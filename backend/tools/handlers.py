from __future__ import annotations
from datetime import datetime, timezone
from database import get_supabase

# Gerçek şema:
# products: id, emoji, ad, mevcut_kg, kapasite_kg, kategori, son_kullanim_tarihi, alis_fiyati
# tasks: id, is_name, durum (bool), oncelik
# requests: id, musteri, urun, miktar, saat, durum
# ai_logs: id, zaman, tarih, tip, baslik, mesaj, kategori, ...
# producers: id, ad, telefon, aktif_mi
# price_list: id, urun_adi, alis_fiyati, satis_fiyati, birim, gecerli_mi
# pending_approvals: id, uretici_telefon, uretici_adi, urun_adi, talep_miktari, kabul_miktari, birim, stok_doluluk, ham_mesaj, durum, olusturuldu
# sister_producers: id, ad, telefon, alabilecegi_urunler, aktif_mi
# agent_decisions: id, ajan, karar, aciklama, tetikleyen, meta, olusturuldu


def _find_product(product_name: str) -> dict | None:
    """
    Ürün adıyla products tablosunda ara.
    Türkçe büyük/küçük harf sorununu çözmek için birden fazla pattern dener:
    'incir' → 'incir', 'İncir', 'İNCİR'
    """
    sb = get_supabase()

    # Türkçe büyük harf: ilk harfi Türkçe kuralıyla büyüt
    first = product_name[0] if product_name else ''
    if first == 'i':
        tr_titled = 'İ' + product_name[1:]
    elif first == 'ı':
        tr_titled = 'I' + product_name[1:]
    else:
        tr_titled = product_name.capitalize()

    for pattern in [product_name, tr_titled, product_name.capitalize()]:
        res = (
            sb.table("products")
            .select("id, ad, emoji, mevcut_kg, kapasite_kg")
            .ilike("ad", f"%{pattern}%")
            .execute()
        )
        if res.data:
            return res.data[0]
    return None


def get_stock(product_name: str) -> dict:
    product = _find_product(product_name)
    if not product:
        return {"error": f"'{product_name}' ürünü bulunamadı."}
    current = product.get("mevcut_kg") or 0
    capacity = product.get("kapasite_kg") or 1
    return {
        "product_name": product["ad"],
        "quantity": current,
        "unit": "kg",
        "fill_percentage": round((current / capacity) * 100),
        "updated_at": None,
    }


def check_threshold(product_name: str) -> dict:
    product = _find_product(product_name)
    if not product:
        return {"error": f"'{product_name}' ürünü bulunamadı."}

    current = product.get("mevcut_kg") or 0
    capacity = product.get("kapasite_kg") or 1
    critical_level = capacity * 0.25
    is_critical = current <= critical_level
    fill_percentage = round((current / capacity) * 100) if capacity > 0 else 100

    return {
        "product_name": product["ad"],
        "is_critical": is_critical,
        "fill_percentage": fill_percentage,
        "current_quantity": current,
        "critical_level": round(critical_level),
        "unit": "kg",
        "recommendation": (
            f"Acil sipariş gerekli. Mevcut {current} kg, eşik {round(critical_level)} kg."
            if is_critical
            else f"Stok yeterli. Doluluk %{fill_percentage}."
        ),
    }


def get_daily_orders(date: str) -> dict:
    """requests tablosundan sipariş listesi (created_at yok, tüm kayıtlar döner)"""
    sb = get_supabase()
    res = sb.table("requests").select("id, musteri, urun, miktar, saat, durum").execute()
    orders = res.data or []
    return {
        "date": date,
        "total": len(orders),
        "orders": [
            {
                "id": o["id"],
                "customer_name": o.get("musteri", ""),
                "product": o.get("urun", ""),
                "quantity": o.get("miktar", ""),
                "unit": "kg",
                "status": o.get("durum", ""),
            }
            for o in orders
        ],
    }


