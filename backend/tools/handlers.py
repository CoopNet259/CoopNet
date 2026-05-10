from __future__ import annotations
from datetime import datetime, timezone
from database import get_supabase


def get_stock(product_name: str) -> dict:
    sb = get_supabase()
    res = sb.table("products").select("id, name, unit, critical_stock_level").ilike("name", f"%{product_name}%").single().execute()
    if not res.data:
        return {"error": f"'{product_name}' ürünü bulunamadı."}
    product = res.data

    inv_res = sb.table("inventory").select("current_quantity, updated_at, unit").eq("product_id", product["id"]).single().execute()
    inv = inv_res.data or {}

    return {
        "product_name": product["name"],
        "quantity": inv.get("current_quantity", 0),
        "unit": inv.get("unit") or product["unit"],
        "updated_at": inv.get("updated_at"),
    }


def check_threshold(product_name: str) -> dict:
    sb = get_supabase()
    res = sb.table("products").select("id, name, unit, critical_stock_level").ilike("name", f"%{product_name}%").single().execute()
    if not res.data:
        return {"error": f"'{product_name}' ürünü bulunamadı."}
    product = res.data

    inv_res = sb.table("inventory").select("current_quantity, unit").eq("product_id", product["id"]).single().execute()
    inv = inv_res.data or {}

    current = inv.get("current_quantity", 0)
    unit = inv.get("unit") or product["unit"]
    critical_level = product["critical_stock_level"]
    is_critical = current <= critical_level
    fill_percentage = round((current / critical_level) * 100) if critical_level > 0 else 100

    return {
        "product_name": product["name"],
        "is_critical": is_critical,
        "fill_percentage": fill_percentage,
        "current_quantity": current,
        "critical_level": critical_level,
        "unit": unit,
        "recommendation": (
            f"Acil sipariş gerekli. Mevcut {current} {unit}, eşik {critical_level} {unit}."
            if is_critical
            else f"Stok yeterli. Doluluk %{fill_percentage}."
        ),
    }


def get_daily_orders(date: str) -> dict:
    sb = get_supabase()
    res = (
        sb.table("orders")
        .select("id, customer_name, quantity, unit, status, created_at, products(name)")
        .gte("created_at", f"{date}T00:00:00")
        .lte("created_at", f"{date}T23:59:59")
        .order("created_at", desc=True)
        .execute()
    )
    if res.error if hasattr(res, "error") else False:
        return {"error": "Siparişler alınamadı."}

    orders = res.data or []
    return {
        "date": date,
        "total": len(orders),
        "orders": [
            {
                "id": o["id"],
                "customer_name": o["customer_name"],
                "product": (o.get("products") or {}).get("name"),
                "quantity": o["quantity"],
                "unit": o["unit"],
                "status": o["status"],
            }
            for o in orders
        ],
    }


def assign_task(role: str, title: str, priority: str, description: str | None = None, product_name: str | None = None) -> dict:
    sb = get_supabase()

    product_id = None
    if product_name:
        p_res = sb.table("products").select("id").ilike("name", f"%{product_name}%").single().execute()
        if p_res.data:
            product_id = p_res.data["id"]

    task_res = (
        sb.table("tasks")
        .insert({
            "title": title,
            "description": description,
            "assigned_role": role,
            "priority": priority,
            "status": "todo",
            "product_id": product_id,
        })
        .select("id")
        .single()
        .execute()
    )

    if not task_res.data:
        return {"error": "Görev oluşturulamadı."}

    priority_label = {"high": "🔴 Yüksek öncelikli", "medium": "🟡 Orta öncelikli", "low": "🟢 Düşük öncelikli"}
    notif_msg = f"{priority_label.get(priority, priority)} görev atandı."
    if description:
        notif_msg += f" Not: {description}"

    sb.table("notifications").insert({
        "role": role,
        "title": f"Yeni görev: {title}",
        "message": notif_msg.strip(),
        "type": "warning" if priority == "high" else "info",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"task_id": task_res.data["id"], "message": f'Görev oluşturuldu: "{title}" → {role}'}


def update_stock(product_name: str, delta: float, reason: str) -> dict:
    sb = get_supabase()
    p_res = sb.table("products").select("id, name, unit").ilike("name", f"%{product_name}%").single().execute()
    if not p_res.data:
        return {"error": f"'{product_name}' ürünü bulunamadı."}
    product = p_res.data

    inv_res = sb.table("inventory").select("current_quantity").eq("product_id", product["id"]).single().execute()
    current = (inv_res.data or {}).get("current_quantity", 0)
    new_qty = current + delta

    sb.table("inventory").update({"current_quantity": new_qty, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("product_id", product["id"]).execute()

    return {
        "product_name": product["name"],
        "previous_quantity": current,
        "new_quantity": new_qty,
        "delta": delta,
        "reason": reason,
    }


def get_sales_forecast(product_name: str, days: int) -> dict:
    sb = get_supabase()
    p_res = sb.table("products").select("id, name").ilike("name", f"%{product_name}%").single().execute()
    if not p_res.data:
        return {"error": f"'{product_name}' ürünü bulunamadı."}
    product = p_res.data

    from datetime import timedelta
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    orders_res = (
        sb.table("orders")
        .select("quantity")
        .eq("product_id", product["id"])
        .gte("created_at", since)
        .eq("status", "delivered")
        .execute()
    )
    orders = orders_res.data or []
    total_sold = sum(o.get("quantity", 0) for o in orders)
    daily_avg = total_sold / 30
    forecast = round(daily_avg * days)

    return {
        "product_name": product["name"],
        "forecast_days": days,
        "estimated_demand": forecast,
        "daily_average": round(daily_avg),
        "based_on_days": 30,
        "note": (
            "Geçmiş satış verisi yok, tahmin güvenilir değil"
            if not orders
            else f"Son 30 günde {total_sold} kg satıldı"
        ),
    }


def send_notification(role: str, title: str, message: str, type: str = "info") -> dict:
    sb = get_supabase()
    res = sb.table("notifications").insert({
        "role": role,
        "title": title,
        "message": message,
        "type": type,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    if not res.data:
        return {"error": "Bildirim gönderilemedi."}
    return {"status": "sent", "role": role, "title": title}


def execute_tool_call(name: str, args: dict) -> dict:
    match name:
        case "get_stock":
            return get_stock(**args)
        case "check_threshold":
            return check_threshold(**args)
        case "get_daily_orders":
            return get_daily_orders(**args)
        case "assign_task":
            return assign_task(**args)
        case "update_stock":
            return update_stock(**args)
        case "get_sales_forecast":
            return get_sales_forecast(**args)
        case "send_notification":
            return send_notification(**args)
        case _:
            return {"error": f"Bilinmeyen tool: {name}"}
