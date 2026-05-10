import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

// GET /api/ai/logs
// AI Logs sayfasının iki bölümünü besler:
//   1. alerts  → notifications tablosundan bugünkü anomali + stok uyarıları
//   2. actions → ai_logs tablosundan son AI işlemleri
//
// Query params:
//   ?date=YYYY-MM-DD  (opsiyonel, default: bugün)
//   ?limit=N          (opsiyonel, default: 20)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date  = searchParams.get("date")  ?? new Date().toISOString().split("T")[0];
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const supabase = createServerClient();

  // ── 1. ALERTS — notifications tablosu ───────────────────────
  // Bugün oluşturulan warning/error tipindeki bildirimler
  const { data: notifications, error: notifError } = await supabase
    .from("notifications")
    .select("id, title, message, type, role, is_read, created_at")
    .in("type", ["warning", "error", "info"])
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (notifError) {
    console.error("[AI_LOGS_NOTIF_ERROR]", notifError.message);
  }

  // notifications → alert formatına dönüştür (tasarımdaki alert-card yapısına uygun)
  const alerts = (notifications ?? []).map((n) => ({
    id:     n.id,
    level:  n.type === "error" ? "danger" : n.type === "warning" ? "warn" : "info",
    title:  n.title,
    desc:   n.message,
    source: roleLabel(n.role),
    time:   formatTime(n.created_at),
    is_read: n.is_read,
  }));

  // ── 2. AI ACTIONS — ai_logs tablosu ─────────────────────────
  // Son AI işlemleri — action_type, input, output, zaman
  const { data: aiLogs, error: logsError } = await supabase
    .from("ai_logs")
    .select("id, action_type, input_text, output_data, status, created_at")
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (logsError) {
    console.error("[AI_LOGS_ERROR]", logsError.message);
  }

  // ai_logs → log-row formatına dönüştür (tasarımdaki log-row yapısına uygun)
  const actions = (aiLogs ?? []).map((log) => ({
    id:         log.id,
    time:       formatTime(log.created_at),
    title:      actionTitle(log.action_type),
    why:        log.input_text,
    ctx:        actionCtx(log.action_type),
    status:     log.status ?? "bilgi",
    confidence: extractConfidence(log.output_data),
    impact:     extractImpact(log.action_type, log.output_data),
  }));

  // ── ÖZET SAYAÇLAR ────────────────────────────────────────────
  const summary = {
    total_actions:   actions.length,
    total_alerts:    alerts.length,
    danger_count:    alerts.filter((a) => a.level === "danger").length,
    warn_count:      alerts.filter((a) => a.level === "warn").length,
    info_count:      alerts.filter((a) => a.level === "info").length,
    unread_count:    alerts.filter((a) => !a.is_read).length,
  };

  return NextResponse.json({ date, summary, alerts, actions });
}

// ── YARDIMCI FONKSİYONLAR ────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  });
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    manager:      "Yönetici",
    warehouse:    "Depo · Stok",
    producer:     "Üretici sinyali",
    customer_rep: "Müşteri hizmetleri",
  };
  return map[role] ?? role;
}

function actionTitle(actionType: string): string {
  const map: Record<string, string> = {
    harvest_analyze:   "Hasat analizi yapıldı",
    chat:              "Sohbet isteği yanıtlandı",
    daily_summary:     "Günlük özet oluşturuldu",
    draft_email:       "Tedarikçi mail taslağı hazırlandı",
    draft_notification:"Müşteri bildirimi taslağı hazırlandı",
    stock_check:       "Stok kontrolü yapıldı",
    anomaly_check:     "Anomali taraması tamamlandı",
  };
  return map[actionType] ?? actionType;
}

function actionCtx(actionType: string): string[] {
  const map: Record<string, string[]> = {
    harvest_analyze:    ["Üretici", "Hasat", "Stok"],
    chat:               ["AI", "Sohbet"],
    daily_summary:      ["AI", "Özet", "Günlük"],
    draft_email:        ["Tedarikçi", "Mail"],
    draft_notification: ["Müşteri", "Bildirim"],
    stock_check:        ["Depo", "Stok"],
    anomaly_check:      ["AI", "Anomali"],
  };
  return map[actionType] ?? ["AI"];
}

function extractConfidence(outputData: unknown): number {
  if (!outputData || typeof outputData !== "object") return 92;
  const d = outputData as Record<string, unknown>;
  // harvest_analyze confidence
  if (d.parsed && typeof d.parsed === "object") {
    const p = d.parsed as Record<string, unknown>;
    if (typeof p.confidence === "number") return Math.round(p.confidence * 100);
  }
  return 92;
}

function extractImpact(actionType: string, outputData: unknown): string {
  if (!outputData || typeof outputData !== "object") return "iş akışına dahil edildi";
  const d = outputData as Record<string, unknown>;

  if (actionType === "stock_check") {
    const count = d.critical_count;
    return count ? `${count} kritik ürün tespit edildi` : "tüm stoklar yeterli";
  }
  if (actionType === "anomaly_check") {
    const count = d.anomaly_count;
    return count ? `${count} anomali tespit edildi` : "anomali yok";
  }
  if (actionType === "harvest_analyze") {
    const executed = Array.isArray(d.executed_actions) ? d.executed_actions.length : 0;
    return executed ? `${executed} otomatik aksiyon alındı` : "öneri üretildi";
  }
  return "iş akışına dahil edildi";
}
