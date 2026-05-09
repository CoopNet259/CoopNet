import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/ai/orchestrator";

// POST /api/ai/chat
// Body: { message: string }
// Orchestrator'ı çalıştırır, AI'ın cevabını ve hangi tool'ları çağırdığını döner.
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message gerekli" }, { status: 400 });
  }

  try {
    const result = await runAgent(message);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
    return NextResponse.json(
      { error: isRateLimit ? "AI şu an yoğun, lütfen birkaç saniye bekleyip tekrar deneyin." : "AI yanıt üretemedi." },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
