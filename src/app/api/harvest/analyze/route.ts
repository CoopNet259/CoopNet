import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { runAgent } from "@/lib/ai/orchestrator";
import { logAI } from "@/lib/ai/logger";
import { assign_task, send_notification } from "@/lib/ai/tools/handlers";
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

  try {
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

    const stockStatus = extractStockStatus(agentResult.toolCalls);
    const suggestedActions = deriveActions(parsed, agentResult.toolCalls);

    // Otomatik aksiyon: confidence yüksekse (>= 0.7) görev + bildirim oluştur
    // Düşük confidence'da insan onayına bırak — hatalı aksiyon almaktansa bekle
    const executedActions: string[] = [];
    const autoExecuted = parsed.confidence >= 0.7;

    if (autoExecuted) {
      // 1. Depo görevi oluştur
      const timeNote = parsed.available_time ? ` (Teslim: ${parsed.available_time})` : "";
      const taskResult = await assign_task({
        role: "warehouse",
        title: `${parsed.product_name} hasat teslimi — ${parsed.quantity} ${parsed.unit}`,
        description: `Üretici bildirimi: "${message}"${timeNote}`,
        priority: stockStatus.is_critical ? "high" : "medium",
        product_name: parsed.product_name,
      });

      if (!("error" in taskResult)) {
        executedActions.push(`Depo görevi oluşturuldu (ID: ${taskResult.task_id})`);
      }

      // 2. Depocuya bildirim gönder
      await send_notification({
        role: "warehouse",
        title: `Yeni hasat: ${parsed.product_name}`,
        message: `${parsed.quantity} ${parsed.unit} ${parsed.product_name} teslim alınacak.${timeNote} Görev oluşturuldu.`,
        type: "info",
      });
      executedActions.push("Depo sorumlusuna bildirim gönderildi");

      // 3. Stok kritikse yöneticiye de bildir
      if (stockStatus.is_critical) {
        await send_notification({
          role: "manager",
          title: `⚠️ Kritik stok + yeni hasat: ${parsed.product_name}`,
          message: `${parsed.product_name} stoğu kritik (${stockStatus.current_quantity} ${stockStatus.unit}). Yeni hasat yolda: ${parsed.quantity} ${parsed.unit}.`,
          type: "warning",
        });
        executedActions.push("Yöneticiye kritik stok + hasat bildirimi gönderildi");
      }
    }

    const response: HarvestAnalysisResult = {
      parsed,
      stock_status: stockStatus,
      recommendation: agentResult.text,
      actions: suggestedActions,
      executed_actions: executedActions,
      auto_executed: autoExecuted,
      ...resolveConfidence(parsed.confidence),
    };

    await logAI({
      input_text: message,
      output_data: response,
      action_type: "harvest_analyze",
    });

    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    return NextResponse.json(
      { error: isRateLimit ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." : "Hasat analizi yapılamadı." },
      { status: isRateLimit ? 429 : 500 }
    );
  }
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

// Confidence skorunu insan okunabilir etikete ve uyarıya dönüştür
function resolveConfidence(confidence: number): {
  confidence_label: "Yüksek" | "Orta" | "Düşük";
  confidence_warning: string | null;
} {
  if (confidence >= 0.85) {
    return { confidence_label: "Yüksek", confidence_warning: null };
  }
  if (confidence >= 0.7) {
    return {
      confidence_label: "Orta",
      confidence_warning: "Mesaj kısmen belirsiz. Aksiyonlar alındı ancak üreticiyle teyit edilmesi önerilir.",
    };
  }
  return {
    confidence_label: "Düşük",
    confidence_warning: "Mesaj çok belirsiz, otomatik aksiyon alınmadı. Üreticiden net bilgi isteyin.",
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
