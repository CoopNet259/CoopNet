'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './depo.css';

const Icon = ({ d, size = 18 }: { d: string | string[]; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  clipboard: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  dollar: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  brain: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
  log: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  chevron: 'M9 18l6-6-6-6',
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  search: ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z', 'M16 16l3.5 3.5'],
  trending: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  package: ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
  plus: 'M12 5v14M5 12h14',
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
};

const navItems = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: 'grid', path: '/dashboard' },
  { id: 'depo', label: 'Depo', icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler', label: 'Talepler', icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler', label: 'Üreticiler', icon: 'users', path: '/dashboard/ureticiler' },
  { id: 'finansal', label: 'Finansal Raporlar', icon: 'dollar', path: '/dashboard/finansal' },
  { id: 'anomali', label: 'Anomali', icon: 'alert', path: '/dashboard/anomali' },
  { id: 'ai-raporlar', label: 'AI Raporları', icon: 'brain', path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs', label: 'AI Logs', icon: 'log', path: '/dashboard/ai-logs' },
];

type UrgencyLevel = 'kritik' | 'dusuk' | 'normal' | 'iyi';

interface StokUrun {
  id: number; emoji: string; ad: string;
  mevcutKg: number; kapasiteKg: number;
  kategori: string; sonGuncelleme: string;
}

const initialStokVerisi: StokUrun[] = [
  { id: 1, emoji: '🍅', ad: 'Domates', mevcutKg: 80, kapasiteKg: 500, kategori: 'Sebze', sonGuncelleme: 'Bugün 08:30' },
  { id: 2, emoji: '🫑', ad: 'Biber', mevcutKg: 55, kapasiteKg: 300, kategori: 'Sebze', sonGuncelleme: 'Bugün 09:00' },
  { id: 3, emoji: '🍑', ad: 'Kayısı', mevcutKg: 18, kapasiteKg: 200, kategori: 'Meyve', sonGuncelleme: 'Dün 17:00' },
  { id: 4, emoji: '🟣', ad: 'İncir', mevcutKg: 12, kapasiteKg: 150, kategori: 'Meyve', sonGuncelleme: 'Dün 16:00' },
  { id: 5, emoji: '🥒', ad: 'Salatalık', mevcutKg: 210, kapasiteKg: 400, kategori: 'Sebze', sonGuncelleme: 'Bugün 07:45' },
  { id: 6, emoji: '🍆', ad: 'Patlıcan', mevcutKg: 95, kapasiteKg: 250, kategori: 'Sebze', sonGuncelleme: 'Bugün 09:15' },
  { id: 7, emoji: '🧅', ad: 'Soğan', mevcutKg: 320, kapasiteKg: 600, kategori: 'Sebze', sonGuncelleme: 'Dün 18:00' },
  { id: 8, emoji: '🥕', ad: 'Havuç', mevcutKg: 45, kapasiteKg: 300, kategori: 'Sebze', sonGuncelleme: 'Bugün 08:00' },
  { id: 9, emoji: '🍇', ad: 'Üzüm', mevcutKg: 22, kapasiteKg: 200, kategori: 'Meyve', sonGuncelleme: 'Dün 15:00' },
  { id: 10, emoji: '🌽', ad: 'Mısır', mevcutKg: 160, kapasiteKg: 350, kategori: 'Tahıl', sonGuncelleme: 'Bugün 08:50' },
];

interface Calisan {
  id: number; ad: string; rol: string;
  musait: boolean; vardiya: string; gorev?: string;
}

