# CoopNet — Kooperatif Yönetim Sistemi
## Yeni Claude Code Oturumu İçin Proje Dökümantasyonu

---

## 📌 Proje Nedir?

**CoopNet**, tarım kooperatiflerini yönetmek için geliştirilmiş, yapay zeka destekli bir web uygulamasıdır. Kullanıcı: **"Üreten Kadınlar Kooperatifi"** yöneticisi.

Sistemin temel amacı:
- Depo stoklarını takip etmek
- Üreticilerden gelen WhatsApp hasat bildirimlerini AI ile otomatik işlemek
- Siparişleri ve görevleri yönetmek
- AI tabanlı anomali tespiti, günlük özet ve haftalık içgörüler üretmek

---

## 🛠 Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | FastAPI (Python 3.11), Pydantic v2 |
| **Veritabanı** | Supabase (PostgreSQL) |
| **AI** | Google Gemini (`gemini-2.5-flash` / `gemini-2.5-pro`) |
| **WhatsApp** | Twilio WhatsApp Sandbox + cloudflared tüneli |
| **CSS Mimarisi** | Her sayfa kendi `.css` dosyasını import eder (Tailwind ile KARIŞTIRILMAZ) |

---

## 📁 Proje Yapısı

```
CoopNet/
├── backend/                        # FastAPI backend
│   ├── main.py                     # Uygulama giriş noktası, router kayıtları, CORS
│   ├── config.py                   # Pydantic settings (.env okur)
│   ├── database.py                 # Supabase singleton client
│   ├── requirements.txt            # Python bağımlılıkları
│   ├── .env                        # Gizli anahtarlar (git'e eklenmez)
│   │
│   ├── models/
│   │   └── schemas.py              # Tüm Pydantic modelleri
│   │
│   ├── routers/
│   │   ├── dashboard.py            # GET /api/dashboard/summary, PATCH /api/dashboard/tasks/{id}
│   │   ├── harvest.py              # POST /api/harvest/analyze, GET /api/harvest/messages
│   │   ├── whatsapp.py             # POST /api/webhook/whatsapp (Twilio), POST /api/webhook/whatsapp/demo
│   │   ├── ai.py                   # Chat, günlük özet, taslak e-posta, haftalık içgörü, AI logları, raporlar
│   │   ├── producers.py            # GET /api/producers
│   │   ├── anomaly_router.py       # GET /api/anomaly/summary
│   │   └── cron.py                 # POST /api/cron/daily-summary (cron job tetikleyici)
│   │
│   ├── services/
│   │   ├── gemini_client.py        # Gemini model fabrikası (flash/pro seçimi)
│   │   ├── orchestrator.py         # AI ajan döngüsü (tool calling, multi-turn chat)
│   │   ├── logger.py               # ai_logs tablosuna yazma
│   │   ├── context.py              # AI için bağlam oluşturma (stok + siparişler özeti)
│   │   └── anomaly.py              # Stok bazlı anomali tespiti
│   │
│   └── tools/
│       ├── definitions.py          # Gemini FunctionDeclaration tanımları (7 tool)
│       └── handlers.py             # Tool implementasyonları (Supabase sorguları)
│
├── src/
│   └── app/
│       ├── dashboard/
│       │   ├── page.tsx            # Ana dashboard
│       │   ├── dashboard.css
│       │   ├── depo/               # Depo stok yönetimi
│       │   ├── talepler/           # Sipariş talepleri
│       │   ├── ureticiler/         # Üretici listesi
│       │   ├── finansal/           # Finansal raporlar
│       │   ├── anomali/            # AI anomali tespiti
│       │   ├── ai-raporlar/        # AI raporları
│       │   ├── ai-logs/            # AI işlem logları
│       │   └── uretici-mesaj/      # WhatsApp üretici mesaj yönetimi ← YENİ
│       │
│       └── login/                  # Giriş sayfası
│
├── src/lib/api/
│   └── client.ts                   # Tüm API fonksiyonları ve TypeScript tipleri
│
├── supabase_schema.sql             # Veritabanı şeması + seed verisi
├── PROJE.md                        # Bu dosya
└── package.json
```

---

## 🗄 Veritabanı Şeması (Supabase)

> ⚠️ **ÖNEMLİ:** Tablo ve kolon adları Türkçedir. Backend kodu bu isimlere göre yazılmıştır.

