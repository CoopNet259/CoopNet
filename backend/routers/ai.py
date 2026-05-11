from __future__ import annotations
import asyncio
import json
from datetime import date as date_type, timedelta
from fastapi import APIRouter, HTTPException, Query
from database import get_supabase
from models.schemas import (
    ChatRequest,
    DailySummaryRequest,
    DraftEmailRequest,
    DraftNotificationRequest,
    WeeklyInsightRequest,
)
from services.gemini_client import get_model
from services.orchestrator import run_agent
from services.context import build_daily_context
from services.logger import log_ai

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ── POST /api/ai/chat ─────────────────────────────────────────

@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.message:
        raise HTTPException(status_code=400, detail="message gerekli")
    try:
        result = await run_agent(req.message, req.history)
        return result
    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        raise HTTPException(status_code=429 if is_rl else 500, detail="AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." if is_rl else "AI yanıt üretemedi.")


# ── POST /api/ai/daily-summary ────────────────────────────────

DAILY_SUMMARY_SYSTEM = """Sen CoopFlow AI'sın. Kooperatif yöneticisi için günlük operasyon özeti yaz.

Format — tam olarak bu üç başlıkla:
## Bugün Ne Oldu
(2-3 madde, rakamlarla)

## Kritik Durumlar
(varsa kritik stoklar ve gecikmeler, yoksa "Kritik durum yok")

## Yarın Ne Yapılmalı
(2-3 somut aksiyon önerisi)

Türkçe yaz. Her madde kısa ve eyleme dönüştürülebilir olsun."""


@router.post("/daily-summary")
async def daily_summary(req: DailySummaryRequest):
    target_date = req.date or date_type.today().isoformat()
    try:
        ctx = await build_daily_context(target_date)
        model = get_model()

        prompt = f"""Aşağıdaki günlük operasyon verisini analiz et ve yöneticiye özet hazırla.

Tarih: {ctx['date']}

Siparişler:
- Toplam: {ctx['orders']['total']}
- Teslim edildi: {ctx['orders']['delivered']}
- Bekliyor: {ctx['orders']['pending']}
- Gecikmiş: {ctx['orders']['delayed']}

Stok durumu:
{chr(10).join(f"- {i['name']}: {i['quantity']} {i['unit']}{' ⚠️ KRİTİK' if i['is_critical'] else ''}" for i in ctx['inventory'])}

Görevler: {ctx['tasks']['done']}/{ctx['tasks']['total']} tamamlandı

Hasat bildirimleri:
{chr(10).join(f"- {h['producer']}: {h['quantity']} {h['unit']} {h['product']} ({h['status']})" for h in ctx['harvests'])}"""

        result = await asyncio.to_thread(
            model.generate_content,
            prompt,
            system_instruction=DAILY_SUMMARY_SYSTEM,
        )
        summary = result.text
        critical_items = [i for i in ctx["inventory"] if i["is_critical"]]

        response = {
            "date": target_date,
            "summary": summary,
            "stats": ctx["orders"],
            "critical_items": critical_items,
            "anomalies": ctx["anomalies"],
        }
        log_ai("daily_summary", f"daily_summary_{target_date}", response)
        return response

    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        raise HTTPException(status_code=429 if is_rl else 500, detail="AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." if is_rl else "Günlük özet oluşturulamadı.")


# ── POST /api/ai/draft-email ──────────────────────────────────

DRAFT_EMAIL_SYSTEM = """Sen CoopFlow AI'sın. Kooperatif adına tedarikçiye gönderilecek Türkçe sipariş e-postası yaz.

SADECE şu JSON formatında yanıt ver:
{
  "subject": "e-posta konusu",
  "body": "e-posta gövdesi (selamlama, talep, imza dahil)",
  "suggested_quantity": öneri_miktar_sayı
}

Kurallar:
- Resmi ve kısa üslup
- suggested_quantity: mevcut miktarın 3 katı kadar öner (deponu dolduracak kadar)
- İmzayı "CoopFlow Kooperatif Yönetim Sistemi" olarak yaz
- Body içinde \\n ile satır geç"""


@router.post("/draft-email")
async def draft_email(req: DraftEmailRequest):
    if not req.product_name or not req.quantity:
        raise HTTPException(status_code=400, detail="product_name ve quantity gerekli")
    try:
        model = get_model()
        prompt = (
            f"Kooperatif deposunda {req.product_name} stoğu kritik seviyeye düştü.\n"
            f"Mevcut miktar: {req.quantity} {req.unit}.\n"
            f"Bu ürün için tedarikçiye sipariş e-postası taslağı hazırla."
        )
        result = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"response_mime_type": "application/json"},
            system_instruction=DRAFT_EMAIL_SYSTEM,
        )
        draft = json.loads(result.text)
        log_ai("draft_email", f"draft_email: {req.product_name} {req.quantity}{req.unit}", draft)
        return draft
    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        raise HTTPException(status_code=429 if is_rl else 500, detail="AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." if is_rl else "Mail taslağı oluşturulamadı.")


