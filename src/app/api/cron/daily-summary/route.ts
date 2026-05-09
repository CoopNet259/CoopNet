import { NextRequest, NextResponse } from "next/server";

// GET /api/cron/daily-summary
// Supabase pg_cron veya harici cron servisi tarafından her gün 18:00'de çağrılır.
// CRON_SECRET ile korunur — izinsiz tetiklemeyi önler.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/ai/daily-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today }),
    });

    const data = await res.json();
    return NextResponse.json({ triggered: true, date: today, result: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
