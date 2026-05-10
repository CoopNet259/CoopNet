import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

// GET /api/dashboard/summary
// Dashboard sayfasının tüm bölümlerini tek istekle besler:
//   - kpis        : üst bant (açık talepler, kritik stok, görevler, hasat)
//   - stock        : depo sütunu — kritikten başa göre sıralı stok listesi
//   - orders       : talepler sütunu — bugünkü siparişler
//   - tasks        : bugünün görevleri
//   - trends       : talep trendi (artanlar / azalanlar)

export async function GET() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Paralel sorgular — hepsini aynı anda çek
  const [
    ordersRes,
    productsRes,
    tasksRes,
    harvestsRes,
    prevWeekOrdersRes,
  ] = await Promise.all([
    // Bugünkü siparişler
    supabase
      .from("orders")
      .select("id, customer_name, quantity, unit, status, created_at, product_id, products(name)")
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false }),

    // Tüm ürünler + stok seviyeleri
    supabase
      .from("products")
      .select("id, name, unit, critical_stock_level, inventory(current_quantity)"),

    // Bugünkü görevler
    supabase
      .from("tasks")
      .select("id, title, status, priority, assigned_role")
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false }),

    // Bu haftaki hasat bildirimleri
    supabase
      .from("producer_product_reports")
      .select("quantity, unit, status, products(name), profiles(full_name)")
      .gte("created_at", weekAgo.toISOString()),

    // Geçen hafta sipariş — trend hesabı için
    supabase
      .from("orders")
      .select("quantity, product_id")
      .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 14)).toISOString())
      .lt("created_at", weekAgo.toISOString()),
  ]);

  // ── STOK ────────────────────────────────────────────────────
  const stockItems = (productsRes.data ?? []).map((p) => {
    const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
    const current = (inv as { current_quantity?: number } | null)?.current_quantity ?? 0;
    const capacity = p.critical_stock_level * 4; // kritik eşiğin 4 katını "tam dolu" say
    const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 100;
    const isCritical = current <= p.critical_stock_level;
    const tier = pct < 15 ? "urgent" : pct < 30 ? "warn" : "good";

    return {
      id:        p.id,
      name:      p.name,
      unit:      p.unit,
      current,
      capacity,
      pct,
      tier,
      is_critical: isCritical,
    };
  }).sort((a, b) => a.pct - b.pct); // kritikten başa sırala

  // ── KPI'LAR ─────────────────────────────────────────────────
  const orders      = ordersRes.data ?? [];
  const tasks       = tasksRes.data  ?? [];
  const harvests    = harvestsRes.data ?? [];

  const openOrders    = orders.filter((o) => o.status !== "delivered" && o.status !== "canceled");
  const criticalCount = stockItems.filter((s) => s.is_critical).length;
  const openTasks     = tasks.filter((t) => t.status !== "done");
  const totalHarvestKg = harvests.reduce((s, h) => s + (h.quantity ?? 0), 0);

  // Geçen haftayla karşılaştır — sipariş trend yüzdesi
  const thisWeekTotal = orders.reduce((s, o) => s + (o.quantity ?? 0), 0);
  const prevWeekTotal = (prevWeekOrdersRes.data ?? []).reduce((s, o) => s + (o.quantity ?? 0), 0);
  const orderTrendPct = prevWeekTotal > 0
    ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100)
    : 0;

  // ── TALEPLERİ FORMATLA ───────────────────────────────────────
  const formattedOrders = orders.slice(0, 5).map((o) => ({
    id:       o.id,
    customer: o.customer_name,
    product:  (o.products as unknown as { name: string })?.name ?? "—",
    quantity: o.quantity,
    unit:     o.unit,
    status:   o.status,
    urgency:  o.status === "delayed" ? "urgent" : o.status === "pending" ? "warn" : "good",
  }));

  // ── TREND (artanlar / azalanlar) ────────────────────────────
  // Bu haftaki siparişleri ürün bazında topla
  const thisWeekMap: Record<string, { name: string; total: number }> = {};
  for (const o of orders) {
    const id   = o.product_id as string;
    const name = (o.products as unknown as { name: string })?.name ?? id;
    if (!id) continue;
    if (!thisWeekMap[id]) thisWeekMap[id] = { name, total: 0 };
    thisWeekMap[id].total += o.quantity ?? 0;
  }

  const prevWeekMap: Record<string, number> = {};
  for (const o of prevWeekOrdersRes.data ?? []) {
    const id = o.product_id as string;
    if (!id) continue;
    prevWeekMap[id] = (prevWeekMap[id] ?? 0) + (o.quantity ?? 0);
  }

  const trends: { name: string; delta: string; pct: number; up: boolean }[] = [];
  for (const [id, { name, total }] of Object.entries(thisWeekMap)) {
    const prev = prevWeekMap[id] ?? 0;
    if (prev === 0) continue;
    const pct = Math.round(((total - prev) / prev) * 100);
    if (Math.abs(pct) >= 10) {
      trends.push({ name, delta: `${pct > 0 ? "+" : ""}${pct}%`, pct, up: pct > 0 });
    }
  }
  trends.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  return NextResponse.json({
    date: today,
    kpis: {
      open_orders:     openOrders.length,
      order_trend_pct: orderTrendPct,
      critical_stock:  criticalCount,
      open_tasks:      openTasks.length,
      harvest_kg_week: totalHarvestKg,
    },
    stock:   stockItems.slice(0, 8),
    orders:  formattedOrders,
    tasks:   tasks.slice(0, 5).map((t) => ({
      id:     t.id,
      title:  t.title,
      done:   t.status === "done",
      priority: t.priority,
      role:   t.assigned_role,
    })),
    trends: {
      up:   trends.filter((t) => t.up).slice(0, 3),
      down: trends.filter((t) => !t.up).slice(0, 3),
    },
  });
}
