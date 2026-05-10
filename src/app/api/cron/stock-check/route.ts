import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { logAI } from "@/lib/ai/logger";

// GET /api/cron/stock-check
// Tüm ürünlerin stok seviyesini tarar.
// Kritik eşikte olan her ürün için yöneticiye + depocuya otomatik bildirim gönderir.
// Supabase pg_cron tarafından her sabah 08:00'de tetiklenir.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createServerClient();

  // 1. Tüm ürünleri ve stok bilgilerini çek
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, unit, critical_stock_level");

  if (error || !products) {
    return NextResponse.json({ error: "Ürünler alınamadı." }, { status: 500 });
  }

  // 2. Her ürün için stok seviyesini kontrol et
  const criticalProducts: Array<{
    name: string;
    current_quantity: number;
    critical_level: number;
    unit: string;
    fill_percentage: number;
  }> = [];

  for (const product of products) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("current_quantity")
      .eq("product_id", product.id)
      .single();

    const current = inv?.current_quantity ?? 0;
    const isCritical = current <= product.critical_stock_level;

    if (isCritical) {
      const fillPct = product.critical_stock_level > 0
        ? Math.round((current / product.critical_stock_level) * 100)
        : 0;

      criticalProducts.push({
        name: product.name,
        current_quantity: current,
        critical_level: product.critical_stock_level,
        unit: product.unit,
        fill_percentage: fillPct,
      });
    }
  }

  // 3. Kritik ürün yoksa bitir
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

  // 4. Her kritik ürün için bildirim gönder
  const notificationRows = criticalProducts.flatMap((p) => [
    // Yöneticiye
    {
      role: "manager",
      title: `⚠️ Kritik Stok: ${p.name}`,
      message: `${p.name} stoğu kritik seviyede. Mevcut: ${p.current_quantity} ${p.unit} (eşiğin %${p.fill_percentage}'i). Tedarikçi siparişi gerekli.`,
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    },
    // Depo sorumlusuna
    {
      role: "warehouse",
      title: `⚠️ Kritik Stok: ${p.name}`,
      message: `${p.name} stoğu kritik seviyeye düştü. Mevcut: ${p.current_quantity} ${p.unit}. Stok sayımı yapın ve yöneticiye bildirin.`,
      type: "warning",
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  const { error: notifError } = await supabase
    .from("notifications")
    .insert(notificationRows);

  if (notifError) {
    console.error("[STOCK_CHECK_NOTIF_ERROR]", notifError.message);
  }

  // 5. Log ve yanıt
  const result = {
    checked: products.length,
    critical_count: criticalProducts.length,
    critical_products: criticalProducts,
    notifications_sent: notifError ? 0 : notificationRows.length,
    checked_at: new Date().toISOString(),
  };

  await logAI({
    input_text: "cron:stock_check",
    output_data: result,
    action_type: "stock_check",
  });

  return NextResponse.json(result);
}
