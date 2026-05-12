from __future__ import annotations
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import get_supabase
from services.logger import log_ai
from tools.handlers import (
    get_near_expiry_products,
    get_sister_producers_for_product,
    log_agent_decision,
    send_notification,
    send_twilio_whatsapp,
    create_pending_waste_offer,
    assign_task,
    update_stock,
)
from config import settings

router = APIRouter(prefix="/api/waste-prevention", tags=["waste-prevention"])

# ── GET /api/waste-prevention/test-whatsapp ───────────────────────────────────

@router.get("/test-whatsapp")
async def test_whatsapp():
    """
    Yöneticiye test WhatsApp mesajı gönderir.
    Twilio credentials doğrulamak için kullanılır.
    """
    to = settings.manager_whatsapp
    if not to:
        return {"status": "error", "message": "MANAGER_WHATSAPP .env'de tanımlı değil."}

    # Gerçekçi bir israf teklifi örneği gönder
    msg = (
        "🧪 *CoopNet Test Mesajı*\n\n"
        "Bu mesaj Twilio entegrasyonunu doğrulamak için gönderildi.\n\n"
        "——— Gerçek Teklif Örneği ———\n\n"
        "Merhaba *Tatlıcı Şirin Koop.*! 🌿\n\n"
        "⚡ KRİTİK: Depomuzda *45 kg İncir* bulunuyor ve "
        "*1 gün* içinde tüketilmesi gerekiyor.\n\n"
        "📦 Miktar: 45 kg\n"
        "💰 Teklif fiyatı: ₺45/kg\n\n"
        "Bu ürünü almak isterseniz *Onaylıyorum* yazmanız yeterli.\n"
        "Onayınızın ardından depo görevlimiz sizinle iletişime geçecektir.\n\n"
        "_CoopNet AI — Kooperatif Yönetim Sistemi_"
    )

    result = send_twilio_whatsapp(to, msg)
    return {
        "status":      result.get("status"),
        "to":          to,
        "message_sid": result.get("message_sid"),
        "message":     "Mesaj gönderildi!" if result.get("status") == "sent" else result.get("error", result.get("status")),
    }

# Kaç günden az raf ömrü kalırsa devreye girir
EXPIRY_DAYS_THRESHOLD = 3

# Günlük tüketimin kaç katı olursa "israf riski" sayılır
SURPLUS_MULTIPLIER = 1.5


def _calculate_daily_consumption(product: dict) -> float:
    """
    Basit tahmin: kapasitenin %10'u günlük tüketim.
    Gerçek veri olduğunda stock_movements tablosundan hesaplanabilir.
    """
    capacity = product.get("kapasite_kg") or 100
    return capacity * 0.10


def _discounted_price(alis_fiyati: float | None, days_left: int) -> float | None:
    """
    İsraf fiyatı: alış fiyatına eşit olacak şekilde indirimli satış fiyatı.
    Yani kardeş üreticiye alış fiyatından satıyoruz, zarar etmiyoruz.
    """
    return alis_fiyati  # Alış fiyatı = israf satış fiyatı


def _days_left(expiry_str: str | None) -> int | None:
    if not expiry_str:
        return None
    try:
        expiry = date.fromisoformat(expiry_str)
        return (expiry - date.today()).days
    except Exception:
        return None


# ── GET /api/waste-prevention/check ──────────────────────────────────────────

