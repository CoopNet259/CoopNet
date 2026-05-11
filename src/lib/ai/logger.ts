import { createServerClient } from "@/lib/supabase/client";

export interface LogEntry {
  input_text: string;
  output_data: unknown;
  action_type: "harvest_analyze" | "chat" | "daily_summary" | "draft_email" | "draft_notification" | "stock_check" | "anomaly_check" | "weekly_insight";
  created_by?: string;
}

const TIP_MAP: Record<LogEntry["action_type"], string> = {
  harvest_analyze: "Otomasyon",
  chat: "Rapor",
  daily_summary: "Rapor",
  draft_email: "Otomasyon",
  draft_notification: "Otomasyon",
  stock_check: "Anomali",
  anomaly_check: "Anomali",
  weekly_insight: "Rapor",
};

const KATEGORI_MAP: Record<LogEntry["action_type"], string> = {
  harvest_analyze: "Depo",
  chat: "AI Tespiti",
  daily_summary: "Raporlama",
  draft_email: "İletişim",
  draft_notification: "İletişim",
  stock_check: "Depo",
  anomaly_check: "AI Tespiti",
  weekly_insight: "Raporlama",
};

const BASLIK_MAP: Record<LogEntry["action_type"], string> = {
  harvest_analyze: "Hasat analizi yapıldı",
  chat: "Sohbet isteği yanıtlandı",
  daily_summary: "Günlük özet oluşturuldu",
  draft_email: "Tedarikçi mail taslağı hazırlandı",
  draft_notification: "Müşteri bildirimi taslağı hazırlandı",
  stock_check: "Stok kontrolü yapıldı",
  anomaly_check: "Anomali taraması tamamlandı",
  weekly_insight: "Haftalık özet oluşturuldu",
};

function extractImpact(actionType: LogEntry["action_type"], data: unknown): string {
  if (!data || typeof data !== "object") return "iş akışına dahil edildi";
  const d = data as Record<string, unknown>;
  if (actionType === "stock_check") {
    const c = d.critical_count;
    return typeof c === "number" && c > 0 ? `${c} kritik ürün tespit edildi` : "tüm stoklar yeterli";
  }
  if (actionType === "anomaly_check") {
    const c = d.anomaly_count;
    return typeof c === "number" && c > 0 ? `${c} anomali tespit edildi` : "anomali yok";
  }
  if (actionType === "harvest_analyze") {
    const ex = d.executed_actions;
    const n = Array.isArray(ex) ? ex.length : 0;
    return n ? `${n} otomatik aksiyon alındı` : "öneri üretildi";
  }
  return "iş akışına dahil edildi";
}

export async function logAI(entry: LogEntry): Promise<void> {
  const now = new Date();
  const record = {
    zaman: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    tarih: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    tip: TIP_MAP[entry.action_type],
    baslik: BASLIK_MAP[entry.action_type],
    mesaj: (entry.input_text ?? "").slice(0, 300),
    renk: entry.action_type === "anomaly_check" || entry.action_type === "stock_check" ? "red" : "green",
    kategori: KATEGORI_MAP[entry.action_type],
    detay_neden: (entry.input_text ?? "").slice(0, 200) || null,
    detay_etki: extractImpact(entry.action_type, entry.output_data),
  };

  const supabase = createServerClient();
  const { error } = await supabase.from("ai_logs").insert(record);

  if (error) {
    console.error("[AI_LOG_ERROR]", error.message);
    console.log("[AI_LOG_FALLBACK]", JSON.stringify(record, null, 2));
  }
}
