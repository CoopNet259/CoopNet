-- ============================================================
-- CoopNet Tarihsel Veri Seed — 4–12 Mayıs 2026
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ============================================================
-- 1. MEVCUT TABLOLARA KOLON EKLE
-- ============================================================

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS tarih TEXT,
  ADD COLUMN IF NOT EXISTS birim_fiyat NUMERIC,
  ADD COLUMN IF NOT EXISTS toplam_tutar NUMERIC;

ALTER TABLE producers
  ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- ============================================================
-- 2. YENİ TABLOLAR
-- ============================================================

DROP TABLE IF EXISTS stock_movements CASCADE;
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  tarih TEXT NOT NULL,
  urun_id INTEGER REFERENCES products(id),
  urun_adi TEXT,
  giris_kg NUMERIC DEFAULT 0,
  cikis_satis_kg NUMERIC DEFAULT 0,
  cikis_transfer_kg NUMERIC DEFAULT 0,
  aciklama TEXT
);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read stock_movements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert stock_movements" ON stock_movements FOR INSERT WITH CHECK (true);

DROP TABLE IF EXISTS daily_sales CASCADE;
CREATE TABLE daily_sales (
  id SERIAL PRIMARY KEY,
  tarih TEXT NOT NULL,
  toplam_satis_kg NUMERIC,
  toplam_gelir NUMERIC,
  siparis_sayisi INTEGER,
  en_cok_satan_urun TEXT,
  notlar TEXT
);
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read daily_sales" ON daily_sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert daily_sales" ON daily_sales FOR INSERT WITH CHECK (true);

DROP TABLE IF EXISTS producer_supplies CASCADE;
CREATE TABLE producer_supplies (
  id SERIAL PRIMARY KEY,
  tarih TEXT NOT NULL,
  uretici_id INTEGER REFERENCES producers(id),
  uretici_adi TEXT,
  urun_adi TEXT,
  miktar_kg NUMERIC,
  birim_fiyat NUMERIC,
  toplam_tutar NUMERIC,
  durum TEXT DEFAULT 'teslim_alindi'
);
ALTER TABLE producer_supplies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read producer_supplies" ON producer_supplies FOR SELECT USING (true);
CREATE POLICY "Allow public insert producer_supplies" ON producer_supplies FOR INSERT WITH CHECK (true);

DROP TABLE IF EXISTS cooperative_transfers CASCADE;
CREATE TABLE cooperative_transfers (
  id SERIAL PRIMARY KEY,
  tarih TEXT NOT NULL,
  kardes_koop_adi TEXT,
  urun_adi TEXT,
  miktar_kg NUMERIC,
  birim_fiyat NUMERIC,
  toplam_tutar NUMERIC,
  amac TEXT
);
ALTER TABLE cooperative_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read cooperative_transfers" ON cooperative_transfers FOR SELECT USING (true);
CREATE POLICY "Allow public insert cooperative_transfers" ON cooperative_transfers FOR INSERT WITH CHECK (true);

DROP TABLE IF EXISTS financial_movements CASCADE;
CREATE TABLE financial_movements (
  id SERIAL PRIMARY KEY,
  tarih TEXT NOT NULL,
  gelir NUMERIC,
  uretici_odemesi NUMERIC,
  operasyonel_gider NUMERIC,
  net NUMERIC,
  aciklama TEXT
);
ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read financial_movements" ON financial_movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert financial_movements" ON financial_movements FOR INSERT WITH CHECK (true);

-- ============================================================
-- 3. ÜRETİCİLER — 8 kadın üretici + 4 kardeş kooperatif
-- ============================================================

TRUNCATE producers RESTART IDENTITY CASCADE;

INSERT INTO producers (id, ad, lokasyon, urunler, kapasite, karsilama, puan, avatar, ihtiyac, type, aktif) VALUES
(1,  'Fatma Yıldız',          'Mut, Mersin',         '["Domates", "Biber"]',        '500 kg / Gün', '%88', '4.9', 'FY', NULL, 'genel', true),
(2,  'Ayşe Demir',            'Battalgazi, Malatya',  '["Kayısı"]',                  '300 kg / Gün', '%94', '4.8', 'AD', NULL, 'genel', true),
(3,  'Hatice Yılmaz',         'Koçarlı, Aydın',      '["İncir", "Üzüm"]',           '250 kg / Gün', '%91', '4.7', 'HY', NULL, 'genel', true),
(4,  'Zeynep Kaya',           'Kemer, Antalya',       '["Salatalık", "Patlıcan"]',   '400 kg / Gün', '%86', '4.6', 'ZK', NULL, 'genel', true),
(5,  'Emine Çetin',           'Karatay, Konya',       '["Soğan", "Havuç"]',          '600 kg / Gün', '%90', '4.8', 'EÇ', NULL, 'genel', true),
(6,  'Gülay Arslan',          'Seyhan, Adana',        '["Mısır", "Domates"]',        '450 kg / Gün', '%83', '4.5', 'GA', NULL, 'genel', true),
(7,  'Halime Şahin',          'Buldan, Denizli',      '["Üzüm"]',                    '200 kg / Gün', '%70', '4.4', 'HŞ', NULL, 'genel', false),
(8,  'Nurcan Polat',          'Bornova, İzmir',       '["Biber", "Patlıcan"]',       '180 kg / Gün', '%65', '4.3', 'NP', NULL, 'genel', false),
(9,  'Bereket Salça Atölyesi','Kozan, Adana',         NULL,                          '2 Ton / Hafta', NULL,  NULL,  'BS', 'Salçalık Domates & Biber',     'kardes', true),
(10, 'Tatlıcı Şirin Koop.',   'Mezitli, Mersin',      NULL,                          '500 kg / Hafta',NULL,  NULL,  'TŞ', 'Reçellik Kayısı & İncir',      'kardes', true),
(11, 'Karadeniz Koop',        'Ortahisar, Trabzon',   NULL,                          '1 Ton / Hafta', NULL,  NULL,  'KK', 'Taze Sebze (Soğan, Havuç)',    'kardes', true),
(12, 'Ege Bereket Koop',      'Bornova, İzmir',       NULL,                          '800 kg / Hafta',NULL,  NULL,  'EB', 'Salatalık, Patlıcan, Biber',   'kardes', true);

