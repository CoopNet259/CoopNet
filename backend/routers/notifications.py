from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter
from database import get_supabase

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _relative_time(iso: str | None) -> str:
    """ISO 8601 string → 'X dk önce / X s önce / X gün önce'"""
    if not iso:
        return ""
    try:
        # Supabase timestamps come with timezone offset
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff = int((now - dt).total_seconds())
        if diff < 60:
            return "az önce"
        if diff < 3600:
            return f"{diff // 60} dk önce"
        if diff < 86400:
            return f"{diff // 3600} s önce"
        return f"{diff // 86400} gün önce"
    except Exception:
        return ""


@router.get("")
async def get_notifications():
    """
    Üç kaynaktan gerçek bildirim üretir:
      1. Kritik / düşük stok (products tablosu, pct ≤ 25)
      2. Bekleyen yönetici onayları (pending_approvals)
      3. Açık yüksek/acil öncelikli görevler (tasks)
    """
    sb = get_supabase()
    notifications: list[dict] = []

    # ── 1. Stok uyarıları ──────────────────────────────────────────
    products = sb.table("products").select(
        "id, emoji, ad, mevcut_kg, kapasite_kg"
    ).execute().data or []

    for p in products:
        current  = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct      = round((current / capacity) * 100) if capacity > 0 else 100
        name     = f"{p.get('emoji', '')} {p.get('ad', '')}".strip()

        if pct <= 15:
            notifications.append({
                "id":       f"stock-{p['id']}",
                "icon":     "🔴",
                "text":     f"{name} stoku kritik seviyede (%{pct})",
                "time":     "stok takibi",
                "severity": "kritik",
                "category": "Depo",
            })
        elif pct <= 25:
            notifications.append({
                "id":       f"stock-low-{p['id']}",
                "icon":     "🟠",
                "text":     f"{name} stoğu düşük (%{pct})",
                "time":     "stok takibi",
                "severity": "yuksek",
                "category": "Depo",
            })

    # ── 2. Bekleyen onaylar ────────────────────────────────────────
    approvals = sb.table("pending_approvals").select(
        "id, urun_adi, uretici_adi, talep_miktari, birim, olusturuldu"
    ).eq("durum", "bekliyor").order("olusturuldu", desc=False).execute().data or []

    for a in approvals:
        notifications.append({
            "id":       f"approval-{a['id']}",
            "icon":     "📋",
            "text":     f"{a.get('urun_adi', '?')} talebi onay bekliyor ({a.get('talep_miktari', '?')} {a.get('birim', '')})",
            "time":     _relative_time(a.get("olusturuldu")),
            "severity": "yuksek",
            "category": "Onay",
        })

    # ── 3. Açık acil / yüksek öncelikli görevler ──────────────────
    HIGH_PRIORITY = {"high", "urgent", "yuksek", "acil", "kritik"}
    tasks = sb.table("tasks").select(
        "id, is_name, oncelik, created_at"
    ).eq("durum", False).execute().data or []

    for t in tasks:
        if (t.get("oncelik") or "").lower() in HIGH_PRIORITY:
            notifications.append({
                "id":       f"task-{t['id']}",
                "icon":     "✅",
                "text":     t.get("is_name", "Görev"),
                "time":     _relative_time(t.get("created_at")),
                "severity": "orta",
                "category": "Görev",
            })

    # Severity sıralama: kritik → yuksek → orta
    order = {"kritik": 0, "yuksek": 1, "orta": 2}
    notifications.sort(key=lambda n: order.get(n["severity"], 3))

    return {
        "notifications": notifications[:10],   # en fazla 10
        "unread_count":  len(notifications),
    }
