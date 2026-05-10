import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// ─────────────────────────────────────────────────────────────
// GET /api/cron/anomaly-check
// Her sabah 07:30'da Supabase pg_cron tarafından tetiklenir.
// 4 anomali tipi tarar, bulduklarını notifications + ai_logs'a yazar.
// CRON_SECRET header ile korunur.
// ─────────────────────────────────────────────────────────────

export interface Anomaly {
  type: "demand_spike" | "delayed_surge" | "stock_burnrate" | "producer_silence";
  severity: "danger" | "warn" | "info";
  title: string;
  desc: string;
  source: string;
  meta?: Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createServerClient();
  const anomalies: Anomaly[] = [];

  // ── 1. TALEP ANOMALİSİ ──────────────────────────────────────
  // Bu haftaki sipariş adedi geçen haftaya göre ürün bazında %30+ sapıyorsa anomali
  {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);

    const { data: thisWeek } = await supabase
      .from("orders")
      .select("quantity, product_id, products(name)")
      .gte("created_at", thisWeekStart.toISOString());

    const { data: lastWeek } = await supabase
      .from("orders")
      .select("quantity, product_id, products(name)")
      .gte("created_at", lastWeekStart.toISOString())
      .lt("created_at", thisWeekStart.toISOString());

    // Ürün bazında toplam miktar
    const sumByProduct = (rows: typeof thisWeek) => {
      const map: Record<string, { name: string; total: number }> = {};
      for (const r of rows ?? []) {
        const id = r.product_id as string;
        const name = (r.products as unknown as { name: string })?.name ?? id;
        if (!map[id]) map[id] = { name, total: 0 };
        map[id].total += r.quantity ?? 0;
      }
      return map;
    };

    const thisMap = sumByProduct(thisWeek);
    const lastMap = sumByProduct(lastWeek);

    for (const [id, { name, total }] of Object.entries(thisMap)) {
      const prev = lastMap[id]?.total ?? 0;
      if (prev === 0) continue;
      const changePct = Math.round(((total - prev) / prev) * 100);
      if (Math.abs(changePct) >= 30) {
        const up = changePct > 0;
        anomalies.push({
          type: "demand_spike",
          severity: Math.abs(changePct) >= 50 ? "danger" : "warn",
          title: `${name} talebinde ${up ? "+" : ""}${changePct}% sapma`,
          desc: `${name} ürününün bu haftaki talebi geçen haftaya göre ${up ? "ani artış" : "belirgin düşüş"} gösteriyor. Geçen hafta: ${prev} kg — Bu hafta: ${total} kg.`,
          source: "Talep modeli",
          meta: { product_id: id, change_pct: changePct, this_week: total, last_week: prev },
        });
      }
    }
  }

  // ── 2. GECİKMİŞ SİPARİŞ PATLAMASI ──────────────────────────
  // Bugünkü delayed oranı son 7 günlük ortalamanın 2 katına çıktıysa anomali
  {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: todayOrders } = await supabase
      .from("orders")
      .select("status")
      .gte("created_at", `${today}T00:00:00`);

    const { data: weekOrders } = await supabase
      .from("orders")
      .select("status")
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", `${today}T00:00:00`);

    const delayedRate = (orders: typeof todayOrders) => {
      if (!orders || orders.length === 0) return 0;
      return orders.filter((o) => o.status === "delayed").length / orders.length;
    };

    const todayRate = delayedRate(todayOrders);
    const weekRate = delayedRate(weekOrders);

    if (weekRate > 0 && todayRate >= weekRate * 2 && todayRate > 0.1) {
      const todayPct = Math.round(todayRate * 100);
      const weekPct = Math.round(weekRate * 100);
      anomalies.push({
        type: "delayed_surge",
        severity: todayRate >= 0.3 ? "danger" : "warn",
        title: `Gecikmiş sipariş oranı yükseldi: %${todayPct}`,
        desc: `Bugünkü gecikme oranı (%${todayPct}), 7 günlük ortalamanın (%${weekPct}) 2 katına ulaştı. Operasyonel tıkanıklık veya kargo sorunu olabilir.`,
        source: "Operasyon",
        meta: { today_rate: todayRate, week_avg_rate: weekRate },
      });
    }
  }

  // ── 3. STOK ERİME HIZI ──────────────────────────────────────
  // Son 7 günlük tüketim önceki 7 güne göre %50+ artmışsa anomali
  {
    const now = new Date();
    const d7 = new Date(now); d7.setDate(now.getDate() - 7);
    const d14 = new Date(now); d14.setDate(now.getDate() - 14);

    const { data: recentDelivered } = await supabase
      .from("orders")
      .select("quantity, product_id, products(name)")
      .eq("status", "delivered")
      .gte("created_at", d7.toISOString());

    const { data: prevDelivered } = await supabase
      .from("orders")
      .select("quantity, product_id, products(name)")
      .eq("status", "delivered")
      .gte("created_at", d14.toISOString())
      .lt("created_at", d7.toISOString());

    const sumMap = (rows: typeof recentDelivered) => {
      const map: Record<string, { name: string; total: number }> = {};
      for (const r of rows ?? []) {
        const id = r.product_id as string;
        const name = (r.products as unknown as { name: string })?.name ?? id;
        if (!map[id]) map[id] = { name, total: 0 };
        map[id].total += r.quantity ?? 0;
      }
      return map;
    };

    const recentMap = sumMap(recentDelivered);
    const prevMap = sumMap(prevDelivered);

    for (const [id, { name, total }] of Object.entries(recentMap)) {
      const prev = prevMap[id]?.total ?? 0;
      if (prev === 0) continue;
      const burnIncrease = Math.round(((total - prev) / prev) * 100);
      if (burnIncrease >= 50) {
        anomalies.push({
          type: "stock_burnrate",
          severity: burnIncrease >= 100 ? "danger" : "warn",
          title: `${name} tüketim hızı +%${burnIncrease} arttı`,
          desc: `${name} son 7 günde ${total} kg teslim edildi, önceki 7 güne (${prev} kg) kıyasla tüketim hızı belirgin biçimde yükseldi.`,
          source: "Depo · Stok",
          meta: { product_id: id, recent_7d: total, prev_7d: prev, increase_pct: burnIncrease },
        });
      }
    }
  }

  // ── 4. ÜRETİCİ SESSİZLİĞİ ───────────────────────────────────
  // 5+ gündür producer_product_reports tablosuna kayıt yapmamış üretici
  {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { data: activeProducers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "producer");

    for (const producer of activeProducers ?? []) {
      const { data: recentReport } = await supabase
        .from("producer_product_reports")
        .select("id, created_at")
        .eq("producer_id", producer.id)
        .gte("created_at", fiveDaysAgo.toISOString())
        .limit(1)
        .single();

      if (!recentReport) {
        anomalies.push({
          type: "producer_silence",
          severity: "warn",
          title: `Üretici sessizliği: ${producer.full_name}`,
          desc: `${producer.full_name} 5 gündür hasat bildirimi yapmadı. İletişime geçilmesi önerilir.`,
          source: "Üretici sinyali",
          meta: { producer_id: producer.id },
        });
      }
    }
  }

  // ── BİLDİRİM + LOG ──────────────────────────────────────────
  if (anomalies.length > 0) {
    const notifRows = anomalies.map((a) => ({
      role: "manager",
      title: a.title,
      message: a.desc,
      type: a.severity === "danger" ? "error" : a.severity === "warn" ? "warning" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("notifications").insert(notifRows);
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
