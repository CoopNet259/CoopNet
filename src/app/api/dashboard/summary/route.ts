import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

// GET /api/dashboard/summary
// supabase_schema.sql: products, requests, tasks — orders/inventory/harvest tabloları yok.

const DONE_STATUSES = new Set(["teslim edildi", "iptal", "onaylandi"]);

function urgency(durum: string): "urgent" | "warn" | "good" {
  if (durum === "gecikti" || durum === "gecikmiş") return "urgent";
  if (durum === "bekliyor") return "warn";
  return "good";
}

export async function GET() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  const [requestsRes, productsRes, tasksRes] = await Promise.all([
    supabase.from("requests").select("id, musteri, urun, miktar, saat, durum").order("id", { ascending: false }),
    supabase.from("products").select("id, emoji, ad, mevcut_kg, kapasite_kg").order("id", { ascending: true }),
    supabase.from("tasks").select("id, is_name, durum, oncelik").order("id", { ascending: true }),
  ]);

  const requests = requestsRes.data ?? [];
  const products = productsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const stockItems = products
    .map((p) => {
      const current = p.mevcut_kg ?? 0;
      const capacity = p.kapasite_kg ?? 1;
      const critical_level = capacity * 0.25;
      const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 100;
      const is_critical = current <= critical_level;
      const tier = pct < 15 ? "urgent" : pct < 30 ? "warn" : "good";
      return {
        id: String(p.id),
        name: `${p.emoji ?? ""} ${p.ad ?? ""}`.trim(),
        unit: "kg",
        current,
        capacity,
        pct,
        tier,
        is_critical,
      };
    })
    .sort((a, b) => a.pct - b.pct);

  const openRequests = requests.filter((r) => !DONE_STATUSES.has(r.durum ?? ""));
  const criticalCount = stockItems.filter((s) => s.is_critical).length;
  const openTasks = tasks.filter((t) => !t.durum);

  const priorityMap: Record<string, string> = { yuksek: "high", orta: "medium", dusuk: "low" };

  const formattedOrders = requests.slice(0, 5).map((r) => ({
    id: String(r.id),
    customer: r.musteri ?? "",
    product: r.urun ?? "",
    quantity: r.miktar ?? "",
    unit: "kg",
    status: r.durum ?? "",
    urgency: urgency(r.durum ?? ""),
  }));

  const formattedTasks = tasks.slice(0, 5).map((t) => ({
    id: String(t.id),
    title: t.is_name ?? "",
    done: Boolean(t.durum),
    priority: priorityMap[t.oncelik ?? ""] ?? t.oncelik ?? "medium",
    role: "manager",
  }));

  return NextResponse.json({
    date: today,
    kpis: {
      open_orders: openRequests.length,
      order_trend_pct: 0,
      critical_stock: criticalCount,
      open_tasks: openTasks.length,
      harvest_kg_week: 0,
    },
    stock: stockItems.slice(0, 8),
    orders: formattedOrders,
    tasks: formattedTasks,
    trends: { up: [], down: [] },
  });
}
