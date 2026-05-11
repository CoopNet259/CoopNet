from __future__ import annotations
from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_supabase

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary():
    sb = get_supabase()
    today = date.today().isoformat()

    # ── Stok (products tablosu: ad, mevcut_kg, kapasite_kg) ─────
    products_res = sb.table("products").select(
        "id, emoji, ad, mevcut_kg, kapasite_kg, kategori"
    ).execute()

    # ── Siparişler (requests tablosu) ───────────────────────────
    requests_res = sb.table("requests").select(
        "id, musteri, urun, miktar, saat, durum"
    ).execute()

    # ── Görevler (tasks: is_name, durum boolean, oncelik) ───────
    tasks_res = sb.table("tasks").select(
        "id, is_name, durum, oncelik"
    ).execute()

    products = products_res.data or []
    requests = requests_res.data or []
    tasks = tasks_res.data or []

    # ── Stok hesapla ─────────────────────────────────────────────
    stock_items = []
    for p in products:
        current = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        critical_level = capacity * 0.25
        pct = round((current / capacity) * 100) if capacity > 0 else 100
        is_critical = current <= critical_level
        tier = "urgent" if pct < 15 else "warn" if pct < 30 else "good"
        stock_items.append({
            "id": str(p["id"]),
            "name": f"{p.get('emoji', '')} {p.get('ad', '')}".strip(),
            "unit": "kg",
            "current": current,
            "capacity": capacity,
            "pct": pct,
            "tier": tier,
            "is_critical": is_critical,
        })
    stock_items.sort(key=lambda x: x["pct"])

    # ── KPI hesapla ──────────────────────────────────────────────
    done_statuses = {"teslim edildi", "iptal", "onaylandi"}
    open_requests = [r for r in requests if r.get("durum") not in done_statuses]
    critical_count = sum(1 for s in stock_items if s["is_critical"])
    open_tasks = [t for t in tasks if not t.get("durum")]

    # ── Siparişleri formatla ─────────────────────────────────────
    def urgency(durum: str) -> str:
        if durum in ("gecikti", "gecikmiş"):
            return "urgent"
        if durum == "bekliyor":
            return "warn"
        return "good"

    formatted_orders = [
        {
            "id": str(r["id"]),
            "customer": r.get("musteri", ""),
            "product": r.get("urun", ""),
            "quantity": r.get("miktar", ""),
            "unit": "kg",
            "status": r.get("durum", ""),
            "urgency": urgency(r.get("durum", "")),
        }
        for r in requests[:5]
    ]

    # ── Görevleri formatla ───────────────────────────────────────
    priority_map = {"yuksek": "high", "orta": "medium", "dusuk": "low"}
    formatted_tasks = [
        {
            "id": str(t["id"]),
            "title": t.get("is_name", ""),
            "done": bool(t.get("durum")),
            "priority": priority_map.get(t.get("oncelik", ""), t.get("oncelik", "")),
            "role": "manager",
        }
        for t in tasks[:5]
    ]

    return {
        "date": today,
        "kpis": {
            "open_orders": len(open_requests),
            "order_trend_pct": 0,
            "critical_stock": critical_count,
            "open_tasks": len(open_tasks),
            "harvest_kg_week": 0,
        },
        "stock": stock_items[:8],
        "orders": formatted_orders,
        "tasks": formatted_tasks,
        "trends": {"up": [], "down": []},
    }


class TaskToggle(BaseModel):
    done: bool


@router.patch("/tasks/{task_id}")
async def toggle_task(task_id: str, body: TaskToggle):
    sb = get_supabase()
    res = (
        sb.table("tasks")
        .update({"durum": body.done})
        .eq("id", task_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    return {"id": task_id, "done": body.done}
