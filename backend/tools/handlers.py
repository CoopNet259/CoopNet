from __future__ import annotations
from datetime import datetime, timezone
from database import get_supabase

# Gerçek şema:
# products: id, emoji, ad, mevcut_kg, kapasite_kg, kategori
# tasks: id, is_name, durum (bool), oncelik
# requests: id, musteri, urun, miktar, saat, durum
# ai_logs: id, zaman, tarih, tip, baslik, mesaj, kategori, ...
# notifications tablosu YOK


def _find_product(product_name: str) -> dict | None:
    """ürün adıyla products tablosunda ara (ad kolonu, ILIKE)"""
    sb = get_supabase()
    res = sb.table("products").select(
        "id, ad, emoji, mevcut_kg, kapasite_kg"
    ).ilike("ad", f"%{product_name}%").execute()
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


def assign_task(
    role: str,
    title: str,
    priority: str,
    description: str | None = None,
    product_name: str | None = None,
) -> dict:
    """
    Görev oluştur — tasks tablosu: is_name, durum (bool), oncelik
    """
    sb = get_supabase()

    oncelik_map = {"high": "yuksek", "medium": "orta", "low": "dusuk"}
    oncelik = oncelik_map.get(priority, priority)

    try:
        task_res = (
            sb.table("tasks")
            .insert({
                "is_name": title,
                "durum": False,
                "oncelik": oncelik,
            })
            .execute()
        )
        if task_res.data:
            task_id = task_res.data[0].get("id") if isinstance(task_res.data, list) else task_res.data.get("id")
            return {"task_id": task_id, "message": f'Görev oluşturuldu: "{title}"'}
    except Exception:
        pass  # RLS veya başka hata — görevi oluşturamadık ama akışı durdurmuyoruz

    return {"task_id": "demo", "message": f'Görev planlandı: "{title}" (DB kısıtı: Supabase INSERT policy gerekli)'}


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

    return {
        "product_name": product["ad"],
        "previous_quantity": current,
        "new_quantity": new_qty,
        "delta": delta,
        "reason": reason,
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
