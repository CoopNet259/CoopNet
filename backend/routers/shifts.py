from __future__ import annotations
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from database import get_supabase

router = APIRouter(prefix="/api/shifts", tags=["shifts"])

DEPT_LABEL = {
    "depo":      "Depo",
    "lojistik":  "Lojistik",
    "tarla":     "Tarla",
    "muhasebe":  "Muhasebe",
    "yonetim":   "Yönetim",
}

VARDIYE_LABEL = {
    "sabah":          "Sabah (08-16)",
    "tam_gun":        "Tam Gün (08-18)",
    "ogleden_sonra":  "Öğleden Sonra (14-22)",
}

VARDIYE_COLOR = {
    "sabah":         "#3b82f6",
    "tam_gun":       "#10b981",
    "ogleden_sonra": "#f59e0b",
}

DEPT_COLOR = {
    "depo":     "#6366f1",
    "lojistik": "#f97316",
    "tarla":    "#22c55e",
    "muhasebe": "#8b5cf6",
    "yonetim":  "#ef4444",
}


# ── GET /api/shifts/employees ─────────────────────────────────────
@router.get("/employees")
async def list_employees(departman: str | None = Query(default=None)):
    sb = get_supabase()
    q = sb.table("employees").select("*").eq("aktif", True)
    if departman:
        q = q.eq("departman", departman)
    res = q.order("departman").order("ad").execute()
    employees = res.data or []
    for e in employees:
        e["departman_label"] = DEPT_LABEL.get(e["departman"], e["departman"])
        e["dept_color"] = DEPT_COLOR.get(e["departman"], "#64748b")
    return {"employees": employees}


# ── GET /api/shifts/schedule ──────────────────────────────────────
@router.get("/schedule")
async def get_schedule(week: str = Query(default=None)):
    """
    Haftanın Pazartesi'sini referans alır.
    week parametresi verilmezse bu haftayı döner.
    """
    sb = get_supabase()
    today = date.fromisoformat(week) if week else date.today()
    # Haftanın başı (Pazartesi)
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    # Tüm çalışanlar
    emp_res = sb.table("employees").select("*").eq("aktif", True).execute()
    employees = {e["id"]: e for e in (emp_res.data or [])}

    # Bu haftanın vardiyaları
    shift_res = (
        sb.table("shifts")
        .select("*, employees(id, ad, departman, rol, avatar_emoji)")
        .gte("tarih", monday.isoformat())
        .lte("tarih", sunday.isoformat())
        .order("tarih")
        .order("baslangic")
        .execute()
    )
    shifts = shift_res.data or []

    # Günlük grupla
    days: list[dict] = []
    TR_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
    for i in range(7):
        day_date = monday + timedelta(days=i)
        day_shifts = [s for s in shifts if s["tarih"] == day_date.isoformat()]
        # Departmana göre grupla
        by_dept: dict[str, list] = {}
        for s in day_shifts:
            dept = s["departman"]
            emp  = s.get("employees") or {}
            entry = {
                "shift_id":    s["id"],
                "employee_id": s["employee_id"],
                "ad":          emp.get("ad", "?"),
                "avatar":      emp.get("avatar_emoji", "👤"),
                "rol":         emp.get("rol", ""),
                "vardiye":     s["vardiye_turu"],
                "vardiye_label": VARDIYE_LABEL.get(s["vardiye_turu"], s["vardiye_turu"]),
                "vardiye_color": VARDIYE_COLOR.get(s["vardiye_turu"], "#64748b"),
                "baslangic":   s["baslangic"],
                "bitis":       s["bitis"],
                "notlar":      s.get("notlar"),
            }
            by_dept.setdefault(dept, []).append(entry)

        days.append({
            "date":       day_date.isoformat(),
            "day_name":   TR_DAYS[i],
            "is_today":   day_date == date.today(),
            "is_weekend": i >= 5,
            "shifts":     by_dept,
            "total":      len(day_shifts),
        })

    return {
        "week_start": monday.isoformat(),
        "week_end":   sunday.isoformat(),
        "days":       days,
    }


# ── GET /api/shifts/on-duty ───────────────────────────────────────
@router.get("/on-duty")
async def on_duty(departman: str | None = Query(default=None)):
    """
    Şu an vardiyede olan çalışanlar.
    Aktif vardiye yoksa bugünün tüm vardiyelerini döner (mesai bitti gösterimi).
    """
    sb        = get_supabase()
    now       = datetime.now()
    today_str = now.date().isoformat()
    now_time  = now.strftime("%H:%M")

    def _fetch(date_str: str, time_filter: bool):
        q = (
            sb.table("shifts")
            .select("*, employees(id, ad, departman, rol, avatar_emoji, telefon)")
            .eq("tarih", date_str)
        )
        if time_filter:
            q = q.lte("baslangic", now_time).gte("bitis", now_time)
        if departman:
            q = q.eq("departman", departman)
        return q.order("baslangic").execute().data or []

    shifts = _fetch(today_str, time_filter=True)
    active = True
    if not shifts:
        # Mesai bitti — bugünün tüm vardiyelerini göster
        shifts = _fetch(today_str, time_filter=False)
        active = False

    def _fmt(s: dict) -> dict:
        emp = s.get("employees") or {}
        return {
            "shift_id":        s["id"],
            "employee_id":     s["employee_id"],
            "ad":              emp.get("ad", "?"),
            "avatar":          emp.get("avatar_emoji", "👤"),
            "rol":             emp.get("rol", ""),
            "telefon":         emp.get("telefon"),
            "departman":       s["departman"],
            "departman_label": DEPT_LABEL.get(s["departman"], s["departman"]),
            "dept_color":      DEPT_COLOR.get(s["departman"], "#64748b"),
            "vardiye":         s["vardiye_turu"],
            "vardiye_label":   VARDIYE_LABEL.get(s["vardiye_turu"], s["vardiye_turu"]),
            "baslangic":       s["baslangic"],
            "bitis":           s["bitis"],
            "active":          active,
        }

    return {"date": today_str, "time": now_time, "on_duty": [_fmt(s) for s in shifts]}


# ── POST /api/shifts/ ─────────────────────────────────────────────
class ShiftCreate(BaseModel):
    employee_id:  int
    tarih:        str
    vardiye_turu: str
    baslangic:    str
    bitis:        str
    departman:    str
    notlar:       str | None = None

@router.post("/")
async def create_shift(body: ShiftCreate):
    sb = get_supabase()
    try:
        res = sb.table("shifts").insert(body.model_dump()).execute()
        return {"ok": True, "shift": res.data[0] if res.data else {}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── DELETE /api/shifts/{shift_id} ────────────────────────────────
@router.delete("/{shift_id}")
async def delete_shift(shift_id: int):
    sb = get_supabase()
    sb.table("shifts").delete().eq("id", shift_id).execute()
    return {"ok": True}


# ── GET /api/shifts/tasks ─────────────────────────────────────────
@router.get("/tasks")
async def get_tasks_with_assignees():
    """Görevleri atanan çalışan bilgisiyle döner."""
    sb = get_supabase()
    res = (
        sb.table("tasks")
        .select("id, is_name, durum, oncelik, departman, aciklama, created_at, assigned_to, employees(id, ad, avatar_emoji, rol, departman)")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    tasks = res.data or []
    for t in tasks:
        emp = t.get("employees") or {}
        t["assigned_name"]   = emp.get("ad")
        t["assigned_avatar"]  = emp.get("avatar_emoji")
        t["assigned_rol"]     = emp.get("rol")
        t.pop("employees", None)
    return {"tasks": tasks}