### `products` — Depo Stokları
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL PK | |
| emoji | TEXT | Ürün emojisi (🍅) |
| ad | TEXT | Ürün adı |
| mevcut_kg | INTEGER | Mevcut stok miktarı |
| kapasite_kg | INTEGER | Maksimum kapasite |
| kategori | TEXT | Sebze / Meyve / Tahıl |
| son_guncelleme | TEXT | Serbest metin tarih |

**Kritik eşik:** `mevcut_kg <= kapasite_kg * 0.25` → `is_critical = True`

### `tasks` — Görevler
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL PK | |
| is_name | TEXT | Görev adı |
| durum | BOOLEAN | false=bekliyor, true=tamamlandı |
| oncelik | TEXT | `yuksek` / `orta` / `dusuk` |

### `requests` — Siparişler / Talepler
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL PK | |
| musteri | TEXT | Müşteri adı |
| urun | TEXT | Ürün adı |
| miktar | TEXT | Miktar (serbest metin) |
| saat | TEXT | Teslim saati |
| durum | TEXT | `bekliyor` / `onaylandi` |

### `ai_logs` — AI İşlem Kayıtları
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL PK | |
| zaman | TEXT | `HH:MM` formatı |
| tarih | TEXT | `DD Ay YYYY` formatı |
| tip | TEXT | Anomali / Rapor / Otomasyon / Uyarı |
| baslik | TEXT | Başlık |
| mesaj | TEXT | Açıklama |
| kategori | TEXT | Depo / İletişim / Raporlama vs. |
| detay_neden | TEXT | Neden tetiklendi |
| detay_etki | TEXT | Etki açıklaması |

> **Not:** `notifications` tablosu yok. Bildirimler `ai_logs`'a yazılır.

### `producers` — Üreticiler
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL PK | |
| ad | TEXT | Ad |
| lokasyon | TEXT | |
| urunler | JSONB | `["Domates", "Biber"]` |
| kapasite | TEXT | |
| type | TEXT | `talep` / `genel` / `kardes` |

