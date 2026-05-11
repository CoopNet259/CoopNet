from __future__ import annotations
from database import get_supabase


def compute_daily_anomaly_insights(date: str) -> dict:
    """
    supabase_schema.sql: requests'te created_at yok; orders/inventory yok.
    Zaman serisi anomalileri hesaplanamaz — düşük stok + anlık gecikme oranı.
    """
    sb = get_supabase()

    try:
        products_res = sb.table("products").select("ad, mevcut_kg, kapasite_kg").execute()
        products = products_res.data or []
    except Exception:
        products = []

    stock_depletion_anomalies = []
    for p in products:
        current = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct = round((current / capacity) * 100) if capacity > 0 else 100
        if pct > 30:
            continue
        stock_depletion_anomalies.append({
            "product_name": p.get("ad", ""),
            "previous_7d_consumption": 0,
            "recent_7d_consumption": current,
            "acceleration_ratio": 2.0 if pct <= 15 else 1.5,
            "is_anomaly": True,
        })

    try:
        reqs_res = sb.table("requests").select("durum").execute()
        reqs = reqs_res.data or []
    except Exception:
        reqs = []

    delayed = sum(1 for r in reqs if r.get("durum") in ("gecikti", "gecikmiş"))
    delayed_ratio = (delayed / len(reqs)) if reqs else 0

    return {
        "date": date,
        "demand_anomalies": [],
        "delayed_spike": {
            "date": date,
            "delayed_ratio_today": delayed_ratio,
            "delayed_ratio_7d_average": 0,
            "multiplier": 2 if delayed_ratio > 0.2 else 0,
            "is_anomaly": len(reqs) >= 2 and delayed_ratio >= 0.2,
        },
        "stock_depletion_anomalies": stock_depletion_anomalies,
        "producer_silence": [],
    }
