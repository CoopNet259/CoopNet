from __future__ import annotations
from datetime import date, timedelta
from fastapi import APIRouter
from database import get_supabase

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary():
    sb = get_supabase()
    today = date.today().isoformat()
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    two_weeks_ago = (date.today() - timedelta(days=14)).isoformat()

    orders_res = (
        sb.table("orders")
        .select("id, customer_name, quantity, unit, status, created_at, product_id, products(name)")
        .gte("created_at", f"{today}T00:00:00")
        .order("created_at", desc=True)
        .execute()
    )
    products_res = sb.table("products").select("id, name, unit, critical_stock_level, inventory(current_quantity)").execute()
    tasks_res = (
        sb.table("tasks")
        .select("id, title, status, priority, assigned_role")
        .gte("created_at", f"{today}T00:00:00")
        .order("created_at", desc=True)
        .execute()
    )
    harvests_res = (
        sb.table("producer_product_reports")
        .select("quantity, unit, status, products(name), profiles(full_name)")
        .gte("created_at", f"{week_ago}T00:00:00")
        .execute()
    )
    prev_orders_res = (
        sb.table("orders")
        .select("quantity, product_id")
        .gte("created_at", f"{two_weeks_ago}T00:00:00")
        .lt("created_at", f"{week_ago}T00:00:00")
        .execute()
    )

    orders = orders_res.data or []
    harvests = harvests_res.data or []
    tasks = tasks_res.data or []
    prev_orders = prev_orders_res.data or []

    # Stok
    def _inv(raw) -> dict:
        if isinstance(raw, list):
            return raw[0] if raw else {}
        return raw or {}

    stock_items = []
    for p in (products_res.data or []):
        inv = _inv(p.get("inventory"))
        current = inv.get("current_quantity", 0)
        capacity = p["critical_stock_level"] * 4
        pct = round((current / capacity) * 100) if capacity > 0 else 100
        is_critical = current <= p["critical_stock_level"]
        tier = "urgent" if pct < 15 else "warn" if pct < 30 else "good"
        stock_items.append({
            "id": p["id"], "name": p["name"], "unit": p["unit"],
            "current": current, "capacity": capacity, "pct": pct,
            "tier": tier, "is_critical": is_critical,
        })
    stock_items.sort(key=lambda x: x["pct"])

    # KPI
    open_orders = [o for o in orders if o["status"] not in ("delivered", "canceled")]
    critical_count = sum(1 for s in stock_items if s["is_critical"])
    open_tasks = [t for t in tasks if t["status"] != "done"]
    total_harvest_kg = sum(h.get("quantity", 0) for h in harvests)
    this_week_total = sum(o.get("quantity", 0) for o in orders)
    prev_week_total = sum(o.get("quantity", 0) for o in prev_orders)
    order_trend_pct = round(((this_week_total - prev_week_total) / prev_week_total) * 100) if prev_week_total > 0 else 0

    # Siparişler
    def _pname(raw) -> str:
        if isinstance(raw, dict):
            return raw.get("name", "—")
        return "—"

    formatted_orders = [
        {
            "id": o["id"], "customer": o["customer_name"],
            "product": _pname(o.get("products")), "quantity": o["quantity"],
            "unit": o["unit"], "status": o["status"],
            "urgency": "urgent" if o["status"] == "delayed" else "warn" if o["status"] == "pending" else "good",
        }
        for o in orders[:5]
    ]

    # Trend
    this_map: dict[str, dict] = {}
    for o in orders:
        pid = str(o.get("product_id", ""))
        name = _pname(o.get("products"))
        if not pid:
            continue
        if pid not in this_map:
            this_map[pid] = {"name": name, "total": 0}
        this_map[pid]["total"] += o.get("quantity", 0)

    prev_map: dict[str, int] = {}
    for o in prev_orders:
        pid = str(o.get("product_id", ""))
        if pid:
            prev_map[pid] = prev_map.get(pid, 0) + o.get("quantity", 0)

    trends: list[dict] = []
    for pid, info in this_map.items():
        prev = prev_map.get(pid, 0)
        if prev == 0:
            continue
        pct = round(((info["total"] - prev) / prev) * 100)
        if abs(pct) >= 10:
            trends.append({"name": info["name"], "delta": f"{'+' if pct > 0 else ''}{pct}%", "pct": pct, "up": pct > 0})
    trends.sort(key=lambda x: abs(x["pct"]), reverse=True)

    return {
        "date": today,
        "kpis": {
            "open_orders": len(open_orders),
            "order_trend_pct": order_trend_pct,
            "critical_stock": critical_count,
            "open_tasks": len(open_tasks),
            "harvest_kg_week": total_harvest_kg,
        },
        "stock": stock_items[:8],
        "orders": formatted_orders,
        "tasks": [
            {"id": t["id"], "title": t["title"], "done": t["status"] == "done", "priority": t["priority"], "role": t["assigned_role"]}
            for t in tasks[:5]
        ],
        "trends": {
            "up": [t for t in trends if t["up"]][:3],
            "down": [t for t in trends if not t["up"]][:3],
        },
    }
