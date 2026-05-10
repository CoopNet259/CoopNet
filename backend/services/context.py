from __future__ import annotations
from database import get_supabase
from services.anomaly import compute_daily_anomaly_insights


async def build_daily_context(date: str) -> dict:
    sb = get_supabase()
    start = f"{date}T00:00:00"
    end   = f"{date}T23:59:59"

    orders_res    = sb.table("orders").select("status").gte("created_at", start).lte("created_at", end).execute()
    inventory_res = sb.table("inventory").select("current_quantity, unit, products(name, critical_stock_level)").execute()
    tasks_res     = sb.table("tasks").select("status").gte("created_at", start).lte("created_at", end).execute()
    harvests_res  = (
        sb.table("producer_product_reports")
        .select("quantity, unit, status, profiles(full_name), products(name)")
        .gte("created_at", start)
        .lte("created_at", end)
        .execute()
    )

    orders    = orders_res.data or []
    inventory = inventory_res.data or []
    tasks     = tasks_res.data or []
    harvests  = harvests_res.data or []
    anomalies = compute_daily_anomaly_insights(date)

    def _product(raw) -> dict:
        if isinstance(raw, list):
            return raw[0] if raw else {}
        return raw or {}

    return {
        "date": date,
        "orders": {
            "total":     len(orders),
            "pending":   sum(1 for o in orders if o["status"] == "pending"),
            "delivered": sum(1 for o in orders if o["status"] == "delivered"),
            "delayed":   sum(1 for o in orders if o["status"] == "delayed"),
        },
        "inventory": [
            {
                "name":        _product(i.get("products")).get("name", ""),
                "quantity":    i["current_quantity"],
                "unit":        i["unit"],
                "is_critical": i["current_quantity"] <= _product(i.get("products")).get("critical_stock_level", 0),
            }
            for i in inventory
        ],
        "tasks": {
            "total": len(tasks),
            "done":  sum(1 for t in tasks if t["status"] == "done"),
            "todo":  sum(1 for t in tasks if t["status"] in ("todo", "in_progress")),
        },
        "harvests": [
            {
                "producer": _product(h.get("profiles")).get("full_name", "Bilinmeyen"),
                "product":  _product(h.get("products")).get("name", "Bilinmeyen"),
                "quantity": h["quantity"],
                "unit":     h["unit"],
                "status":   h["status"],
            }
            for h in harvests
        ],
        "anomalies": anomalies,
    }
