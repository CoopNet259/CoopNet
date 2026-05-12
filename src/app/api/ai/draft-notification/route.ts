import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// POST /api/ai/draft-notification
// Body: { order_id: string } — requests tablosu (supabase_schema.sql)

export async function POST(req: NextRequest) {
  const { order_id } = await req.json();

  if (!order_id) {
    return NextResponse.json({ error: "order_id gerekli" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: order, error } = await supabase
    .from("requests")
    .select("musteri, urun, miktar, saat, durum")
    .eq("id", order_id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }

  try {
    const model = getModel();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Aşağıdaki sipariş için müşteriye bildirim taslağı yaz:

Müşteri: ${order.musteri ?? ""}
Ürün: ${order.urun ?? ""}
Miktar: ${order.miktar ?? ""}
Durum: ${order.durum ?? ""}
Saat: ${order.saat ?? ""}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
      systemInstruction: `Sen CoopNet AI'sın. Kooperatif müşteri temsilcisi adına müşteriye gönderilecek bildirim mesajı yaz.

SADECE şu JSON formatında yanıt ver:
{
  "subject": "mesaj konusu",
  "message": "mesaj içeriği (kısa, samimi, özür veya bilgi içeren)",
  "channel": "in_app"
}

Durum değerlerine göre ton (Türkçe durumlar: bekliyor, onaylandi, teslim edildi, gecikti, gecikmiş):
- gecikti / gecikmiş: özür dile, yeni tahmini süre belirt (1-2 gün)
- bekliyor: siparişin alındığını onayla, hazırlık sürecinde olduğunu söyle
- onaylandi: onaylandığını belirt, hazırlık / sevkiyat bilgisi
- teslim edildi: teşekkür ve teslim özeti

Kısa tut, samimi ol, Türkçe yaz.`,
    });

    const draft = JSON.parse(result.response.text());

    await logAI({
      input_text: `draft_notification: order_id=${order_id}`,
      output_data: { order_id, order, draft },
      action_type: "draft_notification",
    });

    return NextResponse.json(draft);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    return NextResponse.json(
      {
        error: isRateLimit
          ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin."
          : "Bildirim taslağı oluşturulamadı.",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