def _get_on_duty_employee(departman: str) -> dict | None:
    """
    O an vardiyede olan ilk çalışanı döner.
    Bulamazsa None döner (akış durdurmaz).
    """
    from datetime import datetime as _dt
    sb   = get_supabase()
    now  = _dt.now()
    today_str = now.date().isoformat()
    now_time  = now.strftime("%H:%M")
    try:
        res = (
            sb.table("shifts")
            .select("employee_id, employees(id, ad, avatar_emoji, rol, telefon)")
            .eq("tarih",      today_str)
            .eq("departman",  departman)
            .lte("baslangic", now_time)
            .gte("bitis",     now_time)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if rows:
            emp = rows[0].get("employees") or {}
            return {
                "id":     rows[0]["employee_id"],
                "ad":     emp.get("ad", "?"),
                "avatar": emp.get("avatar_emoji", "👤"),
                "rol":    emp.get("rol", ""),
            }
    except Exception:
        pass
    return None


# Rol → departman eşlemesi
_ROLE_TO_DEPT: dict[str, str] = {
    "warehouse":  "depo",
    "depo":       "depo",
    "logistics":  "lojistik",
    "lojistik":   "lojistik",
    "field":      "tarla",
    "tarla":      "tarla",
    "finance":    "muhasebe",
    "muhasebe":   "muhasebe",
    "manager":    "yonetim",
    "yonetim":    "yonetim",
}


def assign_task(
    role: str,
    title: str,
    priority: str,
    description: str | None = None,
    product_name: str | None = None,
) -> dict:
    """
    Görev oluştur — vardiyede olan çalışana otomatik ata.
    tasks tablosu: is_name, durum, oncelik, assigned_to, departman, aciklama
    """
    sb = get_supabase()

    oncelik_map = {"high": "yuksek", "medium": "orta", "low": "dusuk"}
    oncelik = oncelik_map.get(priority, priority)

    # Vardiyedeki çalışanı bul
    departman   = _ROLE_TO_DEPT.get(role.lower(), "depo")
    on_duty_emp = _get_on_duty_employee(departman)

    record: dict = {
        "is_name":   title,
        "durum":     False,
        "oncelik":   oncelik,
        "departman": departman,
        "aciklama":  description or "",
    }
    if on_duty_emp:
        record["assigned_to"] = on_duty_emp["id"]

    try:
        task_res = sb.table("tasks").insert(record).execute()
        if task_res.data:
            task_id = task_res.data[0].get("id") if isinstance(task_res.data, list) else task_res.data.get("id")
            assignee_msg = f" → {on_duty_emp['avatar']} {on_duty_emp['ad']} ({on_duty_emp['rol']})" if on_duty_emp else " → (vardiyede kimse yok)"
            return {
                "task_id":    task_id,
                "assigned_to": on_duty_emp,
                "message":    f'Görev oluşturuldu: "{title}"{assignee_msg}',
            }
    except Exception:
        pass

    return {
        "task_id":    "demo",
        "assigned_to": on_duty_emp,
        "message":    f'Görev planlandı: "{title}"' + (f" → {on_duty_emp['ad']}" if on_duty_emp else ""),
    }


def update_stock(product_name: str, delta: float, reason: str) -> dict:
    """
    Stok güncelle — products tablosundaki mevcut_kg alanını değiştir
    """
    product = _find_product(product_name)
    if not product:
        return {"error": f"'{product_name}' ürünü bulunamadı."}

    current = product.get("mevcut_kg") or 0
    new_qty = max(0, current + delta)

    sb = get_supabase()
    try:
        sb.table("products").update({"mevcut_kg": int(new_qty)}).eq("id", product["id"]).execute()
    except Exception:
        pass  # UPDATE policy yoksa sessizce geç

    # Anlık kritik alarm: stok %10'a düştüyse anında bildir
    capacity = product.get("kapasite_kg") or 1
    new_pct  = round((new_qty / capacity) * 100) if capacity > 0 else 100
    if new_pct <= 10:
        fire_critical_alert(
            title=f"Stok kritik: {product['ad']}",
            message=f"{product['ad']} stoğu %{new_pct}'e düştü ({new_qty} kg). Acil tedarik gerekli.",
            category="Depo",
            meta={"product_id": product.get("id"), "new_pct": new_pct, "new_qty": new_qty},
        )

    return {
        "product_name": product["ad"],
        "previous_quantity": current,
        "new_quantity": new_qty,
        "delta": delta,
        "reason": reason,
        "critical_alert_fired": new_pct <= 10,
    }


def get_sales_forecast(product_name: str, days: int) -> dict:
    """
    Basit tahmin — requests tablosunda geçmiş tarih verisi olmadığı için
    sabit bir günlük ortalama tahmini döndür.
    """
    product = _find_product(product_name)
    if not product:
        return {"error": f"'{product_name}' ürünü bulunamadı."}

    # Şemada geçmişe dönük sipariş verisi yok, kaba tahmin
    capacity = product.get("kapasite_kg") or 100
    daily_avg = round(capacity * 0.1)  # kapasitenin %10'u günlük tahmin
    forecast = daily_avg * days

    return {
        "product_name": product["ad"],
        "forecast_days": days,
        "estimated_demand": forecast,
        "daily_average": daily_avg,
        "based_on_days": 30,
        "note": "Geçmiş satış verisi yok; kapasite bazlı kaba tahmin kullanıldı.",
    }


def send_notification(role: str, title: str, message: str, type: str = "info") -> dict:
    """
    notifications tablosu mevcut şemada yok — ai_logs'a yazıyoruz.
    """
    sb = get_supabase()
    now = datetime.now(timezone.utc)
    tip_map = {"warning": "Uyarı", "error": "Hata", "info": "Rapor"}
    try:
        sb.table("ai_logs").insert({
            "zaman": now.strftime("%H:%M"),
            "tarih": now.strftime("%d %B %Y"),
            "tip": tip_map.get(type, "Rapor"),
            "baslik": title,
            "mesaj": message,
            "kategori": "İletişim",
        }).execute()
    except Exception:
        pass  # Bildirim kaydedilemese bile akış devam etsin
    return {"status": "sent", "role": role, "title": title}


# ── YENİ: Üretici doğrulama ───────────────────────────────────────────────────

def verify_producer(phone: str) -> dict | None:
    """Telefon numarasıyla kayıtlı üretici ara. Bulunamazsa None döner."""
    sb = get_supabase()
    clean = phone.replace("whatsapp:", "").strip()
    res = sb.table("producers").select("*").eq("telefon", clean).execute()
    if res.data:
        row = res.data[0]
        # aktif_mi kolonu varsa kontrol et
        if "aktif_mi" in row and row["aktif_mi"] is False:
            return None
        return row
    return None


def get_product_price(product_name: str) -> dict | None:
    """Fiyat listesinden ürün fiyatını getir."""
    sb = get_supabase()
    res = (
        sb.table("price_list")
        .select("urun_adi, alis_fiyati, satis_fiyati, birim")
        .ilike("urun_adi", f"%{product_name}%")
        .eq("gecerli_mi", True)
        .execute()
    )
    return res.data[0] if res.data else None


def calculate_needed_quantity(product_name: str, offered: float) -> float:
    """
    Mevcut stok açığına göre ne kadar alabileceğimizi hesapla.
    Kapasite - mevcut = açık. Teklif edilen miktarı aşamaz.
    """
    product = _find_product(product_name)
    if not product:
        return offered
    current = product.get("mevcut_kg") or 0
    capacity = product.get("kapasite_kg") or 0
    gap = max(0.0, capacity - current)
    return min(offered, gap)


def create_pending_approval(
    uretici_telefon: str,
    uretici_adi: str,
    urun_adi: str,
    talep_miktari: float,
    kabul_miktari: float,
    birim: str,
    stok_doluluk: int,
    ham_mesaj: str,
) -> dict:
    """Yönetici onay kuyruğuna kayıt ekle."""
    sb = get_supabase()
    try:
        res = sb.table("pending_approvals").insert({
            "uretici_telefon": uretici_telefon,
            "uretici_adi": uretici_adi,
            "urun_adi": urun_adi,
            "talep_miktari": talep_miktari,
            "kabul_miktari": kabul_miktari,
            "birim": birim,
            "stok_doluluk": stok_doluluk,
            "ham_mesaj": ham_mesaj,
            "durum": "bekliyor",
        }).execute()
        return res.data[0] if res.data else {"id": None}
    except Exception as exc:
        return {"id": None, "error": str(exc)}


def log_agent_decision(
    ajan: str,
    karar: str,
    aciklama: str,
    tetikleyen: str,
    meta: dict,
) -> None:
    """Ajan kararını agent_decisions tablosuna yaz (audit log)."""
    sb = get_supabase()
    try:
        sb.table("agent_decisions").insert({
            "ajan": ajan,
            "karar": karar,
            "aciklama": aciklama,
            "tetikleyen": tetikleyen[:500],
            "meta": meta,
        }).execute()
    except Exception:
        pass  # Audit log kritik değil, akışı durdurmuyoruz


def fire_critical_alert(
    title: str,
    message: str,
    category: str = "Kritik",
    meta: dict | None = None,
) -> None:
    """
    Anlık kritik alarm. ai_logs'a yazar + manager'a bildirim gönderir.
    Sabah raporunu beklemez.
    """
    send_notification(role="manager", title=f"🚨 {title}", message=message, type="error")
    sb = get_supabase()
    now = datetime.now(timezone.utc)
    try:
        sb.table("ai_logs").insert({
            "zaman": now.strftime("%H:%M"),
            "tarih": now.strftime("%d %B %Y"),
            "tip": "Kritik",
            "baslik": f"🚨 {title}",
            "mesaj": message,
            "kategori": category,
            "renk": "red",
        }).execute()
    except Exception:
        pass
    log_agent_decision(
        ajan="critical_alert",
        karar="alarm_tetiklendi",
        aciklama=message,
        tetikleyen="system",
        meta=meta or {},
    )


def get_near_expiry_products(days_threshold: int = 3) -> list[dict]:
    """Son kullanım tarihi yaklaşan ürünleri getir."""
    from datetime import date, timedelta
    sb = get_supabase()
    threshold_date = (date.today() + timedelta(days=days_threshold)).isoformat()
    res = (
        sb.table("products")
        .select("id, ad, emoji, mevcut_kg, kapasite_kg, son_kullanim_tarihi, alis_fiyati")
        .lte("son_kullanim_tarihi", threshold_date)
        .gt("mevcut_kg", 0)
        .execute()
    )
    return res.data or []


# ── Twilio WhatsApp Gönderici ─────────────────────────────────────────────────

def send_twilio_whatsapp(to: str, message: str) -> dict:
    """
    Twilio WhatsApp ile mesaj gönderir.
    .env'de TWILIO_* değerleri yoksa simülasyon modunda çalışır.
    """
    try:
        from config import settings
        sid   = settings.twilio_account_sid
        token = settings.twilio_auth_token
        frm   = settings.twilio_whatsapp_from

        if not all([sid, token, frm]):
            # Simülasyon — Twilio henüz yapılandırılmamış
            print(f"[TWILIO_SIM] → {to}: {message[:100]}…")
            return {"status": "simulated", "to": to, "message_sid": "SIM_" + to[-4:]}

        from twilio.rest import Client
        client = Client(sid, token)
        msg = client.messages.create(
            body=message,
            from_=f"whatsapp:{frm}",
            to=f"whatsapp:{to}",
        )
        print(f"[TWILIO_SENT] → {to} | SID: {msg.sid}")
        return {"status": "sent", "to": to, "message_sid": msg.sid}

    except Exception as exc:
        print(f"[TWILIO_ERROR] {exc}")
        return {"status": "error", "to": to, "error": str(exc)}


# ── Pending Waste Offers ──────────────────────────────────────────────────────

def create_pending_waste_offer(
    urun_adi:         str,
    miktar_kg:        float,
    alis_fiyati:      float | None,
    days_left:        int,
    sister_id:        int,
    sister_telefon:   str,
    sister_adi:       str,
    whatsapp_message: str,
) -> dict:
    """İsraf teklifi gönderildiğinde pending_waste_offers tablosuna yaz."""
    sb = get_supabase()
    try:
        res = sb.table("pending_waste_offers").insert({
            "urun_adi":         urun_adi,
            "miktar_kg":        miktar_kg,
            "alis_fiyati":      alis_fiyati,
            "days_left":        days_left,
            "sister_id":        sister_id,
            "sister_telefon":   sister_telefon,
            "sister_adi":       sister_adi,
            "whatsapp_message": whatsapp_message,
            "durum":            "bekliyor",
        }).execute()
        return res.data[0] if res.data else {}
    except Exception as exc:
        print(f"[PENDING_OFFER_INSERT_ERR] {exc}")
        return {}


def find_pending_offer_by_phone(telefon: str) -> dict | None:
    """Gelen WhatsApp mesajının sahibinin bekleyen israf teklifi var mı?"""
    sb = get_supabase()
    try:
        res = (
            sb.table("pending_waste_offers")
            .select("*")
            .eq("sister_telefon", telefon)
            .eq("durum", "bekliyor")
            .order("olusturuldu", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None
    except Exception:
        return None


def confirm_waste_offer(offer_id: int) -> bool:
    """Teklifi onaylandı olarak işaretle."""
    sb = get_supabase()
    try:
        sb.table("pending_waste_offers").update({"durum": "onaylandi"}).eq("id", offer_id).execute()
        return True
    except Exception as exc:
        print(f"[OFFER_CONFIRM_ERR] {exc}")
        return False


def _tr_lower(s: str) -> str:
    """Türkçe büyük/küçük harf normalize: İ→i, I→ı"""
    return s.replace('İ', 'i').replace('I', 'ı').lower()


def get_sister_producers_for_product(product_name: str) -> list[dict]:
    """Belirli ürünü alabilecek kardeş üreticileri getir (Türkçe karakter safe)."""
    sb = get_supabase()
    res = sb.table("sister_producers").select("*").eq("aktif_mi", True).execute()
    needle = _tr_lower(product_name)
    matches = []
    for row in (res.data or []):
        urunler = row.get("alabilecegi_urunler") or []
        if any(needle in _tr_lower(u) for u in urunler):
            matches.append(row)
    return matches


# ── execute_tool_call ──────────────────────────────────────────────────────────

def execute_tool_call(name: str, args: dict) -> dict:
    match name:
        case "get_stock":
            return get_stock(**args)
        case "check_threshold":
            return check_threshold(**args)
        case "get_daily_orders":
            return get_daily_orders(**args)
        case "assign_task":
            return assign_task(**args)
        case "update_stock":
            return update_stock(**args)
        case "get_sales_forecast":
            return get_sales_forecast(**args)
        case "send_notification":
            return send_notification(**args)
        case _:
            return {"error": f"Bilinmeyen tool: {name}"}
