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
    order_res = (
        sb.table("orders")
        .select("customer_name, quantity, unit, status, created_at, products(name)")
        .eq("id", req.order_id)
        .single()
        .execute()
    )
    if not order_res.data:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")

    order = order_res.data
    product_name = (order.get("products") or {}).get("name", "Bilinmeyen")

    from datetime import datetime
    created_tr = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00")).strftime("%d.%m.%Y")

    try:
        model = get_model()
        prompt = (
            f"Aşağıdaki sipariş için müşteriye bildirim taslağı yaz:\n\n"
            f"Müşteri: {order['customer_name']}\n"
            f"Ürün: {product_name}\n"
            f"Miktar: {order['quantity']} {order['unit']}\n"
            f"Durum: {order['status']}\n"
            f"Sipariş tarihi: {created_tr}"
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

    notif_res = (
        sb.table("notifications")
        .select("id, title, message, type, role, is_read, created_at")
        .in_("type", ["warning", "error", "info"])
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    logs_res = (
        sb.table("ai_logs")
        .select("id, action_type, input_text, output_data, status, created_at")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    def fmt_time(iso: str) -> str:
        from datetime import datetime
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%H:%M")

    def role_label(role: str) -> str:
        return {"manager": "Yönetici", "warehouse": "Depo · Stok", "producer": "Üretici sinyali", "customer_rep": "Müşteri hizmetleri"}.get(role, role)

    def action_title(at: str) -> str:
        return {
            "harvest_analyze": "Hasat analizi yapıldı", "chat": "Sohbet isteği yanıtlandı",
            "daily_summary": "Günlük özet oluşturuldu", "draft_email": "Tedarikçi mail taslağı hazırlandı",
            "draft_notification": "Müşteri bildirimi taslağı hazırlandı", "stock_check": "Stok kontrolü yapıldı",
            "anomaly_check": "Anomali taraması tamamlandı",
        }.get(at, at)

    def action_ctx(at: str) -> list[str]:
        return {
            "harvest_analyze": ["Üretici", "Hasat", "Stok"], "chat": ["AI", "Sohbet"],
            "daily_summary": ["AI", "Özet", "Günlük"], "draft_email": ["Tedarikçi", "Mail"],
            "draft_notification": ["Müşteri", "Bildirim"], "stock_check": ["Depo", "Stok"],
            "anomaly_check": ["AI", "Anomali"],
        }.get(at, ["AI"])

    def extract_confidence(data) -> int:
        if isinstance(data, dict) and "parsed" in data:
            p = data["parsed"]
            if isinstance(p, dict) and "confidence" in p:
                return round(p["confidence"] * 100)
        return 92

    def extract_impact(at: str, data) -> str:
        if not isinstance(data, dict):
            return "iş akışına dahil edildi"
        if at == "stock_check":
            return f"{data['critical_count']} kritik ürün tespit edildi" if data.get("critical_count") else "tüm stoklar yeterli"
        if at == "anomaly_check":
            return f"{data['anomaly_count']} anomali tespit edildi" if data.get("anomaly_count") else "anomali yok"
        if at == "harvest_analyze":
            executed = len(data.get("executed_actions", []))
            return f"{executed} otomatik aksiyon alındı" if executed else "öneri üretildi"
        return "iş akışına dahil edildi"

    alerts = [
        {
            "id": n["id"],
            "level": "danger" if n["type"] == "error" else "warn" if n["type"] == "warning" else "info",
            "title": n["title"],
            "desc": n["message"],
            "source": role_label(n["role"]),
            "time": fmt_time(n["created_at"]),
            "is_read": n["is_read"],
        }
        for n in (notif_res.data or [])
    ]

    actions = [
        {
            "id": log["id"],
            "time": fmt_time(log["created_at"]),
            "title": action_title(log["action_type"]),
            "why": log["input_text"],
            "ctx": action_ctx(log["action_type"]),
            "status": log.get("status", "bilgi"),
            "confidence": extract_confidence(log.get("output_data")),
            "impact": extract_impact(log["action_type"], log.get("output_data")),
        }
        for log in (logs_res.data or [])
    ]

    summary = {
        "total_actions": len(actions),
        "total_alerts": len(alerts),
        "danger_count": sum(1 for a in alerts if a["level"] == "danger"),
        "warn_count": sum(1 for a in alerts if a["level"] == "warn"),
        "info_count": sum(1 for a in alerts if a["level"] == "info"),
        "unread_count": sum(1 for a in alerts if not a["is_read"]),
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
        orders_res = (
            sb.table("orders")
            .select("status, quantity, products(name)")
            .gte("created_at", f"{week_start}T00:00:00")
            .lt("created_at", f"{week_end}T00:00:00")
            .execute()
        )
        orders = orders_res.data or []
        total_orders = len(orders)
        delivered = sum(1 for o in orders if o["status"] == "delivered")
        delayed = sum(1 for o in orders if o["status"] == "delayed")
        fulfillment_rate = round((delivered / total_orders) * 100) if total_orders > 0 else 0

        products_res = sb.table("products").select("id, name, unit, critical_stock_level").execute()
        critical_items = []
        for p in (products_res.data or []):
            inv = sb.table("inventory").select("current_quantity").eq("product_id", p["id"]).single().execute()
            current = (inv.data or {}).get("current_quantity", 0)
            if current <= p["critical_stock_level"]:
                critical_items.append({"name": p["name"], "current": current, "unit": p["unit"]})

        prev_week_start = (date_type.fromisoformat(week_start) - timedelta(days=7)).isoformat()
        prev_res = (
            sb.table("orders")
            .select("quantity, product_id")
            .gte("created_at", f"{prev_week_start}T00:00:00")
            .lt("created_at", f"{week_start}T00:00:00")
            .execute()
        )
        prev_orders = prev_res.data or []
        this_total = sum(o.get("quantity", 0) for o in orders)
        prev_total = sum(o.get("quantity", 0) for o in prev_orders)
        demand_trend = round(((this_total - prev_total) / prev_total) * 100) if prev_total > 0 else 0

        harvests_res = (
            sb.table("producer_product_reports")
            .select("quantity, unit, status, products(name), profiles(full_name)")
            .gte("created_at", f"{week_start}T00:00:00")
            .lt("created_at", f"{week_end}T00:00:00")
            .execute()
        )
        harvests = harvests_res.data or []

        def _get(raw, key: str, default="Bilinmeyen") -> str:
            if isinstance(raw, dict):
                return raw.get(key, default)
            return default

        context_text = f"""Hafta: {week_start} – {week_end}

Sipariş özeti:
- Toplam: {total_orders}
- Teslim edildi: {delivered} (%{fulfillment_rate} karşılama)
- Gecikmiş: {delayed}
- Geçen haftaya göre talep değişimi: {'+' if demand_trend >= 0 else ''}{demand_trend}%

Kritik stok durumu ({len(critical_items)} ürün):
{chr(10).join(f"- {i['name']}: {i['current']} {i['unit']} (kritik eşiğin altında)" for i in critical_items) or "- Kritik stok yok"}

Hasat bildirimleri ({len(harvests)} kayıt):
{chr(10).join(f"- {_get(h.get('profiles'), 'full_name')}: {h['quantity']} {h['unit']} {_get(h.get('products'), 'name')} ({h['status']})" for h in harvests[:5]) or "- Kayıt yok"}"""

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
                "demand_trend_pct": demand_trend,
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
