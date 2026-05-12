from __future__ import annotations
from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from routers.harvest import _parse_harvest_multi, _resolve_confidence
from services.logger import log_ai
from tools.handlers import (
    assign_task,
    send_notification,
    check_threshold,
    verify_producer,
    get_product_price,
    calculate_needed_quantity,
    create_pending_approval,
    log_agent_decision,
    find_pending_offer_by_phone,
    confirm_waste_offer,
    update_stock,
    send_twilio_whatsapp,
)
from models.schemas import ParsedHarvest

router = APIRouter(prefix="/api/webhook", tags=["webhook"])

# ── Onay ifadesi tespiti ──────────────────────────────────────────────────────
def _tr_norm(s: str) -> str:
    """Türkçe karakterleri ASCII'ye yaklaştır: İ→i, ı→i, Ğ→g vb."""
    return (s.lower()
            .replace("i̇", "i").replace("İ", "i")
            .replace("ı", "i").replace("I", "i")
            .replace("ğ", "g").replace("Ğ", "g")
            .replace("ş", "s").replace("Ş", "s")
            .replace("ç", "c").replace("Ç", "c")
            .replace("ö", "o").replace("Ö", "o")
            .replace("ü", "u").replace("Ü", "u"))

# Normalize edilmiş onay kelimeleri
_CONFIRM_WORDS = [
    "onayliyorum", "onayladim", "evet", "tamam", "ok", "kabul",
    "alacagim", "alirim", "istiyorum", "alalim", "olur",
]

def _is_confirmation(message: str) -> bool:
    return any(w in _tr_norm(message) for w in _CONFIRM_WORDS)

# ── Stok karar eşikleri ───────────────────────────────────────────────────────
CRITICAL_THRESHOLD  = 25   # %25 altı → otomatik kabul
SUFFICIENT_THRESHOLD = 75  # %75 üstü → ihtiyaç yok


def _twiml(message: str) -> PlainTextResponse:
    body = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{message}</Message>
