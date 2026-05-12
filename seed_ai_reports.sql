-- AI Raporları — 4–11 Mayıs 2026 (her gün için ayrı rapor)
-- Supabase SQL Editor'da çalıştırın

-- Sequence'i mevcut en yüksek id'ye getir (explicit insert sonrası kayması önlenir)
SELECT setval('ai_reports_id_seq', (SELECT MAX(id) FROM ai_reports));

INSERT INTO ai_reports (baslik, maddeler) VALUES

('AI Günlük Analiz Özeti — 4 Mayıs 2026',
'["Haftaya güçlü başlangıç: 5 sipariş tamamlandı, günlük gelir ₺7.380.",
  "Depo doluluk oranı %87 — 10 üründe stok hazır, haftalık teslimat takvimi onaylandı.",
  "Domates (350 kg) ve Soğan (500 kg) en yüksek stok düzeyinde, haftanın yoğun taleplerine hazır.",
  "Öneri: Kayısı ve İncir stoğu 9 günde tükenebilir. Ayşe Demir ve Hatice Yılmaz ile hafta içi sipariş görüşmesi planlanmalı."]'),

('AI Günlük Analiz Özeti — 5 Mayıs 2026',
'["Fatma Yıldız''dan 80 kg domates + 60 kg biber teslim alındı. Toplam tedarik maliyeti ₺2.840.",
  "5 sipariş tamamlandı, günlük gelir ₺8.043 — haftanın en iyi başlangıcı.",
  "Biber stoğu teslimatla birlikte 218 kg''a yükseldi; haftalık talepleri karşılamaya yeterli.",
  "İncir günlük satış hızı 13 kg — mevcut 75 kg stok yaklaşık 6 gün yetecek. Hatice Yılmaz''a bildirim gönderildi."]'),

('AI Günlük Analiz Özeti — 6 Mayıs 2026',
'["4 sipariş tamamlandı, günlük gelir ₺7.175 — çarşamba ortalamasının üzerinde.",
  "Üzüm ve Mısır bu gün en çok satan ürünler arasında girdi.",
  "Kayısı stoku 95 kg''a indi. Mevcut satış hızında 6 gün kala.",
  "Öneri: Patlıcan ve salatalık talebi artıyor. Zeynep Kaya''nın perşembe teslimatı kritik önem taşıyor."]'),

('AI Günlük Analiz Özeti — 7 Mayıs 2026',
'["Zeynep Kaya''dan 80 kg salatalık + 50 kg patlıcan teslim alındı. Salatalık stoğu 338 kg''a yükseldi.",
  "5 sipariş tamamlandı, günlük gelir ₺8.043.",
  "Havuç stoku 113 kg''a düştü — beklenen günlük çıkış 28 kg ile yaklaşık 4 gün kala. Emine Çetin''e erken teslimat talebi iletildi.",
  "Hafta sonu için Kayısı ve İncir talebinde artış bekleniyor. Pazar satışlarına hazırlık yapılmalı."]'),

('AI Günlük Analiz Özeti — 8 Mayıs 2026',
'["Emine Çetin''den 120 kg soğan + 80 kg havuç teslim alındı. Havuç stoğu 167 kg''a çıktı.",
  "Bereket Salça Atölyesi''ne 50 kg domates + 30 kg biber transfer edildi (₺1.960) — israf önlendi.",
  "5 sipariş + 1 kardeş koop transferiyle günlük gelir ₺9.340 — haftanın rekoru.",
  "Haftalık kapanış özeti: Toplam gelir ₺39.981, tüm teslimatlar zamanında, israf sıfır. Domates ve Biber en çok satan ürünler."]'),

('AI Günlük Analiz Özeti — 9 Mayıs 2026',
'["Hatice Yılmaz''dan 30 kg incir + 50 kg üzüm teslim alındı. Üzüm stoğu 71 kg''a yükseldi.",
  "Cumartesi pazar satışları ₺8.029 — Kayısı ve Üzüm hafta sonu favorileri.",
  "Domates stoku 135 kg''a geriledi. Gülay Arslan''a pazartesi teslimatı için hatırlatma yapıldı.",
  "Öneri: İncir stoku 54 kg — günlük ~12 kg satış hızında yaklaşık 4-5 gün yetecek. Tatlıcı Şirin Koop. ile önceden transfer görüşmesi başlatılabilir."]'),

('AI Günlük Analiz Özeti — 10 Mayıs 2026',
'["Karadeniz Koop''a 40 kg soğan + 30 kg havuç transfer edildi (₺930) — bölgesel stok optimizasyonu.",
  "Pazar günü 3 sipariş tamamlandı, gelir ₺6.652.",
  "Kayısı stoku 29 kg''a geriledi — kritik eşik yaklaşıyor. Yarın Ayşe Demir teslimatı bekleniyor.",
  "Havuç günlük çıkışı 48 kg (satış + transfer) ile rekor düzeyde. Pazartesi yeni tedarik değerlendirilmeli."]'),

('AI Günlük Analiz Özeti — 11 Mayıs 2026',
'["Ayşe Demir''den 30 kg kayısı, Gülay Arslan''dan 70 kg mısır + 50 kg domates teslim alındı (₺3.280).",
  "Tatlıcı Şirin Koop.''a 20 kg kayısı + 15 kg incir transfer edildi (₺2.690) — reçel sezonu işbirliği.",
  "5 sipariş tamamlandı; günlük gelir ₺10.215 — 9 günün rekoru.",
  "Domates stoku 115 kg, günlük ~40 kg satışla 2-3 gün yetecek. Yeni tedarik planlanmalı.",
  "İncir stoku 18 kg''a indi — yarın için acil durum protokolü başlatıldı."]');