### Diğer tablolar
- `employees` — Çalışanlar (dashboard'da kullanılıyor)
- `cooperatives` — Kooperatif bilgisi
- `dashboard_stats` — KPI kartları için sabit veriler
- `ai_reports` — AI rapor maddeler listesi
- `stk_alerts` — İsraf riski uyarıları
- `financial_stats` — Finansal KPI verileri

### RLS Politikaları (Supabase Row Level Security)
```sql
-- Uygulama için gerekli INSERT/UPDATE politikaları (supabase_schema.sql'de mevcut):
CREATE POLICY "Allow public insert ai_logs" ON ai_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert tasks"   ON tasks   FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks"   ON tasks   FOR UPDATE USING (true);
CREATE POLICY "Allow public update products" ON products FOR UPDATE USING (true);
```

---

## 🔌 API Endpoint Referansı

### Dashboard
```
GET  /api/dashboard/summary          → KPI kartları, stok, siparişler, görevler
PATCH /api/dashboard/tasks/{task_id} → { done: bool } → görev toggle
```

### Hasat / WhatsApp
```
POST /api/harvest/analyze            → { message } → AI parse + stok kontrol + aksiyonlar
GET  /api/harvest/messages?limit=20  → Gelen WhatsApp mesajları + hasat görevleri

POST /api/webhook/whatsapp           → Twilio'dan gelen gerçek WhatsApp webhook (TwiML döner)
POST /api/webhook/whatsapp/demo      → UI demo (Form: Body, ProfileName) → JSON döner
```

### AI
```
POST /api/ai/chat                    → { message, history[] } → { text, toolCalls[] }
POST /api/ai/daily-summary           → { date? } → Günlük AI özeti
POST /api/ai/weekly-insight          → { week_start? } → Haftalık içgörü + aksiyon önerileri
POST /api/ai/draft-email             → { product_name, quantity, unit } → E-posta taslağı
POST /api/ai/draft-notification      → { order_id } → Bildirim taslağı
GET  /api/ai/logs?date=&limit=       → AI log geçmişi
GET  /api/ai/reports                 → AI rapor maddeleri
```

### Diğer
```
GET  /api/producers                  → Üretici listesi
GET  /api/anomaly/summary?target_date= → Anomali raporu
POST /api/cron/daily-summary         → Cron job tetikleyici (Authorization: Bearer {CRON_SECRET})
GET  /health                         → { status: "ok" }
```

---

## 🤖 AI Katmanı

### Gemini Model Kullanımı
```python
# gemini_client.py
get_model(complex=False)  # → gemini-2.5-flash  (hızlı, ucuz — çoğu işlemde)
get_model(complex=True)   # → gemini-2.5-pro    (derin analiz — haftalık içgörü)
```

> ⚠️ **Ücretsiz kota sınırı:** Gemini API ücretsiz tier'da **20 istek/gün**. Kota dolunca `429` hatası alınır.

### Regex Fallback
`harvest.py`'deki `_parse_harvest()` fonksiyonu, Gemini API'ye ulaşamazsa otomatik olarak `_regex_parse()` fallback'ine geçer. Regex parse: `{sayı} kg/adet/kasa {ürün adı}` kalıplarını yakalar, `confidence=0.80` döner.

### AI Ajan Tool'ları (7 adet)
Tüm tool tanımları `tools/definitions.py`, implementasyonları `tools/handlers.py`'da:

| Tool | Açıklama |
|------|----------|
| `get_stock` | Ürünün mevcut stok miktarı |
| `check_threshold` | Kritik eşik kontrolü |
| `get_daily_orders` | Günlük sipariş listesi |
| `assign_task` | `tasks` tablosuna görev oluştur |
| `update_stock` | `products.mevcut_kg` güncelle |
| `get_sales_forecast` | Kapasite bazlı kaba talep tahmini |
| `send_notification` | `ai_logs`'a bildirim kaydı yaz |

### Orchestrator (Ajan Döngüsü)
`services/orchestrator.py` → Gemini function calling döngüsü, max 5 iterasyon, multi-turn chat desteği.

---

## 📱 WhatsApp Entegrasyonu

### Akış
```
Üretici → WhatsApp → Twilio → POST /api/webhook/whatsapp
                                    ↓
                              _parse_harvest() (Gemini veya regex fallback)
                                    ↓
                              check_threshold() (stok kontrolü)
                                    ↓
                              assign_task() + send_notification()
                                    ↓
                              TwiML yanıtı → WhatsApp'a geri gönderilir
```

### Twilio Sandbox Kurulumu
1. [console.twilio.com](https://console.twilio.com) → Messaging → Try WhatsApp
2. Sandbox numarasına `join <kelime>` mesajı gönder (telefon için)
3. Webhook URL: `https://<cloudflared-url>/api/webhook/whatsapp`
4. `POST` methodu seçili olmalı

### Cloudflared Tüneli
```bash
# Her seferinde yeni URL üretir, Twilio'da güncellenmesi gerekir
cloudflared tunnel --url http://localhost:8000
```

### Demo Endpoint
Gerçek Twilio olmadan test için: `POST /api/webhook/whatsapp/demo`
- Form body: `Body=100 kg domates hasat ettim&ProfileName=Demo Üretici`
- JSON döner (TwiML değil)
- Frontend `uretici-mesaj` sayfasındaki "Test Gönder" paneli bunu kullanır

---

## 🖥 Frontend Sayfaları

Her sayfa kendi CSS dosyasını import eder. **Sidebar + Header tüm sayfalarda tekrarlanır** (Next.js shared layout kullanılmıyor, her sayfada kopyalanmış).

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Ana Dashboard | `/dashboard` | KPI kartlar, stok tablosu, görevler, siparişler, AI chat |
| Depo | `/dashboard/depo` | Stok kartları, doluluk barları |
| Talepler | `/dashboard/talepler` | Sipariş listesi |
| Üreticiler | `/dashboard/ureticiler` | Üretici kartları (talep/genel/kardeş tipleri) |
| Finansal | `/dashboard/finansal` | Finansal KPI + AI analiz |
| Anomali | `/dashboard/anomali` | AI tabanlı anomali listesi |
| AI Raporları | `/dashboard/ai-raporlar` | Haftalık içgörü, taslak e-posta, bildirim |
| AI Logs | `/dashboard/ai-logs` | AI işlem geçmişi + aksiyonlar |
| Üretici Mesaj | `/dashboard/uretici-mesaj` | WhatsApp gelen mesaj yönetimi ← YENİ |

### CSS Mimarisi Kuralı
- Her sayfa için ayrı CSS (`dashboard/anomali/anomali.css` gibi)
- CSS değişkenleri: `--green-900` → `--green-400` (sidebar gradient), `--grey-50` → `--grey-900`
- Sidebar: `linear-gradient(170deg, #1a3328, #1e3d2f, #162e24)`
- Aktif nav item: `border-left: 3px solid var(--green-400)`
- Tailwind sadece `className`'lerde kullanılabilir ama mevcut sayfalarda custom CSS tercih edilmiş

### `src/lib/api/client.ts`
Tüm API çağrıları burada tanımlı. Yeni endpoint eklenince buraya da tip + fonksiyon eklenmeli.

---

## ⚙️ Ortam Kurulumu

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # .env yoksa elle oluştur
uvicorn main:app --reload --port 8000
```

### `.env` Dosyası (backend/)
```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
CRON_SECRET=herhangi_bir_gizli_deger
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Frontend
```bash
# Proje kökünde
npm install
npm run dev       # → http://localhost:3000
```

### Supabase Şema
`supabase_schema.sql` dosyasını Supabase Dashboard → SQL Editor'e yapıştır ve çalıştır. Tüm tablolar + seed verisi + RLS politikaları bu dosyada.

---

## 🌿 Git Branching Kuralı
- **Ana branch:** `develop`
- Feature branch: `feature/xxx` — develop'tan açılır, develop'a merge edilir
- `main` branch production içindir
- Commit mesajlarında "claude" kelimesi kullanılmaz

---

## 🐛 Bilinen Sorunlar / Sınırlamalar

1. **Gemini Ücretsiz Kota:** Günde 20 istek. Kota dolunca regex fallback devreye girer (hasat parse için). Chat ve diğer AI özellikler 429 hatası döner.

2. **Cloudflared Tüneli:** Her yeniden başlatmada URL değişir, Twilio'da elle güncellenmesi gerekir. Kalıcı çözüm: Twilio ücretli hesap + sabit domain.

3. **WhatsApp Üretici Kimliği:** Gelen mesajlarda üretici adı (`ProfileName`) Twilio Sandbox'ta set edilebilir ama DB'de saklanmıyor. Üretici eşleştirmesi yapılmıyor.

4. **ai_logs'ta Detay Eksikliği:** `/api/harvest/messages` endpoint'i AI parse sonuçlarını (ürün, miktar, stok detayı) DB'den çekemiyor — sadece ham mesaj metni ve `detay_etki` string'i dönüyor. Detaylı analiz sadece demo endpoint üzerinden anlık görülebiliyor.

5. **Shared Layout Yok:** Sidebar ve Header her sayfada tekrarlanıyor. Next.js `layout.tsx` kullanılmıyor (bilinçli tercih ya da teknik borç).

6. **`ureticiler/page.tsx` TS Hataları:** `any` type parametrelerinde uyarı var ama build'i engellemiyor.

---

## 🚀 Bir Sonraki Adımlar (Öneriler)

- [ ] WhatsApp mesajlarında üretici adını DB'ye kaydet (`ai_logs`'a `profil_adi` kolonu ekle)
- [ ] AI parse sonuçlarını (product_name, quantity, unit) `ai_logs`'a JSON olarak sakla → mesaj listesinde detay göster
- [ ] Next.js shared `layout.tsx` ile sidebar/header tekrarını kaldır
- [ ] Cloudflared yerine kalıcı domain + Twilio paid → gerçek WhatsApp bildirimleri
- [ ] Haftalık içgörü ve günlük özet için otomatik cron job (Vercel Cron veya Supabase Edge Function)
- [ ] Üretici kimlik doğrulama: Telefon numarasına göre `producers` tablosundan eşleştirme

---

## 🔑 Önemli Dosyalar — Hızlı Referans

| Dosya | Ne Zaman Aç |
|-------|-------------|
| `backend/tools/handlers.py` | Supabase sorguları değiştirilecekse |
| `backend/routers/harvest.py` | Hasat parse mantığı değiştirilecekse |
| `backend/routers/whatsapp.py` | Twilio webhook değiştirilecekse |
| `backend/services/orchestrator.py` | AI ajan döngüsü değiştirilecekse |
| `src/lib/api/client.ts` | Yeni API endpoint'i eklenecekse |
| `supabase_schema.sql` | DB şeması referansı için |
| `src/app/dashboard/anomali/anomali.css` | Yeni sayfa CSS'i için şablon |
