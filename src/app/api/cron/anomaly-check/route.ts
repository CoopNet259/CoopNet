import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// GET /api/cron/anomaly-check — stk_alerts, products, requests; ai_logs'a yazar

export interface Anomaly {
  type: "stk_risk" | "low_stock" | "delayed_snapshot";
  severity: "danger" | "warn" | "info";
  title: string;
  desc: string;
  source: string;
  meta?: Record<string, unknown>;
}

function nowLogFields() {
  const now = new Date();
  return {
    zaman: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    tarih: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
  };
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createServerClient();
  const anomalies: Anomaly[] = [];

  const { data: stkRows } = await supabase
    .from("stk_alerts")
    .select("id, urun, emoji, kalan_gun_mesaj, miktar, islem, kardesler");

  for (const row of stkRows ?? []) {
    anomalies.push({
      type: "stk_risk",
      severity: "warn",
      title: `STK riski: ${row.urun ?? "?"}`,
      desc: `${row.emoji ?? ""} ${row.urun ?? ""} — ${row.kalan_gun_mesaj ?? ""}. Önerilen işlem: ${row.islem ?? ""}.`,
      source: "STK İzleme",
      meta: { stk_alert_id: row.id },
    });
  }

  const { data: products } = await supabase.from("products").select("id, ad, emoji, mevcut_kg, kapasite_kg");
  for (const p of products ?? []) {
    const current = p.mevcut_kg ?? 0;
    const capacity = p.kapasite_kg ?? 1;
    const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 100;
    if (pct <= 20) {
      const name = `${p.emoji ?? ""} ${p.ad ?? ""}`.trim();
      anomalies.push({
        type: "low_stock",
        severity: pct <= 10 ? "danger" : "warn",
        title: `${name} stok seviyesi kritik`,
        desc: `${name} depoda %${pct} dolulukta. Acil tedarik veya satış planı gerekebilir.`,
        source: "Stok Analizi",
        meta: { product_id: p.id, fill_pct: pct },
      });
    }
  }

  const { data: reqs } = await supabase.from("requests").select("durum");
  const rows = reqs ?? [];
  if (rows.length > 0) {
    const delayed = rows.filter((r) => r.durum === "gecikti" || r.durum === "gecikmiş").length;
    const ratio = delayed / rows.length;
    if (rows.length >= 2 && ratio >= 0.2) {
      anomalies.push({
        type: "delayed_snapshot",
        severity: ratio >= 0.5 ? "danger" : "warn",
        title: `Gecikmiş talep oranı yüksek: %${Math.round(ratio * 100)}`,
        desc: `Aktif ${rows.length} talepten ${delayed} tanesi gecikmiş durumda. Operasyon ve kargo kontrol edilmeli.`,
        source: "Operasyon",
        meta: { total: rows.length, delayed },
      });
    }
  }

  if (anomalies.length > 0) {
    const t = nowLogFields();
    const logRows = anomalies.map((a) => ({
      ...t,
      tip: a.severity === "danger" ? "Anomali" : "Uyarı",
      baslik: a.title,
      mesaj: a.desc.slice(0, 500),
      kategori: "AI Tespiti",
      renk: a.severity === "danger" ? "red" : "gold",
    }));
    const { error: insErr } = await supabase.from("ai_logs").insert(logRows);
    if (insErr) console.error("[ANOMALY_AI_LOG_ERROR]", insErr.message);
  }

  const result = {
    checked_at: new Date().toISOString(),
    anomaly_count: anomalies.length,
    anomalies,
  };

  await logAI({
    input_text: "cron:anomaly_check",
    output_data: result,
    action_type: "anomaly_check",
  });

  return NextResponse.json(result);
}