SELECT setval('producers_id_seq', 12);

-- ============================================================
-- 4. REQUESTS — 40 sipariş, 4–12 Mayıs
-- ============================================================

TRUNCATE requests RESTART IDENTITY CASCADE;

INSERT INTO requests (id, musteri, urun, miktar, saat, durum, tarih, birim_fiyat, toplam_tutar) VALUES
-- 4 Mayıs Pazartesi
(1,  'Migros Market',            'Domates',   '40 kg',  '09:00', 'tamamlandi', '2026-05-04', 24,  960),
(2,  'Organik Pazar',            'Kayısı',    '15 kg',  '10:30', 'tamamlandi', '2026-05-04', 72,  1080),
(3,  'BİM Market',               'Soğan',     '30 kg',  '11:00', 'tamamlandi', '2026-05-04', 14,  420),
(4,  'Taze Dükkan',              'Üzüm',      '20 kg',  '14:00', 'tamamlandi', '2026-05-04', 60,  1200),
(5,  'Lezzet Lokantası',         'İncir',     '12 kg',  '15:00', 'tamamlandi', '2026-05-04', 115, 1380),
-- 5 Mayıs Salı
(6,  'Migros Market',            'Biber',     '22 kg',  '09:30', 'tamamlandi', '2026-05-05', 38,  836),
(7,  'A101 Market',              'Domates',   '45 kg',  '10:00', 'tamamlandi', '2026-05-05', 24,  1080),
(8,  'Belediye Sosyal Market',   'Havuç',     '28 kg',  '11:30', 'tamamlandi', '2026-05-05', 18,  504),
(9,  'Organik Pazar',            'İncir',     '13 kg',  '13:00', 'tamamlandi', '2026-05-05', 115, 1495),
(10, 'Yeşil Sofralar',           'Kayısı',    '16 kg',  '14:30', 'tamamlandi', '2026-05-05', 72,  1152),
-- 6 Mayıs Çarşamba
(11, 'Migros Market',            'Salatalık', '22 kg',  '08:45', 'tamamlandi', '2026-05-06', 14,  308),
(12, 'BİM Market',               'Mısır',     '22 kg',  '10:00', 'tamamlandi', '2026-05-06', 20,  440),
(13, 'Kooperatif Kantini',       'Patlıcan',  '13 kg',  '11:00', 'tamamlandi', '2026-05-06', 28,  364),
(14, 'Taze Dükkan',              'Üzüm',      '20 kg',  '15:00', 'tamamlandi', '2026-05-06', 60,  1200),
-- 7 Mayıs Perşembe
(15, 'Migros Market',            'Domates',   '45 kg',  '09:00', 'tamamlandi', '2026-05-07', 24,  1080),
(16, 'A101 Market',              'Biber',     '22 kg',  '10:30', 'tamamlandi', '2026-05-07', 38,  836),
(17, 'Organik Pazar',            'Kayısı',    '16 kg',  '11:00', 'tamamlandi', '2026-05-07', 72,  1152),
(18, 'Belediye Sosyal Market',   'Soğan',     '32 kg',  '13:00', 'tamamlandi', '2026-05-07', 14,  448),
(19, 'Lezzet Lokantası',         'İncir',     '13 kg',  '14:00', 'tamamlandi', '2026-05-07', 115, 1495),
-- 8 Mayıs Cuma
(20, 'Migros Market',            'Salatalık', '22 kg',  '08:30', 'tamamlandi', '2026-05-08', 14,  308),
(21, 'BİM Market',               'Havuç',     '26 kg',  '10:00', 'tamamlandi', '2026-05-08', 18,  468),
(22, 'Bereket Salça Atölyesi',   'Domates',   '50 kg',  '11:00', 'tamamlandi', '2026-05-08', 20,  1000),
(23, 'Bereket Salça Atölyesi',   'Biber',     '30 kg',  '11:30', 'tamamlandi', '2026-05-08', 32,  960),
(24, 'Yeşil Sofralar',           'Üzüm',      '20 kg',  '16:00', 'tamamlandi', '2026-05-08', 60,  1200),
-- 9 Mayıs Cumartesi
(25, 'Esnaf Pazarı',             'Domates',   '35 kg',  '09:00', 'tamamlandi', '2026-05-09', 24,  840),
(26, 'Esnaf Pazarı',             'Biber',     '18 kg',  '09:30', 'tamamlandi', '2026-05-09', 38,  684),
(27, 'Organik Pazar',            'Kayısı',    '20 kg',  '11:00', 'tamamlandi', '2026-05-09', 72,  1440),
(28, 'Taze Dükkan',              'Üzüm',      '25 kg',  '14:00', 'tamamlandi', '2026-05-09', 60,  1500),
-- 10 Mayıs Pazar
(29, 'Karadeniz Koop',           'Soğan',     '40 kg',  '10:00', 'tamamlandi', '2026-05-10', 12,  480),
(30, 'Karadeniz Koop',           'Havuç',     '30 kg',  '10:30', 'tamamlandi', '2026-05-10', 15,  450),
(31, 'Kooperatif Kantini',       'Mısır',     '14 kg',  '12:00', 'tamamlandi', '2026-05-10', 20,  280),
-- 11 Mayıs Pazartesi
(32, 'Migros Market',            'Domates',   '45 kg',  '09:00', 'tamamlandi', '2026-05-11', 24,  1080),
(33, 'A101 Market',              'Biber',     '22 kg',  '10:00', 'tamamlandi', '2026-05-11', 38,  836),
(34, 'Tatlıcı Şirin Koop.',      'Kayısı',    '20 kg',  '11:00', 'tamamlandi', '2026-05-11', 61,  1220),
(35, 'Tatlıcı Şirin Koop.',      'İncir',     '15 kg',  '11:30', 'tamamlandi', '2026-05-11', 98,  1470),
(36, 'Belediye Sosyal Market',   'Soğan',     '32 kg',  '14:00', 'tamamlandi', '2026-05-11', 14,  448),
-- 12 Mayıs Salı (bugün)
(37, 'Migros Market',            'Domates',   '35 kg',  '09:00', 'tamamlandi', '2026-05-12', 24,  840),
(38, 'Ege Bereket Koop',         'Salatalık', '30 kg',  '10:30', 'bekliyor',   '2026-05-12', 12,  360),
(39, 'Ege Bereket Koop',         'Patlıcan',  '20 kg',  '11:00', 'bekliyor',   '2026-05-12', 24,  480),
(40, 'Organik Pazar',            'Kayısı',    '9 kg',   '13:00', 'bekliyor',   '2026-05-12', 72,  648);

