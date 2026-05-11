-- Supabase Şema ve Başlangıç Verileri (Seed)
-- Bu dosyayı Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" (Çalıştır) diyerek tabloları oluşturabilirsiniz.

-- 1. PRODUCTS (Stok / Depo)
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  emoji TEXT,
  ad TEXT,
  mevcut_kg INTEGER,
  kapasite_kg INTEGER,
  kategori TEXT,
  son_guncelleme TEXT
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);

INSERT INTO products (id, emoji, ad, mevcut_kg, kapasite_kg, kategori, son_guncelleme) VALUES
(1, '🍅', 'Domates', 80, 500, 'Sebze', 'Bugün 08:30'),
(2, '🫑', 'Biber', 55, 300, 'Sebze', 'Bugün 09:00'),
(3, '🍑', 'Kayısı', 18, 200, 'Meyve', 'Dün 17:00'),
(4, '🟣', 'İncir', 12, 150, 'Meyve', 'Dün 16:00'),
(5, '🥒', 'Salatalık', 210, 400, 'Sebze', 'Bugün 07:45'),
(6, '🍆', 'Patlıcan', 95, 250, 'Sebze', 'Bugün 09:15'),
(7, '🧅', 'Soğan', 320, 600, 'Sebze', 'Dün 18:00'),
(8, '🥕', 'Havuç', 45, 300, 'Sebze', 'Bugün 08:00'),
(9, '🍇', 'Üzüm', 22, 200, 'Meyve', 'Dün 15:00'),
(10, '🌽', 'Mısır', 160, 350, 'Tahıl', 'Bugün 08:50')
ON CONFLICT (id) DO NOTHING;

-- 2. EMPLOYEES (Çalışanlar)
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  ad TEXT,
  rol TEXT,
  musait BOOLEAN,
  vardiya TEXT,
  gorev TEXT
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON employees FOR SELECT USING (true);

INSERT INTO employees (id, ad, rol, musait, vardiya, gorev) VALUES
(1, 'Fatma Kaya', 'Depo Sorumlusu', true, '08:00–16:00', 'Domates bölümü kontrolü'),
(2, 'Emine Çelik', 'Stok Takip', true, '08:00–16:00', 'Giriş sayımı'),
(3, 'Hatice Arslan', 'Taşıma Operatörü', true, '09:00–17:00', 'Müsait'),
(4, 'Zeynep Öztürk', 'Depo Asistanı', false, 'İzinli', NULL),
(5, 'Ayşe Şahin', 'Kalite Kontrol', false, '16:00–24:00', NULL)
ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCERS (Üreticiler)
DROP TABLE IF EXISTS producers CASCADE;
CREATE TABLE producers (
  id SERIAL PRIMARY KEY,
  ad TEXT,
  lokasyon TEXT,
  urunler JSONB,
  kapasite TEXT,
  karsilama TEXT,
  puan TEXT,
  avatar TEXT,
  ihtiyac TEXT,
  type TEXT -- 'talep', 'genel', 'kardes'
);
ALTER TABLE producers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON producers FOR SELECT USING (true);

INSERT INTO producers (id, ad, lokasyon, urunler, kapasite, karsilama, puan, avatar, ihtiyac, type) VALUES
(1, 'Ahmet Yılmaz', 'Çukurova, Adana', '["Domates", "Biber"]', '500 kg / Gün', '%85', NULL, 'AY', NULL, 'talep'),
(2, 'Fatma Şahin', 'Mut, Mersin', '["Kayısı", "Erik"]', '300 kg / Gün', '%92', NULL, 'FŞ', NULL, 'talep'),
(3, 'Mehmet Demir', 'Silifke, Mersin', '["Çilek", "Limon"]', '150 kg / Gün', NULL, '4.8', 'MD', NULL, 'genel'),
(4, 'Ayşe Kaya', 'Tarsus, Adana', '["Salatalık", "Patlıcan"]', '250 kg / Gün', NULL, '4.5', 'AK', NULL, 'genel'),
(5, 'Hasan Öztürk', 'Erdemli, Mersin', '["Muz", "Domates"]', '400 kg / Gün', NULL, '4.9', 'HÖ', NULL, 'genel'),
(6, 'Zeynep Çelik', 'Yüreğir, Adana', '["Soğan", "Patates"]', '600 kg / Gün', NULL, '4.6', 'ZÇ', NULL, 'genel'),
(7, 'Bereket Salça Atölyesi', 'Kozan, Adana', NULL, '2 Ton / Hafta', NULL, NULL, 'BS', 'Salçalık Domates & Biber', 'kardes'),
(8, 'Tatlıcı Şirin Koop.', 'Mezitli, Mersin', NULL, '500 kg / Hafta', NULL, NULL, 'TŞ', 'Reçellik Kayısı & İncir', 'kardes')
ON CONFLICT (id) DO NOTHING;