# ── POST /api/ai/draft-notification ──────────────────────────

DRAFT_NOTIF_SYSTEM = """Sen CoopFlow AI'sın. Kooperatif müşteri temsilcisi adına müşteriye gönderilecek bildirim mesajı yaz.

SADECE şu JSON formatında yanıt ver:
{
  "subject": "mesaj konusu",
  "message": "mesaj içeriği (kısa, samimi, özür veya bilgi içeren)",
  "channel": "in_app"
}

Durum değerlerine göre ton:
- delayed: özür dile, yeni tahmini süre belirt (1-2 gün)
- pending: siparişin alındığını onayla, hazırlık sürecinde olduğunu söyle
- preparing: hazırlanıyor, yakında teslim
- ready: teslimata hazır, bekliyor

Kısa tut, samimi ol, Türkçe yaz."""


@router.post("/draft-notification")
async def draft_notification(req: DraftNotificationRequest):
    if not req.order_id:
        raise HTTPException(status_code=400, detail="order_id gerekli")

    sb = get_supabase()
    # requests tablosu: musteri, urun, miktar, saat, durum
    order_res = (
        sb.table("requests")
        .select("musteri, urun, miktar, saat, durum")
        .eq("id", req.order_id)
        .single()
        .execute()
    )
    if not order_res.data:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")

    order = order_res.data

    try:
        model = get_model()
        prompt = (
            f"Aşağıdaki sipariş için müşteriye bildirim taslağı yaz:\n\n"
            f"Müşteri: {order.get('musteri', '')}\n"
            f"Ürün: {order.get('urun', '')}\n"
            f"Miktar: {order.get('miktar', '')}\n"
            f"Durum: {order.get('durum', '')}\n"
            f"Saat: {order.get('saat', '')}"
        )
        result = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"response_mime_type": "application/json"},
            system_instruction=DRAFT_NOTIF_SYSTEM,
        )
        draft = json.loads(result.text)
        log_ai("draft_notification", f"draft_notification: order_id={req.order_id}", {"order_id": req.order_id, "order": order, "draft": draft})
        return draft
    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        raise HTTPException(status_code=429 if is_rl else 500, detail="AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." if is_rl else "Bildirim taslağı oluşturulamadı.")


# ── GET /api/ai/logs ──────────────────────────────────────────

@router.get("/logs")
async def ai_logs(
    date: str = Query(default=None),
    limit: int = Query(default=20),
):
    target = date or date_type.today().isoformat()
    sb = get_supabase()
    start, end = f"{target}T00:00:00", f"{target}T23:59:59"

    # ai_logs tablosu: id, zaman, tarih, tip, baslik, mesaj, renk, kategori
    # notifications tablosu yok — ai_logs'tan hem alert hem action üretiyoruz
    logs_res = (
        sb.table("ai_logs")
        .select("id, zaman, tarih, tip, baslik, mesaj, renk, kategori, detay_ne, detay_neden, detay_etki")
        .order("id", desc=True)
        .limit(limit)
        .execute()
    )

    def tip_to_level(tip: str) -> str:
        if tip in ("Anomali", "Hata"):
            return "danger"
        if tip in ("Tahmin", "Uyarı"):
            return "warn"
        return "info"

    def kategori_ctx(kat: str) -> list[str]:
        return {
            "Depo": ["Depo", "Stok"], "Trend": ["AI", "Trend"],
            "Raporlama": ["AI", "Rapor"], "İletişim": ["AI", "Bildirim"],
            "AI Tespiti": ["AI", "Anomali"],
        }.get(kat, ["AI"])

    all_logs = logs_res.data or []

    alerts = [
        {
            "id": str(log["id"]),
            "level": tip_to_level(log.get("tip", "")),
            "title": log.get("baslik", ""),
            "desc": log.get("mesaj", ""),
            "source": log.get("kategori", "AI"),
            "time": log.get("zaman", ""),
            "is_read": False,
        }
        for log in all_logs
        if log.get("tip") in ("Anomali", "Hata", "Uyarı", "Tahmin")
    ]

    actions = [
        {
            "id": str(log["id"]),
            "time": log.get("zaman", ""),
            "title": log.get("baslik", ""),
            "why": log.get("detay_neden") or log.get("mesaj", ""),
            "ctx": kategori_ctx(log.get("kategori", "")),
            "status": "success",
            "confidence": 92,
            "impact": log.get("detay_etki") or "iş akışına dahil edildi",
        }
        for log in all_logs
        if log.get("tip") in ("Rapor", "Otomasyon", "Aksiyon")
    ]

    summary = {
        "total_actions": len(actions),
        "total_alerts": len(alerts),
        "danger_count": sum(1 for a in alerts if a["level"] == "danger"),
        "warn_count": sum(1 for a in alerts if a["level"] == "warn"),
        "info_count": sum(1 for a in alerts if a["level"] == "info"),
        "unread_count": len(alerts),
    }

    return {"date": target, "summary": summary, "alerts": alerts, "actions": actions}