SELECT setval('requests_id_seq', 40);

-- ============================================================
-- 5. ÜRETİCİ TEDARİKLERİ
-- ============================================================

INSERT INTO producer_supplies (tarih, uretici_id, uretici_adi, urun_adi, miktar_kg, birim_fiyat, toplam_tutar, durum) VALUES
('2026-05-05', 1, 'Fatma Yıldız',   'Domates',    80,  16,  1280, 'teslim_alindi'),
('2026-05-05', 1, 'Fatma Yıldız',   'Biber',      60,  26,  1560, 'teslim_alindi'),
('2026-05-07', 4, 'Zeynep Kaya',    'Salatalık',  80,   9,   720, 'teslim_alindi'),
('2026-05-07', 4, 'Zeynep Kaya',    'Patlıcan',   50,  19,   950, 'teslim_alindi'),
('2026-05-08', 5, 'Emine Çetin',    'Soğan',     120,  10,  1200, 'teslim_alindi'),
('2026-05-08', 5, 'Emine Çetin',    'Havuç',      80,  12,   960, 'teslim_alindi'),
('2026-05-09', 3, 'Hatice Yılmaz',  'İncir',      30,  82,  2460, 'teslim_alindi'),
('2026-05-09', 3, 'Hatice Yılmaz',  'Üzüm',       50,  42,  2100, 'teslim_alindi'),
('2026-05-11', 2, 'Ayşe Demir',     'Kayısı',     30,  50,  1500, 'teslim_alindi'),
('2026-05-11', 6, 'Gülay Arslan',   'Mısır',      70,  14,   980, 'teslim_alindi'),
('2026-05-11', 6, 'Gülay Arslan',   'Domates',    50,  16,   800, 'teslim_alindi');

-- ============================================================
-- 6. KARDEŞ KOOPERATİF TRANSFERLERİ
-- ============================================================

INSERT INTO cooperative_transfers (tarih, kardes_koop_adi, urun_adi, miktar_kg, birim_fiyat, toplam_tutar, amac) VALUES
('2026-05-08', 'Bereket Salça Atölyesi', 'Domates',   50, 20, 1000, 'Salça üretimi — Bereket Atölyesi haftalık tedarik'),
('2026-05-08', 'Bereket Salça Atölyesi', 'Biber',     30, 32,  960, 'Biber salçası — raf ömrü optimizasyonu'),
('2026-05-10', 'Karadeniz Koop',         'Soğan',     40, 12,  480, 'Bölge dağıtımı — stok fazlası değerlendirme'),
('2026-05-10', 'Karadeniz Koop',         'Havuç',     30, 15,  450, 'Bölge dağıtımı — stok fazlası değerlendirme'),
('2026-05-11', 'Tatlıcı Şirin Koop.',    'Kayısı',    20, 61, 1220, 'Kayısı reçeli üretimi — mevsimsel işbirliği'),
('2026-05-11', 'Tatlıcı Şirin Koop.',    'İncir',     15, 98, 1470, 'İncir reçeli — son parti teslim'),
('2026-05-12', 'Ege Bereket Koop',       'Salatalık', 30, 12,  360, 'İzmir bölgesi taze dağıtım'),
('2026-05-12', 'Ege Bereket Koop',       'Patlıcan',  20, 24,  480, 'İzmir bölgesi taze dağıtım');

