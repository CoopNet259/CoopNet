// Üretici mesajından çıkarılan yapılandırılmış veri
export interface ParsedHarvest {
  product_name: string;
  quantity: number;
  unit: string;
  available_time: string | null; // "11:00" gibi, yoksa null
  confidence: number;            // 0-1 arası, AI ne kadar emin?
}

// Hasat analizinin sonucu — parse + stok değerlendirmesi
export interface HarvestAnalysisResult {
  parsed: ParsedHarvest;
  stock_status: {
    current_quantity: number;
    unit: string;
    is_critical: boolean;
    fill_percentage: number;
  };
  recommendation: string; // AI'ın Türkçe önerisi
  actions: string[];      // ["Depo görevi oluştur", "Yöneticiye bildir", ...]
}
