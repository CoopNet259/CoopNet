'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';

/* ── Icons ── */
const Icon = ({ d, size = 18 }: { d: string | string[]; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  dollar:    ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:     ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:     ['M9.5 2a2.5 2.5 0 0 1 5 0','M12 2v4','M12 2C6.477 2 2 6.477 2 12c0 2.5.933 4.785 2.465 6.515','M12 2c5.523 0 10 4.477 10 10 0 2.5-.933 4.785-2.465 6.515','M8 12h8','M12 8v8'],
  log:       ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  bell:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:    ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  logout:    ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  chevron:   'M9 18l6-6-6-6',
  check:     'M20 6L9 17l-5-5',
  package:   ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96L12 12.01l8.73-5.05','M12 22.08V12'],
};

/* ── Sidebar nav items ── */
const navItems = [
  { id: 'dashboard',   label: 'Ana Sayfa',        icon: 'grid',      path: '/dashboard' },
  { id: 'depo',        label: 'Depo',             icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',    label: 'Talepler',         icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',  label: 'Üreticiler',       icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',    label: 'Finansal Raporlar',icon: 'dollar',    path: '/dashboard/finansal' },
  { id: 'anomali',     label: 'Anomali',          icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar', label: 'AI Raporları',     icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',     label: 'AI Logs',          icon: 'log',       path: '/dashboard/ai-logs' },
];

/* ── Mock data ── */
const depoUyariler = [
  { id: 1, urun: 'Domates', stok: '12 kg', esik: '50 kg', aciliyet: 'kritik', emoji: '🍅' },
  { id: 2, urun: 'Biber',   stok: '28 kg', esik: '60 kg', aciliyet: 'yuksek', emoji: '🫑' },
  { id: 3, urun: 'Patlıcan',stok: '35 kg', esik: '40 kg', aciliyet: 'orta',   emoji: '🍆' },
];

const bugunTalepler = [
  { id: 1, musteri: 'Migros Market',      urun: 'Domates',  miktar: '200 kg', saat: '09:00', durum: 'bekliyor' },
  { id: 2, musteri: 'Tarım Kooperatifi',  urun: 'Biber',    miktar: '80 kg',  saat: '11:30', durum: 'onaylandi' },
  { id: 3, musteri: 'Organik Pazar',      urun: 'Patlıcan', miktar: '60 kg',  saat: '14:00', durum: 'bekliyor' },
];

const ureticiler = [
  { id: 1, ad: 'Fatma Kaya',    urun: 'Domates',  miktar: '150 kg', mesafe: '8 km',  puan: 4.9, emoji: '🍅' },
  { id: 2, ad: 'Ayşe Demir',   urun: 'Biber',    miktar: '90 kg',  mesafe: '12 km', puan: 4.7, emoji: '🫑' },
  { id: 3, ad: 'Hatice Yıldız', urun: 'Patlıcan', miktar: '70 kg',  mesafe: '5 km',  puan: 4.8, emoji: '🍆' },
];

const dunOzeti = [
  { label: 'Toplam Sipariş',   value: '14',      icon: '📦', renk: 'green' },
  { label: 'Teslim Edilen',    value: '11',      icon: '✅', renk: 'green' },
  { label: 'Bekleyen',         value: '3',       icon: '⏳', renk: 'gold'  },
  { label: 'Toplam Gelir',     value: '₺24.600', icon: '💰', renk: 'green' },
  { label: 'Yeni Üretici',     value: '2',       icon: '👤', renk: 'blue'  },
  { label: 'Anomali Tespiti',  value: '1',       icon: '⚠️', renk: 'red'   },
];

const bugunIsler = [
  { id: 1, is: 'Migros siparişi için domates temini',     durum: false, oncelik: 'yuksek' },
  { id: 2, is: 'Depo stok sayımı yapılacak',              durum: false, oncelik: 'orta'   },
  { id: 3, is: 'Ayşe Demir ile fiyat görüşmesi',          durum: true,  oncelik: 'orta'   },
  { id: 4, is: 'Q2 finansal raporu tamamlanacak',         durum: false, oncelik: 'yuksek' },
  { id: 5, is: 'Organik Pazar sözleşmesi imzalanacak',    durum: false, oncelik: 'dusuk'  },
];

const aiLogs = [
  { zaman: '09:14', tip: 'Anomali', mesaj: 'Domates stoku kritik seviyenin altına düştü. Acil sipariş önerisi gönderildi.', renk: 'red' },
  { zaman: '08:55', tip: 'Tahmin',  mesaj: 'Bu hafta biber talebi %18 artış bekleniyor. Üreticilere bildirim yapıldı.',       renk: 'gold' },
  { zaman: '08:30', tip: 'Rapor',   mesaj: 'Dün gerçekleşen 14 sipariş için günlük özet raporu oluşturuldu.',                renk: 'green' },
  { zaman: '07:45', tip: 'Otomasyon',mesaj: 'Organik Pazar talebine otomatik yanıt taslağı hazırlandı.',                    renk: 'blue' },
];

const aiOzet = {
  baslik: 'AI Günlük Analiz Özeti — 10 Mayıs 2026',
  maddeler: [
    'Depoda 3 ürün kritik stok seviyesinin altında. Öncelikli sipariş gerekiyor.',
    'Bugünkü 3 talep toplamda ₺8.200 değerinde. Tamamı zamanında karşılanabilir.',
    'Fatma Kaya bu ay en yüksek performanslı üretici olarak öne çıkıyor.',
    'Pazar eğilimi: Domates fiyatları bu haftadan itibaren %7 artış gösterebilir.',
  ],
};

/* ═══════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showNotif, setShowNotif] = useState(false);
  const [isler, setIsler] = useState(bugunIsler);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const toggleIs = (id: number) => {
    setIsler(prev => prev.map(i => i.id === id ? { ...i, durum: !i.durum } : i));
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
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => navClick(item)}
              id={`nav-${item.id}`}
            >
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
          <button className="logout-btn" onClick={() => router.push('/login')} title="Çıkış Yap">
            <Icon d={icons.logout} size={16} />
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="main">

        {/* Header */}
        <header className="header">
          <div className="header-coop-title">
            <span className="header-coop-icon">🌱</span>
            <div>
              <h2 className="header-coop-name">Üreten Kadınlar Kooperatif</h2>
              <p className="header-coop-sub">Yönetim Paneli · 10 Mayıs 2026</p>
            </div>
          </div>

          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Ürün, üretici, talep ara…" />
          </div>

          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} id="notif-btn">
                <Icon d={icons.bell} size={18} />
                <span className="notif-dot" />
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Bildirimler</div>
                  {[
                    { icon: '⚠️', text: 'Domates stoku kritik seviyede', time: '5dk önce' },
                    { icon: '📦', text: 'Migros siparişi onay bekliyor', time: '30dk önce' },
                    { icon: '🤖', text: 'AI anomali raporu hazır',        time: '1s önce'  },
                  ].map((n, i) => (
                    <div key={i} className="notif-item">
                      <span style={{ fontSize: 16 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="notif-text">{n.text}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <div className="notif-footer">
                    <button>Tümünü gör</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content">

          {/* ── 3-column section ── */}
          <div className="three-col-header">
            <h3 className="section-title">Anlık Durum</h3>
            <p className="section-sub">Stok uyarıları, bugünün talepleri ve tedarik edebilecek üreticiler</p>
          </div>

          <div className="three-col-grid">

            {/* Kolon 1: Depo */}
            <div
              className="col-card col-depo"
              onClick={() => router.push('/dashboard/depo')}
              id="col-depo"
            >
              <div className="col-card-head">
                <div className="col-card-icon-wrap depo-icon-wrap">
                  <Icon d={icons.warehouse} size={18} />
                </div>
                <div>
                  <h4>Depo</h4>
                  <p>Stok uyarıları</p>
                </div>
                <span className="col-badge red">{depoUyariler.length}</span>
              </div>
              <div className="col-items" onClick={e => e.stopPropagation()}>
                {depoUyariler.map(item => (
                  <div
                    key={item.id}
                    className="col-item"
                    onClick={() => router.push('/dashboard/depo')}
                  >
                    <span className="col-item-emoji">{item.emoji}</span>
                    <div className="col-item-body">
                      <strong>{item.urun}</strong>
                      <p>Stok: {item.stok} / Eşik: {item.esik}</p>
                    </div>
                    <span className={`aciliyet-pill ${item.aciliyet}`}>
                      {item.aciliyet === 'kritik' ? '🔴 Kritik' : item.aciliyet === 'yuksek' ? '🟠 Yüksek' : '🟡 Orta'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="col-footer">Tümünü gör →</div>
            </div>

            {/* Kolon 2: Talepler */}
            <div
              className="col-card col-talep"
              onClick={() => router.push('/dashboard/talepler')}
              id="col-talepler"
            >
              <div className="col-card-head">
                <div className="col-card-icon-wrap talep-icon-wrap">
                  <Icon d={icons.clipboard} size={18} />
                </div>
                <div>
                  <h4>Talepler</h4>
                  <p>Bugünün talepleri</p>
                </div>
                <span className="col-badge green">{bugunTalepler.length}</span>
              </div>
              <div className="col-items" onClick={e => e.stopPropagation()}>
                {bugunTalepler.map(item => (
                  <div
                    key={item.id}
                    className="col-item"
                    onClick={() => router.push('/dashboard/talepler')}
                  >
                    <div className="col-item-body">
                      <strong>{item.musteri}</strong>
                      <p>{item.urun} · {item.miktar} · {item.saat}</p>
                    </div>
                    <span className={`durum-pill ${item.durum}`}>
                      {item.durum === 'onaylandi' ? '✅ Onaylandı' : '⏳ Bekliyor'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="col-footer">Tümünü gör →</div>
            </div>

            {/* Kolon 3: Üreticiler */}
            <div
              className="col-card col-uretici"
              onClick={() => router.push('/dashboard/ureticiler')}
              id="col-ureticiler"
            >
              <div className="col-card-head">
                <div className="col-card-icon-wrap uretici-icon-wrap">
                  <Icon d={icons.users} size={18} />
                </div>
                <div>
                  <h4>Üreticiler</h4>
                  <p>Tedarik edebilecekler</p>
                </div>
                <span className="col-badge purple">{ureticiler.length}</span>
              </div>
              <div className="col-items" onClick={e => e.stopPropagation()}>
                {ureticiler.map(item => (
                  <div
                    key={item.id}
                    className="col-item"
                    onClick={() => router.push('/dashboard/ureticiler')}
                  >
                    <span className="col-item-emoji">{item.emoji}</span>
                    <div className="col-item-body">
                      <strong>{item.ad}</strong>
                      <p>{item.urun} · {item.miktar} · {item.mesafe}</p>
                    </div>
                    <span className="puan-badge">⭐ {item.puan}</span>
                  </div>
                ))}
              </div>
              <div className="col-footer">Tümünü gör →</div>
            </div>

          </div>

          {/* ── Dünün Özeti ── */}
          <section className="section-block" id="dun-ozeti">
            <div className="section-block-header">
              <span className="section-block-icon">📊</span>
              <h3>Dünün Özeti</h3>
              <span className="section-block-date">9 Mayıs 2026</span>
            </div>
            <div className="ozet-grid">
              {dunOzeti.map((o, i) => (
                <div key={i} className={`ozet-card ozet-${o.renk}`}>
                  <span className="ozet-icon">{o.icon}</span>
                  <div className="ozet-value">{o.value}</div>
                  <div className="ozet-label">{o.label}</div>
                  <div className={`ozet-bar-fill ${o.renk}`} style={{ width: barsReady ? '100%' : '0%' }} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Bugün Yapılacaklar ── */}
          <section className="section-block" id="bugun-isler">
            <div className="section-block-header">
              <span className="section-block-icon">✅</span>
              <h3>Bugün Yapılması Gerekenler</h3>
              <span className="section-block-date">
                {isler.filter(i => i.durum).length}/{isler.length} tamamlandı
              </span>
            </div>
            <div className="is-listesi">
              {isler.map(is => (
                <div
                  key={is.id}
                  className={`is-item${is.durum ? ' done' : ''}`}
                  onClick={() => toggleIs(is.id)}
                  id={`is-${is.id}`}
                >
                  <div className={`is-check${is.durum ? ' checked' : ''}`}>
                    {is.durum && <Icon d={icons.check} size={12} />}
                  </div>
                  <span className="is-text">{is.is}</span>
                  <span className={`oncelik-pill ${is.oncelik}`}>
                    {is.oncelik === 'yuksek' ? '🔴 Yüksek' : is.oncelik === 'orta' ? '🟡 Orta' : '🟢 Düşük'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── AI Logs ── */}
          <section className="section-block" id="ai-logs-section">
            <div className="section-block-header">
              <span className="section-block-icon">🤖</span>
              <h3>AI Logs</h3>
              <button className="section-link-btn" onClick={() => router.push('/dashboard/ai-logs')}>
                Tüm loglar →
              </button>
            </div>
            <div className="ai-log-list">
              {aiLogs.map((log, i) => (
                <div key={i} className={`ai-log-item log-${log.renk}`}>
                  <div className={`log-tip log-tip-${log.renk}`}>{log.tip}</div>
                  <div className="log-mesaj">{log.mesaj}</div>
                  <div className="log-zaman">{log.zaman}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── AI Analiz Özeti ── */}
          <section className="section-block ai-ozet-section" id="ai-ozet">
            <div className="section-block-header">
              <span className="section-block-icon">✨</span>
              <h3>AI Analiz Özeti</h3>
              <button className="section-link-btn" onClick={() => router.push('/dashboard/ai-raporlar')}>
                Tüm raporlar →
              </button>
            </div>
            <div className="ai-ozet-card">
              <div className="ai-ozet-baslik">
                <span className="ai-chip">AI · Gemini</span>
                <span className="ai-ozet-title">{aiOzet.baslik}</span>
              </div>
              <ul className="ai-ozet-list">
                {aiOzet.maddeler.map((m, i) => (
                  <li key={i}>
                    <span className="ai-bullet">›</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