-- ============================================================
-- 7. STOK HAREKETLERİ — 4–12 Mayıs (başlangıç stok → bugünkü stok)
--
-- Başlangıç (4 Mayıs):   Domates 350, Biber 200, Kayısı 140, İncir 100,
--                         Salatalık 350, Patlıcan 180, Soğan 500, Havuç 220,
--                         Üzüm 150, Mısır 280
-- Bitiş (12 Mayıs DB):   Domates  80, Biber  55, Kayısı  18, İncir  12,
--                         Salatalık 210, Patlıcan 95, Soğan 320, Havuç  45,
--                         Üzüm  22, Mısır 160
-- ============================================================

INSERT INTO stock_movements (tarih, urun_id, urun_adi, giris_kg, cikis_satis_kg, cikis_transfer_kg, aciklama) VALUES

-- DOMATES (id=1): başlangıç 350 → bitiş 80
-- Giriş: +80 (05-May), +50 (11-May) = +130
-- Çıkış satış: 40+45+40+45+40+35+25+45+35 = 350
-- Çıkış transfer: 50 (08-May Bereket Salça)
-- 350 + 130 - 350 - 50 = 80 ✓
('2026-05-04', 1, 'Domates',    0,  40,  0, 'Günlük satış'),
('2026-05-05', 1, 'Domates',   80,  45,  0, 'Fatma Yıldız teslimatı + günlük satış'),
('2026-05-06', 1, 'Domates',    0,  40,  0, 'Günlük satış'),
('2026-05-07', 1, 'Domates',    0,  45,  0, 'Günlük satış'),
('2026-05-08', 1, 'Domates',    0,  40, 50, 'Günlük satış + Bereket Salça transferi'),
('2026-05-09', 1, 'Domates',    0,  35,  0, 'Hafta sonu satış'),
('2026-05-10', 1, 'Domates',    0,  25,  0, 'Hafta sonu satış'),
('2026-05-11', 1, 'Domates',   50,  45,  0, 'Gülay Arslan teslimatı + günlük satış'),
('2026-05-12', 1, 'Domates',    0,  35,  0, 'Günlük satış'),

-- BİBER (id=2): başlangıç 200 → bitiş 55
-- Giriş: +60 (05-May) = +60
-- Çıkış satış: 20+22+20+22+20+18+13+22+18 = 175
-- Çıkış transfer: 30 (08-May Bereket Salça)
-- 200 + 60 - 175 - 30 = 55 ✓
('2026-05-04', 2, 'Biber',      0,  20,  0, 'Günlük satış'),
('2026-05-05', 2, 'Biber',     60,  22,  0, 'Fatma Yıldız teslimatı + günlük satış'),
('2026-05-06', 2, 'Biber',      0,  20,  0, 'Günlük satış'),
('2026-05-07', 2, 'Biber',      0,  22,  0, 'Günlük satış'),
('2026-05-08', 2, 'Biber',      0,  20, 30, 'Günlük satış + Bereket Salça transferi'),
('2026-05-09', 2, 'Biber',      0,  18,  0, 'Hafta sonu satış'),
('2026-05-10', 2, 'Biber',      0,  13,  0, 'Hafta sonu satış'),
('2026-05-11', 2, 'Biber',      0,  22,  0, 'Günlük satış'),
('2026-05-12', 2, 'Biber',      0,  18,  0, 'Günlük satış'),

-- KAYISI (id=3): başlangıç 140 → bitiş 18
-- Giriş: +30 (11-May) = +30
-- Çıkış satış: 15+16+14+16+15+20+15+12+9 = 132
-- Çıkış transfer: 20 (11-May Tatlıcı Şirin)
-- 140 + 30 - 132 - 20 = 18 ✓
('2026-05-04', 3, 'Kayısı',     0,  15,  0, 'Günlük satış'),
('2026-05-05', 3, 'Kayısı',     0,  16,  0, 'Günlük satış'),
('2026-05-06', 3, 'Kayısı',     0,  14,  0, 'Günlük satış'),
('2026-05-07', 3, 'Kayısı',     0,  16,  0, 'Günlük satış'),
('2026-05-08', 3, 'Kayısı',     0,  15,  0, 'Günlük satış'),
('2026-05-09', 3, 'Kayısı',     0,  20,  0, 'Hafta sonu pazar satışı'),
('2026-05-10', 3, 'Kayısı',     0,  15,  0, 'Hafta sonu satış'),
('2026-05-11', 3, 'Kayısı',    30,  12, 20, 'Ayşe Demir teslimatı + satış + Tatlıcı Şirin transferi'),
('2026-05-12', 3, 'Kayısı',     0,   9,  0, 'Günlük satış'),

