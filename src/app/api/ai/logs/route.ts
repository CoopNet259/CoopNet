import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

// GET /api/ai/logs
// supabase_schema.sql: ai_logs (notifications yok). FastAPI /api/ai/logs ile aynı mantığa yakın.

function tipToLevel(tip: string): "danger" | "warn" | "info" {
  if (tip === "Anomali" || tip === "Hata") return "danger";
  if (tip === "Tahmin" || tip === "Uyarı") return "warn";
  return "info";
}

function kategoriCtx(kat: string): string[] {
  const m: Record<string, string[]> = {
    Depo: ["Depo", "Stok"],
    Trend: ["AI", "Trend"],
    Raporlama: ["AI", "Rapor"],
    İletişim: ["AI", "Bildirim"],
    "AI Tespiti": ["AI", "Anomali"],
  };
  return m[kat] ?? ["AI"];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const supabase = createServerClient();

  const { data: allLogs, error } = await supabase
    .from("ai_logs")
    .select("id, zaman, tarih, tip, baslik, mesaj, renk, kategori, detay_ne, detay_neden, detay_etki")
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[AI_LOGS_ERROR]", error.message);
    return NextResponse.json({ date, summary: {}, alerts: [], actions: [], error: error.message }, { status: 500 });
  }

  const logs = allLogs ?? [];

  const alerts = logs
    .filter((log) => ["Anomali", "Hata", "Uyarı", "Tahmin"].includes(log.tip ?? ""))
    .map((log) => ({
      id: String(log.id),
      level: tipToLevel(log.tip ?? ""),
      title: log.baslik ?? "",
      desc: log.mesaj ?? "",
      source: log.kategori ?? "AI",
      time: log.zaman ?? "",
      is_read: false,
    }));

  const actions = logs
    .filter((log) => ["Rapor", "Otomasyon", "Aksiyon"].includes(log.tip ?? ""))
    .map((log) => ({
      id: String(log.id),
      time: log.zaman ?? "",
      title: log.baslik ?? "",
      why: log.detay_neden || log.mesaj || "",
      ctx: kategoriCtx(log.kategori ?? ""),
      status: "success",
      confidence: 92,
      impact: log.detay_etki || "iş akışına dahil edildi",
    }));

  const summary = {
    total_actions: actions.length,
    total_alerts: alerts.length,
    danger_count: alerts.filter((a) => a.level === "danger").length,
    warn_count: alerts.filter((a) => a.level === "warn").length,
    info_count: alerts.filter((a) => a.level === "info").length,
    unread_count: alerts.length,
  };

  return NextResponse.json({ date, summary, alerts, actions });
}
