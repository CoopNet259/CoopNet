-- Supabase Şema ve Başlangıç Verileri (Seed)
-- Bu dosyayı Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" (Çalıştır) diyerek tabloları oluşturabilirsiniz.

-- 1. PRODUCTS (Stok / Depo)
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS employees (
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
CREATE TABLE IF NOT EXISTS producers (
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
CREATE TABLE IF NOT EXISTS requests (
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
CREATE TABLE IF NOT EXISTS ai_logs (
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
