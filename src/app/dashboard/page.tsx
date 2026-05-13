'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';
import { getDashboardSummary, patchTask, getDashboardBrief, type DashboardSummary, type StockItem, type OrderItem, type TaskItem, type DashboardBrief } from '@/lib/api/client';
import NotifBell from './components/NotifBell';

/* ── Icons ── */
const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
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
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  check:     'M20 6L9 17l-5-5',
  package:   ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96L12 12.01l8.73-5.05','M12 22.08V12'],
  phone:     ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
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
  { id: 'vardiye',      label: 'Vardiya',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj', label: 'Üretici Mesaj',  icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

/* ── Emoji yardımcısı ── */
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

function tierToAciliyet(tier: string) {
  if (tier === 'urgent') return 'kritik';
  if (tier === 'warn') return 'yuksek';
  return 'orta';
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function parseTrDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${TR_MONTHS[m - 1]} ${y}`;
}

/* ═══════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [barsReady, setBarsReady] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<DashboardBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 150);
    getDashboardSummary()
      .then(data => {
        setSummary(data);
        setTasks(data.tasks.map(t => ({ ...t })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getDashboardBrief()
      .then(data => { setBrief(data); setBriefError(false); })
      .catch(() => setBriefError(true))
      .finally(() => setBriefLoading(false));

    return () => clearTimeout(t);
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    patchTask(id, newDone).catch(console.error);
  };

  // Türetilmiş veriler
  const depoUyariler = (summary?.stock ?? [])
    .filter(s => s.is_critical)
    .slice(0, 3)
    .map(s => ({
      id: s.id, urun: s.name, emoji: emojiFor(s.name),
      stok: `${s.current} ${s.unit}`, esik: `${Math.round(s.capacity / 4)} ${s.unit}`,
      aciliyet: tierToAciliyet(s.tier),
    }));

  const bugunTalepler = (summary?.orders ?? []).slice(0, 3).map(o => ({
    id: o.id, musteri: o.customer, urun: o.product,
    miktar: `${o.quantity} ${o.unit}`,
    saat: '—',
    durum: o.status === 'delivered' ? 'onaylandi' : 'bekliyor',
  }));

  const dunOzeti = summary ? [
    { label: 'Açık Siparişler',  value: String(summary.kpis.open_orders),    icon: '📦', renk: 'green' },
    { label: 'Kritik Stok',      value: String(summary.kpis.critical_stock),  icon: '⚠️', renk: 'red'   },
    { label: 'Açık Görevler',    value: String(summary.kpis.open_tasks),      icon: '✅', renk: 'gold'  },
    { label: 'Hasat (haftalık)', value: `${summary.kpis.harvest_kg_week} kg`, icon: '🌾', renk: 'green' },
    { label: 'Talep Trendi',     value: `${summary.kpis.order_trend_pct > 0 ? '+' : ''}${summary.kpis.order_trend_pct}%`, icon: '📈', renk: summary.kpis.order_trend_pct >= 0 ? 'green' : 'red' },
    { label: 'Tarih',            value: parseTrDate(summary.date), icon: '📅', renk: 'blue' },
  ] : [];

  const ureticiler = [
    { id: 1, ad: 'Fatma Kaya',     urun: 'Domates',  miktar: '150 kg', mesafe: '8 km',  puan: 4.9, emoji: '🍅' },
    { id: 2, ad: 'Ayşe Demir',    urun: 'Biber',    miktar: '90 kg',  mesafe: '12 km', puan: 4.7, emoji: '🫑' },
    { id: 3, ad: 'Hatice Yıldız', urun: 'Patlıcan', miktar: '70 kg',  mesafe: '5 km',  puan: 4.8, emoji: '🍆' },
  ];

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
              <p className="header-coop-sub">Yönetim Paneli · {summary ? parseTrDate(summary.date) : '—'}</p>
            </div>
          </div>

          <div className="header-actions">
            <NotifBell />
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

          {/* ── Güncel Özet ── */}
          <section className="section-block" id="dun-ozeti">
            <div className="section-block-header">
              <span className="section-block-icon">📊</span>
              <h3>Güncel Durum</h3>
              <span className="section-block-date">{summary ? parseTrDate(summary.date) : '—'}</span>
            </div>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Veriler yükleniyor…</div>
            ) : (
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
            )}
          </section>

          {/* ── Bugün Yapılacaklar ── */}
          <section className="section-block" id="bugun-isler">
            <div className="section-block-header">
              <span className="section-block-icon">✅</span>
              <h3>Bugün Yapılması Gerekenler</h3>
              <span className="section-block-date">
                {tasks.filter(t => t.done).length}/{tasks.length} tamamlandı
              </span>
            </div>
            <div className="is-listesi">
              {tasks.length === 0 && !loading && (
                <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Bugün için görev yok.</div>
              )}
              {tasks.map(t => (
                <div
                  key={t.id}
                  className={`is-item${t.done ? ' done' : ''}`}
                  onClick={() => toggleTask(t.id)}
                  id={`is-${t.id}`}
                >
                  <div className={`is-check${t.done ? ' checked' : ''}`}>
                    {t.done && <Icon d={icons.check} size={12} />}
                  </div>
                  <span className="is-text">{t.title}</span>
                  <span className={`oncelik-pill ${t.priority === 'high' ? 'yuksek' : t.priority === 'medium' ? 'orta' : 'dusuk'}`}>
                    {t.priority === 'high' ? '🔴 Yüksek' : t.priority === 'medium' ? '🟡 Orta' : '🟢 Düşük'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── STK İsraf Önleme ve Kardeş Üretici Eşleşmeleri ── */}
          <section className="stk-widget" id="stk-ozet" onClick={() => router.push('/dashboard/talepler')} style={{ cursor: 'pointer' }}>
            <div className="stk-widget-header">
              <div className="stk-widget-title">
                <span style={{ fontSize: 20 }}>♻️</span>
                <div>
                  <h3>İsraf Önleme & Kardeş Üretici Eşleşmeleri</h3>
                  <p>STK riski taşıyan ürünler ve yönlendirilebilecek üreticiler</p>
                </div>
              </div>
              <Icon d={icons.chevron} size={20} extra="text-grey-400" />
            </div>
            <div className="stk-widget-content">
              {/* Domates */}
              <div className="stk-widget-item">
                <div className="stk-widget-urun">
                  <span className="stk-widget-urun-emoji">🍅</span>
                  <div className="stk-widget-urun-info">
                    <strong>Domates (120 kg)</strong>
                    <span>⚠️ 3 Gün Kaldı</span>
                  </div>
                </div>
                <div className="stk-widget-kardes">
                  <div className="stk-widget-kardes-avatar">BS</div>
                  <div className="stk-widget-kardes-info">
                    <strong>Bereket Salça Atölyesi</strong>
                    <span>Salça Üretimi İçin Uygun</span>
                  </div>
                </div>
              </div>

              {/* İncir */}
              <div className="stk-widget-item">
                <div className="stk-widget-urun">
                  <span className="stk-widget-urun-emoji">🟣</span>
                  <div className="stk-widget-urun-info">
                    <strong>İncir (45 kg)</strong>
                    <span>⚠️ 2 Gün Kaldı</span>
                  </div>
                </div>
                <div className="stk-widget-kardes">
                  <div className="stk-widget-kardes-avatar">TŞ</div>
                  <div className="stk-widget-kardes-info">
                    <strong>Tatlıcı Şirin Kooperatifi</strong>
                    <span>Reçel Üretimi İçin Uygun</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Talep Trendi ── */}
          {summary && (summary.trends.up.length > 0 || summary.trends.down.length > 0) && (
            <section className="section-block" id="trend-section">
              <div className="section-block-header">
                <span className="section-block-icon">📈</span>
                <h3>Talep Trendi</h3>
                <span className="section-block-date">Bu hafta vs geçen hafta</span>
              </div>
              <div className="ai-log-list">
                {summary.trends.up.map((t, i) => (
                  <div key={i} className="ai-log-item log-green">
                    <div className="log-tip log-tip-green">↑ Artan</div>
                    <div className="log-mesaj">{t.name}</div>
                    <div className="log-zaman">{t.delta}</div>
                  </div>
                ))}
                {summary.trends.down.map((t, i) => (
                  <div key={i} className="ai-log-item log-red">
                    <div className="log-tip log-tip-red">↓ Azalan</div>
                    <div className="log-mesaj">{t.name}</div>
                    <div className="log-zaman">{t.delta}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
              <div className="ai-log-item log-blue">
                <div className="log-tip log-tip-blue">Rapor</div>
                <div className="log-mesaj">Detaylı AI logları için AI Logs sayfasını ziyaret edin.</div>
                <div className="log-zaman">→</div>
              </div>
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
                <span className="ai-ozet-title">Günlük AI Analizi — {summary ? parseTrDate(summary.date) : '—'}</span>
              </div>

              {/* Yükleniyor */}
              {briefLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
                  {[80, 65, 72].map((w, i) => (
                    <div key={i} style={{
                      height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#e8f5e9 25%,#c8e6c9 50%,#e8f5e9 75%)',
                      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                      width: `${w}%`, opacity: 0.7
                    }} />
                  ))}
                </div>
              )}

              {/* Hata */}
              {!briefLoading && briefError && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
                  AI özeti şu an alınamadı. Backend çalışıyor mu?
                </div>
              )}

              {/* Gerçek AI içeriği */}
              {!briefLoading && !briefError && brief && (
                <ul className="ai-ozet-list">
                  {brief.bullets.map((bullet, i) => (
                    <li key={i}><span className="ai-bullet">›</span>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
