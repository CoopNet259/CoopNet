import { createServerClient } from "@/lib/supabase/client";
import type {
  DailyAnomalyInsights,
  DelayedSpike,
  DemandAnomaly,
  ProducerSilence,
  StockDepletionAnomaly,
} from "@/lib/ai/types";

/**
 * supabase_schema.sql: requests'te created_at yok; orders/inventory/profiles yok.
 * Zaman serisi anomalileri hesaplanamaz — Python services/anomaly.py ile aynı yaklaşım:
 * stok düşüklüğü sinyali + anlık gecikme oranı.
 */
export async function computeDailyAnomalyInsights(date: string): Promise<DailyAnomalyInsights> {
  const supabase = createServerClient();

  const { data: products } = await supabase
    .from("products")
    .select("ad, mevcut_kg, kapasite_kg");

  const stockDepletionAnomalies: StockDepletionAnomaly[] = (products ?? [])
    .map((p) => {
      const current = p.mevcut_kg ?? 0;
      const capacity = p.kapasite_kg ?? 1;
      const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 100;
      const is_anomaly = pct <= 30;
      return {
        product_name: p.ad ?? "",
        previous_7d_consumption: 0,
        recent_7d_consumption: current,
        acceleration_ratio: pct <= 15 ? 2 : pct <= 30 ? 1.5 : 1,
        is_anomaly,
      };
    })
    .filter((x) => x.is_anomaly)
    .sort((a, b) => b.acceleration_ratio - a.acceleration_ratio);

  const { data: reqs } = await supabase.from("requests").select("durum");
  const rows = reqs ?? [];
  const delayed = rows.filter((r) => r.durum === "gecikti" || r.durum === "gecikmiş").length;
  const delayed_ratio_today = rows.length > 0 ? delayed / rows.length : 0;

  const delayedSpike: DelayedSpike = {
    date,
    delayed_ratio_today,
    delayed_ratio_7d_average: 0,
    multiplier: delayed_ratio_today > 0.2 ? 2 : 0,
    is_anomaly: rows.length >= 2 && delayed_ratio_today >= 0.2,
  };

  return {
    date,
    demand_anomalies: [] as DemandAnomaly[],
    delayed_spike: delayedSpike,
    stock_depletion_anomalies: stockDepletionAnomalies,
    producer_silence: [] as ProducerSilence[],
  };
}
