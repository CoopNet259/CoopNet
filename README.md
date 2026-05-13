# 🌿 CoopNet

<p align="center">
  <strong>Tarım kooperatifleri için yapay zeka destekli operasyon, stok ve görev yönetim platformu.</strong>
</p>

<p align="center">
  <a href="https://coopnet-production.up.railway.app"><strong>🚀 Canlı Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://coopnet-backend-production.up.railway.app/docs"><strong>📡 API Dokümantasyonu</strong></a>
</p>

<p align="center">
  Developed by
  <br />
  <a href="https://github.com/zeynep0zge"><strong>Zeynep Özge</strong></a> ·
  <a href="https://github.com/aslanbaris13"><strong>Barış Aslan</strong></a>
</p>

<p align="center">
  <code>Demo Giriş:</code> &nbsp;
  E-posta: <code>admin@uretenkadin.coop</code> &nbsp;·&nbsp;
  Şifre: <code>kooperatif2026</code>
</p>

---

## 🎯 Problem & Çözüm

Tarım kooperatifleri günlük operasyonlarını büyük ölçüde manuel yürütür: stok takibi Excel'de, üretici iletişimi WhatsApp'ta, görev dağılımı sözlü. Bu dağınık yapı; geç fark edilen stok krizlerine, kaybolan mesajlara, insan hatalarına ve ölçeklenme güçlüğüne zemin hazırlar.

**CoopNet**, bu süreçleri uçtan uca dijitalleştiren, yapay zeka ile proaktif karar alan ve aksiyonlarını denetlenebilir şekilde loglayan bir kooperatif yönetim platformudur.

Yalnızca veri gösteren bir panel değil — **gerçek veriye bağlanan, tool calling ile aksiyon alabilen, kararlarını loglayan ve kooperatif yöneticisine operasyonel öneriler sunan proaktif bir AI ajan mimarisi** üzerine kurulmuştur.

---

## 📋 İçindekiler

