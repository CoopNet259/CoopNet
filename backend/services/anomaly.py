from __future__ import annotations
from datetime import datetime, timedelta, timezone
from database import get_supabase


def _date_range(anchor: datetime, offset_days: int) -> tuple[str, str]:
    d = anchor + timedelta(days=offset_days)
    base = d.strftime("%Y-%m-%d")
    return f"{base}T00:00:00", f"{base}T23:59:59"


def _add_days(date_str: str, days: int) -> str:
    d = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=days)
    return d.strftime("%Y-%m-%d")


def compute_daily_anomaly_insights(date: str) -> dict:
    sb = get_supabase()
    anchor = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    prev_week_start = anchor - timedelta(days=13)
    prev_week_end   = anchor - timedelta(days=7)
    curr_week_start = anchor - timedelta(days=6)
    curr_week_end   = anchor

    delayed_baseline_start = anchor - timedelta(days=7)

    # Siparişler (talep + stok erime)
    orders_res = (
        sb.table("orders")
        .select("created_at, quantity, status, products(name)")
        .gte("created_at", prev_week_start.strftime("%Y-%m-%dT%H:%M:%S"))
        .lte("created_at", curr_week_end.strftime("%Y-%m-%dT%H:%M:%S"))
        .execute()
    )
    all_orders = orders_res.data or []

    # Gecikmiş sipariş kontrolü
    delayed_res = (
        sb.table("orders")
        .select("created_at, status")
        .gte("created_at", delayed_baseline_start.strftime("%Y-%m-%dT%H:%M:%S"))
        .lte("created_at", anchor.strftime("%Y-%m-%dT%H:%M:%S"))
        .execute()
    )
    delayed_orders = delayed_res.data or []

    # Üretici raporları
    producer_res = sb.table("producer_product_reports").select("created_at, profiles(full_name)").execute()
    producer_reports = producer_res.data or []

    # ── Talep anomalileri ────────────────────────────────────────
    demand_map: dict[str, dict] = {}
    for o in all_orders:
        created = datetime.fromisoformat(o["created_at"].replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
        product = o.get("products") or {}
        name = product.get("name", "Bilinmeyen") if isinstance(product, dict) else "Bilinmeyen"
        qty = o.get("quantity", 0)

        if name not in demand_map:
            demand_map[name] = {"prev": 0, "current": 0}

        if o.get("status") != "delivered":
            continue

        if prev_week_start <= created <= prev_week_end:
            demand_map[name]["prev"] += qty
        elif curr_week_start <= created <= curr_week_end:
            demand_map[name]["current"] += qty

    demand_anomalies = []
    for name, v in demand_map.items():
        if v["prev"] > 0:
            ratio = (v["current"] - v["prev"]) / v["prev"]
        elif v["current"] > 0:
            ratio = 1.0
        else:
            ratio = 0.0

        if v["prev"] > 0 and abs(ratio) >= 0.3:
            demand_anomalies.append({
                "product_name": name,
                "previous_week_orders": v["prev"],
                "current_week_orders": v["current"],
                "change_ratio": ratio,
                "is_anomaly": True,
            })

    demand_anomalies.sort(key=lambda x: abs(x["change_ratio"]), reverse=True)

    # ── Gecikmiş sipariş patlaması ───────────────────────────────
    today_str = date
    daily_stats: dict[str, dict] = {}
    for i in range(-7, 1):
        d = (anchor + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[d] = {"total": 0, "delayed": 0}

    for o in delayed_orders:
        d = o["created_at"][:10]
        if d in daily_stats:
            daily_stats[d]["total"] += 1
            if o["status"] == "delayed":
                daily_stats[d]["delayed"] += 1

    today_stat = daily_stats.get(today_str, {"total": 0, "delayed": 0})
    today_ratio = today_stat["delayed"] / today_stat["total"] if today_stat["total"] > 0 else 0

    baseline = [
        daily_stats[k]["delayed"] / daily_stats[k]["total"]
        if daily_stats[k]["total"] > 0 else 0
        for k in list(daily_stats.keys())[:-1]
    ]
    baseline_avg = sum(baseline) / len(baseline) if baseline else 0
    multiplier = today_ratio / baseline_avg if baseline_avg > 0 else (float("inf") if today_ratio > 0 else 0)

    delayed_spike = {
        "date": date,
        "delayed_ratio_today": today_ratio,
        "delayed_ratio_7d_average": baseline_avg,
        "multiplier": multiplier,
        "is_anomaly": today_ratio >= baseline_avg * 2 if baseline_avg > 0 else today_ratio > 0,
    }

    # ── Stok erime hızı ──────────────────────────────────────────
    depletion_map: dict[str, dict] = {}
    for o in all_orders:
        created = datetime.fromisoformat(o["created_at"].replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
        product = o.get("products") or {}
        name = product.get("name", "Bilinmeyen") if isinstance(product, dict) else "Bilinmeyen"
        qty = o.get("quantity", 0)

        if name not in depletion_map:
            depletion_map[name] = {"prev": 0, "recent": 0}

        if prev_week_start <= created <= prev_week_end:
            depletion_map[name]["prev"] += qty
        elif curr_week_start <= created <= curr_week_end:
            depletion_map[name]["recent"] += qty

    stock_depletion_anomalies = []
    for name, v in depletion_map.items():
        if v["prev"] > 0:
            acc = v["recent"] / v["prev"]
        elif v["recent"] > 0:
            acc = float("inf")
        else:
            acc = 0.0

        if v["prev"] > 0 and acc >= 1.3:
            stock_depletion_anomalies.append({
                "product_name": name,
                "previous_7d_consumption": v["prev"],
                "recent_7d_consumption": v["recent"],
                "acceleration_ratio": acc,
                "is_anomaly": True,
            })

    stock_depletion_anomalies.sort(key=lambda x: x["acceleration_ratio"], reverse=True)

    # ── Üretici sessizliği ───────────────────────────────────────
    latest_report: dict[str, datetime] = {}
    for r in producer_reports:
        profile = r.get("profiles") or {}
        name = profile.get("full_name", "Bilinmeyen") if isinstance(profile, dict) else "Bilinmeyen"
        created = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
        if name not in latest_report or created > latest_report[name]:
            latest_report[name] = created

    producer_silence = []
    for producer, last in latest_report.items():
        silent_days = (anchor - last).days
        if silent_days >= 5:
            producer_silence.append({
                "producer": producer,
                "last_report_at": last.isoformat(),
                "silent_days": silent_days,
                "is_anomaly": True,
            })

    producer_silence.sort(key=lambda x: x["silent_days"], reverse=True)

    return {
        "date": date,
        "demand_anomalies": demand_anomalies,
        "delayed_spike": delayed_spike,
        "stock_depletion_anomalies": stock_depletion_anomalies,
        "producer_silence": producer_silence,
    }