@router.get("/check")
async def check_waste_risk(request: Request):
    """
    Her 6 saatte bir çalışır.
    Son kullanım tarihi yakın + fazla stok olan ürünleri tespit eder.
    Uygun kardeş üreticiye WhatsApp teklifi hazırlar.
    Cron secret ile korunur.
    """
    secret = request.headers.get("x-cron-secret")
    if settings.cron_secret and secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Yetkisiz")

    at_risk    = []
    offers_out = []

    near_expiry = get_near_expiry_products(days_threshold=EXPIRY_DAYS_THRESHOLD)

    for product in near_expiry:
        days = _days_left(product.get("son_kullanim_tarihi"))
        if days is None or days < 0:
            continue

        mevcut   = product.get("mevcut_kg") or 0
        daily_est = _calculate_daily_consumption(product)
        needed_before_expiry = daily_est * days  # bu kadarını satabilecektik

        # Elimizdeki fazla miktar
        surplus = mevcut - needed_before_expiry
        if surplus <= 0:
            continue  # Normal tüketimle bitecek, sorun yok

        # İsraf riski var
        urun_adi    = product.get("ad", "bilinmeyen")
        alis_fiyati = product.get("alis_fiyati")
        satis_fiyati = _discounted_price(alis_fiyati, days)

        at_risk.append({
            "urun": urun_adi,
            "mevcut_kg": mevcut,
            "days_left": days,
            "surplus_kg": round(surplus, 1),
            "daily_est_kg": round(daily_est, 1),
        })

        # Kardeş üretici bul
        sisters = get_sister_producers_for_product(urun_adi)
        if not sisters:
            log_agent_decision(
                ajan="waste_prevention",
                karar="kardes_uretici_yok",
                aciklama=f"{urun_adi} için uygun kardeş üretici bulunamadı. {surplus:.0f} kg israf riski var.",
                tetikleyen="cron:waste_prevention",
                meta={"urun": urun_adi, "surplus_kg": surplus, "days_left": days},
            )
            send_notification(
                role="manager",
                title=f"⚠️ İsraf riski: {urun_adi}",
                message=(
                    f"{mevcut} kg {urun_adi} — {days} gün raf ömrü kaldı. "
                    f"~{surplus:.0f} kg israf olabilir. Kardeş üretici bulunamadı, manuel aksiyon gerekli."
                ),
                type="warning",
            )
            continue

        # Kritik (≤2 gün) → WhatsApp otomatik gönderim
        auto_send = days <= 2

        # Her uygun kardeş üreticiye teklif
        for sister in sisters:
            sister_telefon = sister.get("telefon", "")
            sister_adi     = sister.get("ad", "")
            price_line     = f"\n💰 Teklif fiyatı: ₺{satis_fiyati}/kg" if satis_fiyati else ""

            offer_msg = (
                f"Merhaba *{sister_adi}*! 🌿\n\n"
                f"{'⚡ KRİTİK: ' if auto_send else ''}"
                f"Depomuzda *{surplus:.0f} kg {urun_adi}* bulunuyor ve "
                f"*{days} gün* içinde tüketilmesi gerekiyor.\n\n"
                f"📦 Miktar: {surplus:.0f} kg"
                f"{price_line}\n\n"
                f"Bu ürünü almak isterseniz *Onaylıyorum* yazmanız yeterli.\n"
                f"Onayınızın ardından depo görevlimiz sizinle iletişime geçecektir.\n\n"
                f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
            )

            twilio_result = {"status": "skipped"}
            if auto_send:
                twilio_result = send_twilio_whatsapp(sister_telefon, offer_msg)
                create_pending_waste_offer(
                    urun_adi         = urun_adi,
                    miktar_kg        = round(surplus, 1),
                    alis_fiyati      = alis_fiyati,
                    days_left        = days,
                    sister_id        = sister.get("id", 0),
                    sister_telefon   = sister_telefon,
                    sister_adi       = sister_adi,
                    whatsapp_message = offer_msg,
                )

            log_agent_decision(
                ajan="waste_prevention",
                karar="whatsapp_teklif_gonderildi" if auto_send else "teklif_hazirlandi",
                aciklama=(
                    f"{surplus:.0f} kg {urun_adi} teklifi {'WhatsApp ile ' if auto_send else ''}"
                    f"{sister_adi}'e {'gönderildi' if auto_send else 'hazırlandı'} ({days} gün raf ömrü)."
                ),
                tetikleyen="cron:waste_prevention",
                meta={
                    "urun":           urun_adi,
                    "surplus_kg":     round(surplus, 1),
                    "days_left":      days,
                    "sister_id":      sister.get("id"),
                    "sister_adi":     sister_adi,
                    "auto_sent":      auto_send,
                    "twilio_status":  twilio_result.get("status"),
                },
            )

            offers_out.append({
                "urun":              urun_adi,
                "surplus_kg":        round(surplus, 1),
                "days_left":         days,
                "sister_ad":         sister_adi,
                "sister_telefon":    sister_telefon,
                "auto_sent":         auto_send,
                "twilio_status":     twilio_result.get("status"),
                "whatsapp_message":  offer_msg,
            })

    result = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "at_risk_count": len(at_risk),
        "at_risk": at_risk,
        "offers_count": len(offers_out),
        "offers": offers_out,
    }
    log_ai("waste_prevention", "cron:waste_prevention", result)
    return result


# ── GET /api/waste-prevention/scan ───────────────────────────────────────────

