import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { logAI } from "@/lib/ai/logger";

// POST /api/ai/draft-email
// Body: { product_name: string, quantity: number, unit: string }
// Yönetici onay ekranında "Tedarikçiye Mail Gönder" butonuna basınca çağrılır
export async function POST(req: NextRequest) {
  const { product_name, quantity, unit } = await req.json();

  if (!product_name || !quantity) {
    return NextResponse.json({ error: "product_name ve quantity gerekli" }, { status: 400 });
  }

  try {
  const model = getModel();

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `Kooperatif deposunda ${product_name} stoğu kritik seviyeye düştü.
Mevcut miktar: ${quantity} ${unit ?? "kg"}.
Bu ürün için tedarikçiye sipariş e-postası taslağı hazırla.`,
      }],
    }],
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: `Sen CoopNet AI'sın. Kooperatif adına tedarikçiye gönderilecek Türkçe sipariş e-postası yaz.

SADECE şu JSON formatında yanıt ver:
{
  "subject": "e-posta konusu",
  "body": "e-posta gövdesi (selamlama, talep, imza dahil)",
  "suggested_quantity": öneri_miktar_sayı
}

Kurallar:
- Resmi ve kısa üslup
- suggested_quantity: mevcut miktarın 3 katı kadar öner (deponu dolduracak kadar)
- İmzayı "CoopNet Kooperatif Yönetim Sistemi" olarak yaz
- Body içinde \\n ile satır geç`,
  });

  const draft = JSON.parse(result.response.text());

  await logAI({
    input_text: `draft_email: ${product_name} ${quantity}${unit}`,
    output_data: draft,
    action_type: "draft_email",
  });

  return NextResponse.json(draft);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    return NextResponse.json(
      { error: isRateLimit ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." : "Mail taslağı oluşturulamadı." },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
