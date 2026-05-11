from __future__ import annotations
import asyncio
import json
from fastapi import APIRouter, HTTPException
from models.schemas import HarvestRequest, HarvestAnalysisResult, ParsedHarvest, StockStatus
from services.gemini_client import get_model
from services.orchestrator import run_agent
from services.logger import log_ai
from tools.handlers import assign_task, send_notification, check_threshold

router = APIRouter(prefix="/api/harvest", tags=["harvest"])

PARSE_SYSTEM = """Kullanıcının Türkçe mesajından hasat bilgilerini çıkar ve SADECE JSON döndür.

Çıkarman gerekenler:
- product_name: ürün adı (string)
- quantity: miktar (number)
- unit: birim — "kg", "adet", "kasa" (string)
- available_time: varsa saat, "HH:MM" formatında, yoksa null
- confidence: ne kadar emin olduğun, 0.0 ile 1.0 arası (number)

Örnek:
Girdi: "Bugün 200 kg domates hazır, öğlene kadar getirebilirim"
Çıktı: {"product_name":"domates","quantity":200,"unit":"kg","available_time":"12:00","confidence":0.95}"""


async def _parse_harvest(message: str) -> ParsedHarvest:
    import re
    prompt = (
        f"{PARSE_SYSTEM}\n\n"
        f"Mesaj: {message}\n\n"
        "Sadece JSON nesnesi döndür, başka hiçbir şey yazma."
    )
    model = get_model(complex=False)
    result = await asyncio.to_thread(model.generate_content, prompt)
    # gemini-2.5-flash thinking mode: candidates üzerinden text al
    try:
        text = result.text.strip()
    except Exception:
        # Thinking mode'da text doğrudan erişilemiyorsa parts'tan al
        parts = result.candidates[0].content.parts
        text = "".join(p.text for p in parts if hasattr(p, "text") and p.text).strip()
    # Markdown kod bloğunu temizle
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        text = m.group(0)
    return ParsedHarvest(**json.loads(text))


def _resolve_confidence(confidence: float) -> dict:
    if confidence >= 0.85:
        return {"confidence_label": "Yüksek", "confidence_warning": None}
    if confidence >= 0.7:
        return {
            "confidence_label": "Orta",
            "confidence_warning": "Mesaj kısmen belirsiz. Aksiyonlar alındı ancak üreticiyle teyit edilmesi önerilir.",
        }
    return {
        "confidence_label": "Düşük",
        "confidence_warning": "Mesaj çok belirsiz, otomatik aksiyon alınmadı. Üreticiden net bilgi isteyin.",
    }


@router.post("/analyze")
async def analyze_harvest(req: HarvestRequest):
    if not req.message:
        raise HTTPException(status_code=400, detail="message gerekli")

    try:
        parsed = await _parse_harvest(req.message)

        agent_prompt = (
            f'Üretici şunu bildirdi: "{req.message}"\n\n'
            f"Çıkardığım bilgi: {parsed.quantity} {parsed.unit} {parsed.product_name} hazır, "
            f"getirme zamanı: {parsed.available_time or 'belirtilmemiş'}.\n\n"
            "Şimdi:\n1. Bu ürünün mevcut stok durumunu kontrol et\n"
            "2. Kritik eşiğe bak\n3. Ne yapılması gerektiğini söyle"
        )
        agent_result = await run_agent(agent_prompt)

        # Stok durumunu tool çağrılarından çıkar
        threshold_call = next((t for t in agent_result["toolCalls"] if t["tool"] == "check_threshold"), None)
        tr = threshold_call["result"] if threshold_call else {}
        stock_status = StockStatus(
            current_quantity=tr.get("current_quantity", 0),
            unit=tr.get("unit", "kg"),
            is_critical=tr.get("is_critical", False),
            fill_percentage=tr.get("fill_percentage", 100),
        )

        suggested_actions = [
            f"Depo görevi oluştur: {parsed.quantity} {parsed.unit} {parsed.product_name} teslim al"
        ]
        if stock_status.is_critical:
            suggested_actions += ["Yöneticiye kritik stok uyarısı gönder", "Tedarikçi sipariş taslağı hazırla"]
        if parsed.available_time:
            suggested_actions.append(f"Teslim saati: {parsed.available_time} — depo sorumlusuna bildir")

        executed_actions: list[str] = []
        auto_executed = parsed.confidence >= 0.7

        if auto_executed:
            time_note = f" (Teslim: {parsed.available_time})" if parsed.available_time else ""
            task_result = assign_task(
                role="warehouse",
                title=f"{parsed.product_name} hasat teslimi — {parsed.quantity} {parsed.unit}",
                description=f'Üretici bildirimi: "{req.message}"{time_note}',
                priority="high" if stock_status.is_critical else "medium",
                product_name=parsed.product_name,
            )
            if "task_id" in task_result:
                executed_actions.append(f"Depo görevi oluşturuldu (ID: {task_result['task_id']})")

            send_notification(
                role="warehouse",
                title=f"Yeni hasat: {parsed.product_name}",
                message=f"{parsed.quantity} {parsed.unit} {parsed.product_name} teslim alınacak.{time_note} Görev oluşturuldu.",
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
                executed_actions.append("Yöneticiye kritik stok + hasat bildirimi gönderildi")

        conf = _resolve_confidence(parsed.confidence)
        response = {
            "parsed": parsed.model_dump(),
            "stock_status": stock_status.model_dump(),
            "recommendation": agent_result["text"],
            "actions": suggested_actions,
            "executed_actions": executed_actions,
            "auto_executed": auto_executed,
            **conf,
        }

        log_ai("harvest_analyze", req.message, response)
        return response

    except Exception as exc:
        msg = str(exc)
        is_rate_limit = "429" in msg or "quota" in msg.lower()
        raise HTTPException(
            status_code=429 if is_rate_limit else 500,
            detail="AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." if is_rate_limit else "Hasat analizi yapılamadı.",
        )