- [Temel Özellikler](#-temel-özellikler)
- [Sistem Mimarisi](#-sistem-mimarisi)
- [AI Ajan Mimarisi](#-ai-ajan-mimarisi)
- [WhatsApp Entegrasyonu](#-whatsapp-entegrasyonu)
- [Zamanlanmış Ajanlar](#-zamanlanmış-ajanlar)
- [Veritabanı Yapısı](#-veritabanı-yapısı)
- [API Endpointleri](#-api-endpointleri)
- [Kullanılan Teknolojiler](#-kullanılan-teknolojiler)
- [Kurulum](#-kurulum)

---

## ✨ Temel Özellikler

| Alan | Özellik |
|---|---|
| **Stok & Depo** | Gerçek zamanlı stok takibi, kritik eşik uyarıları, doluluk oranı |
| **Sipariş & Talepler** | Müşteri talepleri, onay kuyruğu, 12 saat timeout mekanizması |
| **WhatsApp Otomasyonu** | Üreticinin hasat mesajını AI ile parse et → stok güncelle → görev aç |
| **İsraf Önleme** | Son kullanım tarihi yaklaşan ürünleri tespit et → kardeş üreticiye teklif ilet |
| **AI Raporları** | Sabah briefing, akşam özeti, haftalık içgörü — tamamen otomatik |
| **Anomali Tespiti** | Beklenmeyen stok düşüşü, ani talep artışı, lojistik gecikme |
| **Vardiya & Görev** | Vardiyadaki çalışana otomatik görev atama |
| **Denetim Kaydı** | Her AI kararı `agent_decisions` tablosunda loglanır |

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                      Kullanıcı / Üretici                │
│              (Dashboard · WhatsApp · Cron)              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               Next.js 15 Frontend                       │
│         React · TypeScript · CSS Modules                │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│                FastAPI Backend (Python)                 │
│      Routers · Services · Tools · APScheduler          │
└────────┬─────────────────────────────┬──────────────────┘
         │                             │
┌────────▼────────┐          ┌─────────▼────────┐
│  Supabase       │          │  Google Gemini   │
│  PostgreSQL     │          │  Flash / Pro     │
│  (Veri Katmanı) │          │  (AI Katmanı)    │
└─────────────────┘          └──────────────────┘
                                       │
                             ┌─────────▼────────┐
                             │  Twilio WhatsApp │
                             │  (Mesajlaşma)    │
                             └──────────────────┘
```

### Genel Veri Akışı

```
Kullanıcı / Üretici / Cron Trigger
        ↓
Frontend veya Twilio Webhook
        ↓
FastAPI Backend
        ↓
Gemini AI Agent (Tool Calling döngüsü — maks. 5 tur)
        ↓
Supabase (okuma / yazma)
        ↓
Görev · Bildirim · Rapor · Log
```

---

## 🤖 AI Ajan Mimarisi

Gemini AI üç farklı rolde çalışır:

### 1. Chat Ajanı
Kullanıcı soru sorar → Gemini uygun tool'u seçer → Supabase'den gerçek veri alınır → Türkçe yanıt üretilir.

### 2. NLP Parser
WhatsApp'tan gelen serbest metin mesajlarını yapılandırılmış veriye dönüştürür.

```
Giriş:  "50 kg biber ve 30 kg domates hasat ettim"
Çıkış:  [{ "product": "biber", "quantity": 50, "confidence": 0.95 },
          { "product": "domates", "quantity": 30, "confidence": 0.92 }]
```

Güvenlik mekanizmaları:
- `confidence < 0.5` → "Anlayamadım" yanıtı
- Gemini timeout → Regex parser fallback

### 3. Rapor Yazıcı
Yapılandırılmış kooperatif verisi Gemini'ye gönderilir → Türkçe markdown rapor üretilir → `ai_reports` tablosuna kaydedilir.

### Tool Calling

AI ajanının çağırdığı araçlar:

| Tool | Açıklama |
|---|---|
| `get_stock(product_name)` | Mevcut stok miktarını getirir |
| `check_threshold(product_name)` | Kritik eşik ve doluluk oranını kontrol eder |
| `get_daily_orders(date)` | Belirli tarihteki siparişleri listeler |
| `assign_task(role, title, priority)` | Vardiyadaki çalışana görev atar |
| `update_stock(product_name, delta, reason)` | Stok miktarını günceller |
| `get_sales_forecast(product_name, days)` | Geçmiş veriden talep tahmini üretir |
| `send_notification(role, title, message)` | İlgili role bildirim gönderir |

---

## 📱 WhatsApp Entegrasyonu

```
Üretici WhatsApp mesajı gönderir
        ↓
Twilio → POST /api/webhook/whatsapp
        ↓
Telefon numarası employees tablosunda doğrulanır
        ↓
Gemini NLP Parser → çoklu ürün parse
        ↓
Stok Karar Motoru
```

| Stok Seviyesi | Aksiyon |
|---|---|
| **> %75** | Ürüne ihtiyaç yok → reddedildi olarak loglanır |
| **%25 – %75** | `pending_approvals` tablosuna düşer → yöneticiye bildirim → 12 saat onay süreci |
| **< %25** | Otomatik kabul → depo görevi açılır → üreticiye kabul mesajı |

Her karar `agent_decisions` tablosuna kaydedilir.

---

## ⏰ Zamanlanmış Ajanlar

| Ajan | Zamanlama | Görevi |
|---|---|---|
| **Sabah Ajanı** | Her gün 07:00 | Kritik stoklar + bekleyen onaylar → sabah aksiyon planı |
| **Akşam Ajanı** | Her gün 22:00 | Tamamlanan görevler + sipariş durumları → gün sonu özeti |
| **Haftalık Ajan** | Pazartesi 08:00 | Haftalık trend + performans skoru → haftalık rapor |
| **Onay Timeout** | Her saat | 12 saati geçen onayları otomatik reddeder |
| **Stok Kontrol** | Her 30 dakika | Kritik stokları tarar, görev açar |
| **İsraf Önleme** | Her 6 saat | Son kullanım tarihi yaklaşan ürünleri tespit eder, teklif oluşturur |
| **Tarih Reset** | Pazartesi 00:01 | Ürün raf ömürlerini gerçekçi değerlere resetler |

---

## 🗄️ Veritabanı Yapısı

| Tablo | Açıklama |
|---|---|
| `products` | Ürünler, stok seviyeleri, son kullanım tarihi |
| `requests` | Müşteri siparişleri ve durumları |
| `tasks` | Görevler, atanan çalışan bağlantısı |
| `employees` | Personel, departman, rol, telefon |
| `shifts` | Haftalık vardiya takvimi |
| `pending_approvals` | Yönetici onay kuyruğu, 12 saat timeout |
| `harvest_messages` | WhatsApp hasat bildirimleri |
| `agent_decisions` | AI karar audit log |
| `ai_reports` | Sabah / akşam / haftalık AI raporları |
| `ai_logs` | Chat, harvest ve cron işlem kayıtları |
| `waste_offers` | İsraf önleme teklifleri |
| `producers` | Üretici bilgileri |
| `financial_stats` | Finansal KPI değerleri |

---

## 🔌 API Endpointleri

### Dashboard
```
GET    /api/dashboard/summary
GET    /api/dashboard/stock/all
GET    /api/dashboard/trends
PATCH  /api/dashboard/tasks/{task_id}
```

### AI
```
POST   /api/ai/chat
POST   /api/ai/daily-summary
POST   /api/ai/weekly-insight
POST   /api/ai/draft-email
POST   /api/ai/draft-notification
GET    /api/ai/logs
GET    /api/ai/reports
GET    /api/ai/decisions
GET    /api/ai/dashboard-brief
```

### Harvest / WhatsApp
```
POST   /api/harvest/analyze
GET    /api/harvest/messages
POST   /api/webhook/whatsapp
POST   /api/webhook/whatsapp/demo
```

### Approvals
```
GET    /api/approvals
POST   /api/approvals/{id}/approve
POST   /api/approvals/{id}/reject
```

### Diğer
```
GET    /api/notifications
GET    /api/producers
GET    /api/waste-prevention/scan
GET    /api/anomaly/summary
GET    /api/financial/summary
GET    /api/shifts/schedule
GET    /health
```

---

## 💻 Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Backend** | FastAPI, Python 3.13 |
| **Veritabanı** | Supabase (PostgreSQL) |
| **AI** | Google Gemini Flash / Pro |
| **Mesajlaşma** | Twilio WhatsApp |
| **Zamanlayıcı** | APScheduler |
| **Validation** | Pydantic v2 |
| **Deployment** | Railway (Frontend + Backend) |

---

## 📁 Proje Yapısı

```
CoopNet/
├── backend/
│   ├── main.py              # FastAPI + APScheduler
│   ├── config.py            # Env var yönetimi
│   ├── database.py          # Supabase bağlantısı
│   ├── requirements.txt
│   ├── models/              # Pydantic şemaları
│   ├── routers/             # API route'ları
│   │   ├── ai.py
│   │   ├── dashboard.py
│   │   ├── harvest.py
│   │   ├── whatsapp.py
│   │   ├── approvals.py
│   │   ├── waste_prevention.py
│   │   ├── shifts.py
│   │   ├── financial.py
│   │   └── cron.py
│   ├── services/
│   │   ├── gemini_client.py # Gemini yapılandırması
│   │   ├── orchestrator.py  # AI agent döngüsü
│   │   ├── logger.py        # AI karar loglama
│   │   └── anomaly.py
│   └── tools/
│       ├── definitions.py   # Tool tanımları
│       └── handlers.py      # Tool implementasyonları
├── src/
│   ├── app/
│   │   ├── dashboard/       # Tüm dashboard sayfaları
│   │   ├── login/
│   │   ├── invite/
│   │   └── onboarding/
│   └── lib/
│       └── api/client.ts    # API istemcisi
├── supabase_schema.sql
├── .env.example
└── README.md
```

---

## ⚙️ Kurulum

### 1. Repoyu Klonla

```bash
git clone https://github.com/CoopNet259/CoopNet.git
cd CoopNet
```

### 2. Frontend Bağımlılıklarını Kur

```bash
npm install
```

### 3. Backend Ortamını Kur

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Environment Dosyalarını Oluştur

Frontend — proje ana dizininde `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Backend — `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CRON_SECRET=your_cron_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=+14155238886
MANAGER_WHATSAPP=+90xxxxxxxxxx
```

### 5. Supabase Şemasını Kur

`supabase_schema.sql` dosyasını Supabase SQL Editor'de çalıştır.

### 6. Servisleri Başlat

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend (ayrı terminal)
npm run dev
```

- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`

### 7. WhatsApp Webhook (Opsiyonel)

```bash
ngrok http 8000
# Twilio webhook: https://<id>.ngrok-free.app/api/webhook/whatsapp
```

---

## 🔒 Güvenlik

- `.env` ve `.env.local` asla commit edilmez
- Cron endpointleri `x-cron-secret` header ile korunur
- WhatsApp webhook'ları telefon numarası doğrulaması içerir
- Tüm AI kararları `agent_decisions` tablosunda denetlenebilir şekilde loglanır

---

## 🌱 Proje Vizyonu

CoopNet, kooperatiflerin manuel ve dağınık süreçlerini merkezi, akıllı ve denetlenebilir bir platforma taşır. Yönetici yalnızca mevcut durumu görmekle kalmaz; AI tarafından üretilen aksiyonları, stok uyarılarını, üretici mesajlarını ve görev atamalarını **tek panelden** yönetir.

> Kooperatifler için yapay zeka destekli, proaktif ve uygulanabilir bir operasyon merkezi.

---

## 🤝 Akademik Dürüstlük ve Referanslar

Bu proje R&D ve Hackathon kapsamında sıfırdan geliştirilmiş olup, kullanılan araçlar şeffaf şekilde aşağıdadır:

- **AI Modeli:** Google Gemini (Flash / Pro)
- **Mesajlaşma Entegrasyonu:** Twilio API
- **Veritabanı ve Auth:** Supabase

*Projeye ait tüm AI ajan mimarisi, prompt tasarımları ve FastAPI entegrasyonu ekip tarafından özgün olarak geliştirilmiştir.*
