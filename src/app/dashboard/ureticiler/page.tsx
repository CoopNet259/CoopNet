'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './ureticiler.css';

const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse:['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard:['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:   ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:    ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
  log:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6'],
  chevron:  'M9 18l6-6-6-6',
  logout:   ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:   ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  mapPin:   ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z','M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  check:    'M20 6L9 17l-5-5',
  send:     ['M22 2L11 13','M22 2l-7 20-4-9-9-4 20-7z'],
  heart:    ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  star:     ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z']
};

const navItems = [
  { id: 'dashboard',   label: 'Ana Sayfa',         icon: 'grid',      path: '/dashboard' },
  { id: 'depo',        label: 'Depo',              icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',    label: 'Talepler',          icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',  label: 'Üreticiler',        icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',    label: 'Finansal Raporlar', icon: 'dollar',    path: '/dashboard/finansal' },
  { id: 'anomali',     label: 'Anomali',           icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar', label: 'AI Raporları',      icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',     label: 'AI Logs',           icon: 'log',       path: '/dashboard/ai-logs' },
];

const talebeGoreUreticiler = [
  { id: 1, ad: 'Ahmet Yılmaz', lokasyon: 'Çukurova, Adana', urunler: ['Domates', 'Biber'], kapasite: '500 kg / Gün', karsilama: '%85', avatar: 'AY' },
  { id: 2, ad: 'Fatma Şahin', lokasyon: 'Mut, Mersin', urunler: ['Kayısı', 'Erik'], kapasite: '300 kg / Gün', karsilama: '%92', avatar: 'FŞ' },
];

const genelUreticiler = [
  { id: 3, ad: 'Mehmet Demir', lokasyon: 'Silifke, Mersin', urunler: ['Çilek', 'Limon'], kapasite: '150 kg / Gün', puan: '4.8', avatar: 'MD' },
  { id: 4, ad: 'Ayşe Kaya', lokasyon: 'Tarsus, Adana', urunler: ['Salatalık', 'Patlıcan'], kapasite: '250 kg / Gün', puan: '4.5', avatar: 'AK' },
  { id: 5, ad: 'Hasan Öztürk', lokasyon: 'Erdemli, Mersin', urunler: ['Muz', 'Domates'], kapasite: '400 kg / Gün', puan: '4.9', avatar: 'HÖ' },
  { id: 6, ad: 'Zeynep Çelik', lokasyon: 'Yüreğir, Adana', urunler: ['Soğan', 'Patates'], kapasite: '600 kg / Gün', puan: '4.6', avatar: 'ZÇ' },
];

const kardesUreticiler = [
  { id: 7, ad: 'Bereket Salça Atölyesi', lokasyon: 'Kozan, Adana', ihtiyac: 'Salçalık Domates & Biber', kapasite: '2 Ton / Hafta', avatar: 'BS' },
  { id: 8, ad: 'Tatlıcı Şirin Koop.', lokasyon: 'Mezitli, Mersin', ihtiyac: 'Reçellik Kayısı & İncir', kapasite: '500 kg / Hafta', avatar: 'TŞ' },
];

export default function UreticilerPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('ureticiler');
  const [showNotif, setShowNotif] = useState(false);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  return (
    <div className="coopnet-root">

      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" fill="rgba(255,255,255,0.2)" />
              <path d="M11 4c-2.8 0-5 2.2-5 5 0 2 1.1 3.7 2.8 4.6L11 18l2.2-4.4C14.9 12.7 16 11 16 9c0-2.8-2.2-5-5-5z" fill="#fff" opacity="0.9" />
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>CoopNet</h1>
            <p>Kooperatif Yönetim</p>
          </div>
        </div>

        <div className="coop-name-sidebar">
          <span className="coop-name-icon">🌱</span>
          <span className="coop-name-label">Üreten Kadınlar Kooperatif</span>
        </div>

        <nav>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => navClick(item)} id={`nav-${item.id}`}>
              <Icon d={icons[item.icon]} size={17} />
              <span className="nav-item-label">{item.label}</span>
              {activeNav === item.id && <Icon d={icons.chevron} size={14} />}
            </div>
          ))}
        </nav>

        <div className="sidebar-deco">
          {['🌾','🍅','🌿','🫑','🍆'].map((e, i) => <span key={i}>{e}</span>)}
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">ÜK</div>
            <div className="user-chip-text">
              <h4>Üreten Kadınlar</h4>
              <p>Admin Paneli</p>
            </div>
          </div>
          <button className="logout-btn" onClick={() => router.push('/login')}>
            <Icon d={icons.logout} size={16} />
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="main">

        {/* Header */}
        <header className="header">
          <div className="header-coop-title">
            <span style={{ fontSize: 22 }}>👩‍🌾</span>
            <div>
              <h2 className="header-coop-name">Üreticiler Yönetimi</h2>
              <p className="header-coop-sub">Talep Karşılama ve Kardeş Üretici Ağı · 10 Mayıs 2026</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Üretici veya ürün ara…" />
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} id="notif-btn">
                <Icon d={icons.bell} size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          <div className="ureticiler-layout">

            {/* 1. Talebe Göre Üreticiler */}
            <section className="ureticiler-panel">
              <div className="panel-header">
                <Icon d={icons.alert} size={18} extra="text-gold-500" />
                <h3>Talebi Karşılayabilecek Üreticiler</h3>
                <span className="panel-badge gold">Acil İhtiyaç</span>
              </div>
              <div className="ureticiler-grid">
                {talebeGoreUreticiler.map(uretici => (
                  <div key={uretici.id} className="uretici-card highlight">
                    <div className="uretici-card-top">
                      <div className="uretici-avatar">{uretici.avatar}</div>
                      <div className="uretici-info">
                        <strong>{uretici.ad}</strong>
                        <div className="uretici-lokasyon">
                          <Icon d={icons.mapPin} size={11} /> {uretici.lokasyon}
                        </div>
                      </div>
                      <div className="karsilama-yuzdesi">Talep Karşılama: {uretici.karsilama}</div>
                    </div>
                    <div className="uretici-detay">
                      <div className="uretici-urunler">
                        {uretici.urunler.map((u, i) => <span key={i} className="urun-badge">{u}</span>)}
                      </div>
                      <div className="uretici-kapasite">
                        <Icon d={icons.warehouse} size={12} /> Kapasite: <strong>{uretici.kapasite}</strong>
                      </div>
                    </div>
                    <div className="uretici-actions">
                      <button className="btn-siparis" onClick={() => alert(`${uretici.ad} için acil sipariş talebi oluşturuluyor...`)}>
                        <Icon d={icons.clipboard} size={14} /> Talep Oluştur
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Genel Üreticiler */}
            <section className="ureticiler-panel">
              <div className="panel-header">
                <Icon d={icons.users} size={18} extra="text-green-600" />
                <h3>Genel Üreticiler</h3>
                <span className="panel-badge green">Aktif: {genelUreticiler.length}</span>
              </div>
              <div className="ureticiler-grid">
                {genelUreticiler.map(uretici => (
                  <div key={uretici.id} className="uretici-card">
                    <div className="uretici-card-top">
                      <div className="uretici-avatar">{uretici.avatar}</div>
                      <div className="uretici-info">
                        <strong>{uretici.ad}</strong>
                        <div className="uretici-lokasyon">
                          <Icon d={icons.mapPin} size={11} /> {uretici.lokasyon}
                        </div>
                      </div>
                    </div>
                    <div className="uretici-detay">
                      <div className="uretici-urunler">
                        {uretici.urunler.map((u, i) => <span key={i} className="urun-badge">{u}</span>)}
                      </div>
                      <div className="uretici-kapasite" style={{ marginBottom: 4 }}>
                        <Icon d={icons.warehouse} size={12} /> Kapasite: <strong>{uretici.kapasite}</strong>
                      </div>
                      <div className="uretici-kapasite">
                        <Icon d={icons.star} size={12} extra="text-gold-500" /> Puan: <strong>{uretici.puan}/5.0</strong>
                      </div>
                    </div>
                    <div className="uretici-actions">
                      <button className="btn-iletisim" onClick={() => alert(`${uretici.ad} ile iletişime geçiliyor...`)}>
                        <Icon d={icons.send} size={14} /> Mesaj Gönder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Kardeş Üreticiler */}
            <section className="ureticiler-panel">
              <div className="panel-header">
                <Icon d={icons.heart} size={18} extra="text-purple-500" />
                <h3>Kardeş Üreticiler (Dayanışma & İsraf Önleme)</h3>
                <span className="panel-badge purple">STK Eşleşmeleri</span>
              </div>
              <div className="ureticiler-grid">
                {kardesUreticiler.map(uretici => (
                  <div key={uretici.id} className="uretici-card kardes-actions">
                    <div className="uretici-card-top">
                      <div className="uretici-avatar kardes">{uretici.avatar}</div>
                      <div className="uretici-info">
                        <strong>{uretici.ad}</strong>
                        <div className="uretici-lokasyon">
                          <Icon d={icons.mapPin} size={11} /> {uretici.lokasyon}
                        </div>
                      </div>
                    </div>
                    <div className="uretici-detay">
                      <div className="uretici-urunler">
                        <span className="urun-badge kardes-badge">{uretici.ihtiyac}</span>
                      </div>
                      <div className="uretici-kapasite">
                        <Icon d={icons.warehouse} size={12} /> İşleme Kapasitesi: <strong>{uretici.kapasite}</strong>
                      </div>
                    </div>
                    <div className="uretici-actions">
                      <button className="btn-iletisim" onClick={() => alert(`${uretici.ad} adlı kardeş üreticiye STK'sı yaklaşan ürünler için teklif iletiliyor...`)}>
                        <Icon d={icons.send} size={14} /> Ürün Teklifi İlet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
