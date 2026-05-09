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

  const result = await runAgent(message);
  return NextResponse.json(result);
}
