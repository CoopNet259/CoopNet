'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './talepler.css';
import { getDashboardSummary, type TrendItem } from '@/lib/api/client';

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
  phone:    ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:  'M9 18l6-6-6-6',
  logout:   ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:   ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  trendingUp:['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  trendingDown:['M23 18l-9.5-9.5-5 5L1 6','M17 18h6v-6'],
  heart:    ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  send:     ['M22 2L11 13','M22 2l-7 20-4-9-9-4 20-7z'],
  truck:    ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 16A1.5 1.5 0 1 0 5.5 19 1.5 1.5 0 1 0 5.5 16z','M17.5 16A1.5 1.5 0 1 0 17.5 19 1.5 1.5 0 1 0 17.5 16z'],
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
  { id: 'uretici-mesaj', label: 'Üretici Mesaj',  icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

const artanTalepler = [
  { emoji: '🍅', urun: 'Domates', artis: '+%34', neden: 'Yaz sezonu ve Ramazan öncesi hazırlıklar nedeniyle talep hızla artıyor.' },
  { emoji: '🥒', urun: 'Salatalık', artis: '+%22', neden: 'Bölgesel süpermarket zincirlerinden gelen toplu siparişler.' },
  { emoji: '🍑', urun: 'Kayısı', artis: '+%18', neden: 'Mevsim başı, taze meyve tüketimi trendi yüksek.' },
];

const azalanTalepler = [
  { emoji: '🧅', urun: 'Soğan', dusus: '-%12', neden: 'Geçen haftaki aşırı alım sonrası piyasa doygunluğu.' },
  { emoji: '🌽', urun: 'Mısır', dusus: '-%8', neden: 'Konserve fabrikalarının alımları tamamlandı.' },
  { emoji: '🥕', urun: 'Havuç', dusus: '-%5', neden: 'Hasat sonu, kalite düşüşü beklentisi nedeniyle alımlar yavaşladı.' },
];

const stkRiskliUrunler = [
  {
    id: 1,
    emoji: '🍅',
    urun: 'Domates',
    stk: '3 Gün Kaldı',
    miktar: '120 kg',
    islem: 'Salça Üretimi',
    kardesler: [
      { ad: 'Bereket Salça Atölyesi', tip: 'Kardeş Üretici', avatar: 'BS' },
      { ad: 'Zeynep Ana Yöresel', tip: 'Kardeş Üretici', avatar: 'ZA' }
    ]
  },
  {
    id: 2,
    emoji: '🟣',
    urun: 'İncir',
    stk: '2 Gün Kaldı',
    miktar: '45 kg',
    islem: 'Reçel Üretimi',
    kardesler: [
      { ad: 'Tatlıcı Şirin Koop.', tip: 'Kardeş Üretici', avatar: 'TŞ' }
    ]
  },
  {
    id: 3,
    emoji: '🍇',
    urun: 'Üzüm',
    stk: '4 Gün Kaldı',
    miktar: '85 kg',
    islem: 'Pekmez & Şıra',
    kardesler: [
      { ad: 'Şifa Pekmezcilik', tip: 'Kardeş Üretici', avatar: 'ŞP' },
      { ad: 'Doğal Lezzetler', tip: 'Kardeş Üretici', avatar: 'DL' }
    ]
  }
];

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

export default function TaleplerPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('talepler');
  const [showNotif, setShowNotif] = useState(false);
  const [artanTrend, setArtanTrend] = useState<TrendItem[]>([]);
  const [azalanTrend, setAzalanTrend] = useState<TrendItem[]>([]);

  useEffect(() => {
    getDashboardSummary().then(data => {
      setArtanTrend(data.trends.up);
      setAzalanTrend(data.trends.down);
    }).catch(console.error);
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const handleKardeseIlet = (urun: string) => {
    alert(`${urun} için kardeş üreticilere otomatik mesaj gönderildi ve depo görevlisine STK ayırma talimatı iletildi.`);
  };

  const handleDepoGorevi = (urun: string) => {
    alert(`Depo sorumlularına ${urun} için sevkiyat ve paketleme görevi oluşturuldu.`);
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
            <span style={{ fontSize: 22 }}>📋</span>
            <div>
              <h2 className="header-coop-name">Talepler & İşbirlikleri</h2>
              <p className="header-coop-sub">Talep Trendleri ve STK İsraf Önleme · 10 Mayıs 2026</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Talep veya kardeş üretici ara…" />
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} id="notif-btn">
                <Icon d={icons.bell} size={18} />
                <span className="notif-dot" />
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Talep Bildirimleri</div>
                  <div className="notif-item">
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div className="notif-text">Domates STK Uyarısı (3 gün)</div>
                      <div className="notif-time">10dk önce</div>
                    </div>
                  </div>
                  <div className="notif-footer"><button>Tümünü gör</button></div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          <div className="talepler-layout">

            {/* ÜST: Artan ve Azalan Talepler */}
            <div className="talepler-top-grid">
              
              {/* Artan Talepler */}
              <div className="talep-panel">
                <div className="panel-header">
                  <Icon d={icons.trendingUp} size={18} extra="text-green" />
                  <h3>Artan Talepler</h3>
                  <span className="panel-badge green">Bu Hafta</span>
                </div>
                <div className="talep-list">
                  {artanTrend.length === 0 ? (
                    <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Yüksek artış tespit edilmedi.</div>
                  ) : artanTrend.map((t, i) => (
                    <div key={i} className="talep-item">
                      <div className="talep-emoji">{emojiFor(t.name)}</div>
                      <div className="talep-info">
                        <strong>{t.name}</strong>
                        <p>Geçen haftaya göre talep artışı</p>
                      </div>
                      <div className="talep-stats">
                        <span className="trend-badge up">
                          <Icon d={icons.trendingUp} size={14} /> {t.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Azalan Talepler */}
              <div className="talep-panel">
                <div className="panel-header">
                  <Icon d={icons.trendingDown} size={18} extra="text-red" />
                  <h3>Azalan Talepler</h3>
                  <span className="panel-badge red">Bu Hafta</span>
                </div>
                <div className="talep-list">
                  {azalanTrend.length === 0 ? (
                    <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Belirgin düşüş tespit edilmedi.</div>
                  ) : azalanTrend.map((t, i) => (
                    <div key={i} className="talep-item">
                      <div className="talep-emoji">{emojiFor(t.name)}</div>
                      <div className="talep-info">
                        <strong>{t.name}</strong>
                        <p>Geçen haftaya göre talep düşüşü</p>
                      </div>
                      <div className="talep-stats">
                        <span className="trend-badge down">
                          <Icon d={icons.trendingDown} size={14} /> {t.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ALT: STK Takibi ve Kardeş Üretici */}
            <div className="stk-panel">
              <div className="stk-header">
                <div className="stk-header-title">
                  <span style={{ fontSize: 24 }}>♻️</span>
                  <div>
                    <h3>STK Takibi & İsraf Önleme (Kardeş Üretici Eşleştirmesi)</h3>
                    <p>Son Tüketim Tarihi yaklaşan ürünler otomatik olarak ilgili üreticilerle eşleştirilir.</p>
                  </div>
                </div>
              </div>
              
              <div className="stk-grid">
                {stkRiskliUrunler.map(urun => (
                  <div key={urun.id} className="stk-card">
                    <div className="stk-card-top">
                      <div className="stk-urun">
                        <span className="stk-urun-emoji">{urun.emoji}</span>
                        <div className="stk-urun-info">
                          <strong>{urun.urun}</strong>
                          <span>⚠️ {urun.stk}</span>
                        </div>
                      </div>
                      <div className="stk-miktar">{urun.miktar}</div>
                    </div>

                    <div className="kardes-uretici-box">
                      <div className="kardes-baslik">
                        <Icon d={icons.heart} size={12} /> EŞLEŞEN KARDEŞ ÜRETİCİLER ({urun.islem})
                      </div>
                      {urun.kardesler.map((k, i) => (
                        <div key={i} className="kardes-uretici-item">
                          <div className="kardes-avatar">{k.avatar}</div>
                          <div className="kardes-info">
                            <strong>{k.ad}</strong>
                            <span>{k.tip}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="stk-actions">
                      <button className="btn-ilet" onClick={() => handleKardeseIlet(urun.urun)}>
                        <Icon d={icons.send} size={14} /> Kardeş Üreticiye İlet
                      </button>
                      <button className="btn-depo" onClick={() => handleDepoGorevi(urun.urun)}>
                        <Icon d={icons.truck} size={14} /> Depo Görevi Ata
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