-- İNCİR (id=4): başlangıç 100 → bitiş 12
-- Giriş: +30 (09-May) = +30
-- Çıkış satış: 12+13+11+13+12+15+10+11+6 = 103
-- Çıkış transfer: 15 (11-May Tatlıcı Şirin)
-- 100 + 30 - 103 - 15 = 12 ✓
('2026-05-04', 4, 'İncir',      0,  12,  0, 'Günlük satış'),
('2026-05-05', 4, 'İncir',      0,  13,  0, 'Günlük satış'),
('2026-05-06', 4, 'İncir',      0,  11,  0, 'Günlük satış'),
('2026-05-07', 4, 'İncir',      0,  13,  0, 'Günlük satış'),
('2026-05-08', 4, 'İncir',      0,  12,  0, 'Günlük satış'),
('2026-05-09', 4, 'İncir',     30,  15,  0, 'Hatice Yılmaz teslimatı + hafta sonu satış'),
('2026-05-10', 4, 'İncir',      0,  10,  0, 'Hafta sonu satış'),
('2026-05-11', 4, 'İncir',      0,  11, 15, 'Günlük satış + Tatlıcı Şirin transferi'),
('2026-05-12', 4, 'İncir',      0,   6,  0, 'Günlük satış'),

-- SALATALIK (id=5): başlangıç 350 → bitiş 210
-- Giriş: +80 (07-May) = +80
-- Çıkış satış: 22+24+22+24+22+20+15+24+17 = 190
-- Çıkış transfer: 30 (12-May Ege Bereket)
-- 350 + 80 - 190 - 30 = 210 ✓
('2026-05-04', 5, 'Salatalık',  0,  22,  0, 'Günlük satış'),
('2026-05-05', 5, 'Salatalık',  0,  24,  0, 'Günlük satış'),
('2026-05-06', 5, 'Salatalık',  0,  22,  0, 'Günlük satış'),
('2026-05-07', 5, 'Salatalık', 80,  24,  0, 'Zeynep Kaya teslimatı + günlük satış'),
('2026-05-08', 5, 'Salatalık',  0,  22,  0, 'Günlük satış'),
('2026-05-09', 5, 'Salatalık',  0,  20,  0, 'Hafta sonu satış'),
('2026-05-10', 5, 'Salatalık',  0,  15,  0, 'Hafta sonu satış'),
('2026-05-11', 5, 'Salatalık',  0,  24,  0, 'Günlük satış'),
('2026-05-12', 5, 'Salatalık',  0,  17, 30, 'Günlük satış + Ege Bereket transferi'),

-- PATLICAN (id=6): başlangıç 180 → bitiş 95
-- Giriş: +50 (07-May) = +50
-- Çıkış satış: 13+14+13+14+13+12+8+14+14 = 115
-- Çıkış transfer: 20 (12-May Ege Bereket)
-- 180 + 50 - 115 - 20 = 95 ✓
('2026-05-04', 6, 'Patlıcan',   0,  13,  0, 'Günlük satış'),
('2026-05-05', 6, 'Patlıcan',   0,  14,  0, 'Günlük satış'),
('2026-05-06', 6, 'Patlıcan',   0,  13,  0, 'Günlük satış'),
('2026-05-07', 6, 'Patlıcan',  50,  14,  0, 'Zeynep Kaya teslimatı + günlük satış'),
('2026-05-08', 6, 'Patlıcan',   0,  13,  0, 'Günlük satış'),
('2026-05-09', 6, 'Patlıcan',   0,  12,  0, 'Hafta sonu satış'),
('2026-05-10', 6, 'Patlıcan',   0,   8,  0, 'Hafta sonu satış'),
('2026-05-11', 6, 'Patlıcan',   0,  14,  0, 'Günlük satış'),
('2026-05-12', 6, 'Patlıcan',   0,  14, 20, 'Günlük satış + Ege Bereket transferi'),

-- SOĞAN (id=7): başlangıç 500 → bitiş 320
-- Giriş: +120 (08-May) = +120
-- Çıkış satış: 30+32+30+32+30+28+20+32+26 = 260
-- Çıkış transfer: 40 (10-May Karadeniz Koop)
-- 500 + 120 - 260 - 40 = 320 ✓
('2026-05-04', 7, 'Soğan',      0,  30,  0, 'Günlük satış'),
('2026-05-05', 7, 'Soğan',      0,  32,  0, 'Günlük satış'),
('2026-05-06', 7, 'Soğan',      0,  30,  0, 'Günlük satış'),
('2026-05-07', 7, 'Soğan',      0,  32,  0, 'Günlük satış'),
('2026-05-08', 7, 'Soğan',    120,  30,  0, 'Emine Çetin teslimatı + günlük satış'),
('2026-05-09', 7, 'Soğan',      0,  28,  0, 'Hafta sonu satış'),
('2026-05-10', 7, 'Soğan',      0,  20, 40, 'Hafta sonu satış + Karadeniz Koop transferi'),
('2026-05-11', 7, 'Soğan',      0,  32,  0, 'Günlük satış'),
('2026-05-12', 7, 'Soğan',      0,  26,  0, 'Günlük satış'),

-- HAVUÇ (id=8): başlangıç 220 → bitiş 45
-- Giriş: +80 (08-May) = +80
-- Çıkış satış: 26+28+25+28+26+24+18+28+22 = 225
-- Çıkış transfer: 30 (10-May Karadeniz Koop)
-- 220 + 80 - 225 - 30 = 45 ✓
('2026-05-04', 8, 'Havuç',      0,  26,  0, 'Günlük satış'),
('2026-05-05', 8, 'Havuç',      0,  28,  0, 'Günlük satış'),
('2026-05-06', 8, 'Havuç',      0,  25,  0, 'Günlük satış'),
('2026-05-07', 8, 'Havuç',      0,  28,  0, 'Günlük satış'),
('2026-05-08', 8, 'Havuç',     80,  26,  0, 'Emine Çetin teslimatı + günlük satış'),
('2026-05-09', 8, 'Havuç',      0,  24,  0, 'Hafta sonu satış'),
('2026-05-10', 8, 'Havuç',      0,  18, 30, 'Hafta sonu satış + Karadeniz Koop transferi'),
('2026-05-11', 8, 'Havuç',      0,  28,  0, 'Günlük satış'),
('2026-05-12', 8, 'Havuç',      0,  22,  0, 'Günlük satış'),

