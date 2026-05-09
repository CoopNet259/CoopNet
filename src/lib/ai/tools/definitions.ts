import type { Tool } from "@google/generative-ai";

// Gemini'ye tanıttığımız fonksiyonların listesi.
// AI bu şemaya bakarak hangi fonksiyonu, hangi parametreyle çağıracağına karar verir.
export const toolDefinitions: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "get_stock",
        description:
          "Bir ürünün mevcut stok miktarını, birimini ve son güncelleme zamanını getirir. Stok hakkında soru sorulduğunda bu tool kullanılır.",
        parameters: {
          type: "object" as const,
          properties: {
            product_name: {
              type: "string",
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
          type: "object" as const,
          properties: {
            product_name: {
              type: "string",
              description: "Kontrol edilecek ürünün adı",
            },
          },
          required: ["product_name"],
        },
      },
    ],
  },
];
