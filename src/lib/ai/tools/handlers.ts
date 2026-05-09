// Şu an mock veri kullanıyoruz.
// Supabase kurulunca bu fonksiyonlar gerçek DB sorgularıyla değişecek.

const mockInventory: Record<string, { quantity: number; unit: string; critical_level: number; updated_at: string }> = {
  domates: { quantity: 45, unit: "kg", critical_level: 50, updated_at: "2026-05-10T08:00:00" },
  biber:   { quantity: 12, unit: "kg", critical_level: 30, updated_at: "2026-05-10T07:30:00" },
  elma:    { quantity: 200, unit: "kg", critical_level: 80, updated_at: "2026-05-10T09:00:00" },
  patates: { quantity: 8,  unit: "kg", critical_level: 40, updated_at: "2026-05-10T06:00:00" },
};

export async function get_stock({ product_name }: { product_name: string }) {
  const key = product_name.toLowerCase();
  const item = mockInventory[key];

  if (!item) {
    return { error: `'${product_name}' ürünü bulunamadı.` };
  }

  return {
    product_name,
    quantity: item.quantity,
    unit: item.unit,
    updated_at: item.updated_at,
  };
}

export async function check_threshold({ product_name }: { product_name: string }) {
  const key = product_name.toLowerCase();
  const item = mockInventory[key];

  if (!item) {
    return { error: `'${product_name}' ürünü bulunamadı.` };
  }

  const is_critical = item.quantity <= item.critical_level;
  const fill_percentage = Math.round((item.quantity / item.critical_level) * 100);

  return {
    product_name,
    is_critical,
    fill_percentage,
    current_quantity: item.quantity,
    critical_level: item.critical_level,
    unit: item.unit,
    recommendation: is_critical
      ? `Acil sipariş gerekli. Mevcut ${item.quantity}${item.unit}, eşik ${item.critical_level}${item.unit}.`
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
