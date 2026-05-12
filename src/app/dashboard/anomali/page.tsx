'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './anomali.css';
import { getAnomalySummary } from '@/lib/api/client';
import NotifBell from '../components/NotifBell';

const AUTO_REFRESH_MS = 60_000; // 60 saniyede bir otomatik yenile

const Icon = ({ d, size = 18, extra = '', cls = '' }: { d: string | string[]; size?: number; extra?: string; cls?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls || extra}>
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
  brain: ['M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'],
  log: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron: 'M9 18l6-6-6-6',
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  search: ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z', 'M16 16l3.5 3.5'],
  info: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 16v-4', 'M12 8h.01'],
  refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  trendUp: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  clock: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2'],
  truck: ['M1 3h15v13H1z', 'M16 8h4l3 3v5h-7V8z'],
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
  { id: 'vardiye',      label: 'Vardiye',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj', label: 'Üretici Mesaj', icon: 'phone', path: '/dashboard/uretici-mesaj' },
];

interface Anomaly {
  id: string;
  title: string;
  description: string;
  severity: 'kritik' | 'yuksek' | 'orta' | 'bilgi';
  category: string;
  source: string;
  recommendation: string;
}

// Kategori → ikon eşleşmesi
function categoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (c === 'depo')            return 'warehouse';
  if (c === 'israf')           return 'clock';
  if (c === 'talep')           return 'trendUp';
  if (c === 'lojistik')        return 'truck';
  if (c === 'stk')             return 'bell';
  if (c === 'ai tespiti')      return 'brain';
  return 'alert';
}

const SEVERITY_LABEL: Record<string, string> = {
  kritik: 'KRİTİK', yuksek: 'YÜKSEK', orta: 'ORTA', bilgi: 'BİLGİ',
};