-- ÜZÜM (id=9): başlangıç 150 → bitiş 22
-- Giriş: +50 (09-May) = +50
-- Çıkış satış: 20+22+20+22+20+25+18+22+9 = 178
-- Çıkış transfer: 0
-- 150 + 50 - 178 = 22 ✓
('2026-05-04', 9, 'Üzüm',       0,  20,  0, 'Günlük satış'),
('2026-05-05', 9, 'Üzüm',       0,  22,  0, 'Günlük satış'),
('2026-05-06', 9, 'Üzüm',       0,  20,  0, 'Günlük satış'),
('2026-05-07', 9, 'Üzüm',       0,  22,  0, 'Günlük satış'),
('2026-05-08', 9, 'Üzüm',       0,  20,  0, 'Günlük satış'),
('2026-05-09', 9, 'Üzüm',      50,  25,  0, 'Hatice Yılmaz teslimatı + hafta sonu satış'),
('2026-05-10', 9, 'Üzüm',       0,  18,  0, 'Hafta sonu satış'),
('2026-05-11', 9, 'Üzüm',       0,  22,  0, 'Günlük satış'),
('2026-05-12', 9, 'Üzüm',       0,   9,  0, 'Günlük satış'),

-- MISIR (id=10): başlangıç 280 → bitiş 160
-- Giriş: +70 (11-May) = +70
-- Çıkış satış: 22+24+22+24+22+20+14+24+18 = 190
-- Çıkış transfer: 0
-- 280 + 70 - 190 = 160 ✓
('2026-05-04', 10, 'Mısır',     0,  22,  0, 'Günlük satış'),
('2026-05-05', 10, 'Mısır',     0,  24,  0, 'Günlük satış'),
('2026-05-06', 10, 'Mısır',     0,  22,  0, 'Günlük satış'),
('2026-05-07', 10, 'Mısır',     0,  24,  0, 'Günlük satış'),
('2026-05-08', 10, 'Mısır',     0,  22,  0, 'Günlük satış'),
('2026-05-09', 10, 'Mısır',     0,  20,  0, 'Hafta sonu satış'),
('2026-05-10', 10, 'Mısır',     0,  14,  0, 'Hafta sonu satış'),
('2026-05-11', 10, 'Mısır',    70,  24,  0, 'Gülay Arslan teslimatı + günlük satış'),
('2026-05-12', 10, 'Mısır',     0,  18,  0, 'Günlük satış');

-- ============================================================
-- 8. GÜNLÜK SATIŞ ÖZETLERİ
-- ============================================================

INSERT INTO daily_sales (tarih, toplam_satis_kg, toplam_gelir, siparis_sayisi, en_cok_satan_urun, notlar) VALUES
('2026-05-04', 220, 7380,   5, 'Domates', 'Haftanın açılışı, talepler stabil'),
('2026-05-05', 240, 8043,   5, 'Domates', 'Fatma Yıldız teslimatı alındı'),
('2026-05-06', 217, 7175,   4, 'Üzüm',    'Çarşamba pazar günü — orta yoğunluk'),
('2026-05-07', 240, 8043,   5, 'Domates', 'Zeynep Kaya teslimatı alındı'),
('2026-05-08', 300, 9340,   5, 'Domates', 'Bereket Salça transferi dahil — en yüksek gelir günü'),
('2026-05-09', 217, 8029,   4, 'Kayısı',  'Cumartesi pazar — Hatice Yılmaz teslimatı alındı'),
('2026-05-10', 226,  6652,  3, 'Soğan',   'Pazar günü — Karadeniz Koop transferi'),
('2026-05-11', 269, 10215,  5, 'Domates', 'Pazartesi — tedarik + kardeş koop işlemleri yoğun'),
('2026-05-12', 224,  5992,  4, 'Domates', 'Devam eden gün — 3 sipariş hâlâ beklemede');

-- ============================================================
-- 9. FİNANSAL HAREKETLER
-- ============================================================

INSERT INTO financial_movements (tarih, gelir, uretici_odemesi, operasyonel_gider, net, aciklama) VALUES
('2026-05-04', 7380,     0,  900, 6480, 'Normal işgünü'),
('2026-05-05', 8043,  2840,  950, 4253, 'Fatma Yıldız teslimat ödemesi'),
('2026-05-06', 7175,     0,  850, 6325, 'Normal işgünü'),
('2026-05-07', 8043,  1670,  900, 5473, 'Zeynep Kaya teslimat ödemesi'),
('2026-05-08', 9340,  2160, 1000, 6180, 'Emine Çetin ödemesi + kardeş koop transferi'),
('2026-05-09', 8029,  4560,  800, 2669, 'Hatice Yılmaz ödemesi — incir+üzüm yüksek maliyet'),
('2026-05-10', 6652,     0,  750, 5902, 'Pazar günü — düşük operasyon'),
('2026-05-11',10215,  3280, 1100, 5835, 'Ayşe Demir + Gülay Arslan ödemeleri'),
('2026-05-12', 5992,     0,  600, 5392, 'Devam eden gün — yarım gün rakamı');