# ── POST /api/ai/weekly-insight ───────────────────────────────

WEEKLY_INSIGHT_SYSTEM = """Sen CoopFlow AI'sın. Kooperatif yöneticisi için haftalık gidişat özeti yaz.

SADECE şu JSON formatında yanıt ver:
{
  "insight": "2-3 cümlelik özet paragraf — karşılama oranı, öne çıkan trend, risk varsa belirt",
  "highlights": ["öne çıkan madde 1", "öne çıkan madde 2", "öne çıkan madde 3"],
  "recommended_actions": [
    { "tone": "danger|warn|good", "title": "aksiyon başlığı", "meta": "kısa açıklama" }
  ],
  "week_score": 0-100
}

Kurallar:
- insight: gerçek rakamları kullan, tahmini yok
- recommended_actions: en fazla 3, kritikten başla
- week_score: 100 = mükemmel hafta, 0 = kriz
- Türkçe yaz, kısa ve eyleme dönüştürülebilir ol"""


def _get_monday() -> str:
    today = date_type.today()
    days_since_monday = today.weekday()
    monday = today - timedelta(days=days_since_monday)
    return monday.isoformat()


@router.post("/weekly-insight")
async def weekly_insight(req: WeeklyInsightRequest):
    week_start = req.week_start or _get_monday()
    week_end_dt = date_type.fromisoformat(week_start) + timedelta(days=7)
    week_end = week_end_dt.isoformat()

    sb = get_supabase()
    try:
        # requests tablosu: musteri, urun, miktar, saat, durum
        orders_res = sb.table("requests").select("durum, miktar, urun").execute()
        orders = orders_res.data or []
        total_orders = len(orders)
        delivered = sum(1 for o in orders if o.get("durum") == "teslim edildi")
        delayed = sum(1 for o in orders if o.get("durum") in ("gecikti", "gecikmiş"))
        fulfillment_rate = round((delivered / total_orders) * 100) if total_orders > 0 else 0

        # products tablosu: ad, mevcut_kg, kapasite_kg
        products_res = sb.table("products").select("ad, mevcut_kg, kapasite_kg").execute()
        critical_items = []
        for p in (products_res.data or []):
            current = p.get("mevcut_kg") or 0
            capacity = p.get("kapasite_kg") or 1
            if current <= capacity * 0.25:
                critical_items.append({"name": p.get("ad", ""), "current": current, "unit": "kg"})

        context_text = f"""Hafta: {week_start} – {week_end}

Sipariş özeti:
- Toplam: {total_orders}
- Teslim edildi: {delivered} (%{fulfillment_rate} karşılama)
- Gecikmiş: {delayed}

Kritik stok durumu ({len(critical_items)} ürün):
{chr(10).join(f"- {i['name']}: {i['current']} {i['unit']} (kritik eşiğin altında)" for i in critical_items) or "- Kritik stok yok"}"""

        model = get_model()
        result = await asyncio.to_thread(
            model.generate_content,
            context_text,
            generation_config={"response_mime_type": "application/json"},
            system_instruction=WEEKLY_INSIGHT_SYSTEM,
        )
        ai_output = json.loads(result.text)

        response = {
            "week_start": week_start,
            "week_end": week_end,
            "stats": {
                "total_orders": total_orders,
                "delivered_orders": delivered,
                "delayed_orders": delayed,
                "fulfillment_rate": fulfillment_rate,
                "demand_trend_pct": 0,
                "critical_items": critical_items,
            },
            "insight": ai_output.get("insight", ""),
            "highlights": ai_output.get("highlights", []),
            "recommended_actions": ai_output.get("recommended_actions", []),
            "week_score": ai_output.get("week_score"),
        }
        log_ai("weekly_insight", f"weekly_insight_{week_start}", response)
        return response

    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        raise HTTPException(status_code=429 if is_rl else 500, detail="AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." if is_rl else "Haftalık özet oluşturulamadı.")


# ── GET /api/ai/reports ───────────────────────────────────────

@router.get("/reports")
async def ai_reports():
    sb = get_supabase()
    res = sb.table("ai_reports").select("*").order("id").execute()
    return res.data or []
