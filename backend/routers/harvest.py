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


_URUN_ALIASES: dict[str, str] = {
    "domates": "domates", "biber": "biber", "patlıcan": "patlıcan",
    "salatalık": "salatalık", "kayısı": "kayısı", "incir": "incir",
    "havuç": "havuç", "soğan": "soğan", "mısır": "mısır", "üzüm": "üzüm",
    "patates": "patates", "elma": "elma", "armut": "armut", "kiraz": "kiraz",
    "erik": "erik", "çilek": "çilek", "limon": "limon", "portakal": "portakal",
}


def _regex_parse(message: str) -> ParsedHarvest | None:
    """
    Gemini API erişilemediğinde basit regex ile parse et.
    '100 kg domates hasat ettim' gibi yapıları yakalar.
    """
    import re
    msg = message.lower()

    # Miktar + birim: "100 kg", "50adet", "3 kasa"
    qty_m = re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|adet|kasa|ton|gram|gr)", msg)
    if not qty_m:
        return None

    quantity = float(qty_m.group(1).replace(",", "."))
    unit = qty_m.group(2)

    # Ürün adı
    product_name = None
    for alias in _URUN_ALIASES:
        if alias in msg:
            product_name = _URUN_ALIASES[alias]
            break
    if not product_name:
        # Sayı + birimden sonra gelen kelime
        after = msg[qty_m.end():].strip()
        word_m = re.match(r"(\w+)", after)
        product_name = word_m.group(1) if word_m else "bilinmeyen"

    # Saat: "09:00", "saat 14", "öğleye kadar" vb.
    time_m = re.search(r"(\d{1,2})[:\.](\d{2})", msg)
    available_time = f"{int(time_m.group(1)):02d}:{time_m.group(2)}" if time_m else None

    return ParsedHarvest(
        product_name=product_name,
        quantity=quantity,
        unit=unit,
        available_time=available_time,
        confidence=0.80,  # regex parse — makul güven
    )


async def _parse_harvest(message: str) -> ParsedHarvest:
    import re
    prompt = (
        f"{PARSE_SYSTEM}\n\n"
        f"Mesaj: {message}\n\n"
        "Sadece JSON nesnesi döndür, başka hiçbir şey yazma."
    )
    try:
        model = get_model(complex=False)
        # Twilio webhook 15s timeout'u var; Gemini düşünme moduna girerse aşabilir
        result = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=9.0,
        )
        try:
            text = result.text.strip()
        except Exception:
            parts = result.candidates[0].content.parts
            text = "".join(p.text for p in parts if hasattr(p, "text") and p.text).strip()
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            text = m.group(0)
        return ParsedHarvest(**json.loads(text))
    except Exception as ai_err:
        # Gemini kota doldu, timeout veya erişilemiyor — regex fallback
        fallback = _regex_parse(message)
        if fallback:
            return fallback
        raise ai_err  # regex de başarısızsa orijinal hatayı fırlat


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


PARSE_MULTI_SYSTEM = """Kullanıcının Türkçe mesajından TÜM hasat edilen ürünleri çıkar ve SADECE JSON array döndür.

Her ürün için:
- product_name: ürün adı (string)
- quantity: miktar (number)
- unit: birim — "kg", "adet", "kasa" (string)
- available_time: varsa saat "HH:MM" formatında, yoksa null
- confidence: 0.0-1.0 arası güven skoru (number)

Tek ürün olsa bile array döndür.

Örnek:
Girdi: "50 kg biber ve 30 kg domates hasat ettim, öğleye kadar getirebilirim"
Çıktı: [
  {"product_name":"biber","quantity":50,"unit":"kg","available_time":"12:00","confidence":0.95},
  {"product_name":"domates","quantity":30,"unit":"kg","available_time":"12:00","confidence":0.95}
]"""


async def _parse_harvest_multi(message: str) -> list[ParsedHarvest]:
    """Mesajdan birden fazla ürünü parse et. Liste döner."""
    import re
    prompt = (
        f"{PARSE_MULTI_SYSTEM}\n\n"
        f"Mesaj: {message}\n\n"
        "Sadece JSON array döndür, başka hiçbir şey yazma."
    )
    try:
        model = get_model(complex=False)
        result = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=9.0,
        )
        try:
            text = result.text.strip()
        except Exception:
            parts = result.candidates[0].content.parts
            text = "".join(p.text for p in parts if hasattr(p, "text") and p.text).strip()
        m = re.search(r"\[.*\]", text, re.DOTALL)
        if m:
            text = m.group(0)
        items = json.loads(text)
        if isinstance(items, dict):
            items = [items]
        return [ParsedHarvest(**item) for item in items]
    except Exception:
        # Regex fallback — tek ürün dene
        fallback = _regex_parse(message)
        return [fallback] if fallback else []


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


@router.get("/messages")
async def harvest_messages(limit: int = 20):
    """
    Gelen WhatsApp hasat mesajlarını döner.
    ai_logs tablosundan 'Hasat analizi yapıldı' kayıtları + tasks'tan hasat görevleri.
    """
    from database import get_supabase
    sb = get_supabase()

    logs_res = (
        sb.table("ai_logs")
        .select("id, zaman, tarih, mesaj, detay_etki, kategori")
        .eq("baslik", "Hasat analizi yapıldı")
        .order("id", desc=True)
        .limit(limit)
        .execute()
    )

    tasks_res = (
        sb.table("tasks")
        .select("id, is_name, durum, oncelik")
        .ilike("is_name", "%hasat teslimi%")
        .order("id", desc=True)
        .limit(limit)
        .execute()
    )

    # log'ları zenginleştir
    messages = []
    for log in (logs_res.data or []):
        raw = log.get("mesaj", "")
        messages.append({
            "id": f"log-{log['id']}",
            "time": f"{log.get('zaman', '')} · {log.get('tarih', '')}",
            "message": raw,
            "impact": log.get("detay_etki", ""),
            "source": "whatsapp",
        })

    tasks = []
    for t in (tasks_res.data or []):
        tasks.append({
            "id": t["id"],
            "title": t.get("is_name", ""),
            "done": bool(t.get("durum")),
            "priority": t.get("oncelik", ""),
        })

    return {"messages": messages, "tasks": tasks}