-- ============================================================
-- 10. FİNANSAL ÖZET GÜNCELLE
-- ============================================================

TRUNCATE financial_stats RESTART IDENTITY;

INSERT INTO financial_stats (id, baslik, deger, trend, yon, icon) VALUES
(1, 'Toplam Gelir',                   '₺71.200',  '+%14', 'up',   'dollar'),
(2, 'Operasyonel Gider',              '₺22.400',  '-%6',  'down', 'pieChart'),
(3, 'Kardeş Üretici İşlem Hacmi',     '₺6.420',   '+%28', 'up',   'users'),
(4, 'İsraf Önleme Tasarrufu',         '₺4.800',   '+%11', 'up',   'zap');

-- ============================================================
-- 11. DASHBOARD STATS GÜNCELLE (dünün = 11 Mayıs özeti)
-- ============================================================

TRUNCATE dashboard_stats RESTART IDENTITY;

INSERT INTO dashboard_stats (id, label, value, icon, renk) VALUES
(1, 'Toplam Sipariş',    '5',         '📦', 'green'),
(2, 'Teslim Edilen',     '5',         '✅', 'green'),
(3, 'Bekleyen',          '0',         '⏳', 'gold'),
(4, 'Toplam Gelir',      '₺10.215',   '💰', 'green'),
(5, 'Yeni Üretici',      '1',         '👤', 'blue'),
(6, 'Anomali Tespiti',   '2',         '⚠️', 'red');

-- ============================================================
-- 12. AI LOGS — tarihsel kayıtlar
-- ============================================================

TRUNCATE ai_logs RESTART IDENTITY;

INSERT INTO ai_logs (id, zaman, tarih, tip, baslik, mesaj, renk, kategori) VALUES
-- 4 Mayıs
(1,  '08:00', '4 Mayıs 2026',  'Rapor',   'Haftalık Başlangıç Özeti',       'Depo doluluk oranı %87. 10 üründe stok hazır, haftalık teslimat takvimi onaylandı.',                           'green', 'Depo'),
(2,  '11:30', '4 Mayıs 2026',  'Tahmin',  'Hafta İçi Talep Tahmini',        'Migros ve A101 bu hafta 15% daha fazla domates talep edebilir. Üretici bildirimleri hazırlandı.',              'gold',  'Trend'),
-- 5 Mayıs
(3,  '09:15', '5 Mayıs 2026',  'Otomasyon','Tedarik Onayı',                 'Fatma Yıldız''dan 80 kg domates + 60 kg biber teslim alındı. Stok güncellendi.',                               'blue',  'Depo'),
(4,  '14:00', '5 Mayıs 2026',  'Rapor',   'Günlük Özet',                    '5 sipariş tamamlandı, günlük gelir ₺8.043. Stok seviyeleri normal.',                                           'green', 'Raporlama'),
-- 6 Mayıs
(5,  '10:30', '6 Mayıs 2026',  'Tahmin',  'Kayısı Stok Uyarısı',            'Mevcut satış hızıyla Kayısı stokunun 10 gün içinde tükeneceği tahmin ediliyor. Ayşe Demir''e bildirim gönderildi.','gold', 'Stok'),
-- 7 Mayıs
(6,  '08:45', '7 Mayıs 2026',  'Otomasyon','Tedarik Onayı',                 'Zeynep Kaya''dan 80 kg salatalık + 50 kg patlıcan teslim alındı.',                                             'blue',  'Depo'),
(7,  '16:00', '7 Mayıs 2026',  'Anomali', 'Havuç Tüketim Hızı',             'Havuç günlük çıkışı beklenenden %12 yüksek. Emine Çetin''e erken teslimat talebi iletildi.',                   'red',   'Depo'),
-- 8 Mayıs
(8,  '09:00', '8 Mayıs 2026',  'Otomasyon','Tedarik Onayı',                 'Emine Çetin''den 120 kg soğan + 80 kg havuç teslim alındı.',                                                   'blue',  'Depo'),
(9,  '11:45', '8 Mayıs 2026',  'Rapor',   'Kardeş Koop Transferi',          'Bereket Salça Atölyesi''ne 50 kg domates + 30 kg biber transfer edildi. Toplam değer ₺1.960.',                  'green', 'Transfer'),
(10, '17:00', '8 Mayıs 2026',  'Rapor',   'Haftalık Kapanış Özeti',         'Hafta geliri ₺47.984. En çok satan: Domates. İsraf sıfır. Tüm teslimatlar zamanında.',                         'green', 'Raporlama'),
-- 9 Mayıs
(11, '10:00', '9 Mayıs 2026',  'Otomasyon','Tedarik Onayı',                 'Hatice Yılmaz''dan 30 kg incir + 50 kg üzüm teslim alındı.',                                                   'blue',  'Depo'),
(12, '13:30', '9 Mayıs 2026',  'Tahmin',  'Pazar Günü Talep Analizi',       'Hafta sonu pazar satışları ₺8.029. Kayısı ve üzüm en çok talep gören ürünler.',                                'gold',  'Trend'),
-- 10 Mayıs
(13, '10:30', '10 Mayıs 2026', 'Rapor',   'Kardeş Koop Transferi',          'Karadeniz Koop''a 40 kg soğan + 30 kg havuç transfer edildi. Toplam değer ₺930.',                              'green', 'Transfer'),
(14, '15:00', '10 Mayıs 2026', 'Anomali', 'Düşük Stok Tespit: Kayısı',      'Kayısı stoku 29 kg''a düştü. Yarın Ayşe Demir teslimatı bekleniyor.',                                          'red',   'Stok'),
-- 11 Mayıs
(15, '08:30', '11 Mayıs 2026', 'Otomasyon','Tedarik Onayı',                 'Ayşe Demir''den 30 kg kayısı, Gülay Arslan''dan 70 kg mısır + 50 kg domates teslim alındı.',                   'blue',  'Depo'),
(16, '11:30', '11 Mayıs 2026', 'Rapor',   'Kardeş Koop Transferi',          'Tatlıcı Şirin Koop.''a 20 kg kayısı + 15 kg incir transfer edildi. Toplam değer ₺2.690.',                      'green', 'Transfer'),
(17, '17:30', '11 Mayıs 2026', 'Rapor',   'Günlük Özet — Rekor Gelir',      '11 Mayıs günlük geliri ₺10.215 ile 9 günlük en yüksek rakam. 5 sipariş tamamlandı.',                          'green', 'Raporlama'),
-- 12 Mayıs (bugün)
(18, '08:15', '12 Mayıs 2026', 'Anomali', 'Kritik Stok Uyarısı: İncir',     'İncir stoku 12 kg — günlük satış hızında 1-2 gün yetecek. Acil tedarik planı başlatıldı.',                    'red',   'Stok'),
(19, '08:20', '12 Mayıs 2026', 'Anomali', 'Kritik Stok Uyarısı: Kayısı',    'Kayısı stoku 18 kg — mevsim sonu sinyali. Tatlıcı Şirin Koop. haberdâr edildi.',                              'red',   'Stok'),
(20, '09:00', '12 Mayıs 2026', 'Tahmin',  'Talep Tahmini: Salatalık',       'Bu hafta salatalık talebinin %22 artması bekleniyor. Zeynep Kaya ile görüşme planlandı.',                      'gold',  'Trend'),
(21, '10:45', '12 Mayıs 2026', 'Otomasyon','Otomatik Teklif Hazırlandı',    'Ege Bereket Koop talebi için 30 kg salatalık + 20 kg patlıcan teklifi otomatik oluşturuldu.',                  'blue',  'İletişim');

