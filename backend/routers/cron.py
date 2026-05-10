from __future__ import annotations
from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, HTTPException, Request
from database import get_supabase
from services.logger import log_ai
from services.anomaly import compute_daily_anomaly_insights
from config import settings

router = APIRouter(prefix="/api/cron", tags=["cron"])


def _check_secret(request: Request) -> None:
    secret = request.headers.get("x-cron-secret")
    if not settings.cron_secret or secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Yetkisiz")


# ── GET /api/cron/stock-check ─────────────────────────────────

@router.get("/stock-check")
async def stock_check(request: Request):
    _check_secret(request)
    sb = get_supabase()

    products_res = sb.table("products").select("id, name, unit, critical_stock_level").execute()
    if not products_res.data:
        raise HTTPException(status_code=500, detail="Ürünler alınamadı.")
    products = products_res.data

    critical_products = []
    for p in products:
        inv = sb.table("inventory").select("current_quantity").eq("product_id", p["id"]).single().execute()
        current = (inv.data or {}).get("current_quantity", 0)
        if current <= p["critical_stock_level"]:
            fill_pct = round((current / p["critical_stock_level"]) * 100) if p["critical_stock_level"] > 0 else 0
            critical_products.append({
                "name": p["name"],
                "current_quantity": current,
                "critical_level": p["critical_stock_level"],
                "unit": p["unit"],
                "fill_percentage": fill_pct,
            })

    if not critical_products:
        result = {"checked": len(products), "critical_count": 0, "message": "Tüm stoklar yeterli seviyede."}
        log_ai("stock_check", "cron:stock_check", {**result, "checked_at": datetime.now(timezone.utc).isoformat()})
        return result

    now_iso = datetime.now(timezone.utc).isoformat()
    notif_rows = []
    for cp in critical_products:
        notif_rows += [
            {
                "role": "manager",
                "title": f"⚠️ Kritik Stok: {cp['name']}",
                "message": f"{cp['name']} stoğu kritik seviyede. Mevcut: {cp['current_quantity']} {cp['unit']} (eşiğin %{cp['fill_percentage']}'i). Tedarikçi siparişi gerekli.",
                "type": "warning", "is_read": False, "created_at": now_iso,
            },
            {
                "role": "warehouse",
                "title": f"⚠️ Kritik Stok: {cp['name']}",
                "message": f"{cp['name']} stoğu kritik seviyeye düştü. Mevcut: {cp['current_quantity']} {cp['unit']}. Stok sayımı yapın ve yöneticiye bildirin.",
                "type": "warning", "is_read": False, "created_at": now_iso,
            },
        ]

    sb.table("notifications").insert(notif_rows).execute()

    result = {
        "checked": len(products),
        "critical_count": len(critical_products),
        "critical_products": critical_products,
        "notifications_sent": len(notif_rows),
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

@router.get("/anomaly-check")
async def anomaly_check(request: Request):
    _check_secret(request)
    sb = get_supabase()
    anomalies = []
    now = datetime.now(timezone.utc)
    today_str = date.today().isoformat()

    # ── 1. Talep anomalisi ────────────────────────────────────
    this_week_start = (now - timedelta(days=7)).isoformat()
    last_week_start = (now - timedelta(days=14)).isoformat()

    this_res = sb.table("orders").select("quantity, product_id, products(name)").gte("created_at", this_week_start).execute()
    last_res = sb.table("orders").select("quantity, product_id, products(name)").gte("created_at", last_week_start).lt("created_at", this_week_start).execute()

    def _sum_by_product(rows):
        m: dict[str, dict] = {}
        for r in rows or []:
            pid = str(r.get("product_id", ""))
            name = (r.get("products") or {}).get("name", pid) if isinstance(r.get("products"), dict) else pid
            if pid not in m:
                m[pid] = {"name": name, "total": 0}
            m[pid]["total"] += r.get("quantity", 0)
        return m

    this_map = _sum_by_product(this_res.data)
    last_map = _sum_by_product(last_res.data)
    for pid, info in this_map.items():
        prev = last_map.get(pid, {}).get("total", 0)
        if prev == 0:
            continue
        change_pct = round(((info["total"] - prev) / prev) * 100)
        if abs(change_pct) >= 30:
            up = change_pct > 0
            anomalies.append({
                "type": "demand_spike",
                "severity": "danger" if abs(change_pct) >= 50 else "warn",
                "title": f"{info['name']} talebinde {'+' if up else ''}{change_pct}% sapma",
                "desc": f"{info['name']} ürününün bu haftaki talebi geçen haftaya göre {'ani artış' if up else 'belirgin düşüş'} gösteriyor. Geçen hafta: {prev} kg — Bu hafta: {info['total']} kg.",
                "source": "Talep modeli",
                "meta": {"product_id": pid, "change_pct": change_pct, "this_week": info["total"], "last_week": prev},
            })

    # ── 2. Gecikmiş sipariş patlaması ────────────────────────
    week_ago = (now - timedelta(days=7)).isoformat()
    today_orders = sb.table("orders").select("status").gte("created_at", f"{today_str}T00:00:00").execute()
    week_orders = sb.table("orders").select("status").gte("created_at", week_ago).lt("created_at", f"{today_str}T00:00:00").execute()

    def _delayed_rate(rows):
        r = rows or []
        return sum(1 for o in r if o["status"] == "delayed") / len(r) if r else 0

    today_rate = _delayed_rate(today_orders.data)
    week_rate = _delayed_rate(week_orders.data)
    if week_rate > 0 and today_rate >= week_rate * 2 and today_rate > 0.1:
        anomalies.append({
            "type": "delayed_surge",
            "severity": "danger" if today_rate >= 0.3 else "warn",
            "title": f"Gecikmiş sipariş oranı yükseldi: %{round(today_rate * 100)}",
            "desc": f"Bugünkü gecikme oranı (%{round(today_rate * 100)}), 7 günlük ortalamanın (%{round(week_rate * 100)}) 2 katına ulaştı.",
            "source": "Operasyon",
            "meta": {"today_rate": today_rate, "week_avg_rate": week_rate},
        })

    # ── 3. Stok erime hızı ────────────────────────────────────
    d7 = (now - timedelta(days=7)).isoformat()
    d14 = (now - timedelta(days=14)).isoformat()
    recent_res = sb.table("orders").select("quantity, product_id, products(name)").eq("status", "delivered").gte("created_at", d7).execute()
    prev_res = sb.table("orders").select("quantity, product_id, products(name)").eq("status", "delivered").gte("created_at", d14).lt("created_at", d7).execute()

    recent_map = _sum_by_product(recent_res.data)
    prev_dep_map = _sum_by_product(prev_res.data)
    for pid, info in recent_map.items():
        prev = prev_dep_map.get(pid, {}).get("total", 0)
        if prev == 0:
            continue
        burn = round(((info["total"] - prev) / prev) * 100)
        if burn >= 50:
            anomalies.append({
                "type": "stock_burnrate",
                "severity": "danger" if burn >= 100 else "warn",
                "title": f"{info['name']} tüketim hızı +%{burn} arttı",
                "desc": f"{info['name']} son 7 günde {info['total']} kg teslim edildi, önceki 7 güne ({prev} kg) kıyasla tüketim hızı belirgin biçimde yükseldi.",
                "source": "Depo · Stok",
                "meta": {"product_id": pid, "recent_7d": info["total"], "prev_7d": prev, "increase_pct": burn},
            })

    # ── 4. Üretici sessizliği ─────────────────────────────────
    five_days_ago = (now - timedelta(days=5)).isoformat()
    producers_res = sb.table("profiles").select("id, full_name").eq("role", "producer").execute()
    for producer in (producers_res.data or []):
        recent = (
            sb.table("producer_product_reports")
            .select("id, created_at")
            .eq("producer_id", producer["id"])
            .gte("created_at", five_days_ago)
            .limit(1)
            .execute()
        )
        if not recent.data:
            anomalies.append({
                "type": "producer_silence",
                "severity": "warn",
                "title": f"Üretici sessizliği: {producer['full_name']}",
                "desc": f"{producer['full_name']} 5 gündür hasat bildirimi yapmadı. İletişime geçilmesi önerilir.",
                "source": "Üretici sinyali",
                "meta": {"producer_id": producer["id"]},
            })

    # Bildirimleri kaydet
    if anomalies:
        now_iso = datetime.now(timezone.utc).isoformat()
        sb.table("notifications").insert([
            {
                "role": "manager",
                "title": a["title"],
                "message": a["desc"],
                "type": "error" if a["severity"] == "danger" else "warning" if a["severity"] == "warn" else "info",
                "is_read": False,
                "created_at": now_iso,
            }
            for a in anomalies
        ]).execute()

    result = {"checked_at": datetime.now(timezone.utc).isoformat(), "anomaly_count": len(anomalies), "anomalies": anomalies}
    log_ai("anomaly_check", "cron:anomaly_check", result)
    return result
