import { createServerClient } from "@/lib/supabase/client";
import { computeDailyAnomalyInsights } from "@/lib/ai/anomaly";
import type { DailyAnomalyInsights } from "@/lib/ai/types";

export interface DailyContext {
  date: string;
  orders: { total: number; pending: number; delivered: number; delayed: number };
  inventory: Array<{ name: string; quantity: number; unit: string; is_critical: boolean }>;
  tasks: { total: number; done: number; todo: number };
  harvests: Array<{ producer: string; product: string; quantity: number; unit: string; status: string }>;
  anomalies: DailyAnomalyInsights;
}

export async function buildDailyContext(date: string): Promise<DailyContext> {
  const supabase = createServerClient();

  const [requestsRes, productsRes, tasksRes, anomalies] = await Promise.all([
    supabase.from("requests").select("durum, miktar, urun"),
    supabase.from("products").select("ad, mevcut_kg, kapasite_kg"),
    supabase.from("tasks").select("is_name, durum"),
    computeDailyAnomalyInsights(date),
  ]);

  const requests = requestsRes.data ?? [];
  const products = productsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const pending = requests.filter((o) => o.durum === "bekliyor").length;
  const delivered = requests.filter((o) => o.durum === "teslim edildi").length;
  const delayed = requests.filter((o) => o.durum === "gecikti" || o.durum === "gecikmiş").length;

  const inventory = products.map((p) => {
    const current = p.mevcut_kg ?? 0;
    const capacity = p.kapasite_kg ?? 1;
    const is_critical = current <= capacity * 0.25;
    return {
      name: p.ad ?? "",
      quantity: current,
      unit: "kg",
      is_critical,
    };
  });

  return {
    date,
    orders: {
      total: requests.length,
      pending,
      delivered,
      delayed,
    },
    inventory,
    tasks: {
      total: tasks.length,
      done: tasks.filter((t) => t.durum === true).length,
      todo: tasks.filter((t) => t.durum !== true).length,
    },
    harvests: [],
    anomalies,
  };
}
