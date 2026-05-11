from __future__ import annotations
import asyncio
import json
from fastapi import APIRouter, Form, Request
from fastapi.responses import PlainTextResponse
from models.schemas import HarvestRequest
from routers.harvest import _parse_harvest, _resolve_confidence
from services.orchestrator import run_agent
from services.logger import log_ai
from tools.handlers import assign_task, send_notification, check_threshold
from models.schemas import StockStatus

router = APIRouter(prefix="/api/webhook", tags=["webhook"])


def _twiml(message: str) -> PlainTextResponse:
    """Twilio'ya gönderilecek TwiML yanıtı."""
    body = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{message}</Message>
</Response>"""
    return PlainTextResponse(content=body, media_type="text/xml")


def _format_whatsapp_reply(parsed: dict, stock: dict, executed: list[str], conf_label: str, conf_warning: str | None) -> str:
    """Üreticiye WhatsApp'ta gönderilecek okunabilir yanıt."""
    lines = [
        f"✅ *Hasat bildirimin alındı!*",
        f"📦 *{parsed['product_name'].capitalize()}* — {parsed['quantity']} {parsed['unit']}",
    ]
    if parsed.get("available_time"):
        lines.append(f"🕐 Teslim saati: {parsed['available_time']}")

    lines.append("")
    lines.append(f"📊 *Stok durumu:* %{round(stock['fill_percentage'])} dolu")

    if stock["is_critical"]:
        lines.append("⚠️ Stok kritik seviyede — acil işlem başlatıldı.")
    else:
        lines.append("✔️ Stok yeterli seviyde.")

    if executed:
        lines.append("")
        lines.append("🤖 *Otomatik aksiyonlar:*")
        for a in executed:
            lines.append(f"  • {a}")

    if conf_warning:
        lines.append("")
        lines.append(f"ℹ️ _{conf_warning}_")

    lines.append("")
    lines.append("_CoopNet AI — Kooperatif Yönetim Sistemi_")
    return "\n".join(lines)


@router.post("/whatsapp", response_class=PlainTextResponse)
async def whatsapp_webhook(
    Body: str = Form(...),
    From: str = Form(default=""),
    ProfileName: str = Form(default="Üretici"),
):
    """
    Twilio WhatsApp webhook endpoint.
    Üreticinin gönderdiği mesajı parse eder, stok kontrol eder,
    gerekli aksiyonları alır ve WhatsApp yanıtı döner.
    """
    message = Body.strip()
    if not message:
        return _twiml("Mesaj alınamadı. Lütfen tekrar gönder.")

    try:
        parsed = await _parse_harvest(message)

        # Güven düşükse direkt sor
        if parsed.confidence < 0.5:
            return _twiml(
                f"Merhaba {ProfileName}! Mesajını tam anlayamadım 🤔\n\n"
                "Lütfen şu formatta yaz:\n"
                "*[Miktar] kg/adet [ürün adı] hasat ettim*\n\n"
                "Örnek: _100 kg domates hasat ettim_"
            )

        # Stok kontrolü
        agent_prompt = (
            f'Üretici {ProfileName} şunu bildirdi: "{message}"\n\n'
            f"Çıkardığım bilgi: {parsed.quantity} {parsed.unit} {parsed.product_name} hazır.\n\n"
            "Şimdi:\n1. Bu ürünün mevcut stok durumunu kontrol et\n"
            "2. Kritik eşiğe bak\n3. Ne yapılması gerektiğini söyle"
        )
        agent_result = await run_agent(agent_prompt)

        threshold_call = next((t for t in agent_result["toolCalls"] if t["tool"] == "check_threshold"), None)
        tr = threshold_call["result"] if threshold_call else {}
        stock_status = StockStatus(
            current_quantity=tr.get("current_quantity", 0),
            unit=tr.get("unit", "kg"),
            is_critical=tr.get("is_critical", False),
            fill_percentage=tr.get("fill_percentage", 100),
        )

        executed_actions: list[str] = []
        time_note = f" (Teslim: {parsed.available_time})" if parsed.available_time else ""

        task_result = assign_task(
            role="warehouse",
            title=f"{parsed.product_name} hasat teslimi — {parsed.quantity} {parsed.unit}",
            description=f'Üretici {ProfileName} bildirimi: "{message}"{time_note}',
            priority="high" if stock_status.is_critical else "medium",
            product_name=parsed.product_name,
        )
        if "task_id" in task_result:
            executed_actions.append(f"Depo görevi oluşturuldu (ID: {task_result['task_id']})")

        send_notification(
            role="warehouse",
            title=f"Yeni hasat: {parsed.product_name}",
            message=f"{parsed.quantity} {parsed.unit} {parsed.product_name} teslim alınacak.{time_note}",
            type="info",
        )
        executed_actions.append("Depo sorumlusuna bildirim gönderildi")

        if stock_status.is_critical:
            send_notification(
                role="manager",
                title=f"⚠️ Kritik stok + yeni hasat: {parsed.product_name}",
                message=f"{parsed.product_name} stoğu kritik ({stock_status.current_quantity} {stock_status.unit}). Yeni hasat yolda: {parsed.quantity} {parsed.unit}.",
                type="warning",
            )
            executed_actions.append("Yöneticiye kritik stok bildirimi gönderildi")

        conf = _resolve_confidence(parsed.confidence)

        response = {
            "parsed": parsed.model_dump(),
            "stock_status": stock_status.model_dump(),
            "recommendation": agent_result["text"],
            "executed_actions": executed_actions,
            **conf,
        }
        log_ai("harvest_analyze", message, response)

        reply = _format_whatsapp_reply(
            parsed.model_dump(),
            stock_status.model_dump(),
            executed_actions,
            conf["confidence_label"],
            conf["confidence_warning"],
        )
        return _twiml(reply)

    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        error_reply = (
            "AI şu an yoğun, birkaç saniye sonra tekrar mesaj at 🙏"
            if is_rl else
            "Bir hata oluştu. Lütfen tekrar dene veya yöneticiye bildir."
        )
        return _twiml(error_reply)


