from __future__ import annotations
from datetime import datetime
from typing import Any, Literal
from database import get_supabase

_TR_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

def _tr_date(dt: datetime) -> str:
    return f"{dt.day:02d} {_TR_MONTHS[dt.month - 1]} {dt.year}"

ActionType = Literal[
    "harvest_analyze", "whatsapp_harvest", "whatsapp_harvest_demo",
    "chat", "daily_summary", "draft_email",
    "draft_notification", "stock_check", "anomaly_check", "weekly_insight",
    "morning_briefing", "evening_summary", "weekly_briefing",
    "timeout_check", "waste_prevention",
]

_TIP_MAP: dict[str, str] = {
    "harvest_analyze":       "Otomasyon",
    "whatsapp_harvest":      "Otomasyon",
    "whatsapp_harvest_demo": "Otomasyon",
    "chat":                  "Rapor",
    "daily_summary":         "Rapor",
    "draft_email":           "Otomasyon",
    "draft_notification":    "Otomasyon",
    "stock_check":           "Anomali",
    "anomaly_check":         "Anomali",
    "weekly_insight":        "Rapor",
    "morning_briefing":      "Rapor",
    "evening_summary":       "Rapor",
    "weekly_briefing":       "Rapor",
    "timeout_check":         "Otomasyon",
    "waste_prevention":      "Otomasyon",
}

_KATEGORI_MAP: dict[str, str] = {
    "harvest_analyze":       "Depo",
    "whatsapp_harvest":      "Depo",
    "whatsapp_harvest_demo": "Depo",
    "chat":                  "AI Tespiti",
    "daily_summary":         "Raporlama",
    "draft_email":           "İletişim",
    "draft_notification":    "İletişim",
    "stock_check":           "Depo",
    "anomaly_check":         "AI Tespiti",
    "weekly_insight":        "Raporlama",
    "morning_briefing":      "Raporlama",
    "evening_summary":       "Raporlama",
    "weekly_briefing":       "Raporlama",
    "timeout_check":         "İletişim",
    "waste_prevention":      "Depo",
}

_BASLIK_MAP: dict[str, str] = {
    "harvest_analyze":       "Hasat analizi yapıldı",
    "whatsapp_harvest":      "Hasat analizi yapıldı",
    "whatsapp_harvest_demo": "Hasat analizi yapıldı",
    "chat":                  "Sohbet isteği yanıtlandı",
    "daily_summary":         "Günlük özet oluşturuldu",
    "draft_email":           "Tedarikçi mail taslağı hazırlandı",
    "draft_notification":    "Müşteri bildirimi taslağı hazırlandı",
    "stock_check":           "Stok kontrolü yapıldı",
    "anomaly_check":         "Anomali taraması tamamlandı",
    "weekly_insight":        "Haftalık özet oluşturuldu",
    "morning_briefing":      "Sabah aksiyon planı hazırlandı",
    "evening_summary":       "Gün sonu özeti oluşturuldu",
    "weekly_briefing":       "Haftalık özet oluşturuldu",
    "timeout_check":         "Onay zaman aşımı kontrolü yapıldı",
    "waste_prevention":      "İsraf önleme taraması yapıldı",
}


def log_ai(action_type: ActionType, input_text: str, output_data: Any) -> None:
    now = datetime.now()
    record = {
        "zaman": now.strftime("%H:%M"),
        "tarih": _tr_date(now),
        "tip": _TIP_MAP.get(action_type, "Rapor"),
        "baslik": _BASLIK_MAP.get(action_type, action_type),
        "mesaj": input_text[:300] if input_text else "",
        "kategori": _KATEGORI_MAP.get(action_type, "AI Tespiti"),
        "detay_neden": input_text[:200] if input_text else None,
        "detay_etki": _extract_impact(action_type, output_data),
    }
    try:
        get_supabase().table("ai_logs").insert(record).execute()
    except Exception as exc:
        print(f"[AI_LOG_ERROR] {exc}")
        print(f"[AI_LOG_FALLBACK] {record}")


def _extract_impact(action_type: str, data: Any) -> str:
    if not isinstance(data, dict):
        return "iş akışına dahil edildi"
    if action_type == "stock_check":
        return f"{data['critical_count']} kritik ürün tespit edildi" if data.get("critical_count") else "tüm stoklar yeterli"
    if action_type == "anomaly_check":
        return f"{data['anomaly_count']} anomali tespit edildi" if data.get("anomaly_count") else "anomali yok"
    if action_type == "harvest_analyze":
        executed = len(data.get("executed_actions", []))
        return f"{executed} otomatik aksiyon alındı" if executed else "öneri üretildi"
    if action_type in ("whatsapp_harvest", "whatsapp_harvest_demo"):
        results = data.get("results", [])
        labels = []
        for r in results:
            d = r.get("decision", "")
            urun = r.get("product", "ürün")
            if d == "otomatik_kabul":    labels.append(f"{urun}: kabul ({r.get('needed',0)} kg)")
            elif d == "ihtiyac_yok":     labels.append(f"{urun}: ihtiyaç yok")
            elif d == "onay_bekleniyor": labels.append(f"{urun}: onay bekleniyor")
        return " · ".join(labels) if labels else "işlendi"
    return "iş akışına dahil edildi"
