# CoopNet

**CoopNet**, Üreten Kadınlar Kooperatifi için geliştirilen, tarımsal kooperatif operasyonlarını yapay zeka destekli bir platformda yöneten bir projedir.

---

## Proje Adı ve Kısa Açıklama

- **Proje Adı:** CoopNet
- **Kısa Açıklama:** Depo yönetimi, üretici iletişimi, görev takibi ve AI raporlamayı tek bir sistemde toplayan kooperatif yönetim uygulaması.

---

## Projenin Amacı

CoopNet’in amacı, tarımsal kooperatiflerin günlük operasyonlarını dijitalleştirerek hataları azaltmak, süreçleri hızlandırmak ve yapay zeka destekli öngörülerle karar almayı kolaylaştırmaktır.

---

## Çözülen Problem

- Manuel Excel ve kağıt bazlı stok takip süreçleri
- Telefon / WhatsApp üzerinden dağınık üretici iletişimi
- Vardiya ve görev atamalarının gecikmeli veya hatalı yapılması
- Kritik stok seviyelerinin zamanında fark edilmemesi
- AI destekli raporlama ve otomasyon eksikliği

---

## Kullanıcı Akışı

1. Kullanıcı tarayıcıda `http://localhost:3000` adresindeki login sayfasına gelir.
2. Login başarılı olduğunda `dashboard` ana ekranı açılır.
3. Dashboard’da stok durumu, açık talepler, görevler, AI raporları ve üretici mesajları takip edilir.
4. Üretici WhatsApp üzerinden mesaj gönderdiğinde backend bu mesajı işler.
5. AI ajanı kritik stok, onay bekleyen talepler ve haftalık özet için aksiyon önerir.
6. Gerekirse yönetici dashboard üzerinden görevi onaylar veya düzenler.

---

## Sayfalar ve Modüller

### Frontend
- `src/app/login/` — Giriş ekranı
- `src/app/invite/` — Davet talep formu
- `src/app/dashboard/page.tsx` — Ana dashboard
- `src/app/dashboard/depo/` — Depo yönetimi
- `src/app/dashboard/talepler/` — Talepler
- `src/app/dashboard/vardiye/` — Vardiya yönetimi
- `src/app/dashboard/ureticiler/` — Üreticiler
- `src/app/dashboard/finansal/` — Finansal raporlar
- `src/app/dashboard/anomali/` — Anomali tespiti
- `src/app/dashboard/ai-raporlar/` — AI raporları
- `src/app/dashboard/ai-logs/` — AI işlem kayıtları
- `src/app/dashboard/uretici-mesaj/` — Üretici mesaj yönetimi

### Frontend Yardımcı Modüller
- `src/lib/api/client.ts` — API isteklerini yöneten modül
- `src/lib/ai/orchestrator.ts` — AI agent çağrı mantığı
- `src/lib/ai/tools/definitions.ts` — tool definisyonları
- `src/lib/ai/tools/handlers.ts` — frontend araç işleyicileri

### Backend
- `backend/main.py` — FastAPI uygulaması, CORS ve zamanlanmış görevler
- `backend/config.py` — Ortam değişkenleri ve ayar yönetimi
- `backend/database.py` — Supabase bağlantısı
- `backend/models/` — Pydantic veri modelleri
- `backend/routers/` — API route’ları
- `backend/services/` — AI, orchestrator, logger, anomaly logic
- `backend/tools/` — Gemini tool tanımları ve handler’lar

---

## AI Özellikleri

- Otomatik stok durumu analizi ve kritik eşik tespiti
- Görev atama ve yönetim
- Üretici mesajlarının AI ile yorumlanması
- Günlük / haftalık rapor üretimi
- AI işlem kayıtlarının `ai_logs` tablosuna kaydedilmesi

---

## Gemini AI Ajan Mimarisi

- `backend/services/gemini_client.py` ile Gemini modeli yapılandırılır.
- `backend/services/orchestrator.py` AI agent döngüsünü yönetir.
- Frontend tarafında `src/lib/ai/orchestrator.ts` AI isteklerini işler.
- Ajan, AI tool calling aracılığıyla gerçek veri bağlantısı sağlar.

---

## Tool Calling Mantığı

1. Kullanıcı isteği veya zamanlayıcı çağrısı başlar.
2. Gemini AI, tool çağırması gerektiğinde ilgili fonksiyonu seçer.
3. `backend/tools/definitions.py` tanımları kullanılır.
4. `backend/tools/handlers.py` tool sonuçlarını üretir.
5. AI, sonucu tekrar değerlendirip nihai yanıt üretir.

---

## WhatsApp / Üretici Mesaj Akışı

1. Üretici WhatsApp mesajı gönderir.
2. Twilio mesajı `POST /api/webhook/whatsapp` endpoint’ine iletir.
3. Backend mesajı analiz eder ve gerekirse AI ile işleme sokar.
4. Kritik stok, üretici talebi veya üretim durumu kontrol edilir.
5. Elde edilen sonuçlar `ai_logs` ve ilgili süreç kayıtlarına yansıtılır.

---

## Zamanlanmış Ajanlar

`backend/main.py` içinde APScheduler ile şu zamanlanmış işler çalışır:

- `07:00` — Sabah briefing
- `22:00` — Akşam özeti
- Pazartesi `08:00` — Haftalık rapor
- Her saat — Onay timeout kontrolü
- Her 6 saatte — İsraf önleme kontrolü
- Her 30 dakikada — Kritik stok kontrolü

