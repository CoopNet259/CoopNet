# CoopFlow AI — AI Katmanı Geliştirme Planı

> Sorumluluk: Gemini API entegrasyonu, tool calling, prompt mühendisliği,
> doğal dil → JSON akışı, günlük özet, bildirim taslakları, ai_logs sistemi.
> Tüm AI kodu `src/lib/ai/` ve `src/app/api/ai*/` altında yaşar.

---

## 1. Klasör Yapısı

```
src/
├── lib/
│   └── ai/
│       ├── client.ts          # Gemini istemci başlatma (singleton)
│       ├── tools/
│       │   ├── index.ts       # Tüm tool tanımlarını export eder
│       │   ├── definitions.ts # Tool JSON şemaları (Gemini format)
│       │   └── handlers.ts    # Her tool'un gerçek implementasyonu
│       ├── prompts/
│       │   ├── system.ts      # Sistem promptu sabitleri
│       │   ├── harvest.ts     # Hasat analizi promptu
│       │   ├── summary.ts     # Günlük özet promptu
│       │   └── drafts.ts      # Bildirim/sipariş taslak promptları
│       ├── orchestrator.ts    # ReAct döngüsü — ana ajan mantığı
│       ├── context.ts         # DB'den context çekme (RAG benzeri)
│       └── logger.ts          # ai_logs tablosuna yazma
└── app/
    └── api/
        ├── harvest/
        │   └── analyze/
        │       └── route.ts   # POST /api/harvest/analyze
        └── ai/
            ├── daily-summary/
            │   └── route.ts   # POST /api/ai/daily-summary
            ├── draft-order-email/
            │   └── route.ts   # POST /api/ai/draft-order-email
            └── draft-notification/
                └── route.ts   # POST /api/ai/draft-notification
```

---

## 2. Geliştirme Sırası (5 Gün)

### Gün 3 — AI Çekirdeği (Sen Buradansın)

Proje iskeleti ve Supabase tablolar hazır olacak (Gün 1-2). Sen Gün 3'te devreye giriyorsun.

**Öncelik sırası:**

```
1. Gemini client kurulumu          → 30 dk
2. Tool tanımları (JSON şema)      → 1 saat
3. Tool handler'ları (Supabase)    → 2 saat
4. Orchestrator (ReAct döngüsü)    → 2 saat
5. /api/harvest/analyze endpoint   → 1 saat
6. ai_logs entegrasyonu            → 30 dk
```

**Gün 3 çıktısı:** "200 kg domates hazır" mesajı parse edilip görev oluşturulabiliyor.

---

### Gün 4 — Otomasyon ve Özetler

```
1. /api/ai/daily-summary           → 2 saat
2. /api/ai/draft-order-email       → 1 saat
3. /api/ai/draft-notification      → 1 saat
4. Kritik stok alarm akışı         → 1 saat
5. Context hazırlama optimizasyonu → 1 saat
```

**Gün 4 çıktısı:** Yönetici dashboard'u AI özeti gösteriyor, tedarikçi mail taslağı çıkıyor.

---

## 3. Gemini Client (client.ts)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getModel(complex = false) {
  const modelName = complex ? "gemini-1.5-pro" : "gemini-2.0-flash";
  return genAI.getGenerativeModel({ model: modelName });
}
```

**Environment variable:**
```
GEMINI_API_KEY=your_key_here
```

---

## 4. Tool Tanımları (definitions.ts)

Gemini'nin `tools` parametresine geçilen JSON şemalar.

```typescript
export const toolDefinitions = [
  {
    name: "get_stock",
    description: "Bir ürünün mevcut stok seviyesini, birimini ve son güncelleme zamanını getirir.",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "Ürün UUID'si" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "check_threshold",
    description: "Ürünün kritik eşik durumunu kontrol eder. Kritik mi, doluluk yüzdesi nedir?",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "get_sales_forecast",
    description: "Geçmiş satış verilerine göre ürünün tahmini talebini hesaplar.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        days: { type: "number", description: "Kaç günlük tahmin isteniyor" },
      },
      required: ["product_name", "days"],
    },
  },
  {
    name: "draft_order_email",
    description: "Tedarikçiye gönderilecek sipariş e-postası taslağı oluşturur.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        quantity: { type: "number" },
        unit: { type: "string" },
      },
      required: ["product_name", "quantity", "unit"],
    },
  },
  {
    name: "get_daily_orders",
    description: "Belirli bir tarihteki tüm siparişleri listeler.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD formatında tarih" },
      },
      required: ["date"],
    },
  },
  {
    name: "assign_task",
    description: "Belirtilen role yeni görev atar ve bildirim gönderir.",
    parameters: {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: ["warehouse", "manager", "producer", "customer_rep"],
        },
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        due_time: { type: "string", description: "ISO 8601 datetime" },
        related_product_id: { type: "string" },
      },
      required: ["role", "title", "priority"],
    },
  },
  {
    name: "update_stock",
    description: "Stok miktarını günceller ve inventory_logs'a kaydeder.",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string" },
        delta: { type: "number", description: "Pozitif = giriş, negatif = çıkış" },
        reason: {
          type: "string",
          enum: ["sale", "harvest", "correction", "waste"],
        },
      },
      required: ["product_id", "delta", "reason"],
    },
  },
  {
    name: "send_notification",
    description: "Kullanıcıya bildirim gönderir.",
    parameters: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        message: { type: "string" },
        channel: { type: "string", enum: ["in_app", "email", "sms"] },
      },
      required: ["user_id", "message", "channel"],
    },
  },
];
```

---

## 5. Tool Handler'ları (handlers.ts)

Her tool için Supabase'den gerçek veriyi çeken fonksiyonlar.

```typescript
import { createClient } from "@/lib/supabase/server";