@router.get("/scan")
async def scan_waste_risk_public():
    """
    Yönetici frontend için — auth gerektirmez.
    Son 7 gün içinde sona erecek ürünleri tarar ve kardeş üretici eşleştirir.
    """
    near_expiry = get_near_expiry_products(days_threshold=7)
    items = []

    for product in near_expiry:
        days = _days_left(product.get("son_kullanim_tarihi"))
        if days is None or days < 0:
            continue

        mevcut      = product.get("mevcut_kg") or 0
        daily_est   = _calculate_daily_consumption(product)
        surplus     = max(0.0, mevcut - daily_est * days)
        urun_adi    = product.get("ad", "bilinmeyen")
        sisters     = get_sister_producers_for_product(urun_adi) or []

        kardesler = []
        for s in sisters:
            words = (s.get("ad") or "").split()
            avatar = "".join(w[0].upper() for w in words[:2]) if words else "??"
            kardesler.append({
                "id":       str(s.get("id", "")),
                "ad":       s.get("ad", ""),
                "lokasyon": s.get("lokasyon", ""),
                "telefon":  s.get("telefon", ""),
                "avatar":   avatar,
            })

        items.append({
            "id":           str(product.get("id", "")),
            "urun":         urun_adi,
            "emoji":        product.get("emoji", "📦"),
            "mevcut_kg":    mevcut,
            "days_left":    days,
            "surplus_kg":   round(surplus, 1),
            "daily_est_kg": round(daily_est, 1),
            "alis_fiyati":  product.get("alis_fiyati"),
            "kategori":     product.get("kategori", ""),
            "kardesler":    kardesler,
        })

    items.sort(key=lambda x: x["days_left"])

    return {
        "scanned_at":    datetime.now(timezone.utc).isoformat(),
        "total_at_risk": len(items),
        "items":         items,
    }


# ── POST /api/waste-prevention/send-offer ────────────────────────────────────

class SendOfferBody(BaseModel):
    urun_adi:   str
    surplus_kg: float
    days_left:  int


@router.post("/send-offer")
async def send_waste_offer(body: SendOfferBody):
    """
    Kardeş üreticilere WhatsApp teklif gönderir.
    - Twilio yapılandırılmışsa gerçek mesaj gider
    - pending_waste_offers tablosuna kaydedilir
    - Üretici 'Onaylıyorum' dediğinde webhook otomatik depo görevi oluşturur
    """
    sisters = get_sister_producers_for_product(body.urun_adi) or []

    if not sisters:
        return {
            "status":     "kardes_yok",
            "sent_count": 0,
            "message":    "Uygun kardeş üretici bulunamadı. Manuel aksiyon gerekli.",
        }

    # Fiyat bilgisi
    from tools.handlers import get_product_price
    price_info  = get_product_price(body.urun_adi)
    alis_fiyati = price_info.get("alis_fiyati") if price_info else None
    price_line  = f"\n💰 Teklif fiyatı: ₺{alis_fiyati}/kg" if alis_fiyati else ""

    offers_sent = []
    for sister in sisters:
        sister_telefon = sister.get("telefon", "")
        sister_adi     = sister.get("ad", "")

        offer_msg = (
            f"Merhaba *{sister_adi}*! 🌿\n\n"
            f"Depomuzda *{body.surplus_kg:.0f} kg {body.urun_adi}* bulunuyor ve "
            f"*{body.days_left} gün* içinde tüketilmesi gerekiyor.\n\n"
            f"📦 Miktar: {body.surplus_kg:.0f} kg"
            f"{price_line}\n\n"
            f"Bu ürünü almak isterseniz *Onaylıyorum* yazmanız yeterli.\n"
            f"Onayınızın ardından depo görevlimiz sizinle iletişime geçecektir.\n\n"
            f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
        )

        # WhatsApp gönder (Twilio varsa gerçek, yoksa simülasyon)
        twilio_result = send_twilio_whatsapp(sister_telefon, offer_msg)

        # Bekleyen teklif olarak kaydet
        pending = create_pending_waste_offer(
            urun_adi         = body.urun_adi,
            miktar_kg        = body.surplus_kg,
            alis_fiyati      = alis_fiyati,
            days_left        = body.days_left,
            sister_id        = sister.get("id", 0),
            sister_telefon   = sister_telefon,
            sister_adi       = sister_adi,
            whatsapp_message = offer_msg,
        )

        log_agent_decision(
            ajan="waste_prevention",
            karar="whatsapp_teklif_gonderildi",
            aciklama=(
                f"{body.surplus_kg:.0f} kg {body.urun_adi} teklifi WhatsApp ile "
                f"{sister_adi}'e iletildi ({body.days_left} gün raf ömrü). "
                f"Durum: {twilio_result.get('status', '?')}."
            ),
            tetikleyen="manager:talepler_page",
            meta={
                "urun":           body.urun_adi,
                "surplus_kg":     body.surplus_kg,
                "days_left":      body.days_left,
                "sister_ad":      sister_adi,
                "sister_telefon": sister_telefon,
                "twilio_status":  twilio_result.get("status"),
                "offer_id":       pending.get("id"),
            },
        )
        offers_sent.append({
            "sister_ad":      sister_adi,
            "sister_telefon": sister_telefon,
            "twilio_status":  twilio_result.get("status"),
            "offer_id":       pending.get("id"),
            "message":        offer_msg,
        })

    send_notification(
        role="manager",
        title="📨 İsraf önleme teklifleri gönderildi",
        message=(
            f"{len(offers_sent)} kardeş üreticiye {body.surplus_kg:.0f} kg "
            f"{body.urun_adi} teklifi WhatsApp ile iletildi. "
            f"Onay geldiğinde sistem otomatik işleyecek."
        ),
        type="info",
    )

    result = {
        "status":     "gonderildi",
        "sent_count": len(offers_sent),
        "offers":     offers_sent,
        "message":    f"{len(offers_sent)} kardeş üreticiye WhatsApp teklifi gönderildi.",
    }
    log_ai(
        "waste_prevention",
        f"WhatsApp teklif: {body.surplus_kg:.0f} kg {body.urun_adi} → {len(offers_sent)} kardeş üretici",
        result,
    )
    return result


