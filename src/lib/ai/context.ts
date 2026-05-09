// Supabase gelince bu fonksiyonlar gerçek DB sorgularıyla değişecek.
// Şimdilik mock veri kullanıyoruz — yapı aynı kalacak.

export interface DailyContext {
  date: string;
  orders: { total: number; pending: number; delivered: number; delayed: number };
  inventory: Array<{ name: string; quantity: number; unit: string; is_critical: boolean }>;
  tasks: { total: number; done: number; todo: number };
  harvests: Array<{ producer: string; product: string; quantity: number; unit: string; status: string }>;
}

export async function buildDailyContext(date: string): Promise<DailyContext> {
  // TODO: Supabase gelince:
  // const supabase = createClient();
  // const orders = await supabase.from("orders").select(...).eq("date", date);
  // ...

  return {
    date,
    orders: {
      total: 14,
      pending: 3,
      delivered: 9,
      delayed: 2,
    },
    inventory: [
      { name: "Domates", quantity: 245, unit: "kg", is_critical: false },
      { name: "Biber",   quantity: 12,  unit: "kg", is_critical: true  },
      { name: "Elma",    quantity: 200, unit: "kg", is_critical: false },
      { name: "Patates", quantity: 8,   unit: "kg", is_critical: true  },
    ],
    tasks: {
      total: 8,
      done: 6,
      todo: 2,
    },
    harvests: [
      { producer: "Ahmet Yılmaz", product: "Domates", quantity: 200, unit: "kg", status: "processed" },
      { producer: "Fatma Demir",  product: "Biber",   quantity: 30,  unit: "kg", status: "pending"   },
    ],
  };
}
