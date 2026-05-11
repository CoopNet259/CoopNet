from __future__ import annotations
import asyncio
import json
from datetime import datetime, date as date_type, timezone
from fastapi import APIRouter, HTTPException, Request, Query
from database import get_supabase
from services.logger import log_ai
from services.gemini_client import get_model
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


# ── GET /api/cron/generate-daily-report ──────────────────────
# Günlük verileri okur → Gemini ile ai_reports satırı üretir/günceller.

_TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
              "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]

def _tr_date(iso: str) -> str:
    d = date_type.fromisoformat(iso)
    return f"{d.day} {_TR_MONTHS[d.month - 1]} {d.year}"

DAILY_REPORT_SYSTEM = """Sen CoopFlow AI'sın — bir kadın kooperatifinin veri analistiyiz.
Sana verilen günlük operasyon verilerini analiz edip 4-5 maddelik Türkçe bir özet listesi üret.

SADECE şu JSON formatında yanıt ver:
["madde 1", "madde 2", "madde 3", "madde 4"]

Kurallar:
- Her madde maksimum 120 karakter
- Rakamları mutlaka kullan (₺ tutarlar, kg miktarlar)
- Kritik stok, teslimat, transfer varsa bunları öne çıkar
- Öneri ve aksiyon da ekle (\"Öneri:\" ile başlayan madde)
- Uydurma, sadece verilen veriyi kullan"""


@router.get("/generate-daily-report")
async def generate_daily_report(
    request: Request,
    date: str = Query(default=None, description="YYYY-MM-DD formatında tarih, varsayılan bugün"),
):
    _check_secret(request)
    sb = get_supabase()
    from datetime import timedelta
    target = date or (date_type.today() - timedelta(days=1)).isoformat()
    tr_date = _tr_date(target)

    # 1) Günlük satış özeti
    sales_res = sb.table("daily_sales").select("*").eq("tarih", target).execute()
    sales = sales_res.data[0] if sales_res.data else None

    # 2) Stok hareketleri
    movements_res = (
        sb.table("stock_movements")
        .select("urun_adi, giris_kg, cikis_satis_kg, cikis_transfer_kg")
        .eq("tarih", target)
        .execute()
    )
    movements = movements_res.data or []

    # 3) Üretici teslimatları
    supplies_res = sb.table("producer_supplies").select("*").eq("tarih", target).execute()
    supplies = supplies_res.data or []

    # 4) Kardeş koop transferleri
    transfers_res = sb.table("cooperative_transfers").select("*").eq("tarih", target).execute()
    transfers = transfers_res.data or []

    # 5) Güncel kritik stoklar (products)
    products_res = sb.table("products").select("ad, emoji, mevcut_kg, kapasite_kg").execute()
    critical = [
        p for p in (products_res.data or [])
        if (p.get("mevcut_kg") or 0) <= (p.get("kapasite_kg") or 1) * 0.20
    ]

    # Prompt oluştur
    lines = [f"Tarih: {tr_date}\n"]

    if sales:
        lines.append(
            f"Günlük satış: {sales.get('toplam_satis_kg')} kg, "
            f"gelir ₺{sales.get('toplam_gelir'):,.0f}, "
            f"{sales.get('siparis_sayisi')} sipariş, "
            f"en çok satan: {sales.get('en_cok_satan_urun', '-')}"
        )
    else:
        lines.append("Günlük satış verisi: mevcut değil")

    if movements:
        lines.append("\nStok hareketleri:")
        for m in movements:
            giris = m.get("giris_kg", 0) or 0
            satis = m.get("cikis_satis_kg", 0) or 0
            transfer = m.get("cikis_transfer_kg", 0) or 0
            parts = []
            if giris: parts.append(f"+{giris} kg giriş")
            if satis: parts.append(f"-{satis} kg satış")
            if transfer: parts.append(f"-{transfer} kg transfer")
            if parts:
                lines.append(f"  {m.get('urun_adi')}: {', '.join(parts)}")

    if supplies:
        lines.append("\nÜretici teslimatları:")
        for s in supplies:
            lines.append(
                f"  {s.get('uretici_adi')}: {s.get('urun_adi')} "
                f"{s.get('miktar_kg')} kg @ ₺{s.get('birim_fiyat')}/kg = ₺{s.get('toplam_tutar')}"
            )

    if transfers:
        lines.append("\nKardeş koop transferleri:")
        for t in transfers:
            lines.append(
                f"  {t.get('kardes_koop_adi')}: {t.get('urun_adi')} "
                f"{t.get('miktar_kg')} kg → ₺{t.get('toplam_tutar')} ({t.get('amac', '')})"
            )

    if critical:
        lines.append("\nKritik stok uyarıları (kapasitenin ≤%20):")
        for p in critical:
            pct = round((p.get("mevcut_kg", 0) / (p.get("kapasite_kg") or 1)) * 100)
            lines.append(f"  {p.get('emoji', '')} {p.get('ad')}: {p.get('mevcut_kg')} kg (%{pct})")

    prompt = "\n".join(lines)

    try:
        model = get_model(system_instruction=DAILY_REPORT_SYSTEM)
        result = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        maddeler = json.loads(result.text)
        if not isinstance(maddeler, list):
            raise ValueError("Gemini JSON array döndürmedi")
    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        raise HTTPException(
            status_code=429 if is_rl else 500,
            detail="AI şu an yoğun, tekrar deneyin." if is_rl else f"Rapor üretilemedi: {msg}",
        )

    baslik = f"AI Günlük Analiz Özeti — {tr_date}"

    # Aynı güne ait rapor varsa güncelle, yoksa ekle
    existing = sb.table("ai_reports").select("id").ilike("baslik", f"%{tr_date}%").execute()
    if existing.data:
        report_id = existing.data[0]["id"]
        sb.table("ai_reports").update({"baslik": baslik, "maddeler": maddeler}).eq("id", report_id).execute()
        action = "updated"
    else:
        sb.table("ai_reports").insert({"baslik": baslik, "maddeler": maddeler}).execute()
        action = "created"

    log_ai("generate_daily_report", f"cron:generate_daily_report:{target}", {"action": action, "date": target})
    return {"date": target, "action": action, "baslik": baslik, "maddeler": maddeler}
