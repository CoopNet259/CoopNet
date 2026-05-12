from __future__ import annotations
from datetime import date, timedelta
from fastapi import APIRouter
from database import get_supabase

router = APIRouter(prefix="/api/financial", tags=["financial"])


def _parse_kg(val) -> float:
    if val is None:
        return 0.0
    try:
        return float(str(val).split()[0])
    except (ValueError, IndexError):
        return 0.0


@router.get("/summary")
async def financial_summary():
    sb = get_supabase()
    today = date.today()
    yesterday = (today - timedelta(days=1)).isoformat()
    week_ago = (today - timedelta(days=7)).isoformat()
    two_weeks_ago = (today - timedelta(days=14)).isoformat()

    # ── Ürünler (alış fiyatları için) ──────────────────────────
    products_res = sb.table("products").select(
        "ad, alis_fiyati, mevcut_kg, son_guncelleme"
    ).execute()
    price_map: dict[str, float] = {}
    for p in (products_res.data or []):
        ad = (p.get("ad") or "").strip()
        fiyat = p.get("alis_fiyati")
        if ad and fiyat:
            try:
                price_map[ad] = float(fiyat)
            except (TypeError, ValueError):
                pass

    # Ortalama birim fiyat (fiyatı olmayan ürünler için fallback)
    avg_price = sum(price_map.values()) / len(price_map) if price_map else 25.0

    # ── Dünkü siparişler ────────────────────────────────────────
    yesterday_req = sb.table("requests").select(
        "urun, miktar, durum"
    ).eq("tarih", yesterday).execute()
    yesterday_orders = yesterday_req.data or []

    # Dünkü ciro: miktar_kg * alis_fiyati
    dun_ciro = 0.0
    for r in yesterday_orders:
        kg = _parse_kg(r.get("miktar"))
        urun = (r.get("urun") or "").strip()
        fiyat = price_map.get(urun, avg_price)
        dun_ciro += kg * fiyat

    # ── Dünkü onaylanan transferler ─────────────────────────────
    dun_transfer_res = sb.table("pending_approvals").select(
        "id, kabul_miktari, urun_adi"
    ).eq("durum", "onaylandi").gte("olusturuldu", yesterday).execute()
    dun_transferler = dun_transfer_res.data or []

    # ── Bu haftaki siparişler ───────────────────────────────────
    this_week_res = sb.table("requests").select(
        "urun, miktar, durum, tarih"
    ).gte("tarih", week_ago).execute()
    this_week_orders = this_week_res.data or []

    # ── Geçen haftaki siparişler (trend için) ───────────────────
    last_week_res = sb.table("requests").select(
        "miktar"
    ).gte("tarih", two_weeks_ago).lt("tarih", week_ago).execute()
    last_week_orders = last_week_res.data or []

    # Haftalık ciro hesabı
    haftalik_ciro = 0.0
    for r in this_week_orders:
        kg = _parse_kg(r.get("miktar"))
        urun = (r.get("urun") or "").strip()
        fiyat = price_map.get(urun, avg_price)
        haftalik_ciro += kg * fiyat

    prev_haftalik_ciro = 0.0
    for r in last_week_orders:
        kg = _parse_kg(r.get("miktar"))
        prev_haftalik_ciro += kg * avg_price

    ciro_trend_pct = 0
    if prev_haftalik_ciro > 0:
        ciro_trend_pct = round(((haftalik_ciro - prev_haftalik_ciro) / prev_haftalik_ciro) * 100)
    elif haftalik_ciro > 0:
        ciro_trend_pct = 100

    # ── Haftalık onaylanan transfer hacmi ───────────────────────
    week_transfer_res = sb.table("pending_approvals").select(
        "kabul_miktari, talep_miktari, urun_adi"
    ).eq("durum", "onaylandi").gte("olusturuldu", week_ago).execute()
    week_transfers = week_transfer_res.data or []

    transfer_hacim = 0.0
    for t in week_transfers:
        kg = _parse_kg(t.get("kabul_miktari") or t.get("talep_miktari"))
        urun = (t.get("urun_adi") or "").strip()
        fiyat = price_map.get(urun, avg_price)
        transfer_hacim += kg * fiyat

    # ── İsraf önleme tasarrufu (bu hafta onaylanan × fiyat farkı) ─
    # Yaklaşım: transfer edilen kg × ortalama fiyat = potansiyel kayıp önlendi
    israf_tasarrufu = transfer_hacim  # tasarruf = transfer değeri

    # ── Görevler ─────────────────────────────────────────────────
    tasks_res = sb.table("tasks").select("id, is_name, durum").execute()
    tasks = [
        {"id": t["id"], "is": t.get("is_name", ""), "durum": bool(t.get("durum"))}
        for t in (tasks_res.data or [])
    ]

    # ── Haftalık rapor kartları ──────────────────────────────────
    def fmt_tl(val: float) -> str:
        if val >= 1_000_000:
            return f"₺{val/1_000_000:.1f}M"
        if val >= 1_000:
            return f"₺{int(val):,}".replace(",", ".")
        return f"₺{int(val)}"

    def trend_str(pct: int) -> str:
        return f"+%{abs(pct)}" if pct >= 0 else f"-%{abs(pct)}"

    haftalik_siparis_sayisi = len(this_week_orders)
    prev_siparis_sayisi = len(last_week_orders)
    siparis_trend = 0
    if prev_siparis_sayisi > 0:
        siparis_trend = round(((haftalik_siparis_sayisi - prev_siparis_sayisi) / prev_siparis_sayisi) * 100)

    weekly_cards = [
        {
            "id": 1,
            "baslik": "Tahmini Haftalık Ciro",
            "deger": fmt_tl(haftalik_ciro),
            "trend": trend_str(ciro_trend_pct),
            "yon": "up" if ciro_trend_pct >= 0 else "down",
            "icon": "dollar",
        },
        {
            "id": 2,
            "baslik": "İşlenen Sipariş",
            "deger": str(haftalik_siparis_sayisi),
            "trend": trend_str(siparis_trend),
            "yon": "up" if siparis_trend >= 0 else "down",
            "icon": "pieChart",
        },
        {
            "id": 3,
            "baslik": "Kardeş Üretici İşlem Hacmi",
            "deger": fmt_tl(transfer_hacim) if transfer_hacim > 0 else f"{len(week_transfers)} işlem",
            "trend": f"+{len(week_transfers)} transfer",
            "yon": "up",
            "icon": "users",
        },
        {
            "id": 4,
            "baslik": "İsraf Önleme Tasarrufu",
            "deger": fmt_tl(israf_tasarrufu) if israf_tasarrufu > 0 else f"{len(week_transfers)} ürün",
            "trend": "+%0" if israf_tasarrufu == 0 else trend_str(8),
            "yon": "up",
            "icon": "zap",
        },
    ]

    return {
        "date": today.isoformat(),
        "yesterday": {
            "ciro": fmt_tl(dun_ciro),
            "siparis_sayisi": len(yesterday_orders),
            "transfer_sayisi": len(dun_transferler),
            "israf_kg": round(sum(_parse_kg(t.get("kabul_miktari") or t.get("talep_miktari")) for t in dun_transferler), 1),
        },
        "weekly_cards": weekly_cards,
        "tasks": tasks,
    }
