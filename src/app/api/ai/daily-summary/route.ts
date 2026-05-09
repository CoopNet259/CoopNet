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
    systemInstruction: `Sen CoopFlow AI'sın. Kooperatif yöneticisi için günlük operasyon özeti yaz.

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
  };

  await logAI({
    input_text: `daily_summary_${date}`,
    output_json: response,
    action_type: "daily_summary",
  });

  return NextResponse.json(response);
}
