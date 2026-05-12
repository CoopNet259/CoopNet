import { NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";

export async function GET() {
  const model = getModel();

  const result = await model.generateContent(
    "Sen CoopNet AI'sın. Kendini tek cümleyle Türkçe tanıt."
  );

  const text = result.response.text();

  return NextResponse.json({ message: text });
}