</Response>"""
    return PlainTextResponse(content=body, media_type="text/xml")


def _twiml_silent() -> PlainTextResponse:
    """Kayıtsız numara için sessiz yanıt."""
    return PlainTextResponse(
        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        media_type="text/xml",
    )


async def _process_product(
    parsed: ParsedHarvest,
    producer: dict,
    original_message: str,
) -> dict:
    """
    Tek bir ürün için stok kararını ver.
    Döner: {product, quantity, needed, decision, fill_pct, reply_line}
    """
    uretici_adi     = producer.get("ad", "Üretici")
    uretici_telefon = producer.get("telefon", "")
    product_label   = parsed.product_name.capitalize()

    # Stok durumu
    threshold = check_threshold(parsed.product_name)
    fill_pct  = threshold.get("fill_percentage", 100)
    unit      = threshold.get("unit", parsed.unit)

    # Ne kadar alabiliriz?
    needed_qty = calculate_needed_quantity(parsed.product_name, parsed.quantity)

    # Fiyat
    price_info  = get_product_price(parsed.product_name)
    alis_fiyati = price_info.get("alis_fiyati") if price_info else None
    price_line  = f"\n💰 Alış fiyatı: ₺{alis_fiyati}/kg" if alis_fiyati else ""

    time_note    = f" (Teslim: {parsed.available_time})" if parsed.available_time else ""
    partial_note = (
        f"\n📦 Not: {parsed.quantity} {unit} teklifinizin {needed_qty} {unit}'ını alabiliriz."
        if needed_qty < parsed.quantity else ""
    )

    # ── İHTİYAÇ YOK (%75+) ───────────────────────────────────────────────────
    if fill_pct >= SUFFICIENT_THRESHOLD:
        log_agent_decision(
            ajan="whatsapp_harvest",
            karar="ihtiyac_yok",
            aciklama=f"{product_label} stoku yeterli (%{fill_pct}). Talep reddedildi.",
            tetikleyen=original_message,
            meta={
                "uretici": uretici_adi,
                "urun": parsed.product_name,
                "fill_pct": fill_pct,
                "talep_kg": parsed.quantity,
            },
        )
        return {
            "product": parsed.product_name,
            "quantity": parsed.quantity,
            "needed": 0,
            "decision": "ihtiyac_yok",
            "fill_pct": fill_pct,
            "reply_line": (
                f"❌ *{product_label}*: Depomuzda şu an yeterince {parsed.product_name} bulunuyor "
                f"(%{fill_pct} dolu). Bu ürün için başka alıcılara yönelebilirsiniz."
            ),
        }

    # ── OTOMATİK KABUL (%25 altı) ─────────────────────────────────────────────
    elif fill_pct < CRITICAL_THRESHOLD:
        task_result = assign_task(
            role="warehouse",
            title=f"{parsed.product_name} hasat teslimi — {needed_qty} {unit}",
            description=(
                f'Üretici {uretici_adi}: "{original_message}"{time_note}. '
                f"Alınacak miktar: {needed_qty}/{parsed.quantity} {unit}."
            ),
            priority="high",
            product_name=parsed.product_name,
        )
        send_notification(
            role="warehouse",
            title=f"🚨 Acil teslim: {parsed.product_name}",
            message=(
                f"{uretici_adi}, {needed_qty} {unit} {parsed.product_name} getiriyor.{time_note} "
                f"Stok kritik (%{fill_pct})."
            ),
            type="warning",
        )
        send_notification(
            role="manager",
            title=f"🚨 Kritik stok — otomatik kabul: {parsed.product_name}",
            message=(
                f"Stok %{fill_pct}. {uretici_adi}'nın {needed_qty} {unit} "
                f"{parsed.product_name} teslimatı otomatik onaylandı."
            ),
            type="warning",
        )
        log_agent_decision(
            ajan="whatsapp_harvest",
            karar="otomatik_kabul",
            aciklama=f"{product_label} stoğu kritik (%{fill_pct}). {needed_qty} {unit} otomatik kabul.",
            tetikleyen=original_message,
            meta={
                "uretici": uretici_adi,
                "urun": parsed.product_name,
                "fill_pct": fill_pct,
                "talep_kg": parsed.quantity,
                "kabul_kg": needed_qty,
                "task_id": task_result.get("task_id"),
            },
        )
        return {
            "product": parsed.product_name,
            "quantity": parsed.quantity,
            "needed": needed_qty,
            "decision": "otomatik_kabul",
            "fill_pct": fill_pct,
            "reply_line": (
                f"✅ *{product_label}*: Depo stoğumuz kritik seviyede (%{fill_pct})! "
                f"{needed_qty} {unit} teslim alınacak, depo görevi oluşturuldu.{price_line}{partial_note}"
            ),
        }

    # ── YÖNETİCİ ONAYI (%25–75 arası) ────────────────────────────────────────
    else:
        approval = create_pending_approval(
            uretici_telefon=uretici_telefon,
            uretici_adi=uretici_adi,
            urun_adi=parsed.product_name,
            talep_miktari=parsed.quantity,
            kabul_miktari=needed_qty,
            birim=unit,
            stok_doluluk=fill_pct,
            ham_mesaj=original_message,
        )
        send_notification(
            role="manager",
            title=f"⏳ Onay bekliyor: {parsed.product_name}",
            message=(
                f"{uretici_adi}, {parsed.quantity} {unit} {parsed.product_name} teslim etmek istiyor. "
                f"Stok %{fill_pct}. Alabileceğimiz miktar: {needed_qty} {unit}. "
                f"12 saat içinde yanıt verilmezse otomatik reddedilir."
            ),
            type="info",
        )
        log_agent_decision(
            ajan="whatsapp_harvest",
            karar="onay_bekleniyor",
            aciklama=f"{product_label} için yönetici onayı bekleniyor (approval_id={approval.get('id')}). Stok %{fill_pct}.",
            tetikleyen=original_message,
            meta={
                "uretici": uretici_adi,
                "urun": parsed.product_name,
                "fill_pct": fill_pct,
                "talep_kg": parsed.quantity,
                "kabul_kg": needed_qty,
                "approval_id": approval.get("id"),
            },
        )
        return {
            "product": parsed.product_name,
            "quantity": parsed.quantity,
            "needed": needed_qty,
            "decision": "onay_bekleniyor",
            "fill_pct": fill_pct,
            "reply_line": (
                f"⏳ *{product_label}*: Talebiniz alındı ({parsed.quantity} {unit}, stok %{fill_pct}). "
                f"Yöneticimiz inceleyecek ve 12 saat içinde size geri döneceğiz.{partial_note}"
            ),
        }


# ── TWILIO WEBHOOK ────────────────────────────────────────────────────────────

@router.post("/whatsapp", response_class=PlainTextResponse)
async def whatsapp_webhook(
    Body:        str = Form(...),
    From:        str = Form(default=""),
    ProfileName: str = Form(default="Üretici"),
):
    """
    Twilio WhatsApp webhook.
    1. Üretici kimlik doğrulama
    2. Çoklu ürün NLP parse
    3. Her ürün için stok kararı (ihtiyaç yok / onay bekle / otomatik kabul)
    4. WhatsApp yanıtı
    """
    message = Body.strip()
    if not message:
        return _twiml("Mesaj alınamadı. Lütfen tekrar gönder.")

    clean_phone = From.replace("whatsapp:", "").strip()

    # ── 0) Kardeş üretici israf teklifi onayı mı? ────────────────────────────
    if _is_confirmation(message):
        pending_offer = find_pending_offer_by_phone(clean_phone)
        if pending_offer:
            urun      = pending_offer["urun_adi"]
            miktar    = pending_offer["miktar_kg"]
            sister_ad = pending_offer["sister_adi"]

            # Teklifi onayla
            confirm_waste_offer(pending_offer["id"])

            # Depo görevi oluştur
            task_result = assign_task(
                role="warehouse",
                title=f"İsraf önleme teslimatı: {urun} — {miktar:.0f} kg → {sister_ad}",
                description=(
                    f"{sister_ad} ({clean_phone}) {miktar:.0f} kg {urun} teklifini onayladı. "
                    f"Ürünü hazırlayıp teslim edin."
                ),
                priority="high",
                product_name=urun,
            )

            # Stoktan düş
            update_stock(product_name=urun, delta=-miktar, reason="waste_prevention_sale")

            send_notification(
                role="manager",
                title=f"✅ İsraf teklifi onaylandı: {urun}",
                message=(
                    f"{sister_ad}, {miktar:.0f} kg {urun} teklifini WhatsApp'tan onayladı. "
                    f"Depo görevi oluşturuldu."
                ),
                type="success",
            )

            log_agent_decision(
                ajan="waste_prevention",
                karar="kardes_onayladi",
                aciklama=(
                    f"{sister_ad} {miktar:.0f} kg {urun} teklifini WhatsApp ile onayladı. "
                    f"Depo görevi oluşturuldu, stok güncellendi."
                ),
                tetikleyen=f"whatsapp:{clean_phone}",
                meta={
                    "urun":       urun,
                    "miktar_kg":  miktar,
                    "sister_ad":  sister_ad,
                    "offer_id":   pending_offer["id"],
                    "task_id":    task_result.get("task_id"),
                },
            )

            return _twiml(
                f"✅ Harika! Onayınız alındı.\n\n"
                f"*{miktar:.0f} kg {urun}* teslimatı için depo görevlimiz hazırlanıyor.\n"
                f"En kısa sürede sizinle iletişime geçeceğiz 🌿\n\n"
                f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
            )

    # 1) Kimlik doğrulama
    producer = verify_producer(clean_phone)

    if not producer:
        log_agent_decision(
            ajan="whatsapp_harvest",
            karar="kayitsiz_numara",
            aciklama=f"Bilinmeyen numara mesaj gönderdi: {clean_phone}",
            tetikleyen=message,
            meta={"telefon": clean_phone},
        )
        return _twiml(
            "Merhaba! 👋\n\n"
            "Bu numara CoopNet sisteminde kayıtlı değil.\n\n"
            "Kooperatifimize üretici olarak katılmak için yöneticimizle iletişime geçebilirsiniz.\n\n"
            "_CoopNet AI — Kooperatif Yönetim Sistemi_"
        )

    try:
        # 2) Çoklu ürün parse
        products = await _parse_harvest_multi(message)

        if not products or all(p.confidence < 0.5 for p in products):
            return _twiml(
                f"Merhaba {producer.get('ad', ProfileName)}! Mesajını anlayamadım 🤔\n\n"
                "Lütfen şu formatta yaz:\n"
                "*[Miktar] kg [ürün] hasat ettim*\n\n"
                "Örnek: _50 kg biber ve 30 kg domates hasat ettim_"
            )

        # 3) Her ürün için karar
        results = []
        for parsed in products:
            if parsed.confidence >= 0.5:
                result = await _process_product(parsed, producer, message)
                results.append(result)

        # 4) Yanıt oluştur
        uretici_adi = producer.get("ad", ProfileName)
        lines = [f"Merhaba *{uretici_adi}*! Hasat bildirimin alındı 🌿\n"]
        for r in results:
            lines.append(r["reply_line"])
        lines.append("\n_CoopNet AI — Kooperatif Yönetim Sistemi_")

        log_ai("whatsapp_harvest", message, {"producer": uretici_adi, "results": results})
        return _twiml("\n".join(lines))

    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        return _twiml(
            "AI şu an yoğun, birkaç saniye sonra tekrar mesaj at 🙏"
            if is_rl else
            "Bir hata oluştu. Lütfen tekrar dene veya yöneticiye bildir."
        )


# ── DEMO ENDPOINT (JSON — UI için) ────────────────────────────────────────────

@router.post("/whatsapp/demo")
async def whatsapp_demo(
    Body:        str = Form(...),
    From:        str = Form(default="demo"),
    ProfileName: str = Form(default="Demo Üretici"),
):
    """
    Dashboard'daki WhatsApp demo arayüzü için.
    Gerçek Twilio webhook ile aynı mantık, JSON döner.
    """
    message = Body.strip()
    if not message:
        return {"error": "Boş mesaj"}

    # Demo modunda kimlik doğrulamayı atla — From "demo" ise sahte üretici kullan
    clean_phone = From.replace("whatsapp:", "").strip()
    producer    = verify_producer(clean_phone)
    if not producer:
        producer = {"ad": ProfileName, "telefon": clean_phone}

    try:
        products = await _parse_harvest_multi(message)

        if not products or all(p.confidence < 0.5 for p in products):
            return {
                "reply": (
                    f"Mesajını anlayamadım 🤔\n\n"
                    "Lütfen şu formatta yaz:\n"
                    "**[Miktar] kg [ürün] hasat ettim**\n\n"
                    "Örnek: _50 kg biber hasat ettim_"
                ),
                "results": [],
            }

        results = []
        for parsed in products:
            if parsed.confidence >= 0.5:
                result = await _process_product(parsed, producer, message)
                results.append(result)

        uretici_adi = producer.get("ad", ProfileName)
        lines = [f"Merhaba *{uretici_adi}*! Hasat bildirimin alındı 🌿\n"]
        for r in results:
            lines.append(r["reply_line"])
        lines.append("\n_CoopNet AI — Kooperatif Yönetim Sistemi_")

        log_ai("whatsapp_harvest_demo", message, {"producer": uretici_adi, "results": results})
        return {"reply": "\n".join(lines), "results": results}

    except Exception as exc:
        msg = str(exc)
        is_rl = "429" in msg or "quota" in msg.lower()
        return {
            "reply": "AI şu an yoğun, birkaç saniye bekle 🙏" if is_rl else "Bir hata oluştu.",
            "results": [],
            "error": str(exc),
        }
