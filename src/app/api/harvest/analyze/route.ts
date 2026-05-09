import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { runAgent } from "@/lib/ai/orchestrator";
import type { ParsedHarvest, HarvestAnalysisResult } from "@/lib/ai/types";

// Aşama 1: Türkçe mesajdan ürün/miktar/zaman çıkar
async function parseHarvestMessage(message: string): Promise<ParsedHarvest> {
  const model = getModel(false);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: message }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: `Kullanıcının Türkçe mesajından hasat bilgilerini çıkar ve SADECE JSON döndür.

Çıkarman gerekenler:
- product_name: ürün adı (string)
- quantity: miktar (number)
- unit: birim — "kg", "adet", "kasa" (string)
- available_time: varsa saat, "HH:MM" formatında, yoksa null
- confidence: ne kadar emin olduğun, 0.0 ile 1.0 arası (number)

Örnek:
Girdi: "Bugün 200 kg domates hazır, öğlene kadar getirebilirim"
Çıktı: {"product_name":"domates","quantity":200,"unit":"kg","available_time":"12:00","confidence":0.95}`,
  });

  return JSON.parse(result.response.text()) as ParsedHarvest;
}

// POST /api/harvest/analyze
// Body: { message: string }
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message gerekli" }, { status: 400 });
  }

  // Aşama 1: Mesajı parse et
  const parsed = await parseHarvestMessage(message);

  // Aşama 2: Orchestrator ile stok analizi yap
  const agentPrompt = `Üretici şunu bildirdi: "${message}"

Çıkardığım bilgi: ${parsed.quantity} ${parsed.unit} ${parsed.product_name} hazır,
getirme zamanı: ${parsed.available_time ?? "belirtilmemiş"}.

Şimdi:
1. Bu ürünün mevcut stok durumunu kontrol et
2. Kritik eşiğe bak
3. Ne yapılması gerektiğini söyle`;

  const agentResult = await runAgent(agentPrompt);

  // İki aşamanın sonuçlarını birleştir
  const response: HarvestAnalysisResult = {
    parsed,
    stock_status: extractStockStatus(agentResult.toolCalls),
    recommendation: agentResult.text,
    actions: deriveActions(parsed, agentResult.toolCalls),
  };

  return NextResponse.json(response);
}

// Tool çağrılarından stok durumunu çıkar
function extractStockStatus(toolCalls: Array<{ tool: string; result: unknown }>) {
  const threshold = toolCalls.find((t) => t.tool === "check_threshold")
    ?.result as Record<string, unknown> | undefined;

  if (!threshold) {
    return { current_quantity: 0, unit: "kg", is_critical: false, fill_percentage: 100 };
  }

  return {
    current_quantity: threshold.current_quantity as number,
    unit: threshold.unit as string,
    is_critical: threshold.is_critical as boolean,
    fill_percentage: threshold.fill_percentage as number,
  };
}

// Stok durumuna göre yapılacak aksiyonları belirle
function deriveActions(
  parsed: ParsedHarvest,
  toolCalls: Array<{ tool: string; result: unknown }>
): string[] {
  const actions: string[] = [];
  const threshold = toolCalls.find((t) => t.tool === "check_threshold")
    ?.result as Record<string, unknown> | undefined;

  actions.push(`Depo görevi oluştur: ${parsed.quantity} ${parsed.unit} ${parsed.product_name} teslim al`);

  if (threshold?.is_critical) {
    actions.push("Yöneticiye kritik stok uyarısı gönder");
    actions.push("Tedarikçi sipariş taslağı hazırla");
  }

  if (parsed.available_time) {
    actions.push(`Teslim saati: ${parsed.available_time} — depo sorumlusuna bildir`);
  }

  return actions;
}