export default function AnomaliPage() {
  const router = useRouter();
  const [activeNav, setActiveNav]       = useState('anomali');
  const [anomalies, setAnomalies]       = useState<Anomaly[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [countdown, setCountdown]       = useState(AUTO_REFRESH_MS / 1000);
  const [filterSev, setFilterSev]       = useState<string>('all');
  const [filterCat, setFilterCat]       = useState<string>('all');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const summary = useMemo(() => ({
    total:  anomalies.length,
    kritik: anomalies.filter(a => a.severity === 'kritik').length,
    yuksek: anomalies.filter(a => a.severity === 'yuksek').length,
    orta:   anomalies.filter(a => a.severity === 'orta').length,
    bilgi:  anomalies.filter(a => a.severity === 'bilgi').length,
  }), [anomalies]);

  const categories = useMemo(() =>
    ['all', ...Array.from(new Set(anomalies.map(a => a.category)))],
    [anomalies]
  );

  const filtered = useMemo(() =>
    anomalies.filter(a =>
      (filterSev === 'all' || a.severity === filterSev) &&
      (filterCat === 'all' || a.category === filterCat)
    ),
    [anomalies, filterSev, filterCat]
  );

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getAnomalySummary();
      setAnomalies(data.anomalies as any);
      setLastUpdated(new Date());
      setCountdown(AUTO_REFRESH_MS / 1000);
    } catch (err) {
      console.error('Anomali verisi çekilemedi:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // İlk yükleme
  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => loadData(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // Geri sayım
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? AUTO_REFRESH_MS / 1000 : c - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  return (
    <div className="coopnet-root">
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
            <div key={item.id} className={`nav-item${activeNav === item.id ? ' active' : ''}`} onClick={() => navClick(item)} id={`nav-${item.id}`}>
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
            </div>
          </div>
          <button className="logout-btn" onClick={() => router.push('/login')}>
            <Icon d={icons.logout} size={16} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-coop-title">
            <span className="header-coop-icon">⚠️</span>
            <div>
              <h1 className="header-coop-name">Anomali Yönetimi</h1>
              <p className="header-coop-sub">
                Stok · Talep · İsraf · Lojistik — canlı veri
                {lastUpdated && (
                  <span className="last-updated-sub">
                    {' '}· Son güncelleme {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="header-actions">
            {/* Auto-refresh countdown */}
            <div className="refresh-countdown" title="Otomatik yenileme">
              <div
                className="countdown-ring"
                style={{ '--pct': `${(countdown / (AUTO_REFRESH_MS / 1000)) * 100}` } as React.CSSProperties}
              />
              <span className="countdown-num">{countdown}</span>
            </div>
            <button
              className="btn-refresh-header"
              disabled={refreshing}
              onClick={() => loadData(true)}
            >
              <Icon d={icons.refresh} size={15} cls={refreshing ? 'spin-icon' : ''} />
              {refreshing ? 'Yenileniyor…' : 'Yenile'}
            </button>
            <NotifBell />
          </div>
        </header>

        <div className="content">

          {/* KPI Bar */}
          <div className="anomali-kpi-bar">
            <button
              className={`akpi-card akpi-total${filterSev === 'all' ? ' akpi-active' : ''}`}
              onClick={() => setFilterSev('all')}
            >
              <span className="akpi-num">{loading ? '—' : summary.total}</span>
              <span className="akpi-lbl">Toplam</span>
            </button>
            <button
              className={`akpi-card akpi-kritik${filterSev === 'kritik' ? ' akpi-active' : ''}`}
              onClick={() => setFilterSev(filterSev === 'kritik' ? 'all' : 'kritik')}
            >
              <span className="akpi-num">{loading ? '—' : summary.kritik}</span>
              <span className="akpi-lbl">Kritik</span>
            </button>
            <button
              className={`akpi-card akpi-yuksek${filterSev === 'yuksek' ? ' akpi-active' : ''}`}
              onClick={() => setFilterSev(filterSev === 'yuksek' ? 'all' : 'yuksek')}
            >
              <span className="akpi-num">{loading ? '—' : summary.yuksek}</span>
              <span className="akpi-lbl">Yüksek</span>
            </button>
            <button
              className={`akpi-card akpi-orta${filterSev === 'orta' ? ' akpi-active' : ''}`}
              onClick={() => setFilterSev(filterSev === 'orta' ? 'all' : 'orta')}
            >
              <span className="akpi-num">{loading ? '—' : summary.orta}</span>
              <span className="akpi-lbl">Orta</span>
            </button>
            <button
              className={`akpi-card akpi-bilgi${filterSev === 'bilgi' ? ' akpi-active' : ''}`}
              onClick={() => setFilterSev(filterSev === 'bilgi' ? 'all' : 'bilgi')}
            >
              <span className="akpi-num">{loading ? '—' : summary.bilgi}</span>
              <span className="akpi-lbl">Bilgi</span>
            </button>
          </div>

          {/* Kategori filtre */}
          <div className="anomali-cat-bar">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-chip${filterCat === cat ? ' cat-chip-active' : ''}`}
                onClick={() => setFilterCat(cat)}
              >
                {cat === 'all' ? 'Tüm Kategoriler' : cat}
                {cat !== 'all' && (
                  <span className="cat-count">
                    {anomalies.filter(a => a.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <section className="anomali-panel">
            <div className="panel-header anomaly-header">
              <Icon d={icons.alert} size={18} />
              <h3>Canlı Anomali Akışı</h3>
              <span className="panel-badge red">
                {filtered.length} sonuç
              </span>
            </div>

            <div className="anomaly-list">
              {loading && (
                <div className="anomali-skeleton">
                  {[1,2,3].map(i => (
                    <div key={i} className="anomaly-sk-card">
                      <div className="sk-line sk-title" />
                      <div className="sk-line sk-sub" />
                      <div className="sk-line sk-desc" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="anomali-empty">
                  <div style={{ fontSize: 40 }}>✅</div>
                  <strong>Seçili filtrede anomali yok</strong>
                  <p>Tüm kategorileri görmek için filtreyi sıfırlayın.</p>
                </div>
              )}

              {!loading && filtered.map(anomaly => (
                <div key={anomaly.id} className={`anomaly-card sev-${anomaly.severity}`}>
                  <div className={`anomaly-accent accent-${anomaly.severity}`} />
                  <div className="anomaly-card-inner">
                    <div className="anomaly-card-top">
                      <div className={`anomaly-cat-icon cat-icon-${anomaly.severity}`}>
                        <Icon d={icons[categoryIcon(anomaly.category)]} size={16} />
                      </div>
                      <div className="anomaly-title-block">
                        <strong>{anomaly.title}</strong>
                        <span className="anomaly-meta">{anomaly.category} · {anomaly.source}</span>
                      </div>
                      <span className={`anomaly-pill pill-${anomaly.severity}`}>
                        {SEVERITY_LABEL[anomaly.severity] ?? anomaly.severity}
                      </span>
                    </div>
                    <p className="anomaly-description-text">{anomaly.description}</p>
                    <div className="anomaly-footer">
                      <span className="anomaly-rec-label">💡 Öneri:</span>
                      <span className="anomaly-rec-text">{anomaly.recommendation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
