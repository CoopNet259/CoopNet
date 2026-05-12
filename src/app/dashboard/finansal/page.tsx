'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './finansal.css';
import NotifBell from '../components/NotifBell';
import { getFinancialSummary, type FinancialSummary } from '@/lib/api/client';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function todayTr(): string { const n = new Date(); return `${n.getDate()} ${TR_MONTHS[n.getMonth()]} ${n.getFullYear()}`; }
function yesterdayTr(): string { const n = new Date(); n.setDate(n.getDate() - 1); return `${n.getDate()} ${TR_MONTHS[n.getMonth()]} ${n.getFullYear()}`; }

const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid:         'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse:    ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard:    ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:        ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:       ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:        ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:        'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
  log:          ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6'],
  phone:        ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:      'M9 18l6-6-6-6',
  shift:        ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  logout:       ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:         ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  check:        'M20 6L9 17l-5-5',
  trendingUp:   ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  trendingDown: ['M23 18l-9.5-9.5-5 5L1 6','M17 18h6v-6'],
  pieChart:     ['M21.21 15.89A10 10 0 1 1 8 2.83','M22 12A10 10 0 0 0 12 2v10z'],
  zap:          ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  calendar:     ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  refresh:      ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
};

const navItems = [
  { id: 'dashboard',    label: 'Ana Sayfa',         icon: 'grid',      path: '/dashboard' },
  { id: 'depo',         label: 'Depo',              icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',     label: 'Talepler',          icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',   label: 'Üreticiler',        icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',     label: 'Finansal Raporlar', icon: 'dollar',    path: '/dashboard/finansal' },
  { id: 'anomali',      label: 'Anomali',           icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar',  label: 'AI Raporları',      icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',      label: 'AI Logs',           icon: 'log',       path: '/dashboard/ai-logs' },
  { id: 'vardiye',      label: 'Vardiye',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj',label: 'Üretici Mesaj',     icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

export default function FinansalRaporlarPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('finansal');
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getFinancialSummary()
      .then(setData)
      .catch(e => setError(e.message || 'Veri alınamadı'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleTask = (id: number) => {
    if (!data) return;
    setData({
      ...data,
      tasks: data.tasks.map(t => t.id === id ? { ...t, durum: !t.durum } : t),
    });
  };

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const yesterday = data?.yesterday;
  const tasks     = data?.tasks ?? [];
  const cards     = data?.weekly_cards ?? [];

  const Shimmer = ({ w = '100%', h = 20 }: { w?: string | number; h?: number }) => (
    <div className="fin-shimmer" style={{ width: w, height: h, borderRadius: 6 }} />
  );

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
            <span style={{ fontSize: 22 }}>📈</span>
            <div>
              <h2 className="header-coop-name">Finansal Raporlar</h2>
              <p className="header-coop-sub">Gerçek zamanlı sipariş & transfer verileri</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="fin-refresh-btn" onClick={load} title="Yenile">
              <Icon d={icons.refresh} size={16} />
            </button>
            <NotifBell />
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="fin-error-banner">
            <Icon d={icons.alert} size={16} /> {error}
            <button onClick={load}>Tekrar Dene</button>
          </div>
        )}

        {/* Content */}
        <div className="content">
          <div className="finansal-layout">

            {/* 1. SOL ÜST: Bugün Yapılacaklar */}
            <section className="finansal-panel">
              <div className="panel-header">
                <Icon d={icons.clipboard} size={18} extra="text-green-600" />
                <h3>Görevler</h3>
                {!loading && (
                  <span className="panel-badge green">
                    {tasks.filter(t => t.durum).length}/{tasks.length}
                  </span>
                )}
              </div>
              <div className="is-listesi">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="is-item" style={{ gap: 10 }}>
                        <Shimmer w={20} h={20} />
                        <Shimmer w="80%" h={14} />
                      </div>
                    ))
                  : tasks.length === 0
                    ? <p className="fin-empty">Görev bulunamadı.</p>
                    : tasks.map(t => (
                        <div key={t.id} className={`is-item${t.durum ? ' done' : ''}`}
                          onClick={() => toggleTask(t.id)}>
                          <div className={`is-check${t.durum ? ' checked' : ''}`}>
                            {t.durum && <Icon d={icons.check} size={12} />}
                          </div>
                          <span className="is-text">{t.is}</span>
                        </div>
                      ))
                }
              </div>
            </section>

            {/* 2. SAĞ ÜST: Dünün Raporu */}
            <section className="finansal-panel">
              <div className="panel-header">
                <Icon d={icons.calendar} size={18} extra="text-blue-500" />
                <h3>Dünün Raporu</h3>
                <span className="panel-badge" style={{ background: 'var(--blue-100)', color: 'var(--blue-500)' }}>
                  {yesterdayTr()}
                </span>
              </div>
              <div className="dun-rapor-grid">
                <div className="rapor-kpi-card">
                  <div className="kpi-icon">💰</div>
                  <div className="kpi-deger">
                    {loading ? <Shimmer w={80} h={22} /> : (yesterday?.ciro ?? '—')}
                  </div>
                  <div className="kpi-label">Tahmini Ciro</div>
                </div>
                <div className="rapor-kpi-card">
                  <div className="kpi-icon">📦</div>
                  <div className="kpi-deger">
                    {loading ? <Shimmer w={50} h={22} /> : (yesterday?.siparis_sayisi ?? '—')}
                  </div>
                  <div className="kpi-label">Sipariş</div>
                </div>
                <div className="rapor-kpi-card">
                  <div className="kpi-icon">♻️</div>
                  <div className="kpi-deger">
                    {loading ? <Shimmer w={60} h={22} /> : `${yesterday?.israf_kg ?? 0} kg`}
                  </div>
                  <div className="kpi-label">İsrafı Önlenen</div>
                </div>
                <div className="rapor-kpi-card">
                  <div className="kpi-icon">🤝</div>
                  <div className="kpi-deger">
                    {loading ? <Shimmer w={40} h={22} /> : (yesterday?.transfer_sayisi ?? '—')}
                  </div>
                  <div className="kpi-label">Kardeş Transfer</div>
                </div>
              </div>
            </section>

            {/* 3. SOL ALT: AI Analiz */}
            <section className="finansal-panel ai-panel">
              <div className="panel-header">
                <Icon d={icons.brain} size={18} extra="text-green-600" />
                <h3>AI Finansal Durum Analizi</h3>
                <span className="panel-badge gold">Canlı Veri ✨</span>
              </div>
              <div className="ai-ozet-content">
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Shimmer w="95%" h={14} />
                    <Shimmer w="80%" h={14} />
                    <Shimmer w="88%" h={14} />
                  </div>
                ) : (
                  <>
                    <p className="ai-paragraf">
                      Bu haftaki <strong>{cards.find(c => c.id === 2)?.deger ?? '—'} sipariş</strong> işlendi.{' '}
                      Tahmini haftalık ciro <strong>{cards.find(c => c.id === 1)?.deger ?? '—'}</strong> olarak hesaplandı.{' '}
                      Kardeş üretici transferleriyle{' '}
                      <strong>{cards.find(c => c.id === 4)?.deger ?? '—'}</strong> değerinde israf riski önlendi.
                    </p>
                    <div className="ai-aksiyon-list">
                      {cards.filter(c => c.yon === 'down').map(c => (
                        <div key={c.id} className="ai-aksiyon-item">
                          <Icon d={icons.zap} size={16} extra="ai-aksiyon-icon" />
                          <span className="ai-aksiyon-text">
                            <strong>{c.baslik}</strong>: {c.trend} değişim — geçen haftayla karşılaştırıldı.
                          </span>
                        </div>
                      ))}
                      {cards.filter(c => c.yon === 'down').length === 0 && (
                        <div className="ai-aksiyon-item">
                          <Icon d={icons.zap} size={16} extra="ai-aksiyon-icon" />
                          <span className="ai-aksiyon-text">Bu hafta tüm metrikler pozitif seyredyor. Kooperatif performansı iyi durumda.</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 4. SAĞ ALT: Haftalık Rapor */}
            <section className="finansal-panel">
              <div className="panel-header">
                <Icon d={icons.trendingUp} size={18} extra="text-green-600" />
                <h3>Haftalık Rapor</h3>
                <span className="panel-badge green">Son 7 Gün</span>
              </div>
              <div className="haftalik-list">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="haftalik-item">
                        <div className="haftalik-info">
                          <Shimmer w={36} h={36} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Shimmer w={140} h={13} />
                            <Shimmer w={80} h={11} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <Shimmer w={70} h={16} />
                          <Shimmer w={50} h={12} />
                        </div>
                      </div>
                    ))
                  : cards.map(veri => (
                      <div key={veri.id} className="haftalik-item">
                        <div className="haftalik-info">
                          <div className="haftalik-icon">
                            <Icon d={icons[veri.icon] ?? icons.dollar} size={18} />
                          </div>
                          <div className="haftalik-text">
                            <strong>{veri.baslik}</strong>
                            <span>Son 7 gün</span>
                          </div>
                        </div>
                        <div className="haftalik-deger">
                          <strong>{veri.deger}</strong>
                          <span className={`trend-badge ${veri.yon}`}>
                            {veri.trend} {veri.yon === 'up' ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    ))
                }
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
