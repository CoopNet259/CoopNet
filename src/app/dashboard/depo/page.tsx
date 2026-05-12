'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './depo.css';
import { getAllStock, type StockItem } from '@/lib/api/client';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function todayTr(): string { const n = new Date(); return `${n.getDate()} ${TR_MONTHS[n.getMonth()]} ${n.getFullYear()}`; }

const Icon = ({ d, size = 18 }: { d: string | string[]; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  phone:    ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:  'M9 18l6-6-6-6',
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  logout:   ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:   ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  trending: ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  package:  ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
  plus:     'M12 5v14M5 12h14',
  user:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
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
  { id: 'vardiye',      label: 'Vardiye',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj', label: 'Üretici Mesaj',  icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

type UrgencyLevel = 'kritik' | 'dusuk' | 'normal' | 'iyi';

const URUN_EMOJI: Record<string, string> = {
  domates: '🍅', biber: '🫑', patlıcan: '🍆', salatalık: '🥒',
  kayısı: '🍑', incir: '🟣', havuç: '🥕', soğan: '🧅', mısır: '🌽', üzüm: '🍇',
};
function emojiFor(name: string) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(URUN_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return '📦';
}

interface Calisan {
  id: number; ad: string; rol: string;
  musait: boolean; vardiya: string; gorev?: string;
}

const calisanlar: Calisan[] = [
  { id:1, ad:'Fatma Kaya',    rol:'Depo Sorumlusu',   musait:true,  vardiya:'08:00–16:00', gorev:'Domates bölümü kontrolü' },
  { id:2, ad:'Emine Çelik',   rol:'Stok Takip',       musait:true,  vardiya:'08:00–16:00', gorev:'Giriş sayımı'             },
  { id:3, ad:'Hatice Arslan', rol:'Taşıma Operatörü', musait:true,  vardiya:'09:00–17:00', gorev:'Müsait'                   },
  { id:4, ad:'Zeynep Öztürk', rol:'Depo Asistanı',    musait:false, vardiya:'İzinli',      gorev:undefined                  },
  { id:5, ad:'Ayşe Şahin',    rol:'Kalite Kontrol',   musait:false, vardiya:'16:00–24:00', gorev:undefined                  },
];

interface TrendUyari {
  emoji: string; urun: string; artis: string;
  neden: string; oneri: string; seviye: 'yuksek'|'orta'|'dusuk';
}

const trendUyarilari: TrendUyari[] = [
  { emoji:'🍅', urun:'Domates',   artis:'+34%', neden:'Yaz sezonu + Ramazan öncesi talep artışı',       oneri:'50 kg acil sipariş ver',      seviye:'yuksek' },
  { emoji:'🍑', urun:'Kayısı',    artis:'+28%', neden:'Kayısı hasadı başladı, pazar talebi yüksek',     oneri:'Tedarikçi ile iletişime geç', seviye:'yuksek' },
  { emoji:'🫑', urun:'Biber',     artis:'+18%', neden:'Mevsimsel tüketim artışı — Haziran dönemi',      oneri:'30 kg ek sipariş planla',     seviye:'orta'   },
  { emoji:'🟣', urun:'İncir',     artis:'+22%', neden:'Kurutulmuş incir sezonu başlıyor',               oneri:'Hatice Arslan\'ı devreye al', seviye:'yuksek' },
  { emoji:'🥕', urun:'Havuç',     artis:'+12%', neden:'Okul kantinleri için toplu sipariş bekleniyor',  oneri:'Stok gözlemini artır',        seviye:'orta'   },
];

function tierToUrgency(tier: string): UrgencyLevel {
  if (tier === 'urgent') return 'kritik';
  if (tier === 'warn') return 'dusuk';
  return 'iyi';
}

export default function DepoPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('depo');
  const [showNotif, setShowNotif] = useState(false);
  const [filtre, setFiltre] = useState<'hepsi'|'kritik'|'normal'>('hepsi');
  const [stokVerisi, setStokVerisi] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStock()
      .then(data => setStokVerisi(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const sortedStok = [...stokVerisi]
    .filter(u => {
      if (filtre === 'kritik') return u.is_critical;
      if (filtre === 'normal') return !u.is_critical;
      return true;
    })
    .sort((a, b) => a.pct - b.pct);

  const kritikSayisi = stokVerisi.filter(u => u.is_critical).length;
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
            <span style={{ fontSize: 22 }}>📦</span>
            <div>
              <h2 className="header-coop-name">Depo Yönetimi</h2>
              <p className="header-coop-sub">Üreten Kadınlar Kooperatif · {todayTr()}</p>
            </div>
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
              <div><strong>{loading ? '—' : kritikSayisi}</strong><p>Kritik Stok</p></div>
            </div>
            <div className="depo-kpi-item green">
              <span className="depo-kpi-icon">👷</span>
              <div><strong>{musaitSayisi}/{calisanlar.length}</strong><p>Müsait Çalışan</p></div>
            </div>
            <div className="depo-kpi-item gold">
              <span className="depo-kpi-icon">📈</span>
              <div><strong>{trendUyarilari.filter(t=>t.seviye==='yuksek').length}</strong><p>Yüksek Talep Tahmini</p></div>
            </div>
            <div className="depo-kpi-item blue">
              <span className="depo-kpi-icon">📦</span>
              <div><strong>{loading ? '—' : stokVerisi.length}</strong><p>Toplam Ürün</p></div>
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
                {[...calisanlar].sort((a,b) => (b.musait ? 1 : 0) - (a.musait ? 1 : 0)).map(c => (
                  <div key={c.id} className={`calisan-card${c.musait ? '' : ' pasif'}`}>
                    <div className="calisan-avatar">
                      {c.ad.split(' ').map(w=>w[0]).join('').slice(0,2)}
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
                  {(['hepsi','kritik','normal'] as const).map(f => (
                    <button key={f} className={`filtre-btn${filtre===f?' active':''}`}
                      onClick={()=>setFiltre(f)}>
                      {f==='hepsi'?'Hepsi':f==='kritik'?'🔴 Kritik':'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              {sortedStok.filter(u => u.is_critical).length > 0 && filtre !== 'normal' && (
                <div className="kritik-uyari-banner">
                  <Icon d={icons.alert} size={15} />
                  <strong>Acil Sipariş Gerekiyor</strong>
                  <span>— {sortedStok.filter(u => u.is_critical).length} ürün kritik seviyede</span>
                </div>
              )}

              {loading && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Stok verileri yükleniyor…
                </div>
              )}

              <div className="stok-grid">
                {sortedStok.map(urun => {
                  const urgency = tierToUrgency(urun.tier);
                  return (
                    <div key={urun.id} className={`stok-card urgency-${urgency}`} id={`stok-${urun.id}`}>
                      {urun.is_critical && <div className="stok-kritik-flag">⚠️ ACİL</div>}
                      <div className="stok-card-top">
                        <span className="stok-emoji">{emojiFor(urun.name)}</span>
                        <div className="stok-meta">
                          <strong>{urun.name}</strong>
                          <span className="stok-kategori">{urun.unit}</span>
                        </div>
                        <span className={`urgency-badge ${urgency}`}>
                          {urgency==='kritik'?'Kritik':urgency==='dusuk'?'Düşük':'İyi'}
                        </span>
                      </div>
                      <div className="stok-values">
                        <span className="stok-mevcut">{urun.current} {urun.unit}</span>
                        <span className="stok-kapasite">/ {urun.capacity} {urun.unit}</span>
                        <span className="stok-pct" style={{color: urun.pct<=25?'var(--red-500)':urun.pct<=40?'var(--gold-500)':'var(--green-500)'}}>
                          %{urun.pct}
                        </span>
                      </div>
                      <div className="stok-bar-track">
                        <div className={`stok-bar-fill ${urgency}`} style={{ width: `${urun.pct}%` }} />
                      </div>
                      <div className="stok-footer">
                        <span>📦 Gerçek zamanlı</span>
                        {urun.is_critical && (
                          <button className="siparis-btn" onClick={()=>alert(`${urun.name} için sipariş formu açılıyor…`)}>
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
                        {t.seviye==='yuksek'?'Yüksek':t.seviye==='orta'?'Orta':'Düşük'}
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
