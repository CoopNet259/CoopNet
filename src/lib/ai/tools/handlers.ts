import { createServerClient } from "@/lib/supabase/client";

export async function get_stock({ product_name }: { product_name: string }) {
  const supabase = createServerClient();

  // Önce products tablosundan ürünü bul
  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, name, unit, critical_stock_level")
    .ilike("name", `%${product_name}%`)
    .single();

  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  // Sonra inventory'den stok miktarını çek
  const { data: inv } = await supabase
    .from("inventory")
    .select("current_quantity, updated_at, unit")
    .eq("product_id", product.id)
    .single();

  return {
    product_name: product.name,
    quantity: inv?.current_quantity ?? 0,
    unit: inv?.unit ?? product.unit,
    updated_at: inv?.updated_at ?? null,
  };
}

export async function check_threshold({ product_name }: { product_name: string }) {
  const supabase = createServerClient();

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, name, unit, critical_stock_level")
    .ilike("name", `%${product_name}%`)
    .single();

  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const { data: inv } = await supabase
    .from("inventory")
    .select("current_quantity, unit")
    .eq("product_id", product.id)
    .single();

  const current = inv?.current_quantity ?? 0;
  const unit = inv?.unit ?? product.unit;
  const is_critical = current <= product.critical_stock_level;
  const fill_percentage = product.critical_stock_level > 0
    ? Math.round((current / product.critical_stock_level) * 100)
    : 100;

  return {
    product_name: product.name,
    is_critical,
    fill_percentage,
    current_quantity: current,
    critical_level: product.critical_stock_level,
    unit,
    recommendation: is_critical
      ? `Acil sipariş gerekli. Mevcut ${current} ${unit}, eşik ${product.critical_stock_level} ${unit}.`
      : `Stok yeterli. Doluluk %${fill_percentage}.`,
  };
}

// Gemini'nin tool çağrısını alıp doğru handler'a yönlendiren dispatcher.
// Orchestrator bu fonksiyonu çağırır — hangi tool olduğunu bilmesine gerek yok.
export async function executeToolCall(
  name: string,
  args: Record<string, string>
) {
  switch (name) {
    case "get_stock":
      return get_stock(args as { product_name: string });
    case "check_threshold":
      return check_threshold(args as { product_name: string });
    default:
      return { error: `Bilinmeyen tool: ${name}` };
  }
}
