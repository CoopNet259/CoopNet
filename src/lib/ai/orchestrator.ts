import { getModel } from "./client";
import { toolDefinitions } from "./tools/definitions";
import { executeToolCall } from "./tools/handlers";
import { logAI } from "./logger";

export interface AgentResult {
  text: string;
  toolCalls: Array<{ tool: string; args: Record<string, string>; result: unknown }>;
}

// ReAct döngüsü: Reason (düşün) → Act (tool çağır) → Observe (sonucu al) → tekrar
export async function runAgent(userMessage: string): Promise<AgentResult> {
  const systemPrompt = `Sen CoopFlow AI'sın — bir kooperatifin iş akışını yöneten yapay zeka ajanısın.

Görevin: Kullanıcının sorusunu anla, gerekli tool'ları çağırarak gerçek veriye bak, sonra net ve kısa Türkçe yanıt ver.

Kurallar:
- Önce tool çağır, veriyi gör, sonra yorum yap. Asla tahmin etme.
- Stok kritikse bunu açıkça belirt ve ne yapılması gerektiğini söyle.
- Yanıtların kısa ve eyleme dönüştürülebilir olsun.`;

  const model = getModel(false, systemPrompt);

  const chat = model.startChat({
    tools: toolDefinitions,
  });

  const toolCalls: AgentResult["toolCalls"] = [];

  // İlk mesajı gönder
  let response = await chat.sendMessage(userMessage);

  // ReAct döngüsü — AI tool istemediği anda döngü biter (max 5 tur)
  for (let turn = 0; turn < 5; turn++) {
    const functionCalls = response.response.functionCalls();

    // AI tool istemedi → nihai cevabı döndür
    if (!functionCalls || functionCalls.length === 0) {
      const result = {
        text: response.response.text(),
        toolCalls,
      };

      await logAI({
        input_text: userMessage,
        output_json: result,
        action_type: "chat",
      });

      return result;
    }

    // Her tool'u çalıştır ve sonuçları topla
    const toolResults = await Promise.all(
      functionCalls.map(async (call) => {
        const result = await executeToolCall(
          call.name,
          call.args as Record<string, string>
        );

        toolCalls.push({ tool: call.name, args: call.args as Record<string, string>, result });

        return {
          functionResponse: {
            name: call.name,
            response: result,
          },
        };
      })
    );

    // Sonuçları AI'a geri ver → AI bir sonraki adımı düşünsün
    response = await chat.sendMessage(toolResults);
  }

  return {
    text: response.response.text(),
    toolCalls,
  };
}