# ── Demo endpoint (WhatsApp UI için — Twilio değil, JSON döner) ──

@router.post("/whatsapp/demo")
async def whatsapp_demo(
    Body: str = Form(...),
    ProfileName: str = Form(default="Demo Üretici"),
):
    """
    WhatsApp demo arayüzü için JSON döndüren endpoint.
    Gerçek Twilio webhook ile aynı mantık, farklı response format.
    """
    message = Body.strip()
    if not message:
        return {"error": "Boş mesaj"}

    try:
        parsed = await _parse_harvest(message)

        if parsed.confidence < 0.5:
            return {
                "reply": (
                    f"Mesajını tam anlayamadım 🤔\n\n"
                    "Lütfen şu formatta yaz:\n"
                    "**[Miktar] kg [ürün adı] hasat ettim**\n\n"
                    "Örnek: _100 kg domates hasat ettim_"
                ),
                "parsed": None,
                "stock_status": None,
                "executed_actions": [],
                "confidence_label": "Düşük",
                "confidence_warning": "Mesaj çok belirsiz.",
            }

        agent_prompt = (
            f'Üretici {ProfileName} şunu bildirdi: "{message}"\n\n'
            f"Bilgi: {parsed.quantity} {parsed.unit} {parsed.product_name} hazır.\n\n"
            "Stok durumunu kontrol et ve öneri sun."
        )
        agent_result = await run_agent(agent_prompt)

        threshold_call = next((t for t in agent_result["toolCalls"] if t["tool"] == "check_threshold"), None)
        tr = threshold_call["result"] if threshold_call else {}
        stock_status = StockStatus(
            current_quantity=tr.get("current_quantity", 0),
            unit=tr.get("unit", "kg"),
            is_critical=tr.get("is_critical", False),
            fill_percentage=tr.get("fill_percentage", 100),
        )

        executed_actions: list[str] = []
        time_note = f" (Teslim: {parsed.available_time})" if parsed.available_time else ""

        task_result = assign_task(
            role="warehouse",
            title=f"{parsed.product_name} hasat teslimi — {parsed.quantity} {parsed.unit}",
            description=f'Üretici {ProfileName}: "{message}"{time_note}',
            priority="high" if stock_status.is_critical else "medium",
            product_name=parsed.product_name,
        )
        if "task_id" in task_result:
            executed_actions.append(f"✅ Depo görevi oluşturuldu (ID: {task_result['task_id']})")

        send_notification(
            role="warehouse",
            title=f"Yeni hasat: {parsed.product_name}",
            message=f"{parsed.quantity} {parsed.unit} {parsed.product_name} teslim alınacak.{time_note}",
            type="info",
        )
        executed_actions.append("📬 Depo sorumlusuna bildirim gönderildi")

        if stock_status.is_critical:
            send_notification(
                role="manager",
                title=f"⚠️ Kritik stok + yeni hasat: {parsed.product_name}",
                message=f"{parsed.product_name} stoğu kritik. Yeni hasat yolda: {parsed.quantity} {parsed.unit}.",
                type="warning",
            )
            executed_actions.append("⚠️ Yöneticiye kritik stok bildirimi gönderildi")

        conf = _resolve_confidence(parsed.confidence)
        log_ai("harvest_analyze", message, {"parsed": parsed.model_dump(), "executed_actions": executed_actions})

        reply = _format_whatsapp_reply(
            parsed.model_dump(),
            stock_status.model_dump(),
            executed_actions,
            conf["confidence_label"],
            conf["confidence_warning"],
        )

        return {
            "reply": reply,
            "parsed": parsed.model_dump(),
            "stock_status": stock_status.model_dump(),
            "executed_actions": executed_actions,
            **conf,
        }

    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        return {
            "reply": "AI şu an yoğun, birkaç saniye bekle 🙏" if is_rl else "Bir hata oluştu.",
            "parsed": None,
            "stock_status": None,
            "executed_actions": [],
            "confidence_label": "Hata",
            "confidence_warning": str(exc),
        }
