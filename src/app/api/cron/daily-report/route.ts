import { NextResponse } from 'next/server';

// Vercel Cron: her sabah 07:00 Türkiye saati (04:00 UTC)
// vercel.json'da tanımlı → "0 4 * * *"
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  try {
    const res = await fetch(`${backendUrl}/api/cron/generate-daily-report`, {
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