-- 4. REQUESTS (Talepler)
DROP TABLE IF EXISTS requests CASCADE;
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  musteri TEXT,
  urun TEXT,
  miktar TEXT,
  saat TEXT,
  durum TEXT
);
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON requests FOR SELECT USING (true);

INSERT INTO requests (id, musteri, urun, miktar, saat, durum) VALUES
(1, 'Migros Market', 'Domates', '200 kg', '09:00', 'bekliyor'),
(2, 'Tarım Kooperatifi', 'Biber', '80 kg', '11:30', 'onaylandi'),
(3, 'Organik Pazar', 'Patlıcan', '60 kg', '14:00', 'bekliyor')
ON CONFLICT (id) DO NOTHING;

-- 5. AI LOGS
DROP TABLE IF EXISTS ai_logs CASCADE;
CREATE TABLE ai_logs (
  id SERIAL PRIMARY KEY,
  zaman TEXT,
  tarih TEXT,
  tip TEXT,
  baslik TEXT,
  mesaj TEXT,
  renk TEXT,
  detay_ne TEXT,
  detay_neden TEXT,
  detay_veri TEXT,
  detay_etki TEXT,
  kategori TEXT
);
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON ai_logs FOR SELECT USING (true);

INSERT INTO ai_logs (id, zaman, tarih, tip, baslik, mesaj, renk, detay_ne, detay_neden, detay_veri, detay_etki, kategori) VALUES
(1, '09:14', '10 Mayıs 2026', 'Anomali', 'Domates Stoku Uyarısı', 'Domates stoku kritik seviyenin altına düştü. Acil sipariş önerisi gönderildi.', 'red', NULL, NULL, NULL, NULL, 'Depo'),
(2, '08:55', '10 Mayıs 2026', 'Tahmin', 'Talep Tahmini', 'Bu hafta biber talebi %18 artış bekleniyor. Üreticilere bildirim yapıldı.', 'gold', NULL, NULL, NULL, NULL, 'Trend'),
(3, '08:30', '10 Mayıs 2026', 'Rapor', 'Günlük Özet', 'Dün gerçekleşen 14 sipariş için günlük özet raporu oluşturuldu.', 'green', NULL, NULL, NULL, NULL, 'Raporlama'),
(4, '07:45', '10 Mayıs 2026', 'Otomasyon', 'Otomatik Yanıt', 'Organik Pazar talebine otomatik yanıt taslağı hazırlandı.', 'blue', NULL, NULL, NULL, NULL, 'İletişim')
ON CONFLICT (id) DO NOTHING;

-- 6. COOPERATIVES (Kooperatif Bilgileri)
DROP TABLE IF EXISTS cooperatives CASCADE;
CREATE TABLE cooperatives (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT
);
ALTER TABLE cooperatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON cooperatives FOR SELECT USING (true);

INSERT INTO cooperatives (id, name, description) VALUES
(1, 'Üreten Kadınlar Kooperatif', 'Yönetim Paneli')
ON CONFLICT (id) DO NOTHING;

-- 7. DASHBOARD STATS (Dünün Özeti vb.)
DROP TABLE IF EXISTS dashboard_stats CASCADE;
CREATE TABLE dashboard_stats (
  id SERIAL PRIMARY KEY,
  label TEXT,
  value TEXT,
  icon TEXT,
  renk TEXT
);
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON dashboard_stats FOR SELECT USING (true);

