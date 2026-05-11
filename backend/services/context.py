from __future__ import annotations
from database import get_supabase
from services.anomaly import compute_daily_anomaly_insights


async def build_daily_context(date: str) -> dict:
    sb = get_supabase()

    # requests tablosu (siparişler): musteri, urun, miktar, durum
    requests_res = sb.table("requests").select("durum, miktar, urun").execute()

    # products tablosu (stok): ad, mevcut_kg, kapasite_kg
    products_res = sb.table("products").select("ad, mevcut_kg, kapasite_kg").execute()

    # tasks tablosu: is_name, durum (boolean)
    tasks_res = sb.table("tasks").select("is_name, durum").execute()

    requests = requests_res.data or []
    products = products_res.data or []
    tasks    = tasks_res.data or []
    anomalies = compute_daily_anomaly_insights(date)

    # Teslim durumu: "teslim edildi" / "bekliyor" / "gecikti"
    total_orders = len(requests)
    pending   = sum(1 for o in requests if o.get("durum") == "bekliyor")
    delivered = sum(1 for o in requests if o.get("durum") == "teslim edildi")
    delayed   = sum(1 for o in requests if o.get("durum") in ("gecikti", "gecikmiş"))

    inventory_list = [
        {
            "name":        p.get("ad", ""),
            "quantity":    p.get("mevcut_kg", 0) or 0,
            "unit":        "kg",
            "is_critical": (p.get("mevcut_kg") or 0) <= (p.get("kapasite_kg") or 1) * 0.25,
        }
        for p in products
    ]

    return {
        "date": date,
        "orders": {
            "total":     total_orders,
            "pending":   pending,
            "delivered": delivered,
            "delayed":   delayed,
        },
        "inventory": inventory_list,
        "tasks": {
            "total": len(tasks),
            "done":  sum(1 for t in tasks if t.get("durum")),
            "todo":  sum(1 for t in tasks if not t.get("durum")),
        },
        "harvests": [],  # harvest tablosu mevcut şemada yok
        "anomalies": anomalies,
    }
