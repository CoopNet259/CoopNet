import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// GET /api/cron/stock-check — products.mevcut_kg / kapasite_kg; bildirim → ai_logs

function nowLogFields() {
  const now = new Date();
  return {
    zaman: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    tarih: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
  };
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, ad, emoji, mevcut_kg, kapasite_kg");

  if (error || !products) {
    return NextResponse.json({ error: "Ürünler alınamadı." }, { status: 500 });
  }

  const criticalProducts: Array<{
    name: string;
    current_quantity: number;
    critical_level: number;
    unit: string;
    fill_percentage: number;
  }> = [];

  for (const p of products) {
    const current = p.mevcut_kg ?? 0;
    const capacity = p.kapasite_kg ?? 1;
    const criticalLevel = capacity * 0.25;
    if (current <= criticalLevel) {
      const fillPct = criticalLevel > 0 ? Math.round((current / criticalLevel) * 100) : 0;
      criticalProducts.push({
        name: `${p.emoji ?? ""} ${p.ad ?? ""}`.trim(),
        current_quantity: current,
        critical_level: Math.round(criticalLevel),
        unit: "kg",
        fill_percentage: fillPct,
      });
    }
  }

  if (criticalProducts.length === 0) {
    await logAI({
      input_text: "cron:stock_check",
      output_data: { critical_count: 0, checked_at: new Date().toISOString() },
      action_type: "stock_check",
    });

    return NextResponse.json({
      checked: products.length,
      critical_count: 0,
      message: "Tüm stoklar yeterli seviyede.",
    });
  }

  const t = nowLogFields();
  const logRows = criticalProducts.flatMap((cp) => [
    {
      ...t,
      tip: "Uyarı",
      baslik: `⚠️ Kritik Stok: ${cp.name}`,
      mesaj: `${cp.name} stoğu kritik seviyede. Mevcut: ${cp.current_quantity} ${cp.unit} (doluluk %${cp.fill_percentage}). Tedarikçi siparişi gerekli.`,
      kategori: "Depo",
      renk: "red",
    },
    {
      ...t,
      tip: "Uyarı",
      baslik: `⚠️ Kritik Stok: ${cp.name}`,
      mesaj: `${cp.name} stoğu kritik seviyeye düştü. Mevcut: ${cp.current_quantity} ${cp.unit}. Stok sayımı yapın ve yöneticiye bildirin.`,
      kategori: "Depo",
      renk: "gold",
    },
  ]);

  const { error: logError } = await supabase.from("ai_logs").insert(logRows);
  if (logError) {
    console.error("[STOCK_CHECK_AI_LOG_ERROR]", logError.message);
  }

  const result = {
    checked: products.length,
    critical_count: criticalProducts.length,
    critical_products: criticalProducts,
    ai_logs_written: logError ? 0 : logRows.length,
    checked_at: new Date().toISOString(),
  };

  await logAI({
    input_text: "cron:stock_check",
    output_data: result,
    action_type: "stock_check",
  });

  return NextResponse.json(result);
}
