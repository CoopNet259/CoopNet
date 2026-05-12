import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { buildDailyContext } from "@/lib/ai/context";
import { logAI } from "@/lib/ai/logger";

// POST /api/ai/daily-summary
// Body: { date?: string }   — boş gelirse bugünün tarihi kullanılır
// Supabase cron tarafından her gün 18:00'de tetiklenir
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const date = body.date ?? new Date().toISOString().split("T")[0];

  try {
  // Günün verisini topla
  const context = await buildDailyContext(date);

  const model = getModel();

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `Aşağıdaki günlük operasyon verisini analiz et ve yöneticiye özet hazırla.

Tarih: ${context.date}

Siparişler:
- Toplam: ${context.orders.total}
- Teslim edildi: ${context.orders.delivered}
- Bekliyor: ${context.orders.pending}
- Gecikmiş: ${context.orders.delayed}

Anomali tespiti:
- Talep anomalileri (${context.anomalies.demand_anomalies.length}):
${context.anomalies.demand_anomalies.map((a) =>
  `  - ${a.product_name}: geçen hafta ${a.previous_week_orders}, bu hafta ${a.current_week_orders} (değişim ${(a.change_ratio * 100).toFixed(1)}%)`
).join("\n")}
- Gecikmiş sipariş patlaması:
  - Bugün oran: ${(context.anomalies.delayed_spike.delayed_ratio_today * 100).toFixed(1)}%
  - Son 7 gün ort.: ${(context.anomalies.delayed_spike.delayed_ratio_7d_average * 100).toFixed(1)}%
  - Katsayı: ${Number.isFinite(context.anomalies.delayed_spike.multiplier) ? context.anomalies.delayed_spike.multiplier.toFixed(2) : "sonsuz"}
  - Anomali: ${context.anomalies.delayed_spike.is_anomaly ? "evet" : "hayır"}
- Stok erime anomalileri (${context.anomalies.stock_depletion_anomalies.length}):
${context.anomalies.stock_depletion_anomalies.map((a) =>
  `  - ${a.product_name}: önceki 7 gün ${a.previous_7d_consumption}, son 7 gün ${a.recent_7d_consumption} (hız ${a.acceleration_ratio.toFixed(2)}x)`
).join("\n")}
- Sessiz üreticiler (${context.anomalies.producer_silence.length}):
${context.anomalies.producer_silence.map((p) =>
  `  - ${p.producer}: ${p.silent_days} gündür bildirim yok`
).join("\n")}

Stok durumu:
${context.inventory.map(i =>
  `- ${i.name}: ${i.quantity} ${i.unit}${i.is_critical ? " ⚠️ KRİTİK" : ""}`
).join("\n")}

Görevler: ${context.tasks.done}/${context.tasks.total} tamamlandı

Hasat bildirimleri:
${context.harvests.map(h =>
  `- ${h.producer}: ${h.quantity} ${h.unit} ${h.product} (${h.status})`
).join("\n")}`,
      }],
    }],
    systemInstruction: `Sen CoopNet AI'sın. Kooperatif yöneticisi için günlük operasyon özeti yaz.

Format — tam olarak bu üç başlıkla:
## Bugün Ne Oldu
(2-3 madde, rakamlarla)

## Kritik Durumlar
(varsa kritik stoklar ve gecikmeler, yoksa "Kritik durum yok")

## Yarın Ne Yapılmalı
(2-3 somut aksiyon önerisi)

Türkçe yaz. Her madde kısa ve eyleme dönüştürülebilir olsun.`,
  });

  const summary = result.response.text();

  // Kritik ürünleri ayrıca çıkar — frontend kartlarda gösterecek
  const criticalItems = context.inventory.filter((i) => i.is_critical);

  const response = {
    date,
    summary,
    stats: context.orders,
    critical_items: criticalItems,
    anomalies: context.anomalies,
  };

  await logAI({
    input_text: `daily_summary_${date}`,
    output_data: response,
    action_type: "daily_summary",
  });

  return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    return NextResponse.json(
      { error: isRateLimit ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." : "Günlük özet oluşturulamadı." },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
