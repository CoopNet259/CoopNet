import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// POST /api/ai/weekly-insight — requests + products (supabase_schema.sql)

function parseMiktarKg(miktar: string | null): number {
  if (!miktar) return 0;
  const n = parseFloat(String(miktar).replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const weekStart = body.week_start ?? getMonday();
  const weekEnd = addDays(weekStart, 7);

  const supabase = createServerClient();

  try {
    const { data: requests } = await supabase
      .from("requests")
      .select("durum, miktar, urun");

    const rows = requests ?? [];
    const totalOrders = rows.length;
    const deliveredOrders = rows.filter((o) => o.durum === "teslim edildi").length;
    const delayedOrders = rows.filter((o) => o.durum === "gecikti" || o.durum === "gecikmiş").length;
    const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    const { data: products } = await supabase
      .from("products")
      .select("ad, mevcut_kg, kapasite_kg");

    const criticalItems: Array<{ name: string; current: number; unit: string }> = [];
    for (const p of products ?? []) {
      const current = p.mevcut_kg ?? 0;
      const capacity = p.kapasite_kg ?? 1;
      if (current <= capacity * 0.25) {
        criticalItems.push({ name: p.ad ?? "", current, unit: "kg" });
      }
    }

    const thisTotal = rows.reduce((s, o) => s + parseMiktarKg(o.miktar), 0);
    const demandTrend = 0;

    const contextText = `
Hafta: ${weekStart} – ${weekEnd}

Talep / sipariş özeti (requests — anlık görünüm; şemada tarih kolonu yok):
- Toplam kayıt: ${totalOrders}
- Teslim edildi: ${deliveredOrders} (%${fulfillmentRate} karşılama)
- Gecikmiş: ${delayedOrders}
- Talep hacmi (miktar alanından parse): ~${Math.round(thisTotal)} kg

Kritik stok durumu (${criticalItems.length} ürün):
${criticalItems.length > 0
  ? criticalItems.map((i) => `- ${i.name}: ${i.current} ${i.unit} (kritik eşiğin altında)`).join("\n")
  : "- Kritik stok yok"}

Hasat bildirimleri: şemada ayrı hasat tablosu yok (boş kabul et).
`.trim();

    const model = getModel();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: contextText }] }],
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: `Sen CoopFlow AI'sın. Kooperatif yöneticisi için haftalık gidişat özeti yaz.

SADECE şu JSON formatında yanıt ver:
{
  "insight": "2-3 cümlelik özet paragraf — karşılama oranı, öne çıkan trend, risk varsa belirt",
  "highlights": ["öne çıkan madde 1", "öne çıkan madde 2", "öne çıkan madde 3"],
  "recommended_actions": [
    { "tone": "danger|warn|good", "title": "aksiyon başlığı", "meta": "kısa açıklama" }
  ],
  "week_score": 0-100
}

Kurallar:
- insight: gerçek rakamları kullan, tahmini yok
- recommended_actions: en fazla 3, kritikten başla
- week_score: 100 = mükemmel hafta, 0 = kriz
- Türkçe yaz, kısa ve eyleme dönüştürülebilir ol`,
    });

    const aiOutput = JSON.parse(result.response.text());

    const response = {
      week_start: weekStart,
      week_end: weekEnd,
      stats: {
        total_orders: totalOrders,
        delivered_orders: deliveredOrders,
        delayed_orders: delayedOrders,
        fulfillment_rate: fulfillmentRate,
        demand_trend_pct: demandTrend,
        critical_items: criticalItems,
      },
      insight: aiOutput.insight,
      highlights: aiOutput.highlights ?? [],
      recommended_actions: aiOutput.recommended_actions ?? [],
      week_score: aiOutput.week_score ?? null,
    };

    await logAI({
      input_text: `weekly_insight_${weekStart}`,
      output_data: response,
      action_type: "weekly_insight",
    });

    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    return NextResponse.json(
      {
        error: isRateLimit
          ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin."
          : "Haftalık özet oluşturulamadı.",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