# ── POST /api/waste-prevention/create-task ───────────────────────────────────

class CreateTaskBody(BaseModel):
    urun_adi:   str
    surplus_kg: float
    days_left:  int


@router.post("/create-task")
async def create_waste_task(body: CreateTaskBody):
    """Depo görevlisi için israf önleme görevi oluşturur."""
    from tools.handlers import assign_task

    priority = "high" if body.days_left <= 2 else "medium"
    result = assign_task(
        role="warehouse",
        title=f"İsraf önleme: {body.urun_adi} — {body.surplus_kg:.0f} kg",
        description=(
            f"{body.urun_adi} için {body.days_left} gün içinde "
            f"{body.surplus_kg:.0f} kg tüketim/satış/sevkiyat planı oluştur."
        ),
        priority=priority,
        product_name=body.urun_adi,
    )
    task_result_data = {
        "status":  "gorев_olusturuldu",
        "task_id": result.get("task_id"),
        "message": f"{body.urun_adi} için depo görevi oluşturuldu.",
    }
    log_agent_decision(
        ajan="waste_prevention",
        karar="depo_gorevi_olusturuldu",
        aciklama=f"Yönetici: {body.urun_adi} için israf önleme depo görevi oluşturuldu.",
        tetikleyen="manager:talepler_page",
        meta={
            "urun":       body.urun_adi,
            "surplus_kg": body.surplus_kg,
            "days_left":  body.days_left,
            "task_id":    result.get("task_id"),
        },
    )
    log_ai(
        "waste_prevention",
        f"Depo görevi: {body.urun_adi} — {body.surplus_kg:.0f} kg israf önleme",
        task_result_data,
    )
    return task_result_data


# ── POST /api/waste-prevention/confirm ───────────────────────────────────────

@router.post("/confirm")
async def confirm_waste_sale(
    urun_adi: str,
    miktar_kg: float,
    sister_telefon: str,
):
    """
    Kardeş üretici WhatsApp'tan "Onaylıyorum" dediğinde bu endpoint tetiklenir.
    Depo görevi oluşturur, stok düşer.
    """
    from tools.handlers import assign_task, update_stock

    # Depo görevi
    task_result = assign_task(
        role="warehouse",
        title=f"İsraf önleme satışı: {urun_adi} — {miktar_kg} kg",
        description=f"Kardeş üretici ({sister_telefon}) satışı onayladı. {miktar_kg} kg {urun_adi} hazırlanacak.",
        priority="high",
        product_name=urun_adi,
    )

    # Stoktan düş
    update_stock(product_name=urun_adi, delta=-miktar_kg, reason="sale")

    log_agent_decision(
        ajan="waste_prevention",
        karar="satis_onaylandi",
        aciklama=f"Kardeş üretici {sister_telefon} {miktar_kg} kg {urun_adi} satışını onayladı.",
        tetikleyen=f"whatsapp:{sister_telefon}",
        meta={"urun": urun_adi, "miktar_kg": miktar_kg, "sister_telefon": sister_telefon, "task_id": task_result.get("task_id")},
    )

    return {
        "status": "onaylandi",
        "task_id": task_result.get("task_id"),
        "whatsapp_reply": (
            f"✅ Harika! {miktar_kg} kg *{urun_adi}* satışı onaylandı.\n"
            f"Depo görevlimiz sizinle iletişime geçecek.\n\n"
            f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
        ),
    }
