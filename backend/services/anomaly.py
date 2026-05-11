from __future__ import annotations
from database import get_supabase


def compute_daily_anomaly_insights(date: str) -> dict:
    """
    Zeynep'in şemasında sipariş tablosunda created_at ve miktar sayısal kolonları
    olmadığı için gelişmiş tarih-aralıklı anomali analizi yapılamıyor.
    Mevcut veriyle hesaplanabilecek basit stok anomalilerini döndürüyoruz.
    """
    sb = get_supabase()

    # Stok tablosundan düşük stok anomalilerini hesapla
    try:
        products_res = sb.table("products").select("ad, mevcut_kg, kapasite_kg").execute()
        products = products_res.data or []
    except Exception:
        products = []

    stock_anomalies = []
    for p in products:
        current = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct = round((current / capacity) * 100) if capacity > 0 else 100
        if pct <= 30:
            stock_anomalies.append({
                "product_name": p.get("ad", ""),
                "pct": pct,
                "is_anomaly": True,
            })

    return {
        "date": date,
        "demand_anomalies": [],
        "delayed_spike": {
            "date": date,
            "delayed_ratio_today": 0,
            "delayed_ratio_7d_average": 0,
            "multiplier": 0,
            "is_anomaly": False,
        },
        "stock_depletion_anomalies": stock_anomalies,
        "producer_silence": [],
    }
