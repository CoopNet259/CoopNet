<<<<<<< HEAD
﻿# CoopNet

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
=======
# 🌿 CoopNet

<p align="center">
  <strong>Tarım kooperatifleri için yapay zeka destekli operasyon, stok ve görev yönetim platformu.</strong>
</p>

<p align="center">
  Developed by  
  <br />
  <a href="https://github.com/zeynep0zge"><strong>Zeynep Özge</strong></a> ·
  <a href="https://github.com/aslanbaris13"><strong>Barış Aslan</strong></a>
</p>

---

CoopNet; depo yönetimi, talep takibi, üretici iletişimi, vardiya bazlı görev atama, finansal görünürlük, anomali tespiti, AI raporları ve WhatsApp üzerinden gelen hasat mesajlarını **tek bir sistemde** birleştirir.

Yalnızca veri gösteren bir panel değil — gerçek veriye bağlanan, tool calling ile aksiyon alabilen, kararlarını loglayan ve kooperatif yöneticisine operasyonel öneriler sunan **proaktif bir AI ajan mimarisi** üzerine kurulmuştur.
---

## 📋 İçindekiler

- [Projenin Amacı](#projenin-amacı)
- [Çözülen Problem](#çözülen-problem)
- [Hedef Kullanıcı](#hedef-kullanıcı)
- [Kullanıcı Akışı](#kullanıcı-akışı)
- [Temel Özellikler](#temel-özellikler)
- [Sayfalar ve Modüller](#sayfalar-ve-modüller)
- [Sistem Mimarisi](#sistem-mimarisi)
- [AI Ajan Mimarisi](#ai-ajan-mimarisi)
- [Tool Calling Mantığı](#tool-calling-mantığı)
- [WhatsApp / Üretici Mesaj Akışı](#whatsapp--üretici-mesaj-akışı)
- [Vardiya ve Görev Atama Akışı](#vardiya-ve-görev-atama-akışı)
- [Zamanlanmış Ajanlar](#zamanlanmış-ajanlar)
- [Supabase Veritabanı Yapısı](#supabase-veritabanı-yapısı)
- [API Endpointleri](#api-endpointleri)
- [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
- [Proje Klasör Yapısı](#proje-klasör-yapısı)
- [Kurulum](#kurulum)
- [Güvenlik Notları](#güvenlik-notları)
- [Proje Vizyonu](#proje-vizyonu)

---

## 🎯 Projenin Amacı

CoopNet, tarımsal kooperatiflerin günlük operasyonlarını dijitalleştirerek daha hızlı, izlenebilir ve karar destekli bir yapıya taşımayı hedefler.

Sistem özellikle şu alanlara odaklanır:

- Stok ve depo durumunu merkezi olarak takip etmek
- Üreticilerden gelen hasat mesajlarını otomatik analiz etmek
- Talep, stok ve üretici bilgisini aynı operasyon akışında birleştirmek
- Kritik stok ve israf risklerini erken tespit etmek
- Vardiyadaki uygun çalışana otomatik görev atamak
- Günlük, akşam ve haftalık AI raporları üretmek
- AI kararlarını loglayarak denetlenebilir bir yapı oluşturmak

---

## 🔧 Çözülen Problem

Tarım kooperatiflerinde günlük işleyiş çoğu zaman manuel ve dağınık ilerler:

| Sorun | Sonucu |
|---|---|
| Stok bilgileri Excel, kağıt veya sözlü bildirimlerle takip edilir | Gecikmeli ve hatalı stok verisi |
| Üretici iletişimi WhatsApp ve telefona dağılır | Bilgiler kaybolur, takip edilemez |
| Depo görevleri manuel atanır | Zaman kaybı, insan hatası |
| Kritik stok seviyeleri geç fark edilir | Tedarik krizleri oluşur |
| Son kullanım tarihi yaklaşan ürünler takip edilemez | İsraf ve finansal kayıp |
| Talepler, stoklar ve üretici kapasitesi birlikte yorumlanamaz | Kötü karar kalitesi |
| AI kararları kayıt altına alınmaz | Denetlenemez otomasyon |

**CoopNet**, bu problemleri merkezi, akıllı ve denetlenebilir bir platformla çözer.

---

## 👤 Hedef Kullanıcı

CoopNet, tarım ve gıda kooperatifleri için tasarlanmıştır.

**Ana kullanıcı:** Kooperatif sahibi / Kooperatif yöneticisi

Depo, üretici, vardiya ve çalışan bilgileri operasyonel modüller olarak sisteme entegredir. Ana panel, kooperatif yöneticisinin tüm süreci tek ekrandan izlemesi ve yönetmesi için tasarlanmıştır.

---

## 🔄 Kullanıcı Akışı

```
Onboarding
    ↓
Giriş Yap / CoopNet'ten Davet İste
    ↓
Login
    ↓
Kooperatif Dashboard
    ↓
Depo · Talepler · Üreticiler · Finansal Raporlar
Anomali · AI Raporları · AI Logs · Üretici Mesaj · Vardiya
```
>>>>>>> d5461e8fa84363311f5b4ec81c6a2848401db055

1. Kullanıcı uygulamayı açar; CoopNet marka deneyimiyle karşılaşır.
2. Hesabı varsa login sayfasına geçer, yoksa davet talep formuna yönlenir.
3. Başarılı girişin ardından dashboard açılır.
4. Kooperatif yöneticisi tüm operasyonu tek panelden yönetir.

---

## ✨ Temel Özellikler

| Kategori | Özellikler |
|---|---|
| **Kullanıcı Deneyimi** | Modern onboarding, Supabase Auth, davet talep akışı |
| **Operasyon** | Depo/stok yönetimi, talep takibi, üretici yönetimi |
| **AI & Otomasyon** | Gemini destekli chat ajanı, tool calling, NLP parser, regex fallback |
| **Raporlama** | Günlük/akşam/haftalık AI raporları, anomali tespiti, finansal görünürlük |
| **Entegrasyonlar** | WhatsApp (Twilio), vardiya tabanlı görev atama |
| **Güvenlik & Denetim** | AI karar logları, audit trail, denetlenebilir otomasyon kayıtları |
| **Altyapı** | Supabase PostgreSQL, zamanlanmış ajanlar (APScheduler) |

---

## 📄 Sayfalar ve Modüller

### Onboarding — `/`

İlk karşılama ekranı. CoopNet marka girişi, yeşil-beyaz tarım teması, dinamik arka plan. Giriş yap ve davet iste yönlendirmeleri içerir.

---

### Login — `/login`

Kooperatif hesabıyla sisteme giriş. Supabase Auth entegrasyonu, email/şifre doğrulama, hata mesajı yönetimi.

---

### Davet Talep — `/invite`

Hesabı olmayan kooperatiflerin sisteme dahil olmak için başvuru bıraktığı sayfa.

---

### Dashboard — `/dashboard`

Kooperatifin ana yönetim ekranı.

- KPI kartları ve kritik stok bilgileri
- Bugünün talepleri ve görevleri
- Üretici önerileri ve AI özetleri
- Bildirim alanı ve genel operasyon görünümü

---

### Depo — `/dashboard/depo`

Stok ve depo durumunun takip edildiği sayfa.

- Ürün kartları, mevcut stok miktarı, kapasite bilgisi
- Doluluk oranı, kritik eşik kontrolü, stok uyarıları

---

### Talepler — `/dashboard/talepler`

Müşteri talepleri ve sipariş durumlarının takibi.

- Bekleyen ve onaylanan talepler
- Ürün/miktar/saat bilgileri, talep trendleri
- İsraf önleme bağlantılı yönlendirmeler

---

### Üreticiler — `/dashboard/ureticiler`

Kooperatifin üretici ağını gösterir. Talebe göre üreticiler, genel üreticiler ve kardeş üreticiler olmak üzere üç bölümden oluşur.

---

### Finansal Raporlar — `/dashboard/finansal`

Kooperatifin finansal durumu ve AI yorumları. Finansal KPI değerleri, gelir/gider özetleri ve AI destekli finansal yorumlar içerir.

---

### Anomali — `/dashboard/anomali`

Kooperatif işleyişindeki olağan dışı durumların görüntülendiği sayfa.

Örnek anomaliler: beklenmeyen stok düşüşü, ani talep artışı, lojistik gecikme, kritik görev birikmesi, israf riski.

---

### AI Raporları — `/dashboard/ai-raporlar`

AI tarafından üretilen raporların görüntülendiği sayfa.

- Sabah aksiyon planı (07:00)
- Gün sonu özeti (22:00)
- Haftalık içgörü (Pazartesi 08:00)
- AI önerileri, tedarikçi e-posta ve bildirim taslakları

---

### AI Logs — `/dashboard/ai-logs`

AI tarafından yapılan işlemlerin denetlenebilir kaydı.

- AI işlem geçmişi, aksiyon logları
- Uyarılar, otomasyon kayıtları
- Karar nedenleri ve etki açıklamaları

---

### Üretici Mesaj — `/dashboard/uretici-mesaj`

WhatsApp'tan gelen hasat mesajlarının yönetildiği sayfa.

Sistem bu mesajı AI ile parse eder, ürünleri çıkarır, stok durumunu kontrol eder ve aksiyon üretir.

```
Örnek mesaj: "50 kg biber ve 30 kg domates hasat ettim."
```

---

### Vardiya ve Çalışanlar — `/dashboard/vardiye` · `/dashboard/calisanlar`

Vardiya bazlı görev atama ve çalışan yönetimi.

---

## 🏗️ Sistem Mimarisi

CoopNet dört ana katmandan oluşur:

```
Frontend  →  Next.js + React + TypeScript
Backend   →  FastAPI + Python
Database  →  Supabase PostgreSQL + Auth
AI Layer  →  Google Gemini + Tool Calling
```

### Genel Veri Akışı

```
Kullanıcı / Üretici / Cron
        ↓
Frontend veya Webhook
        ↓
FastAPI Backend
        ↓
Gemini AI Agent
        ↓
Tool Calling
        ↓
Supabase Veritabanı
        ↓
Görev / Bildirim / Rapor / Log
```

Tüm sayfalarda ortak gerçek zamanlı bildirim sistemi bulunur; belirli aralıklarla kritik stok, bekleyen onay ve acil görev bilgilerini alır.

---

## Sayfalar ve Modüller

<<<<<<< HEAD
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

=======
Gemini üç farklı amaçla kullanılır:

### 1. Chat Ajanı

Kullanıcı soru sorar → Gemini uygun tool'u belirler → Supabase'den gerçek veri alınır → Türkçe yanıt üretilir.

Maksimum 5 tur tool-call döngüsü desteklenir.

### 2. NLP Parser

WhatsApp'tan gelen serbest metin mesajlarını yapılandırılmış JSON'a dönüştürür.

**Giriş:**
```
50 kg biber ve 30 kg domates hasat ettim.
```

**Çıktı:**
```json
[
  { "product": "biber",   "quantity": 50, "confidence": 0.95 },
  { "product": "domates", "quantity": 30, "confidence": 0.92 }
]
```

**Güvenlik mekanizmaları:**
- `confidence < 0.5` → "Anlayamadım" yanıtı
- Gemini timeout → Regex parser fallback

### 3. Rapor Yazıcı

Yapılandırılmış kooperatif verileri (stoklar, siparişler, görevler, ajan kararları) Gemini'ye gönderilir. Çıktı olarak Türkçe markdown raporlar üretilir ve `ai_reports` tablosuna kaydedilir.

---

## 🛠️ Tool Calling Mantığı

AI ajanı gerçek operasyon verisine ulaşmak için aşağıdaki tool'ları çağırır:

| Tool | Açıklama |
|---|---|
| `get_stock(product_name)` | Ürünün mevcut stok miktarını ve birimini getirir |
| `check_threshold(product_name)` | Kritik stok eşiğini ve doluluk oranını kontrol eder |
| `get_daily_orders(date)` | Belirli tarihteki siparişleri listeler |
| `assign_task(role, title, priority)` | Vardiyedeki çalışana görev atar |
| `update_stock(product_name, delta, reason)` | Stok miktarını günceller |
| `get_sales_forecast(product_name, days)` | Geçmiş siparişlerden talep tahmini üretir |
| `send_notification(role, title, message)` | İlgili role sistem bildirimi gönderir |

**Tool calling akışı:**
```
AI karar verir → Tool çağrılır → Backend handler çalışır
      ↓
Supabase verisi alınır/güncellenir → Sonuç AI'a döner → AI nihai yanıt üretir
```

---

## 📱 WhatsApp / Üretici Mesaj Akışı

```
Üretici WhatsApp mesajı
        ↓
Twilio Webhook
        ↓
FastAPI /api/webhook/whatsapp
        ↓
Telefon numarası employees tablosunda doğrulanır
        ↓
Gemini NLP Parser → Çoklu ürün parse
        ↓
Stok Karar Motoru
        ↓
Görev / Onay / Red / Log
```

### Stok Karar Mantığı

| Stok Seviyesi | Aksiyon |
|---|---|
| **> %75** | Ürüne şu an ihtiyaç yok → Karar loglanır |
| **%25 – %75** | `pending_approvals` tablosuna düşer → Yöneticiye bildirim → 12 saatlik onay süreci |
| **< %25** | Otomatik kabul → Depo görevi açılır → Yönetici ve çalışana bildirim → Üreticiye kabul mesajı |

Her karar `agent_decisions` tablosuna kaydedilir.

---

## 📅 Vardiya ve Görev Atama Akışı

AI veya sistem bir görev oluşturmak istediğinde:

```
assign_task(role="warehouse")
        ↓
Role → Departman dönüşümü
        ↓
shifts tablosundan aktif vardiya kontrolü
        ↓
Uygun çalışan bulunur
        ↓
tasks tablosuna assigned_to alanıyla görev açılır
        ↓
Görev vardiya sayfasında görünür
```

**Departman eşleştirmeleri:**

| Role | Departman |
|---|---|
| `warehouse` | Depo |
| `logistics` | Lojistik |
| `field` | Tarla |
| `accounting` | Muhasebe |

---

## ⏰ Zamanlanmış Ajanlar

Backend başlatıldığında APScheduler ile ajanlar otomatik olarak devreye girer.

| Ajan | Zamanlama | Görevi |
|---|---|---|
| **Sabah Ajanı** | Her gün 07:00 | Kritik stoklar, bekleyen onaylar, günlük siparişler → sabah aksiyon planı üretir |
| **Akşam Ajanı** | Her gün 22:00 | Tamamlanan görevler, sipariş durumları, ajan kararları → gün sonu özeti üretir |
| **Haftalık Ajan** | Pazartesi 08:00 | Haftalık sipariş trendi, stok değişimi, performans skoru → haftalık rapor üretir |
| **Onay Timeout Ajanı** | Her saat | 12 saati geçen onayları otomatik reddeder, üreticiye bildirim gönderir |
| **Stok Kontrol Ajanı** | Her 30 dakika | Kritik stokları tarar, yüksek öncelikli görev açar, kararı loglar |
| **İsraf Önleme Ajanı** | Her 6 saat | Son kullanım tarihi 3 gün içinde olan ürünleri bulur, kardeş üreticiye teklif oluşturur |

---

## 🗄️ Supabase Veritabanı Yapısı

| Tablo | Açıklama |
|---|---|
| `products` | Ürünler, stok seviyeleri, fiyatlar, son kullanım tarihi |
| `requests` | Müşteri siparişleri ve durumları |
| `tasks` | Görevler ve `assigned_to` ile çalışan bağlantısı |
| `employees` | Personel listesi, departman, rol, telefon, avatar |
| `shifts` | Haftalık vardiya takvimi |
| `pending_approvals` | Yönetici onay kuyruğu ve 12 saat timeout |
| `harvest_messages` | WhatsApp'tan gelen hasat bildirimleri |
| `agent_decisions` | AI ajan kararlarının audit log kaydı |
| `ai_reports` | Sabah, akşam ve haftalık AI raporları |
| `ai_logs` | Chat, harvest ve cron işlem kayıtları |
| `waste_offers` | İsraf önleme teklifleri |
| `producers` | Üretici bilgileri |
| `financial_stats` | Finansal KPI değerleri |
| `dashboard_stats` | Dashboard istatistikleri |
| `stk_alerts` | İsraf ve kritik stok uyarıları |

---

## 🔌 API Endpointleri

### Dashboard
```
GET    /api/dashboard/summary
GET    /api/dashboard/stock/all
GET    /api/dashboard/trends
PATCH  /api/dashboard/tasks/{task_id}
```

### Notifications & Producers
```
GET    /api/notifications
GET    /api/producers
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
POST   /api/approvals/{approval_id}/approve
POST   /api/approvals/{approval_id}/reject
GET    /api/approvals/timeout-check
```

### Cron
```
GET    /api/cron/stock-check
GET    /api/cron/daily-summary
GET    /api/cron/anomaly-check
GET    /api/cron/generate-daily-report
GET    /api/cron/morning-briefing
GET    /api/cron/evening-summary
GET    /api/cron/weekly-briefing
```

### Health
```
GET    /health
```

---

## 💻 Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| **Frontend** | Next.js, React, TypeScript |
| **Styling** | Tailwind CSS / PostCSS |
| **Backend** | FastAPI, Python |
| **Validation** | Pydantic |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth |
| **AI** | Google Gemini Flash / Pro |
| **Messaging** | Twilio WhatsApp |
| **Scheduler** | APScheduler |
| **Tunnel** | Ngrok / Cloudflared |
| **Deployment** | Vercel / Render |
| **Version Control** | Git / GitHub |

---

## 📁 Proje Klasör Yapısı

```
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
│   ├── app/
│   │   ├── onboarding/
│   │   ├── login/
│   │   ├── invite/
│   │   ├── dashboard/
│   │   └── api/
│   └── lib/
│       └── api/
│           └── client.ts
├── supabase_schema.sql
├── seed_ai_reports.sql
├── seed_historical_data.sql
├── package.json
├── next.config.ts
├── vercel.json
├── README.md
└── PROJE.md
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

### 3. Backend Sanal Ortamını Kur

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
python -m pip install -r requirements.txt
```

Eksik paket hatası alınırsa:
```powershell
python -m pip install apscheduler python-multipart
```

### 4. Environment Dosyalarını Oluştur

**Frontend** — proje ana dizininde `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CRON_SECRET=your_cron_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** — `backend/.env`:
>>>>>>> d5461e8fa84363311f5b4ec81c6a2848401db055
```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CRON_SECRET=your_cron_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=your_twilio_whatsapp_number
MANAGER_WHATSAPP=your_manager_whatsapp_number
<<<<<<< HEAD
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
=======
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Supabase Şemasını Kur

`supabase_schema.sql` dosyasını Supabase SQL Editor üzerinde çalıştır. Gerekirse seed dosyalarını da çalıştır:

```
seed_ai_reports.sql
seed_historical_data.sql
```

### 6. Backend'i Başlat

```powershell
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

- Dokümantasyon: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 7. Frontend'i Başlat

```powershell
npm run dev
```

Uygulama: `http://localhost:3000`

### 8. (Opsiyonel) Ngrok ile Dış Erişim

WhatsApp webhook veya dış test için:

```powershell
ngrok http 8000
```

Twilio webhook URL'ini şu şekilde ayarla:
```
https://xxxxx.ngrok-free.app/api/webhook/whatsapp
>>>>>>> d5461e8fa84363311f5b4ec81c6a2848401db055
```

---

<<<<<<< HEAD
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
=======
## 🚀 Demo Akışı

1. Backend'i başlat → Frontend'i başlat
2. Onboarding ekranını aç
3. Login ekranından giriş yap
4. **Dashboard** → genel operasyon görünümünü incele
5. **Depo** → stok durumunu kontrol et
6. **Talepler / Üreticiler** → operasyon akışını gözlemle
7. **Anomali** → olağan dışı durumları gör
8. **AI Raporları** → günlük/haftalık AI çıktılarını incele
9. **AI Logs** → AI kararlarını ve loglarını takip et
10. **Üretici Mesaj** → WhatsApp demo hasat mesajını test et
11. **Vardiya** → görev atama akışını gözlemle

---

## 🌿 Git Branch Akışı

| Branch | Amaç |
|---|---|
| `main` | Production / stable |
| `develop` | Aktif geliştirme |
| `feature/*` | Yeni özellikler |
| `fix/*` | Hata düzeltmeleri |

```bash
# Yeni özellik başlatmak için
git checkout develop
git pull origin develop
git checkout -b feature/feature-name

# Değişiklik sonrası
git add .
git commit -m "Açıklayıcı commit mesajı"
git push origin feature/feature-name
```

---

## 🔒 Güvenlik Notları

- `.env`, `.env.local` ve API key içeren dosyalar **asla GitHub'a gönderilmemelidir**
- Gemini API key ve Twilio auth token gizli tutulmalıdır
- Supabase RLS politikaları doğru yapılandırılmalıdır
- Cron endpointleri `CRON_SECRET` ile korunmalıdır
- WhatsApp webhook endpointleri dışa açık olduğu için doğrulama ve logging zorunludur
- AI kararları `agent_decisions` ve `ai_logs` tablolarında denetlenebilir şekilde tutulmalıdır
- Production ortamında HTTPS, güvenli CORS ve güçlü kimlik doğrulama kullanılmalıdır

---

## 🌱 Proje Vizyonu

CoopNet, kooperatiflerin manuel, dağınık ve gecikmeli operasyon süreçlerini merkezi, akıllı ve denetlenebilir bir platforma dönüştürmeyi hedefler.

Kooperatif yöneticisi yalnızca mevcut durumu görmekle kalmaz; AI tarafından önerilen aksiyonları, kritik stok uyarılarını, üretici mesajlarını, görev atamalarını ve operasyon raporlarını **tek panelden** yönetir.

> **Kooperatifler için yapay zeka destekli, proaktif, güvenilir ve uygulanabilir bir operasyon merkezi oluşturmak.**
>>>>>>> d5461e8fa84363311f5b4ec81c6a2848401db055