const calisanlar: Calisan[] = [
  { id: 1, ad: 'Fatma Kaya', rol: 'Depo Sorumlusu', musait: true, vardiya: '08:00–16:00', gorev: 'Domates bölümü kontrolü' },
  { id: 2, ad: 'Emine Çelik', rol: 'Stok Takip', musait: true, vardiya: '08:00–16:00', gorev: 'Giriş sayımı' },
  { id: 3, ad: 'Hatice Arslan', rol: 'Taşıma Operatörü', musait: true, vardiya: '09:00–17:00', gorev: 'Müsait' },
  { id: 4, ad: 'Zeynep Öztürk', rol: 'Depo Asistanı', musait: false, vardiya: 'İzinli', gorev: undefined },
  { id: 5, ad: 'Ayşe Şahin', rol: 'Kalite Kontrol', musait: false, vardiya: '16:00–24:00', gorev: undefined },
];

interface TrendUyari {
  emoji: string; urun: string; artis: string;
  neden: string; oneri: string; seviye: 'yuksek' | 'orta' | 'dusuk';
}

const trendUyarilari: TrendUyari[] = [
  { emoji: '🍅', urun: 'Domates', artis: '+34%', neden: 'Yaz sezonu + Ramazan öncesi talep artışı', oneri: '50 kg acil sipariş ver', seviye: 'yuksek' },
  { emoji: '🍑', urun: 'Kayısı', artis: '+28%', neden: 'Kayısı hasadı başladı, pazar talebi yüksek', oneri: 'Tedarikçi ile iletişime geç', seviye: 'yuksek' },
  { emoji: '🫑', urun: 'Biber', artis: '+18%', neden: 'Mevsimsel tüketim artışı — Haziran dönemi', oneri: '30 kg ek sipariş planla', seviye: 'orta' },
  { emoji: '🟣', urun: 'İncir', artis: '+22%', neden: 'Kurutulmuş incir sezonu başlıyor', oneri: 'Hatice Arslan\'ı devreye al', seviye: 'yuksek' },
  { emoji: '🥕', urun: 'Havuç', artis: '+12%', neden: 'Okul kantinleri için toplu sipariş bekleniyor', oneri: 'Stok gözlemini artır', seviye: 'orta' },
];

function getUrgency(mevcut: number, kapasite: number): UrgencyLevel {
  const pct = (mevcut / kapasite) * 100;
  if (pct <= 25) return 'kritik';
  if (pct <= 40) return 'dusuk';
  if (pct <= 65) return 'normal';
  return 'iyi';
}

function getPct(mevcut: number, kapasite: number) {
  return Math.round((mevcut / kapasite) * 100);
}

