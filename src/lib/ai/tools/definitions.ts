import { SchemaType, type Tool } from "@google/generative-ai";

export const toolDefinitions: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "get_stock",
        description:
          "Bir ürünün mevcut stok miktarını, birimini ve son güncelleme zamanını getirir. Stok hakkında soru sorulduğunda bu tool kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            product_name: {
              type: SchemaType.STRING,
              description: "Ürünün adı (örn: domates, biber, elma)",
            },
          },
          required: ["product_name"],
        },
      },
      {
        name: "check_threshold",
        description:
          "Bir ürünün kritik stok eşiğini kontrol eder. Ürün kritik seviyede mi, doluluk yüzdesi nedir, ne yapılmalı? Stok uyarısı veya karar gerektiğinde kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            product_name: {
              type: SchemaType.STRING,
              description: "Kontrol edilecek ürünün adı",
            },
          },
          required: ["product_name"],
        },
      },
      {
        name: "get_daily_orders",
        description:
          "Belirli bir tarihteki siparişleri listeler. Günün siparişleri, bekleyen siparişler veya sipariş durumu sorulduğunda kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            date: {
              type: SchemaType.STRING,
              description: "YYYY-MM-DD formatında tarih. Bugün için bugünün tarihi.",
            },
          },
          required: ["date"],
        },
      },
      {
        name: "assign_task",
        description:
          "Belirtilen role yeni bir görev atar. Depo teslim alma, stok sayımı gibi operasyonel görevler oluşturulacağında kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            role: {
              type: SchemaType.STRING,
              description: "Görevi atanacak rol: warehouse, manager, producer, customer_rep",
            },
            title: {
              type: SchemaType.STRING,
              description: "Görevin başlığı",
            },
            description: {
              type: SchemaType.STRING,
              description: "Görevin detayı",
            },
            priority: {
              type: SchemaType.STRING,
              description: "Öncelik seviyesi: high, medium, low",
            },
            product_name: {
              type: SchemaType.STRING,
              description: "İlgili ürün adı (varsa)",
            },
          },
          required: ["role", "title", "priority"],
        },
      },
      {
        name: "update_stock",
        description:
          "Bir ürünün stok miktarını günceller. Hasat teslimi, satış, fire gibi durumlarda stok değişince kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            product_name: {
              type: SchemaType.STRING,
              description: "Güncellenecek ürünün adı",
            },
            delta: {
              type: SchemaType.NUMBER,
              description: "Miktar değişimi. Pozitif = giriş (hasat geldi), negatif = çıkış (satış)",
            },
            reason: {
              type: SchemaType.STRING,
              description: "Değişim sebebi: harvest (hasat), sale (satış), correction (düzeltme), waste (fire)",
            },
          },
          required: ["product_name", "delta", "reason"],
        },
      },
      {
        name: "get_sales_forecast",
        description:
          "Geçmiş siparişlere bakarak bir ürünün önümüzdeki günlerdeki tahmini talebini hesaplar. Sipariş planlaması veya stok kararı alınırken kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            product_name: {
              type: SchemaType.STRING,
              description: "Tahmin yapılacak ürünün adı",
            },
            days: {
              type: SchemaType.NUMBER,
              description: "Kaç günlük tahmin isteniyor (örn: 7, 14, 30)",
            },
          },
          required: ["product_name", "days"],
        },
      },
      {
        name: "send_notification",
        description:
          "Bir kullanıcıya veya role bildirim gönderir. Kritik uyarı, görev bildirimi veya onay gereken durumlarda kullanılır.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            role: {
              type: SchemaType.STRING,
              description: "Bildirim gönderilecek rol: warehouse, manager, producer, customer_rep",
            },
            title: {
              type: SchemaType.STRING,
              description: "Bildirim başlığı",
            },
            message: {
              type: SchemaType.STRING,
              description: "Bildirim mesajı",
            },
            type: {
              type: SchemaType.STRING,
              description: "Bildirim tipi: info, warning, error",
            },
          },
          required: ["role", "title", "message"],
        },
      },
    ],
  },
];
