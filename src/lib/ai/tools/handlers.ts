import { createServerClient } from "@/lib/supabase/client";

function nowLogFields() {
  const now = new Date();
  return {
    zaman: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    tarih: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
  };
}

export async function get_stock({ product_name }: { product_name: string }) {
  const supabase = createServerClient();

  const { data: rows, error: pErr } = await supabase
    .from("products")
    .select("id, ad, emoji, mevcut_kg, kapasite_kg, son_guncelleme")
    .ilike("ad", `%${product_name}%`)
    .limit(1);

  const product = rows?.[0];
  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const current = product.mevcut_kg ?? 0;
  const capacity = product.kapasite_kg ?? 1;
  return {
    product_name: product.ad,
    quantity: current,
    unit: "kg",
    fill_percentage: capacity > 0 ? Math.round((current / capacity) * 100) : 100,
    updated_at: product.son_guncelleme ?? null,
  };
}

export async function check_threshold({ product_name }: { product_name: string }) {
  const supabase = createServerClient();

  const { data: rows, error: pErr } = await supabase
    .from("products")
    .select("id, ad, mevcut_kg, kapasite_kg")
    .ilike("ad", `%${product_name}%`)
    .limit(1);

  const product = rows?.[0];
  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const current = product.mevcut_kg ?? 0;
  const capacity = product.kapasite_kg ?? 1;
  const critical_level = capacity * 0.25;
  const is_critical = current <= critical_level;
  const fill_percentage = capacity > 0 ? Math.round((current / capacity) * 100) : 100;

  return {
    product_name: product.ad,
    is_critical,
    fill_percentage,
    current_quantity: current,
    critical_level: Math.round(critical_level),
    unit: "kg",
    recommendation: is_critical
      ? `Acil sipariş gerekli. Mevcut ${current} kg, eşik ${Math.round(critical_level)} kg.`
      : `Stok yeterli. Doluluk %${fill_percentage}.`,
  };
}

export async function get_daily_orders({ date }: { date: string }) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("requests")
    .select("id, musteri, urun, miktar, saat, durum");

  if (error) return { error: error.message };

  return {
    date,
    total: data?.length ?? 0,
    orders: (data ?? []).map((o) => ({
      id: o.id,
      customer_name: o.musteri,
      product: o.urun,
      quantity: o.miktar,
      unit: "kg",
      status: o.durum,
    })),
  };
}

export async function assign_task({
  role, title, description: _description, priority, product_name: _product_name,
}: {
  role: string;
  title: string;
  description?: string;
  priority: string;
  product_name?: string;
}) {
  const supabase = createServerClient();

  const oncelikMap: Record<string, string> = { high: "yuksek", medium: "orta", low: "dusuk" };
  const oncelik = oncelikMap[priority] ?? priority;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      is_name: title,
      durum: false,
      oncelik,
    })
    .select("id")
    .single();

  if (error) {
    return { task_id: "demo", message: `Görev planlandı: "${title}" (${error.message})` };
  }

  const t = nowLogFields();
  await supabase.from("ai_logs").insert({
    ...t,
    tip: "Uyarı",
    baslik: `Yeni görev (${role})`,
    mesaj: `Öncelik: ${oncelik}. ${title}`.slice(0, 500),
    kategori: "İletişim",
    renk: priority === "high" ? "red" : "gold",
  });

  return { task_id: data.id, message: `Görev oluşturuldu: "${title}" → ${role}` };
}

export async function update_stock({
  product_name, delta, reason,
}: {
  product_name: string;
  delta: number;
  reason: string;
}) {
  const supabase = createServerClient();

  const { data: rows, error: pErr } = await supabase
    .from("products")
    .select("id, ad, mevcut_kg")
    .ilike("ad", `%${product_name}%`)
    .limit(1);

  const product = rows?.[0];
  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const current = product.mevcut_kg ?? 0;
  const newQty = Math.max(0, Math.round(current + delta));

  await supabase
    .from("products")
    .update({ mevcut_kg: newQty })
    .eq("id", product.id);

  return {
    product_name: product.ad,
    previous_quantity: current,
    new_quantity: newQty,
    delta,
    reason,
  };
}

export async function get_sales_forecast({
  product_name, days,
}: {
  product_name: string;
  days: number;
}) {
  const supabase = createServerClient();

  const { data: rows, error: pErr } = await supabase
    .from("products")
    .select("id, ad, kapasite_kg")
    .ilike("ad", `%${product_name}%`)
    .limit(1);

  const product = rows?.[0];
  if (pErr || !product) return { error: `'${product_name}' ürünü bulunamadı.` };

  const capacity = product.kapasite_kg ?? 100;
  const dailyAvg = Math.round(capacity * 0.1);
  const forecast = dailyAvg * days;

  return {
    product_name: product.ad,
    forecast_days: days,
    estimated_demand: forecast,
    daily_average: dailyAvg,
    based_on_days: 30,
    note: "Geçmiş satış verisi yok; kapasite bazlı kaba tahmin kullanıldı.",
  };
}

export async function send_notification({
  role, title, message, type,
}: {
  role: string;
  title: string;
  message: string;
  type?: string;
}) {
  const supabase = createServerClient();

  const tipMap: Record<string, string> = {
    warning: "Uyarı",
    error: "Hata",
    info: "Rapor",
  };
  const t = nowLogFields();
  const { error } = await supabase.from("ai_logs").insert({
    ...t,
    tip: tipMap[type ?? "info"] ?? "Rapor",
    baslik: title,
    mesaj: `${message} (${role})`.slice(0, 500),
    kategori: "İletişim",
    renk: type === "error" ? "red" : "gold",
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
