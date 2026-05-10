import { createServerClient } from "@/lib/supabase/client";
import type {
  DailyAnomalyInsights,
  DelayedSpike,
  DemandAnomaly,
  ProducerSilence,
  StockDepletionAnomaly,
} from "@/lib/ai/types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfDay(date: Date): string {
  return `${toDateString(date)}T00:00:00`;
}

function endOfDay(date: Date): string {
  return `${toDateString(date)}T23:59:59`;
}

export async function computeDailyAnomalyInsights(date: string): Promise<DailyAnomalyInsights> {
  const supabase = createServerClient();
  const anchor = new Date(`${date}T00:00:00Z`);

  const prevWeekStart = addDays(anchor, -13);
  const prevWeekEnd = addDays(anchor, -7);
  const currentWeekStart = addDays(anchor, -6);
  const currentWeekEnd = anchor;

  const delayedBaselineStart = addDays(anchor, -7);
  const delayedBaselineEnd = addDays(anchor, -1);

  const [ordersPeriodRes, delayedRes, producersRes] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, quantity, status, products(name)")
      .gte("created_at", startOfDay(prevWeekStart))
      .lte("created_at", endOfDay(currentWeekEnd)),
    supabase
      .from("orders")
      .select("created_at, status")
      .gte("created_at", startOfDay(delayedBaselineStart))
      .lte("created_at", endOfDay(anchor)),
    supabase
      .from("producer_product_reports")
      .select("created_at, profiles(full_name)"),
  ]);

  const allOrders = ordersPeriodRes.data ?? [];
  const delayedOrders = delayedRes.data ?? [];
  const producerReports = producersRes.data ?? [];

  const demandByProduct = new Map<string, { prev: number; current: number }>();

  for (const order of allOrders) {
    const createdAt = new Date(order.created_at);
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    const productName = (product as { name?: string } | null)?.name ?? "Bilinmeyen";
    const quantity = order.quantity ?? 0;

    if (!demandByProduct.has(productName)) {
      demandByProduct.set(productName, { prev: 0, current: 0 });
    }

    const bucket = demandByProduct.get(productName);
    if (!bucket) continue;

    if (order.status !== "delivered") {
      continue;
    }

    if (createdAt >= prevWeekStart && createdAt <= prevWeekEnd) {
      bucket.prev += quantity;
    } else if (createdAt >= currentWeekStart && createdAt <= currentWeekEnd) {
      bucket.current += quantity;
    }
  }

  const demandAnomalies: DemandAnomaly[] = Array.from(demandByProduct.entries())
    .map(([productName, values]) => {
      const changeRatio = values.prev > 0
        ? (values.current - values.prev) / values.prev
        : values.current > 0
          ? 1
          : 0;

      return {
        product_name: productName,
        previous_week_orders: values.prev,
        current_week_orders: values.current,
        change_ratio: changeRatio,
        is_anomaly: values.prev > 0 && Math.abs(changeRatio) >= 0.3,
      };
    })
    .filter((item) => item.is_anomaly)
    .sort((a, b) => Math.abs(b.change_ratio) - Math.abs(a.change_ratio));

  const delayedDaily = new Map<string, { total: number; delayed: number }>();
  for (let i = -7; i <= 0; i += 1) {
    const day = toDateString(addDays(anchor, i));
    delayedDaily.set(day, { total: 0, delayed: 0 });
  }

  for (const row of delayedOrders) {
    const day = toDateString(new Date(row.created_at));
    const bucket = delayedDaily.get(day);
    if (!bucket) continue;

    bucket.total += 1;
    if (row.status === "delayed") {
      bucket.delayed += 1;
    }
  }

  const todayKey = toDateString(anchor);
  const todayStat = delayedDaily.get(todayKey) ?? { total: 0, delayed: 0 };
  const todayRatio = todayStat.total > 0 ? todayStat.delayed / todayStat.total : 0;

  const baselineRatios: number[] = [];
  for (let i = -7; i <= -1; i += 1) {
    const key = toDateString(addDays(anchor, i));
    const stat = delayedDaily.get(key) ?? { total: 0, delayed: 0 };
    baselineRatios.push(stat.total > 0 ? stat.delayed / stat.total : 0);
  }
  const baselineAvg = baselineRatios.length > 0
    ? baselineRatios.reduce((sum, value) => sum + value, 0) / baselineRatios.length
    : 0;

  const multiplier = baselineAvg > 0 ? todayRatio / baselineAvg : todayRatio > 0 ? Number.POSITIVE_INFINITY : 0;
  const delayedSpike: DelayedSpike = {
    date,
    delayed_ratio_today: todayRatio,
    delayed_ratio_7d_average: baselineAvg,
    multiplier,
    is_anomaly: baselineAvg > 0 ? todayRatio >= baselineAvg * 2 : todayRatio > 0,
  };

  const depletionByProduct = new Map<string, { prev: number; recent: number }>();
  for (const order of allOrders) {
    const createdAt = new Date(order.created_at);
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    const productName = (product as { name?: string } | null)?.name ?? "Bilinmeyen";
    const quantity = order.quantity ?? 0;

    if (!depletionByProduct.has(productName)) {
      depletionByProduct.set(productName, { prev: 0, recent: 0 });
    }
    const bucket = depletionByProduct.get(productName);
    if (!bucket) continue;

    if (createdAt >= prevWeekStart && createdAt <= prevWeekEnd) {
      bucket.prev += quantity;
    } else if (createdAt >= currentWeekStart && createdAt <= currentWeekEnd) {
      bucket.recent += quantity;
    }
  }

  const stockDepletionAnomalies: StockDepletionAnomaly[] = Array.from(depletionByProduct.entries())
    .map(([productName, values]) => {
      const acceleration = values.prev > 0
        ? values.recent / values.prev
        : values.recent > 0
          ? Number.POSITIVE_INFINITY
          : 0;

      return {
        product_name: productName,
        previous_7d_consumption: values.prev,
        recent_7d_consumption: values.recent,
        acceleration_ratio: acceleration,
        is_anomaly: values.prev > 0 && acceleration >= 1.3,
      };
    })
    .filter((item) => item.is_anomaly)
    .sort((a, b) => b.acceleration_ratio - a.acceleration_ratio);

  const latestProducerReport = new Map<string, Date>();
  for (const report of producerReports) {
    const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
    const producerName = (profile as { full_name?: string } | null)?.full_name ?? "Bilinmeyen";
    const createdAt = new Date(report.created_at);
    const existing = latestProducerReport.get(producerName);

    if (!existing || createdAt > existing) {
      latestProducerReport.set(producerName, createdAt);
    }
  }

  const producerSilence: ProducerSilence[] = Array.from(latestProducerReport.entries())
    .map(([producerName, lastReport]) => {
      const silentDays = Math.floor((anchor.getTime() - lastReport.getTime()) / ONE_DAY_MS);
      return {
        producer: producerName,
        last_report_at: lastReport.toISOString(),
        silent_days: silentDays,
        is_anomaly: silentDays >= 5,
      };
    })
    .filter((item) => item.is_anomaly)
    .sort((a, b) => b.silent_days - a.silent_days);

  return {
    date,
    demand_anomalies: demandAnomalies,
    delayed_spike: delayedSpike,
    stock_depletion_anomalies: stockDepletionAnomalies,
    producer_silence: producerSilence,
  };
}