---

## Kullanılan Teknolojiler

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- FastAPI
- Python 3.11+
- Supabase / PostgreSQL
- Google Gemini
- Twilio WhatsApp
- APScheduler
- Pydantic Settings

---

## Proje Klasör Yapısı

```text
CoopNet/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── models/
│   ├── routers/
│   ├── services/
│   └── tools/
├── src/
│   └── app/
│       ├── dashboard/
│       ├── invite/
│       ├── login/
│       └── onboarding/
├── src/lib/
├── supabase_schema.sql
├── PROJE.md
├── package.json
├── .env.example
└── README.md
```

---

## Supabase Veritabanı Tabloları

Öne çıkan tablolar:

- `products` — depo ürünleri, stok ve kapasite bilgisi
- `tasks` — görev takibi
- `requests` — sipariş talepleri
- `producers` — üretici bilgileri
- `ai_logs` — AI kararları ve olay kayıtları
- `employees` — çalışan bilgiler
- `dashboard_stats` — dashboard KPI verileri
- `ai_reports` — AI rapor öğeleri
- `stk_alerts` — israf ve kritik stok uyarıları
- `financial_stats` — finansal göstergeler

---

## API Endpointleri

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/stock/all`
- `GET /api/dashboard/trends`
- `PATCH /api/dashboard/tasks/{task_id}`

### Producers
- `GET /api/producers`

### Cron
- `GET /api/cron/stock-check`
- `GET /api/cron/daily-summary`
- `GET /api/cron/anomaly-check`
- `GET /api/cron/generate-daily-report`
- `GET /api/cron/morning-briefing`
- `GET /api/cron/evening-summary`
- `GET /api/cron/weekly-briefing`

### AI
- `POST /api/ai/chat`
- `POST /api/ai/daily-summary`
- `POST /api/ai/weekly-insight`
- `POST /api/ai/draft-email`
- `POST /api/ai/draft-notification`
- `GET /api/ai/logs`
- `GET /api/ai/reports`
- `GET /api/ai/decisions`

### Harvest / WhatsApp
- `POST /api/harvest/analyze`
- `GET /api/harvest/messages`
- `POST /api/webhook/whatsapp`
- `POST /api/webhook/whatsapp/demo`

### Approvals
- `GET /api/approvals`
- `POST /api/approvals/{approval_id}/approve`
- `POST /api/approvals/{approval_id}/reject`
- `GET /api/approvals/timeout-check`

---

## Environment Değişkenleri

Örnek `.env` içeriği:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CRON_SECRET=your_cron_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=your_twilio_whatsapp_number
MANAGER_WHATSAPP=your_manager_whatsapp_number
```

> Gizli anahtarları README'ye yazmayın.

---

## Kurulum Adımları

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/aslanbaris13/CoopNet.git
   cd CoopNet
   ```
2. Frontend bağımlılıklarını yükleyin:
   ```bash
   npm install
   ```
3. Backend bağımlılıklarını yükleyin:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
4. `.env` dosyanızı oluşturun veya kök dizindeki `.env.example`’i kullanın.
5. Supabase veritabanını `supabase_schema.sql` ile eşleyin.

---

## Backend Çalıştırma

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Sağlık kontrolü için:

```bash
curl http://localhost:8000/health
```

---

## Frontend Çalıştırma

```bash
cd ..
npm run dev
```

Sonra tarayıcıda:

```text
http://localhost:3000
```

---

## Ngrok / Dış Erişim

WhatsApp webhook testi için yerel backend’i tünelleyin:

```bash
ngrok http 8000
```

Sonra Twilio webhook URL’sini şu şekilde ayarlayın:

```text
https://<tunnel-id>.ngrok-free.app/api/webhook/whatsapp
```

---

## Demo Akışı

1. Backend ve frontend’i çalıştırın.
2. `http://localhost:3000` adresinde uygulamayı açın.
3. Login sonrası dashboard ve modülleri inceleyin.
4. `POST /api/webhook/whatsapp/demo` ile WhatsApp simülasyonunu test edin.
5. `GET /api/cron/morning-briefing` gibi endpoint’lerle zamanlanmış akışları kontrol edin.

---

## Git Branch Akışı

Önerilen dal stratejisi:

- `main` / `master` — üretim kodu
- `develop` — geliştirme dalı
- `feature/<özellik-ismi>` — yeni özellikler
- `fix/<issue-ismi>` — hata düzeltmeleri
- `hotfix/<acil-isim>` — acil düzeltme

Pull request sürecinde kod incelemesi ve test önerilir.

---

## Güvenlik Notları

- `.env` dosyasını sürüm kontrolüne eklemeyin.
- Gizli anahtarları açık kaynakta paylaşmayın.
- Supabase ve Twilio URL’lerini güvenli tünelleme ile kullanın.
- Gemini API kullanımını kota ve maliyet açısından izleyin.
- Üretim ortamında HTTPS, güvenli CORS ve güçlü kimlik doğrulama kullanın.

---

## Özet

CoopNet, tarımsal kooperatiflerin iş süreçlerini AI destekli bir panel ile bütünleştirir. Frontend, backend ve zamanlanmış ajanlar birlikte çalışarak süreci uçtan uca yönetir.
