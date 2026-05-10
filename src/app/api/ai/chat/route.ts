import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/ai/orchestrator";
import type { ChatMessage } from "@/lib/ai/types";

// POST /api/ai/chat
// Body: { message: string, history?: ChatMessage[] }
// history: frontend'in tuttuğu son N mesaj — AI bağlamı hatırlamak için kullanır
export async function POST(req: NextRequest) {
  const { message, history } = await req.json() as {
    message: string;
    history?: ChatMessage[];
  };

  if (!message) {
    return NextResponse.json({ error: "message gerekli" }, { status: 400 });
  }

  try {
    const result = await runAgent(message, history ?? []);
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