INSERT INTO dashboard_stats (id, label, value, icon, renk) VALUES
(1, 'Toplam Sipariş', '14', '📦', 'green'),
(2, 'Teslim Edilen', '11', '✅', 'green'),
(3, 'Bekleyen', '3', '⏳', 'gold'),
(4, 'Toplam Gelir', '₺24.600', '💰', 'green'),
(5, 'Yeni Üretici', '2', '👤', 'blue'),
(6, 'Anomali Tespiti', '1', '⚠️', 'red')
ON CONFLICT (id) DO NOTHING;

-- 8. TASKS (Bugün Yapılacaklar)
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  is_name TEXT,
  durum BOOLEAN,
  oncelik TEXT
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON tasks FOR SELECT USING (true);

INSERT INTO tasks (id, is_name, durum, oncelik) VALUES
(1, 'Migros siparişi için domates temini', false, 'yuksek'),
(2, 'Depo stok sayımı yapılacak', false, 'orta'),
(3, 'Ayşe Demir ile fiyat görüşmesi', true, 'orta'),
(4, 'Q2 finansal raporu tamamlanacak', false, 'yuksek'),
(5, 'Organik Pazar sözleşmesi imzalanacak', false, 'dusuk')
ON CONFLICT (id) DO NOTHING;

-- 9. AI REPORTS (AI Analiz Özeti)
DROP TABLE IF EXISTS ai_reports CASCADE;
CREATE TABLE ai_reports (
  id SERIAL PRIMARY KEY,
  baslik TEXT,
  maddeler JSONB
);
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON ai_reports FOR SELECT USING (true);

INSERT INTO ai_reports (id, baslik, maddeler) VALUES
(1, 'AI Günlük Analiz Özeti — 10 Mayıs 2026', '["Depoda 3 ürün kritik stok seviyesinin altında. Öncelikli sipariş gerekiyor.", "Bugünkü 3 talep toplamda ₺8.200 değerinde. Tamamı zamanında karşılanabilir.", "Fatma Kaya bu ay en yüksek performanslı üretici olarak öne çıkıyor.", "Pazar eğilimi: Domates fiyatları bu haftadan itibaren %7 artış gösterebilir."]')
ON CONFLICT (id) DO NOTHING;

-- 10. STK ALERTS (STK İsraf Önleme)
DROP TABLE IF EXISTS stk_alerts CASCADE;
CREATE TABLE stk_alerts (
  id SERIAL PRIMARY KEY,
  urun TEXT,
  emoji TEXT,
  kalan_gun_mesaj TEXT,
  miktar TEXT,
  islem TEXT,
  kardesler JSONB
);
ALTER TABLE stk_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON stk_alerts FOR SELECT USING (true);

INSERT INTO stk_alerts (id, urun, emoji, kalan_gun_mesaj, miktar, islem, kardesler) VALUES
(1, 'Domates', '🍅', '3 Gün Kaldı', '120 kg', 'Salça Üretimi', '[{"ad": "Bereket Salça Atölyesi", "avatar": "BS", "tip": "Kardeş Üretici"}]'),
(2, 'İncir', '🟣', '2 Gün Kaldı', '45 kg', 'Reçel Üretimi', '[{"ad": "Tatlıcı Şirin Kooperatifi", "avatar": "TŞ", "tip": "Kardeş Üretici"}]')
ON CONFLICT (id) DO NOTHING;

-- 11. FINANCIAL STATS (Finansal Haftalık Rapor)
DROP TABLE IF EXISTS financial_stats CASCADE;
CREATE TABLE financial_stats (
  id SERIAL PRIMARY KEY,
  baslik TEXT,
  deger TEXT,
  trend TEXT,
  yon TEXT,
  icon TEXT
);
ALTER TABLE financial_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON financial_stats FOR SELECT USING (true);

INSERT INTO financial_stats (id, baslik, deger, trend, yon, icon) VALUES
(1, 'Toplam Gelir', '₺145,200', '+%12', 'up', 'dollar'),
(2, 'Operasyonel Gider', '₺42,800', '-%4', 'down', 'pieChart'),
(3, 'Kardeş Üretici İşlem Hacmi', '₺18,500', '+%35', 'up', 'users'),
(4, 'İsraf Önleme Tasarrufu', '₺9,400', '+%8', 'up', 'zap')
ON CONFLICT (id) DO NOTHING;