SELECT setval('ai_logs_id_seq', 21);

-- ============================================================
-- 13. STK ALERTS GÜNCELLE
-- ============================================================

TRUNCATE stk_alerts RESTART IDENTITY;

INSERT INTO stk_alerts (id, urun, emoji, kalan_gun_mesaj, miktar, islem, kardesler) VALUES
(1, 'İncir',  '🟣', '1–2 Gün Kaldı', '12 kg',  'Reçel Üretimi',     '[{"ad": "Tatlıcı Şirin Koop.", "avatar": "TŞ", "tip": "Kardeş Kooperatif"}]'),
(2, 'Kayısı', '🍑', '2–3 Gün Kaldı', '18 kg',  'Reçel Üretimi',     '[{"ad": "Tatlıcı Şirin Koop.", "avatar": "TŞ", "tip": "Kardeş Kooperatif"}]'),
(3, 'Domates','🍅', '2 Gün Kaldı',   '80 kg',  'Salça Üretimi',     '[{"ad": "Bereket Salça Atölyesi", "avatar": "BS", "tip": "Kardeş Kooperatif"}]');

-- ============================================================
-- 14. AI REPORTS GÜNCELLE
-- ============================================================

TRUNCATE ai_reports RESTART IDENTITY;

INSERT INTO ai_reports (id, baslik, maddeler) VALUES
(1, 'AI Günlük Analiz Özeti — 12 Mayıs 2026',
'["İncir (12 kg) ve Kayısı (18 kg) kritik stok seviyesinde. Acil tedarik veya kardeş koop transferi önerilir.",
  "Bugünkü 4 talebin 1''i tamamlandı, 3''ü beklemede. Toplam beklenen gelir ₺5.992.",
  "Son 9 günlük toplam gelir ₺71.200 — geçen haftaya göre +%14 artış.",
  "Hatice Yılmaz (İncir/Üzüm) bu dönemin en yüksek değerli tedarikçisi: ₺4.560 toplam teslimat.",
  "Ege Bereket Koop ile yeni transfer ilişkisi kuruldu — bölgesel ağ genişliyor."]');

-- ============================================================
-- 15. TASKS GÜNCELLE (bugün yapılacaklar)
-- ============================================================

TRUNCATE tasks RESTART IDENTITY;

INSERT INTO tasks (id, is_name, durum, oncelik) VALUES
(1, 'İncir için acil tedarik görüşmesi — Hatice Yılmaz ile iletişime geç',    false, 'yuksek'),
(2, 'Ege Bereket Koop siparişini onayla ve teslim tarihini gir',              false, 'yuksek'),
(3, 'Kayısı son 18 kg için Tatlıcı Şirin teklifi hazırla',                    false, 'orta'),
(4, 'Zeynep Kaya ile salatalık yeni sipariş görüşmesi yap',                   false, 'orta'),
(5, 'Haftalık finansal raporu tamamla ve kooperatif yönetimine sun',           true,  'dusuk');
