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
        "stock": stock_items[:8],   # Ana sayfa widget'ı için ilk 8 (kritikler önce)
        "orders": formatted_orders,
        "tasks": formatted_tasks,
        "trends": {"up": [], "down": []},
    }


@router.get("/stock/all")
async def all_stock():
    """Depo sayfası için tüm ürünleri döndürür (limit yok)."""
    sb = get_supabase()
    products_res = sb.table("products").select(
        "id, emoji, ad, mevcut_kg, kapasite_kg, kategori"
    ).order("ad").execute()

    products = products_res.data or []
    stock_items = []
    for p in products:
        current  = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct      = round((current / capacity) * 100) if capacity > 0 else 100
        tier     = "urgent" if pct < 15 else "warn" if pct < 30 else "good"
        stock_items.append({
            "id":          str(p["id"]),
            "name":        f"{p.get('emoji', '')} {p.get('ad', '')}".strip(),
            "unit":        "kg",
            "current":     current,
            "capacity":    capacity,
            "pct":         pct,
            "tier":        tier,
            "is_critical": current <= capacity * 0.25,
            "kategori":    p.get("kategori", ""),
        })

    stock_items.sort(key=lambda x: x["pct"])
    return stock_items


@router.get("/trends")
async def demand_trends():
    """
    Son 14 günün sipariş verisinden haftalık talep trendi hesaplar.
    Bu hafta vs geçen haftayı karşılaştırır.
    """
    from collections import defaultdict
    from datetime import timedelta

    today      = date.today()
    week_start = (today - timedelta(days=7)).isoformat()
    prev_start = (today - timedelta(days=14)).isoformat()

    sb = get_supabase()

    def _parse_miktar(val) -> float:
        """'40 kg' veya 40 → float"""
        if val is None:
            return 0.0
        try:
            return float(str(val).split()[0])
        except (ValueError, IndexError):
            return 0.0

    try:
        this_res = (
            sb.table("requests")
            .select("urun, miktar")
            .gte("tarih", week_start)
            .execute()
        )
        prev_res = (
            sb.table("requests")
            .select("urun, miktar")
            .gte("tarih", prev_start)
            .lt("tarih", week_start)
            .execute()
        )
    except Exception:
        return {"date": today.isoformat(), "up": [], "down": []}

    this_week = this_res.data or []
    last_week  = prev_res.data or []

    this_totals: dict[str, float] = defaultdict(float)
    last_totals: dict[str, float] = defaultdict(float)

    for r in this_week:
        p = (r.get("urun") or "").strip()
        if p:
            this_totals[p] += _parse_miktar(r.get("miktar"))
    for r in last_week:
        p = (r.get("urun") or "").strip()
        if p:
            last_totals[p] += _parse_miktar(r.get("miktar"))

    trends_up:   list[dict] = []
    trends_down: list[dict] = []

    all_products = set(list(this_totals) + list(last_totals))
    for p in all_products:
        if not p:
            continue
        this_val = this_totals.get(p, 0.0)
        last_val = last_totals.get(p, 0.0)
        if this_val == 0 and last_val == 0:
            continue

        if last_val == 0:
            pct = 100.0
        else:
            pct = ((this_val - last_val) / last_val) * 100

        item = {
            "name":          p,
            "delta":         f"+%{abs(pct):.0f}" if pct >= 0 else f"-%{abs(pct):.0f}",
            "pct":           round(pct, 1),
            "up":            pct > 0,
            "this_week_kg":  round(this_val, 1),
            "last_week_kg":  round(last_val, 1),
        }

        if pct >= 5:
            trends_up.append(item)
        elif pct <= -5:
            trends_down.append(item)

    trends_up.sort(key=lambda x: -x["pct"])
    trends_down.sort(key=lambda x: x["pct"])

    return {
        "date": today.isoformat(),
        "up":   trends_up[:6],
        "down": trends_down[:6],
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