export default function DepoPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('depo');
  const [showNotif, setShowNotif] = useState(false);
  const [filtre, setFiltre] = useState<'hepsi' | 'kritik' | 'normal'>('hepsi');
  const [stokVerisi, setStokVerisi] = useState<StokUrun[]>(initialStokVerisi);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.length > 0) {
          const formatted = data.map((item: any) => ({
            id: item.id,
            emoji: item.emoji,
            ad: item.ad,
            mevcutKg: item.mevcut_kg,
            kapasiteKg: item.kapasite_kg,
            kategori: item.kategori,
            sonGuncelleme: item.son_guncelleme
          }));
          setStokVerisi(formatted);
        }
      })
      .catch(err => console.error("Stok verisi çekilemedi:", err));
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const sortedStok = [...stokVerisi]
    .filter(u => {
      if (filtre === 'kritik') return getUrgency(u.mevcutKg, u.kapasiteKg) === 'kritik';
      if (filtre === 'normal') return getUrgency(u.mevcutKg, u.kapasiteKg) !== 'kritik';
      return true;
    })
    .sort((a, b) => getPct(a.mevcutKg, a.kapasiteKg) - getPct(b.mevcutKg, b.kapasiteKg));

  const kritikSayisi = stokVerisi.filter(u => getUrgency(u.mevcutKg, u.kapasiteKg) === 'kritik').length;
  const musaitSayisi = calisanlar.filter(c => c.musait).length;

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
          {['🌾', '🍅', '🌿', '🫑', '🍆'].map((e, i) => <span key={i}>{e}</span>)}
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
            <span style={{ fontSize: 22 }}>📦</span>
            <div>
              <h2 className="header-coop-name">Depo Yönetimi</h2>
              <p className="header-coop-sub">Üreten Kadınlar Kooperatif · 10 Mayıs 2026</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Ürün veya çalışan ara…" />
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} id="notif-btn">
                <Icon d={icons.bell} size={18} />
                <span className="notif-dot" />
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Depo Bildirimleri</div>
                  {[
                    { icon: '🔴', text: 'İncir stoğu kritik seviyede (%8)', time: '10dk önce' },
                    { icon: '🟠', text: 'Kayısı stoğu düşük (%9)', time: '25dk önce' },
                    { icon: '📦', text: 'Fatma Kaya stok sayımı tamamladı', time: '1s önce' },
                  ].map((n, i) => (
                    <div key={i} className="notif-item">
                      <span style={{ fontSize: 16 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="notif-text">{n.text}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <div className="notif-footer"><button>Tümünü gör</button></div>
                </div>
              )}
            </div>
            <button className="btn-primary-sm" onClick={() => alert('Sipariş formu — yakında aktif')}>
              <Icon d={icons.plus} size={14} /> Sipariş Ver
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content">

          {/* KPI bar */}
          <div className="depo-kpi-bar">
            <div className="depo-kpi-item red">
              <span className="depo-kpi-icon">🔴</span>
              <div><strong>{kritikSayisi}</strong><p>Kritik Stok</p></div>
            </div>
            <div className="depo-kpi-item green">
              <span className="depo-kpi-icon">👷</span>
              <div><strong>{musaitSayisi}/{calisanlar.length}</strong><p>Müsait Çalışan</p></div>
            </div>
            <div className="depo-kpi-item gold">
              <span className="depo-kpi-icon">📈</span>
              <div><strong>{trendUyarilari.filter(t => t.seviye === 'yuksek').length}</strong><p>Yüksek Talep Tahmini</p></div>
            </div>
            <div className="depo-kpi-item blue">
              <span className="depo-kpi-icon">📦</span>
              <div><strong>{stokVerisi.length}</strong><p>Toplam Ürün</p></div>
            </div>
          </div>

          {/* 3-panel layout */}
          <div className="depo-layout">

            {/* SOL — Çalışanlar */}
            <aside className="depo-panel depo-panel-left">
              <div className="panel-header">
                <Icon d={icons.user} size={16} />
                <h3>Depo Çalışanları</h3>
                <span className="panel-badge green">{musaitSayisi} müsait</span>
              </div>
              <div className="calisan-list">
                {[...calisanlar].sort((a, b) => (b.musait ? 1 : 0) - (a.musait ? 1 : 0)).map(c => (
                  <div key={c.id} className={`calisan-card${c.musait ? '' : ' pasif'}`}>
                    <div className="calisan-avatar">
                      {c.ad.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      <span className={`calisan-status-dot ${c.musait ? 'aktif' : 'pasif'}`} />
                    </div>
                    <div className="calisan-info">
                      <strong>{c.ad}</strong>
                      <p>{c.rol}</p>
                      <span className="calisan-vardiya">{c.vardiya}</span>
                    </div>
                    {c.musait && c.gorev && (
                      <div className="calisan-gorev">{c.gorev}</div>
                    )}
                    {!c.musait && (
                      <span className="calisan-ofline-badge">Çevrimdışı</span>
                    )}
                  </div>
                ))}
              </div>
            </aside>

            {/* ORTA — Stok kartları */}
            <div className="depo-panel depo-panel-center">
              <div className="panel-header">
                <Icon d={icons.package} size={16} />
                <h3>Stok Durumu</h3>
                <div className="filtre-tabs">
                  {(['hepsi', 'kritik', 'normal'] as const).map(f => (
                    <button key={f} className={`filtre-btn${filtre === f ? ' active' : ''}`}
                      onClick={() => setFiltre(f)}>
                      {f === 'hepsi' ? 'Hepsi' : f === 'kritik' ? '🔴 Kritik' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              {sortedStok.filter(u => getUrgency(u.mevcutKg, u.kapasiteKg) === 'kritik').length > 0 && filtre !== 'normal' && (
                <div className="kritik-uyari-banner">
                  <Icon d={icons.alert} size={15} />
                  <strong>Acil Sipariş Gerekiyor</strong>
                  <span>— {sortedStok.filter(u => getUrgency(u.mevcutKg, u.kapasiteKg) === 'kritik').length} ürün kritik seviyede</span>
                </div>
              )}

              <div className="stok-grid">
                {sortedStok.map(urun => {
                  const pct = getPct(urun.mevcutKg, urun.kapasiteKg);
                  const urgency = getUrgency(urun.mevcutKg, urun.kapasiteKg);
                  return (
                    <div key={urun.id} className={`stok-card urgency-${urgency}`} id={`stok-${urun.id}`}>
                      {urgency === 'kritik' && <div className="stok-kritik-flag">⚠️ ACİL</div>}
                      <div className="stok-card-top">
                        <span className="stok-emoji">{urun.emoji}</span>
                        <div className="stok-meta">
                          <strong>{urun.ad}</strong>
                          <span className="stok-kategori">{urun.kategori}</span>
                        </div>
                        <span className={`urgency-badge ${urgency}`}>
                          {urgency === 'kritik' ? 'Kritik' : urgency === 'dusuk' ? 'Düşük' : urgency === 'normal' ? 'Normal' : 'İyi'}
                        </span>
                      </div>
                      <div className="stok-values">
                        <span className="stok-mevcut">{urun.mevcutKg} kg</span>
                        <span className="stok-kapasite">/ {urun.kapasiteKg} kg</span>
                        <span className="stok-pct" style={{ color: pct <= 25 ? 'var(--red-500)' : pct <= 40 ? 'var(--gold-500)' : 'var(--green-500)' }}>
                          %{pct}
                        </span>
                      </div>
                      <div className="stok-bar-track">
                        <div className={`stok-bar-fill ${urgency}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="stok-footer">
                        <span>🕐 {urun.sonGuncelleme}</span>
                        {urgency === 'kritik' && (
                          <button className="siparis-btn" onClick={() => alert(`${urun.ad} için sipariş formu açılıyor…`)}>
                            Sipariş Ver →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SAĞ — Trend analizi */}
            <aside className="depo-panel depo-panel-right">
              <div className="panel-header">
                <Icon d={icons.trending} size={16} />
                <h3>Talep Öngörüsü</h3>
                <span className="panel-badge gold">AI Destekli</span>
              </div>

              <div className="trend-ai-chip">
                <span>🤖 Gemini AI</span>
                <span>Mevsimsel + Trend Analizi</span>
              </div>

              <div className="trend-list">
                {trendUyarilari.map((t, i) => (
                  <div key={i} className={`trend-card seviye-${t.seviye}`}>
                    <div className="trend-card-top">
                      <span className="trend-emoji">{t.emoji}</span>
                      <div className="trend-info">
                        <strong>{t.urun}</strong>
                        <span className={`trend-artis ${t.seviye}`}>{t.artis} talep artışı bekleniyor</span>
                      </div>
                      <span className={`seviye-badge ${t.seviye}`}>
                        {t.seviye === 'yuksek' ? 'Yüksek' : t.seviye === 'orta' ? 'Orta' : 'Düşük'}
                      </span>
                    </div>
                    <p className="trend-neden">📊 {t.neden}</p>
                    <div className="trend-oneri">
                      <Icon d={icons.alert} size={12} />
                      <span>{t.oneri}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mevsim-ozet">
                <div className="mevsim-ozet-header">🌤️ Mevsimsel Özet — Mayıs</div>
                <p>Yaz sezonu başlangıcı ile birlikte <strong>domates, biber ve salatalık</strong> talebinde belirgin artış bekleniyor. Meyve tarafında kayısı ve incir hasadı bu ay doruk noktasına ulaşacak.</p>
              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  );
}
