import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// POST /api/ai/weekly-insight
// Body: { week_start?: string }  — YYYY-MM-DD, default: bu haftanın başı (Pazartesi)
// AI Raporları sayfasındaki "Gidişata göre · kısa AI özeti" + "Önerilen aksiyonlar" bölümlerini besler.
// Haftalık veriyi Supabase'den çekip Gemini ile analiz eder.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Haftanın başını hesapla (Pazartesi)
  const weekStart = body.week_start ?? getMonday();
  const weekEnd   = addDays(weekStart, 7);

  const supabase = createServerClient();

  try {
    // ── VERİ TOPLAMA ─────────────────────────────────────────

    // 1. Haftalık sipariş istatistikleri
    const { data: orders } = await supabase
      .from("orders")
      .select("status, quantity, products(name)")
      .gte("created_at", `${weekStart}T00:00:00`)
      .lt("created_at",  `${weekEnd}T00:00:00`);

    const totalOrders     = orders?.length ?? 0;
    const deliveredOrders = orders?.filter((o) => o.status === "delivered").length ?? 0;
    const delayedOrders   = orders?.filter((o) => o.status === "delayed").length   ?? 0;
    const fulfillmentRate = totalOrders > 0
      ? Math.round((deliveredOrders / totalOrders) * 100)
      : 0;

    // 2. Kritik stok durumu
    const { data: products } = await supabase
      .from("products")
      .select("id, name, unit, critical_stock_level");

    const criticalItems: Array<{ name: string; current: number; unit: string }> = [];

    for (const product of products ?? []) {
      const { data: inv } = await supabase
        .from("inventory")
        .select("current_quantity")
        .eq("product_id", product.id)
        .single();

      const current = inv?.current_quantity ?? 0;
      if (current <= product.critical_stock_level) {
        criticalItems.push({ name: product.name, current, unit: product.unit });
      }
    }

    // 3. Geçen haftayla talep karşılaştırması (trend)
    const prevWeekStart = addDays(weekStart, -7);
    const { data: prevOrders } = await supabase
      .from("orders")
      .select("quantity, product_id")
      .gte("created_at", `${prevWeekStart}T00:00:00`)
      .lt("created_at",  `${weekStart}T00:00:00`);

    const thisTotal = orders?.reduce((s, o) => s + (o.quantity ?? 0), 0) ?? 0;
    const prevTotal = prevOrders?.reduce((s, o) => s + (o.quantity ?? 0), 0) ?? 0;
    const demandTrend = prevTotal > 0
      ? Math.round(((thisTotal - prevTotal) / prevTotal) * 100)
      : 0;

    // 4. Hasat bildirimleri
    const { data: harvests } = await supabase
      .from("producer_product_reports")
      .select("quantity, unit, status, products(name), profiles(full_name)")
      .gte("created_at", `${weekStart}T00:00:00`)
      .lt("created_at",  `${weekEnd}T00:00:00`);

    // ── GEMİNİ PROMPT ────────────────────────────────────────
    const model = getModel();

    const contextText = `
Hafta: ${weekStart} – ${weekEnd}

Sipariş özeti:
- Toplam: ${totalOrders}
- Teslim edildi: ${deliveredOrders} (%${fulfillmentRate} karşılama)
- Gecikmiş: ${delayedOrders}
- Geçen haftaya göre talep değişimi: ${demandTrend >= 0 ? "+" : ""}${demandTrend}%

Kritik stok durumu (${criticalItems.length} ürün):
${criticalItems.length > 0
  ? criticalItems.map((i) => `- ${i.name}: ${i.current} ${i.unit} (kritik eşiğin altında)`).join("\n")
  : "- Kritik stok yok"}

Hasat bildirimleri (${harvests?.length ?? 0} kayıt):
${(harvests ?? []).slice(0, 5).map((h) => {
  const producer = (h.profiles as unknown as { full_name: string })?.full_name ?? "Bilinmeyen";
  const product  = (h.products as unknown as { name: string })?.name ?? "Bilinmeyen";
  return `- ${producer}: ${h.quantity} ${h.unit} ${product} (${h.status})`;
}).join("\n") || "- Kayıt yok"}
`.trim();

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
      week_start:    weekStart,
      week_end:      weekEnd,
      stats: {
        total_orders:     totalOrders,
        delivered_orders: deliveredOrders,
        delayed_orders:   delayedOrders,
        fulfillment_rate: fulfillmentRate,
        demand_trend_pct: demandTrend,
        critical_items:   criticalItems,
      },
      insight:              aiOutput.insight,
      highlights:           aiOutput.highlights ?? [],
      recommended_actions:  aiOutput.recommended_actions ?? [],
      week_score:           aiOutput.week_score ?? null,
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
      { error: isRateLimit ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." : "Haftalık özet oluşturulamadı." },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}

// ── YARDIMCI ─────────────────────────────────────────────────

function getMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Pazar
  const diff = day === 0 ? -6 : 1 - day; // Pazartesi'ye çek
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
