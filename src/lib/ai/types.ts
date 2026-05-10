// Chat geçmişindeki tek mesaj — frontend bu formatı gönderir, backend Gemini'ye dönüştürür
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

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
  recommendation: string;     // AI'ın Türkçe önerisi
  actions: string[];          // Önerilen aksiyonlar (metin)
  executed_actions: string[]; // Otomatik olarak gerçekleştirilen aksiyonlar
  auto_executed: boolean;     // confidence >= 0.7 ise true — aksiyon alındı
  confidence_label: "Yüksek" | "Orta" | "Düşük"; // Frontend'e gösterilecek etiket
  confidence_warning: string | null; // Düşük confidence'da uyarı, yoksa null
}

export interface DemandAnomaly {
  product_name: string;
  previous_week_orders: number;
  current_week_orders: number;
  change_ratio: number;
  is_anomaly: boolean;
}

export interface DelayedSpike {
  date: string;
  delayed_ratio_today: number;
  delayed_ratio_7d_average: number;
  multiplier: number;
  is_anomaly: boolean;
}

export interface StockDepletionAnomaly {
  product_name: string;
  previous_7d_consumption: number;
  recent_7d_consumption: number;
  acceleration_ratio: number;
  is_anomaly: boolean;
}

export interface ProducerSilence {
  producer: string;
  last_report_at: string;
  silent_days: number;
  is_anomaly: boolean;
}

export interface DailyAnomalyInsights {
  date: string;
  demand_anomalies: DemandAnomaly[];
  delayed_spike: DelayedSpike;
  stock_depletion_anomalies: StockDepletionAnomaly[];
  producer_silence: ProducerSilence[];
}
