# 🌱 CoopNet — AI-Powered Cooperative Management System

> **Üreten Kadınlar Kooperatifi** için geliştirilmiş, yapay zeka destekli kooperatif yönetim platformu.  
> Stok takibi, görev delegasyonu, vardiye yönetimi ve üretici iletişimini tek çatı altında toplar.

---

## 📸 Ekran Görüntüleri

### Ana Sayfa — Anlık Durum Paneli
![Ana Sayfa](docs/screenshots/dashboard.png)

### Depo Yönetimi — Gerçek Zamanlı Stok Takibi
![Depo](docs/screenshots/depo.png)

### Vardiye Sistemi — Haftalık Takvim
![Vardiye](docs/screenshots/vardiye.png)

### Anomali Tespiti — AI Destekli Uyarılar
![Anomali](docs/screenshots/anomali.png)

### Üretici Mesajlaşma — WhatsApp Entegrasyonu
![Üretici Mesaj](docs/screenshots/uretici-mesaj.png)

### AI Logs — Ajan Karar Kayıtları
![AI Logs](docs/screenshots/ai-logs.png)

---

## 🎯 Problem & Çözüm

**Problem:** Tarımsal kooperatifler stok takibini manuel Excel tablolarıyla, görev atamalarını telefon/WhatsApp zinciriyle, üretici koordinasyonunu da kağıt kayıtlarla yürütüyor. Bu süreçler hata prone, yavaş ve izlenemez.

**CoopNet Çözümü:** Tek bir AI ajanı tüm kooperatif iş akışını izler. Kritik stok seviyesini tespit ettiğinde otomatik görev oluşturur, doğru vardiyedeki çalışana atar ve WhatsApp üzerinden üreticiye bildirim gönderir — hiçbir manuel müdahale gerekmez.

---

## ✨ Özellikler

| Modül | Açıklama |
|-------|----------|
| 📊 **Ana Sayfa** | Stok uyarıları, bugünün talepleri, açık görevler — tek ekranda |
| 🏭 **Depo Yönetimi** | Gerçek zamanlı stok seviyeleri, kritik uyarı sistemi, talep öngörüsü |
| 📅 **Vardiye Sistemi** | Haftalık takvim, "Şu an görevde" görünümü, otomatik görev atama |
| 👥 **Çalışanlar** | Personel listesi, departman filtreleme, vardiye durumu |
| ⚠️ **Anomali Tespiti** | AI destekli stok/sipariş anomalileri, otomatik yenileme |
| 📈 **Talepler & İsraf Önleme** | Talep trendleri, son kullanım tarihi yakın ürün uyarıları, WhatsApp bildirimi |
| 👩‍🌾 **Üreticiler** | Kardeş üretici ağı, talep karşılama haritası |
| 💬 **Üretici Mesaj** | WhatsApp entegrasyonu, hasat onay sistemi, yönetici akışı |
| 💰 **Finansal Raporlar** | Gelir/gider özeti, haftalık performans, yapay zeka öngörüleri |
| 🤖 **AI Raporlar** | Sabah/akşam briefing'leri, haftalık özetler |
| 📋 **AI Logs** | Tüm ajan kararlarının şeffaf kaydı |
| 🔔 **Bildirimler** | Gerçek zamanlı bildirimler: kritik stok + bekleyen onay + acil görevler |

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 14 Frontend                │
│         (TypeScript · App Router · CSS Modules)      │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  AI Ajan │  │ Vardiye  │  │  Bildirimler       │ │
│  │ (Gemini) │  │  Router  │  │  Router            │ │
│  └────┬─────┘  └────┬─────┘  └────────────────────┘ │
│       │              │                               │
│  ┌────▼──────────────▼───────────────────────────┐  │
│  │           APScheduler (Zamanlanmış Görevler)  │  │
│  │  07:00 Sabah Briefing · 22:00 Akşam Özeti    │  │
│  │  Her 30dk Stok Kontrolü · Her 6s İsraf Takibi │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    Supabase                          │
│     PostgreSQL · Row Level Security · Realtime       │
│                                                      │
│  products · requests · tasks · employees · shifts    │
│  pending_approvals · harvest_messages · ai_logs      │
└─────────────────────────────────────────────────────┘
```

---

## 🤖 AI Ajan Mimarisi

**Single LLM + Tool Calling** yaklaşımı:

```
Kullanıcı / Zamanlayıcı
        ↓
   Gemini Flash
        ↓ Tool Call
  ┌─────────────────────────────────────┐
  │  assign_task(role, title, priority) │  → Vardiyedeki çalışana atar
  │  get_stock_status()                 │  → Kritik stok sorgular
  │  create_order(product, qty)         │  → Sipariş oluşturur
  │  send_whatsapp(producer, message)   │  → WhatsApp bildirim gönderir
  │  check_anomalies()                  │  → Anomali tespit eder
  └─────────────────────────────────────┘
        ↓
   Supabase DB
```

AI ajanı görev atarken **vardiye sistemini** kontrol eder:
`assign_task(role="warehouse")` → o an depo vardiyesindeki çalışanı bulur → görevi ona atar.

---

## 🛠️ Teknoloji Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- CSS Modules (custom design system)

**Backend**
- Python / FastAPI
- APScheduler (zamanlanmış görevler)
- Google Gemini Flash (AI ajan)

**Veritabanı & Servisler**
- Supabase (PostgreSQL + Auth + RLS)
- Twilio (WhatsApp Business API)

---

## 👩‍💼 Hedef Kullanıcı

**Üreten Kadınlar Kooperatifi** — Türkiye'deki tarımsal kadın kooperatifleri.  
Günlük 50–200 kg ürün yönetimi, 5–20 aktif üretici, 3–8 kooperatif çalışanı.

---

## 🏆 Hackathon

Bu proje **[Hackathon Adı]** kapsamında geliştirilmiştir.

**Takım:** Barış Aslan  
**Kategori:** AI for Social Good / AgriTech
