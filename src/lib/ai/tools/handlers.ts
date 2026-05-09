import { createServerClient } from "@/lib/supabase/client";

export async function get_stock({ product_name }: { product_name: string }) {
  const supabase = createServerClient();

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, name, unit, critical_stock_level")
    .ilike("name", `%${product_name}%`)
    .single();

  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

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

export async function get_daily_orders({ date }: { date: string }) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_name, quantity, unit, status, created_at, products(name)")
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  return {
    date,
    total: data?.length ?? 0,
    orders: (data ?? []).map((o) => ({
      id: o.id,
      customer_name: o.customer_name,
      product: (o.products as unknown as { name: string })?.name,
      quantity: o.quantity,
      unit: o.unit,
      status: o.status,
    })),
  };
}

export async function assign_task({
  role, title, description, priority, product_name,
}: {
  role: string; title: string; description?: string; priority: string; product_name?: string;
}) {
  const supabase = createServerClient();

  let product_id: string | null = null;
  if (product_name) {
    const { data: p } = await supabase
      .from("products")
      .select("id")
      .ilike("name", `%${product_name}%`)
      .single();
    product_id = p?.id ?? null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: description ?? null,
      assigned_role: role,
      priority,
      status: "todo",
      product_id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { task_id: data.id, message: `Görev oluşturuldu: "${title}" → ${role}` };
}

export async function update_stock({
  product_name, delta, reason,
}: {
  product_name: string; delta: number; reason: string;
}) {
  const supabase = createServerClient();

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, name, unit")
    .ilike("name", `%${product_name}%`)
    .single();

  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const { data: inv } = await supabase
    .from("inventory")
    .select("current_quantity")
    .eq("product_id", product.id)
    .single();

  const newQty = (inv?.current_quantity ?? 0) + delta;

  await supabase
    .from("inventory")
    .update({ current_quantity: newQty, updated_at: new Date().toISOString() })
    .eq("product_id", product.id);

  return {
    product_name: product.name,
    previous_quantity: inv?.current_quantity ?? 0,
    new_quantity: newQty,
    delta,
    reason,
  };
}

export async function get_sales_forecast({
  product_name, days,
}: {
  product_name: string; days: number;
}) {
  const supabase = createServerClient();

  // Önce product_id bul — join üzerinden ilike filtresi Supabase'de çalışmaz
  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, name")
    .ilike("name", `%${product_name}%`)
    .single();

  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("quantity")
    .eq("product_id", product.id)
    .gte("created_at", since.toISOString())
    .eq("status", "delivered");

  const totalSold = (orders ?? []).reduce((sum, o) => sum + (o.quantity ?? 0), 0);
  const dailyAvg = totalSold / 30;
  const forecast = Math.round(dailyAvg * days);

  return {
    product_name: product.name,
    forecast_days: days,
    estimated_demand: forecast,
    daily_average: Math.round(dailyAvg),
    based_on_days: 30,
    note: (orders ?? []).length === 0
      ? "Geçmiş satış verisi yok, tahmin güvenilir değil"
      : `Son 30 günde ${totalSold} kg satıldı`,
  };
}

export async function send_notification({
  role, title, message, type,
}: {
  role: string; title: string; message: string; type?: string;
}) {
  const supabase = createServerClient();

  const { error } = await supabase.from("notifications").insert({
    role,
    title,
    message,
    type: type ?? "info",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { status: "sent", role, title };
}

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
    case "get_stock":
      return get_stock(args as { product_name: string });
    case "check_threshold":
      return check_threshold(args as { product_name: string });
    case "get_daily_orders":
      return get_daily_orders(args as { date: string });
    case "assign_task":
      return assign_task(args as { role: string; title: string; description?: string; priority: string; product_name?: string });
    case "update_stock":
      return update_stock(args as { product_name: string; delta: number; reason: string });
    case "get_sales_forecast":
      return get_sales_forecast(args as { product_name: string; days: number });
    case "send_notification":
      return send_notification(args as { role: string; title: string; message: string; type?: string });
    default:
      return { error: `Bilinmeyen tool: ${name}` };
  }
}