export async function get_stock({ product_id }: { product_id: string }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("inventory")
    .select("current_quantity, updated_at, products(name, unit, critical_stock_level)")
    .eq("product_id", product_id)
    .single();
  return data;
}

export async function check_threshold({ product_id }: { product_id: string }) {
  const stock = await get_stock({ product_id });
  const current = stock.current_quantity;
  const critical = stock.products.critical_stock_level;
  const percentage = Math.round((current / critical) * 100);
  return {
    is_critical: current <= critical,
    fill_percentage: percentage,
    current_quantity: current,
    critical_level: critical,
    recommendation: current <= critical
      ? `Acil sipariş gerekli. Mevcut: ${current}, Eşik: ${critical}`
      : `Stok yeterli. Doluluk: %${percentage}`,
  };
}

export async function get_daily_orders({ date }: { date: string }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, products(name, unit)")
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`);
  return data;
}

export async function assign_task(params: {
  role: string;
  title: string;
  description?: string;
  priority: string;
  due_time?: string;
  related_product_id?: string;
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .insert({
      title: params.title,
      description: params.description,
      assigned_role: params.role,
      priority: params.priority,
      status: "todo",
      due_time: params.due_time,
      related_product_id: params.related_product_id,
    })
    .select()
    .single();
  return { task_id: data.id, message: "Görev oluşturuldu" };
}

export async function update_stock(params: {
  product_id: string;
  delta: number;
  reason: string;
}) {
  const supabase = createClient();
  // Mevcut stoğu al
  const { data: inv } = await supabase
    .from("inventory")
    .select("current_quantity")
    .eq("product_id", params.product_id)
    .single();

  const newQty = inv.current_quantity + params.delta;

  // Güncelle
  await supabase
    .from("inventory")
    .update({ current_quantity: newQty, updated_at: new Date().toISOString() })
    .eq("product_id", params.product_id);

  // Log yaz
  await supabase.from("inventory_logs").insert({
    product_id: params.product_id,
    delta: params.delta,
    reason: params.reason,
  });

  return { new_quantity: newQty };
}

export async function send_notification(params: {
  user_id: string;
  message: string;
  channel: string;
}) {
  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: params.user_id,
    message: params.message,
    channel: params.channel,
    is_read: false,
  });
  return { status: "sent" };
}

// Tool dispatcher — orchestrator bunu çağırır
export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
) {
  const handlers: Record<string, (args: any) => Promise<any>> = {
    get_stock,
    check_threshold,
    get_daily_orders,
    assign_task,
    update_stock,
    send_notification,
  };
  const handler = handlers[name];
  if (!handler) throw new Error(`Bilinmeyen tool: ${name}`);
  return handler(args);
}
```

---

## 6. Orchestrator — ReAct Döngüsü (orchestrator.ts)

```typescript
import { getModel } from "./client";
import { toolDefinitions } from "./tools/definitions";
import { executeToolCall } from "./tools/handlers";
import { logAI } from "./logger";

export async function runAgent(input: string, context: string) {
  const model = getModel();
  const chat = model.startChat({
    tools: [{ functionDeclarations: toolDefinitions }],
    systemInstruction: buildSystemPrompt(),
  });

  const messages = [
    { role: "user", parts: [{ text: `${context}\n\nKullanıcı: ${input}` }] },
  ];

  let finalText = "";
  const actions: unknown[] = [];

  // ReAct döngüsü — max 5 tur
  for (let i = 0; i < 5; i++) {
    const result = await chat.sendMessage(messages[messages.length - 1].parts);
    const response = result.response;

    // Tool çağrısı var mı?
    const toolCalls = response.functionCalls();
    if (!toolCalls || toolCalls.length === 0) {
      finalText = response.text();
      break;
    }

    // Tool'ları çalıştır
    const toolResults = await Promise.all(
      toolCalls.map(async (call) => {
        const result = await executeToolCall(call.name, call.args as Record<string, unknown>);
        actions.push({ tool: call.name, args: call.args, result });
        return {
          functionResponse: {
            name: call.name,
            response: result,
          },
        };
      })
    );

    messages.push({
      role: "model",
      parts: toolCalls.map((c) => ({ functionCall: c })),
    });
    messages.push({ role: "user", parts: toolResults });
  }

  // ai_logs'a kaydet
  await logAI({
    input_text: input,
    output_json: { text: finalText, actions },
    action_type: "orchestrator",
  });

  return { text: finalText, actions };
}
```

---

## 7. Sistem Promptu (prompts/system.ts)

```typescript
export function buildSystemPrompt() {
  return `Sen CoopFlow AI'sın — bir kooperatifin operasyonlarını yöneten proaktif bir iş akışı ajanısın.

GÖREVIN:
- Gelen bilgiyi anla (üretici mesajı, sistem tetikleyicisi, kullanıcı sorusu)
- İlgili tool'ları sırayla çağır, verileri topla
- Tüm bilgileri değerlendirerek en uygun aksiyonu belirle
- Sonucu Türkçe, net ve özlü biçimde açıkla

KRİTİK KURALLAR:
- Her zaman önce stok kontrolü yap, sonra karar ver
- Büyük stok değişimi (>100 kg) veya sipariş iptali için yönetici onayı gerektiğini belirt
- Tedarikçi maili ve müşteri bildirimi için taslak üret, otomatik gönderme
- Tüm kararlarını kısaca açıkla — sistem denetlenebilir olmalı

YANIT FORMATI:
- Rutin işlemler: kısa ve net
- Özet/raporlar: madde madde, önce kritik bilgi
- Onay gerektiren durumlar: aksiyonu öner, yönetici onayını bekle`;
}
```

---

## 8. Context Hazırlama (context.ts)

AI'a vermeden önce ilgili verileri DB'den çek.

```typescript
import { createClient } from "@/lib/supabase/server";

export async function buildHarvestContext(productName: string) {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const [inventory, orders] = await Promise.all([
    supabase
      .from("inventory")
      .select("current_quantity, products!inner(name, unit, critical_stock_level)")
      .ilike("products.name", `%${productName}%`),
    supabase
      .from("orders")
      .select("quantity, status, products!inner(name)")
      .ilike("products.name", `%${productName}%`)
      .in("status", ["pending", "preparing"]),
  ]);

  return `
MEVCUT BAĞLAM (${today}):
- Stok durumu: ${JSON.stringify(inventory.data)}
- Bekleyen siparişler: ${JSON.stringify(orders.data)}
`;
}

export async function buildDashboardContext() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const [inventory, tasks, orders] = await Promise.all([
    supabase
      .from("inventory")
      .select("current_quantity, products(name, unit, critical_stock_level)"),
    supabase
      .from("tasks")
      .select("*")
      .in("status", ["todo", "in_progress"]),
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", `${today}T00:00:00`),
  ]);

  return { inventory: inventory.data, tasks: tasks.data, orders: orders.data };
}
```

---

## 9. API Endpoint'leri

### POST /api/harvest/analyze

Üreticinin doğal dil mesajını parse eder → yapılandırılmış JSON döner.

```typescript
// src/app/api/harvest/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { buildHarvestContext } from "@/lib/ai/context";
import { logAI } from "@/lib/ai/logger";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const model = getModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: message }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          available_time: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["product_name", "quantity", "unit"],
      },
    },
    systemInstruction: `Kullanıcının Türkçe mesajından ürün adını, miktarı, birimi 
    ve müsait zamanı çıkar. available_time ISO 8601 formatında olsun. 
    Emin olamadıklarını null yap, confidence 0-1 arası.`,
  });

  const parsed = JSON.parse(result.response.text());

  // Şimdi orchestrator ile bağlamsal analiz yap
  const context = await buildHarvestContext(parsed.product_name);
  const { runAgent } = await import("@/lib/ai/orchestrator");
  const agentResult = await runAgent(message, context);

  await logAI({
    input_text: message,
    output_json: { parsed, agentResult },
    action_type: "harvest_analyze",
  });

  return NextResponse.json({ parsed, agentResult });
}
```

---

### POST /api/ai/daily-summary

Supabase cron tarafından 18:00'de tetiklenir.

```typescript
// src/app/api/ai/daily-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/client";
import { buildDashboardContext } from "@/lib/ai/context";
import { logAI } from "@/lib/ai/logger";

export async function POST(req: NextRequest) {
  const { date } = await req.json();
  const context = await buildDashboardContext();

  const model = getModel(true); // Özet için pro model
  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `Bugünün (${date}) operasyon özetini oluştur. Bağlam: ${JSON.stringify(context)}`,
      }],
    }],
    systemInstruction: `Kooperatif yöneticisi için kısa, eyleme dönüştürülebilir 
    günlük özet yaz. Başlıklar: Bugün Ne Oldu, Kritik Durumlar, Yarın Ne Bekleniyor. 
    Türkçe, madde madde, maksimum 200 kelime.`,
  });

  const summary = result.response.text();

  await logAI({
    input_text: `daily_summary_${date}`,
    output_json: { summary },
    action_type: "daily_summary",
  });

  return NextResponse.json({ summary });
}
```

---

### POST /api/ai/draft-order-email

```typescript
// src/app/api/ai/draft-order-email/route.ts
export async function POST(req: NextRequest) {
  const { product_name, quantity, unit } = await req.json();

  const model = getModel();
  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `${product_name} için ${quantity} ${unit} sipariş maili taslağı yaz.`,
      }],
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
          suggested_quantity: { type: "number" },
        },
      },
    },
    systemInstruction: `Profesyonel, kısa Türkçe tedarikçi sipariş maili. 
    Kooperatif adına resmi üslup. Teslimat aciliyetini belirt.`,
  });

  return NextResponse.json(JSON.parse(result.response.text()));
}
```

---

## 10. AI Logs (logger.ts)

```typescript
import { createClient } from "@/lib/supabase/server";

interface LogEntry {
  input_text: string;
  output_json: Record<string, unknown>;
  action_type: string;
  created_by?: string;
}

export async function logAI(entry: LogEntry) {
  const supabase = createClient();
  await supabase.from("ai_logs").insert({
    input_text: entry.input_text,
    output_json: entry.output_json,
    action_type: entry.action_type,
    created_by: entry.created_by ?? "system",
    created_at: new Date().toISOString(),
  });
}
```

---

## 11. Hata Yönetimi

```typescript
// Retry decorator — parse hatalarında kullan
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

// Gemini fallback
function getModelWithFallback() {
  try {
    return getModel(false); // flash
  } catch {
    return getModel(true);  // pro fallback
  }
}
```

---

## 12. Test Senaryoları (Gün 5 Demo Kontrolü)

| Senaryo | Input | Beklenen Çıktı |
|---------|-------|----------------|
| Hasat bildirimi | "Bugün 200 kg domates hazır, öğlene getirebilirim" | product: domates, qty: 200, unit: kg, time: ~11:00 |
| Kritik stok | domates < eşik | check_threshold → is_critical: true + assign_task çağrısı |
| Günlük özet | POST /api/ai/daily-summary | Yöneticiye madde madde özet metni |
| Sipariş taslağı | product: biber, qty: 50 | Hazır e-posta subject + body |
| Tool zinciri | Hasat + stok + sipariş eşleşme | 3+ tool çağrısı, tek yanıtta hepsi |

---

## 13. Öncelik Sırası (Neyi Önce Yap)

```
✅ ZORUNLU (Demo çalışması için)
  1. client.ts — Gemini bağlantısı
  2. definitions.ts — Tool şemaları (get_stock, check_threshold, assign_task)
  3. handlers.ts — Supabase sorguları
  4. orchestrator.ts — ReAct döngüsü
  5. /api/harvest/analyze — Demo'nun ana akışı buradan başlar
  6. logger.ts — ai_logs kaydı

⚡ ÖNEMLİ (Yönetici dashboard için)
  7. /api/ai/daily-summary
  8. /api/ai/draft-order-email
  9. context.ts — buildDashboardContext

🔵 BONUS (Vakit kalırsa)
  10. /api/ai/draft-notification
  11. get_sales_forecast tool
  12. Retry mekanizması
```

---

## 14. Takım Arayüzleri

AI geliştirici olarak takım arkadaşlarına şunları sağla:

### Frontend'in çağıracağı endpoint'ler:
- `POST /api/harvest/analyze` → `{ parsed, agentResult }`
- `POST /api/ai/daily-summary` → `{ summary: string }`
- `POST /api/ai/draft-order-email` → `{ subject, body }`
- `POST /api/ai/draft-notification` → `{ subject, body }`

### Backend'in sağlaması gereken Supabase tabloları:
- `inventory`, `inventory_logs`, `products`, `orders`, `tasks`, `notifications`, `ai_logs`
- Supabase Realtime: `tasks` tablosunda `INSERT` eventi

---

*Bu plan CoopFlow_AI_Proje_Dokumani.docx baz alınarak oluşturulmuştur.*
*Geliştirme süresince güncellenebilir.*
