from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from database import get_supabase
from services.logger import log_ai
from config import settings

router = APIRouter(prefix="/api/cron", tags=["cron"])


def _check_secret(request: Request) -> None:
    secret = request.headers.get("x-cron-secret")
    if not settings.cron_secret or secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Yetkisiz")


def _ai_log_row(*, baslik: str, mesaj: str, tip: str, kategori: str) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "zaman": now.strftime("%H:%M"),
        "tarih": now.strftime("%d %B %Y"),
        "tip": tip,
        "baslik": baslik,
        "mesaj": mesaj[:500],
        "kategori": kategori,
        "renk": "red" if tip == "Anomali" else "gold",
    }


# ── GET /api/cron/stock-check ─────────────────────────────────
# Şema: products (mevcut_kg, kapasite_kg). notifications yok → ai_logs.


@router.get("/stock-check")
async def stock_check(request: Request):
    _check_secret(request)
    sb = get_supabase()

    products_res = sb.table("products").select("id, ad, emoji, mevcut_kg, kapasite_kg").execute()
    products = products_res.data or []
    if not products:
        raise HTTPException(status_code=500, detail="Ürünler alınamadı.")

    critical_products = []
    for p in products:
        current = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        critical_level = capacity * 0.25
        if current <= critical_level:
            fill_pct = round((current / capacity) * 100) if capacity > 0 else 0
            name = f"{p.get('emoji', '')} {p.get('ad', '')}".strip()
            critical_products.append({
                "name": name,
                "current_quantity": current,
                "critical_level": round(critical_level),
                "unit": "kg",
                "fill_percentage": fill_pct,
            })

    if not critical_products:
        result = {"checked": len(products), "critical_count": 0, "message": "Tüm stoklar yeterli seviyede."}
        log_ai("stock_check", "cron:stock_check", {**result, "checked_at": datetime.now(timezone.utc).isoformat()})
        return result

    log_rows = []
    for cp in critical_products:
        log_rows += [
            _ai_log_row(
                baslik=f"⚠️ Kritik Stok: {cp['name']}",
                mesaj=(
                    f"{cp['name']} stoğu kritik seviyede. Mevcut: {cp['current_quantity']} {cp['unit']} "
                    f"(doluluk %{cp['fill_percentage']}). Tedarikçi siparişi gerekli."
                ),
                tip="Uyarı",
                kategori="Depo",
            ),
            _ai_log_row(
                baslik=f"⚠️ Kritik Stok: {cp['name']}",
                mesaj=(
                    f"{cp['name']} stoğu kritik seviyeye düştü. Mevcut: {cp['current_quantity']} {cp['unit']}. "
                    "Stok sayımı yapın ve yöneticiye bildirin."
                ),
                tip="Uyarı",
                kategori="Depo",
            ),
        ]

    try:
        sb.table("ai_logs").insert(log_rows).execute()
    except Exception as exc:
        print(f"[CRON_STOCK_CHECK_INSERT] {exc}")

    now_iso = datetime.now(timezone.utc).isoformat()
    result = {
        "checked": len(products),
        "critical_count": len(critical_products),
        "critical_products": critical_products,
        "ai_logs_written": len(log_rows),
        "checked_at": now_iso,
    }
    log_ai("stock_check", "cron:stock_check", result)
    return result


# ── GET /api/cron/daily-summary ───────────────────────────────


@router.get("/daily-summary")
async def cron_daily_summary(request: Request):
    _check_secret(request)
    from routers.ai import daily_summary
    from models.schemas import DailySummaryRequest

    return await daily_summary(DailySummaryRequest())


# ── GET /api/cron/anomaly-check ───────────────────────────────
# Şema: requests (durum), products, stk_alerts. orders/profiles/notifications yok.


@router.get("/anomaly-check")
async def anomaly_check(request: Request):
    _check_secret(request)
    sb = get_supabase()
    anomalies: list[dict] = []

    # 1) STK uyarıları (stk_alerts)
    stk_res = sb.table("stk_alerts").select("id, urun, emoji, kalan_gun_mesaj, miktar, islem, kardesler").execute()
    for row in stk_res.data or []:
        anomalies.append({
            "type": "stk_risk",
            "severity": "warn",
            "title": f"STK riski: {row.get('urun', '?')}",
            "desc": f"{row.get('emoji', '')} {row.get('urun', '')} — {row.get('kalan_gun_mesaj', '')}. "
            f"Önerilen işlem: {row.get('islem', '')}.",
            "source": "STK İzleme",
            "meta": {"stk_alert_id": row.get("id")},
        })

    # 2) Düşük stok (products)
    products_res = sb.table("products").select("id, ad, emoji, mevcut_kg, kapasite_kg").execute()
    for p in products_res.data or []:
        current = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct = round((current / capacity) * 100) if capacity > 0 else 100
        if pct <= 20:
            name = f"{p.get('emoji', '')} {p.get('ad', '')}".strip()
            anomalies.append({
                "type": "low_stock",
                "severity": "danger" if pct <= 10 else "warn",
                "title": f"{name} stok seviyesi kritik",
                "desc": f"{name} depoda %{pct} dolulukta. Acil tedarik veya satış planı gerekebilir.",
                "source": "Stok Analizi",
                "meta": {"product_id": p.get("id"), "fill_pct": pct},
            })

    # 3) Gecikmiş talep oranı (requests — tarih kolonu yok; anlık snapshot)
    reqs = (sb.table("requests").select("durum").execute().data) or []
    if reqs:
        delayed = sum(1 for r in reqs if r.get("durum") in ("gecikti", "gecikmiş"))
        ratio = delayed / len(reqs)
        if len(reqs) >= 2 and ratio >= 0.2:
            anomalies.append({
                "type": "delayed_snapshot",
                "severity": "danger" if ratio >= 0.5 else "warn",
                "title": f"Gecikmiş talep oranı yüksek: %{round(ratio * 100)}",
                "desc": f"Aktif {len(reqs)} talepten {delayed} tanesi gecikmiş durumda. Operasyon ve kargo kontrol edilmeli.",
                "source": "Operasyon",
                "meta": {"total": len(reqs), "delayed": delayed},
            })

    if anomalies:
        log_rows = [
            _ai_log_row(
                baslik=a["title"],
                mesaj=a["desc"],
                tip="Anomali" if a["severity"] == "danger" else "Uyarı",
                kategori="AI Tespiti",
            )
            for a in anomalies
        ]
        try:
            sb.table("ai_logs").insert(log_rows).execute()
        except Exception as exc:
            print(f"[CRON_ANOMALY_INSERT] {exc}")

    result = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "anomaly_count": len(anomalies),
        "anomalies": anomalies,
    }
    log_ai("anomaly_check", "cron:anomaly_check", result)
    return result
