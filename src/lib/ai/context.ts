import { createServerClient } from "@/lib/supabase/client";

export interface DailyContext {
  date: string;
  orders: { total: number; pending: number; delivered: number; delayed: number };
  inventory: Array<{ name: string; quantity: number; unit: string; is_critical: boolean }>;
  tasks: { total: number; done: number; todo: number };
  harvests: Array<{ producer: string; product: string; quantity: number; unit: string; status: string }>;
}

export async function buildDailyContext(date: string): Promise<DailyContext> {
  const supabase = createServerClient();
  const start = `${date}T00:00:00`;
  const end   = `${date}T23:59:59`;

  const [ordersRes, inventoryRes, tasksRes, harvestsRes] = await Promise.all([
    supabase.from("orders").select("status").gte("created_at", start).lte("created_at", end),
    supabase.from("inventory").select("current_quantity, unit, products(name, critical_stock_level)"),
    supabase.from("tasks").select("status").gte("created_at", start).lte("created_at", end),
    supabase
      .from("producer_product_reports")
      .select("quantity, unit, status, profiles(full_name), products(name)")
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  const orders = ordersRes.data ?? [];
  const inventory = inventoryRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const harvests = harvestsRes.data ?? [];

  return {
    date,
    orders: {
      total:     orders.length,
      pending:   orders.filter((o) => o.status === "pending").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      delayed:   orders.filter((o) => o.status === "delayed").length,
    },
    inventory: inventory.map((i) => {
      const p = i.products as { name: string; critical_stock_level: number };
      return {
        name:        p.name,
        quantity:    i.current_quantity,
        unit:        i.unit,
        is_critical: i.current_quantity <= p.critical_stock_level,
      };
    }),
    tasks: {
      total: tasks.length,
      done:  tasks.filter((t) => t.status === "done").length,
      todo:  tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length,
    },
    harvests: harvests.map((h) => ({
      producer: (h.profiles as { full_name: string })?.full_name ?? "Bilinmeyen",
      product:  (h.products as { name: string })?.name ?? "Bilinmeyen",
      quantity: h.quantity,
      unit:     h.unit,
      status:   h.status,
    })),
  };
}
