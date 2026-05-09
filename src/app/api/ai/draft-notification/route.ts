import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// POST /api/ai/draft-notification
// Body: { order_id: string }
// Gecikmiş veya sorunlu sipariş için müşteri bildirim taslağı üretir.
// Temsilci taslağı görür, onaylar, sistem gönderir.
export async function POST(req: NextRequest) {
  const { order_id } = await req.json();

  if (!order_id) {
    return NextResponse.json({ error: "order_id gerekli" }, { status: 400 });
  }

  // Siparişi DB'den çek
  const supabase = createServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("customer_name, quantity, unit, status, created_at, products(name)")
    .eq("id", order_id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }

  const product = (Array.isArray(order.products) ? order.products[0] : order.products) as unknown as { name: string };

  try {
  const model = getModel();

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `Aşağıdaki sipariş için müşteriye bildirim taslağı yaz:

Müşteri: ${order.customer_name}
Ürün: ${product.name}
Miktar: ${order.quantity} ${order.unit}
Durum: ${order.status}
Sipariş tarihi: ${new Date(order.created_at).toLocaleDateString("tr-TR")}`,
      }],
    }],
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: `Sen CoopFlow AI'sın. Kooperatif müşteri temsilcisi adına müşteriye gönderilecek bildirim mesajı yaz.

SADECE şu JSON formatında yanıt ver:
{
  "subject": "mesaj konusu",
  "message": "mesaj içeriği (kısa, samimi, özür veya bilgi içeren)",
  "channel": "in_app"
}

Durum değerlerine göre ton:
- delayed: özür dile, yeni tahmini süre belirt (1-2 gün)
- pending: siparişin alındığını onayla, hazırlık sürecinde olduğunu söyle
- preparing: hazırlanıyor, yakında teslim
- ready: teslimata hazır, bekliyor

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
      { error: isRateLimit ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." : "Bildirim taslağı oluşturulamadı." },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
