// ============================================================
// CoopNet — Mock data for the prototype
// ============================================================

const MOCK = {
  cooperative: "Üreten Kadınlar Kooperatif",
  cooperativeShort: "ÜK",
  user: { name: "Aslı Demir", role: "Kooperatif Yöneticisi", initials: "AD" },

  // === DEPO ===
  stock: [
    { id:"DOM-01", name:"Domates",       icon:"🍅", unit:"kg", current: 142,  capacity: 1200, supplier:"Zeynep Hn.", expiresIn: 3, sku:"V-DOM-01", trend:[3,4,3,2,2,1,1] },
    { id:"BIB-01", name:"Sivri Biber",   icon:"🌶️", unit:"kg", current: 88,   capacity: 800,  supplier:"Hatice Hn.", expiresIn: 5, sku:"V-BIB-01", trend:[5,4,5,4,3,2,2] },
    { id:"INC-01", name:"İncir",         icon:"🟣", unit:"kg", current: 24,   capacity: 400,  supplier:"Fadime Hn.", expiresIn: 2, sku:"M-INC-01", trend:[6,5,4,3,2,1,1] },
    { id:"KAY-01", name:"Kayısı",        icon:"🟠", unit:"kg", current: 310,  capacity: 600,  supplier:"Sevim Hn.",  expiresIn: 7, sku:"M-KAY-01", trend:[2,3,3,4,5,5,4] },
    { id:"CIL-01", name:"Çilek",         icon:"🍓", unit:"kg", current: 64,   capacity: 300,  supplier:"Ayşe Hn.",   expiresIn: 4, sku:"M-CIL-01", trend:[2,2,3,3,4,4,3] },
    { id:"PAT-01", name:"Patlıcan",      icon:"🟪", unit:"kg", current: 412,  capacity: 900,  supplier:"Hülya Hn.",  expiresIn: 9, sku:"V-PAT-01", trend:[3,3,4,4,4,5,5] },
    { id:"SAL-01", name:"Salça (kavanoz)", icon:"🫙", unit:"ad",  current: 1420, capacity: 4000, supplier:"Naciye Hn.", expiresIn: 180, sku:"P-SAL-01", trend:[2,2,2,3,3,3,4] },
    { id:"REC-01", name:"Reçel (kavanoz)", icon:"🍯", unit:"ad",  current: 980,  capacity: 3200, supplier:"Nurten Hn.", expiresIn: 240, sku:"P-REC-01", trend:[1,2,2,3,4,4,5] },
  ],

  // === STAFF ===
  staff: [
    { name:"Meryem Yıldız",    role:"Depo Sorumlusu",  status:"on",  shift:"08:00–17:00", initials:"MY" },
    { name:"Sevda Korkmaz",    role:"Sevkiyat",        status:"on",  shift:"09:00–18:00", initials:"SK" },
    { name:"Hatice Aslan",     role:"Kalite Kontrol",  status:"brb", shift:"Mola: 14:00", initials:"HA" },
    { name:"Gülay Öz",         role:"Depo Görevlisi",  status:"off", shift:"İzinli",      initials:"GÖ" },
    { name:"Nazlı Türk",       role:"Depo Görevlisi",  status:"off", shift:"Yarın 08:00", initials:"NT" },
  ],

  // === DEMANDS ===
  demands: [
    { id:"T-2412", customer:"Kadıköy Pazar Yeri",    qty:"180 kg",  product:"Domates",    eta:"Bugün 16:00", status:"hazır",    urgency:"warn" },
    { id:"T-2411", customer:"Beyoğlu Coop Mağaza",   qty:"45 ad",   product:"Salça",      eta:"Bugün 17:30", status:"hazırlanıyor", urgency:"warn" },
    { id:"T-2410", customer:"Şişli Restoran Grubu",  qty:"60 kg",   product:"Sivri Biber",eta:"Bugün 18:00", status:"yeni",     urgency:"urgent" },
    { id:"T-2409", customer:"Üsküdar Halk Pazarı",   qty:"320 kg",  product:"Patlıcan",   eta:"Yarın 09:00", status:"planlı",   urgency:"good" },
    { id:"T-2408", customer:"Ataşehir Catering Co.", qty:"22 ad",   product:"Reçel",      eta:"Yarın 11:00", status:"planlı",   urgency:"good" },
  ],

  trendsUp:   [
    { name:"Sivri Biber", delta:"+34%", note:"3 günlük ortalama" },
    { name:"Salça",       delta:"+22%", note:"Mevsimsel tetikleyici" },
    { name:"Çilek",       delta:"+18%", note:"İstanbul/Anadolu yakası" },
  ],
  trendsDown: [
    { name:"Patlıcan",    delta:"−12%", note:"Geçen haftaya göre" },
    { name:"Kayısı",      delta:"−8%",  note:"Yeni hasat öncesi" },
  ],

  // === PRODUCERS ===
  producers: [
    { name:"Zeynep Çiftçioğlu",  loc:"Antalya / Kumluca",  tags:["Domates","Biber"], rate:98, lead:"1 gün",  active:true,  init:"ZÇ", capacity:"3.2 ton/hafta" },
    { name:"Hatice Aksoy",       loc:"İzmir / Tire",        tags:["Sivri Biber","Patlıcan"], rate:96, lead:"1 gün", active:true, init:"HA", capacity:"2.4 ton/hafta" },
    { name:"Sevim Demirkan",     loc:"Malatya",             tags:["Kayısı"],          rate:99, lead:"2 gün", active:true, init:"SD", capacity:"1.8 ton/hafta" },
    { name:"Fadime Yılmaz",      loc:"Aydın / Germencik",   tags:["İncir"],           rate:94, lead:"2 gün", active:true, init:"FY", capacity:"900 kg/hafta" },
    { name:"Ayşe Korkmaz",       loc:"Mersin",              tags:["Çilek","Limon"],   rate:91, lead:"1 gün", active:false, init:"AK", capacity:"700 kg/hafta" },
    { name:"Hülya Çelik",        loc:"Bursa / İznik",       tags:["Patlıcan","Soğan"],rate:93, lead:"1 gün", active:false, init:"HÇ", capacity:"1.4 ton/hafta" },
  ],
  sisterProducers: [
    { name:"Naciye'nin Salçaları",   tags:["Salça","Konserve"],     match:"Domates fazlası",   loc:"Eskişehir", init:"NS", desc:"Domates fazlasını acı/tatlı salçaya dönüştürür." },
    { name:"Nurten Reçel Atölyesi",  tags:["Reçel","Marmelat"],     match:"İncir, Kayısı, Çilek", loc:"Bursa", init:"NR", desc:"Son tüketim tarihi yaklaşan meyveleri reçele dönüştürür." },
    { name:"Sema Turşu Kooperatifi", tags:["Turşu","Salamura"],     match:"Biber, Patlıcan",   loc:"Çanakkale", init:"ST", desc:"Sebze fazlasını turşuya çevirir, %18 paylaşım modeli." },
    { name:"Emine Kuru Meyve",       tags:["Kurutma","Pekmez"],     match:"İncir, Kayısı",     loc:"Aydın",  init:"EK", desc:"Düşük raf ömrü meyvelerini güneşte kurutur." },
  ],

  // === MATCHES (talep <-> kardeş üretici) ===
  matches: [
    { src:"23 kg Domates · SKT 2 gün",  dst:"Naciye'nin Salçaları",  flow:"→ salça üretimi",  saving:"₺2.180", status:"yeni" },
    { src:"14 kg İncir · SKT 1 gün",    dst:"Nurten Reçel Atölyesi", flow:"→ incir reçeli",   saving:"₺1.640", status:"onay bekliyor" },
    { src:"38 kg Patlıcan · SKT 3 gün", dst:"Sema Turşu Kooperatifi", flow:"→ patlıcan turşusu", saving:"₺2.840", status:"yeni" },
    { src:"9 kg Kayısı · SKT 2 gün",    dst:"Emine Kuru Meyve",       flow:"→ kayısı kurutma",  saving:"₺820",   status:"eşleşti" },
  ],

  // === AI Acting / logs ===
  aiLogs: [
    { time:"09:42", title:"Sipariş taslağı oluşturuldu",  why:"Domates stoğu son 7 günde 42% düştü; ortalama satışa göre 4 günlük rezerv kaldı.", ctx:["Depo","Domates","+1.000 kg"], status:"hazır" },
    { time:"09:18", title:"Kardeş eşleşme önerildi",       why:"İncir stoğunun %14'ü 48 saat içinde SKT'ye giriyor; Nurten Reçel atölyesi alım kapasitesinde.", ctx:["Talep","İncir","Eşleşme"], status:"onay" },
    { time:"08:55", title:"Sevkiyat yeniden planlandı",     why:"Hatice Aslan mola moduna geçti; T-2410 görevi Sevda Korkmaz'a aktarıldı.", ctx:["Depo","Sevkiyat"], status:"uygulandı" },
    { time:"08:30", title:"Anomali bildirimi",              why:"Çilek talebinde 3 günlük ortalamaya kıyasla +44% sapma; mevsimsel olmayan artış olabilir.", ctx:["Talep","Çilek","Anomali"], status:"izleme" },
    { time:"07:50", title:"Mevsim öngörüsü güncellendi",    why:"Mayıs hava durumu modeli kayısı talebini +18% revize etti; Malatya tedarik penceresi 3 hafta.", ctx:["AI","Mevsim","Kayısı"], status:"bilgi" },
  ],

  alerts: [
    { level:"danger", title:"Kritik stok: İncir %6",           desc:"Mevcut talep hızıyla 18 saat içinde tükenir. Fadime Hn. ile sipariş açılmalı.", source:"Depo · Stok" },
    { level:"danger", title:"SKT riski: 23 kg Domates",        desc:"3 gün içinde son tüketim tarihi. Salça atölyesine eşleşme önerildi.",          source:"Talep · STK" },
    { level:"warn",   title:"Sevkiyat çakışması: 16:00",        desc:"İki müşteriye aynı saatte teslimat planlı, depo ekibi 2 kişi müsait.",          source:"Depo · Sevkiyat" },
    { level:"warn",   title:"Ödeme gecikmesi: T-2387",          desc:"Restoran grubu 14 gündür tahsil edilemedi.",                                    source:"Finans" },
    { level:"info",   title:"Anormal talep: Çilek +44%",        desc:"Mevsimsel olmayan ani artış, kaynak tetikleyici tespit ediliyor.",              source:"AI · Anomali" },
  ],

  yesterdaySummary: {
    fulfilled: 18, late: 2, canceled: 1,
    revenue: "₺48.620",
    topProduct: "Domates",
    notes: "12 talep zamanında karşılandı, 2 talep 30 dk gecikti, 1 talep iptal."
  },

  todayTasks: [
    { done:false, title:"Fadime Hn. ile incir siparişi açılacak",      meta:"Acil · 18 saatlik stok" },
    { done:false, title:"23 kg domates → Naciye Hn. salça atölyesi",    meta:"Eşleşme onayı bekliyor" },
    { done:true,  title:"Sevda Korkmaz'a T-2410 atandı",                 meta:"AI tarafından yapıldı" },
    { done:false, title:"Haftalık üretici performans toplantısı",       meta:"15:00 · Kooperatif salonu" },
    { done:false, title:"Kadıköy Pazar Yeri sevkiyatı (180 kg domates)",meta:"16:00 · Sevda K." },
    { done:true,  title:"Kasa raporu kapatıldı",                        meta:"Dün · Aslı D." },
  ],

  weekly: {
    sales: [12,18,16,22,28,24,30],
    fulfillment: 96, // %
    avgLead: "1.4 gün",
    wasteAvoided: "184 kg",
    sisterRevenue: "₺6.420",
  },
};

window.MOCK = MOCK;
