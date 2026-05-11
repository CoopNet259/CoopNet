'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import './ai-raporlar.css';
import { getAIReports } from '@/lib/api/client';

const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
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
  chevron: 'M9 18l6-6-6-6',
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  search: ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z', 'M16 16l3.5 3.5'],
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

interface ReportItem {
  id: number;
  baslik: string;
  maddeler: string[];
}

const defaultInsights = [
  'AI raporları sistemdeki en önemli değişiklikleri öne çıkarır.',
  'Her rapor, depo ve talep verileri baz alınarak üretilir.',
  'Bugünkü ana aksiyon önerileri gerçek zamanlı verilere dayanır.',
];

function parseReportItems(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return [value]; }
  }
  return [];
}

export default function AIRaporlarPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('ai-raporlar');
  const [showNotif, setShowNotif] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const summary = useMemo(() => ({
    reports: reports.length,
    bulletItems: reports.reduce((acc, item) => acc + item.maddeler.length, 0),
  }), [reports]);

  useEffect(() => {
    getAIReports()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item) => ({
            id: item.id,
            baslik: item.baslik,
            maddeler: parseReportItems(item.maddeler),
          }));
          setReports(formatted);
        }
      })
      .catch(err => console.error('AI raporları çekilemedi:', err))
      .finally(() => setLoading(false));
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
              <p>Admin Paneli</p>
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
            <span className="header-coop-icon">🤖</span>
            <div>
              <h1 className="header-coop-name">AI Raporları</h1>
              <p className="header-coop-sub">Sistemin oluşturduğu akıllı öngörü raporlarını izleyin</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Rapor veya anahtar kelime ara…" />
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} id="notif-btn">
                <Icon d={icons.bell} size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="reports-topbar">
            <div>
              <h2>Günlük AI Analizleri</h2>
              <p>AI kaynaklı raporlarınız, anahtar sonuçlar ve aksiyon önerileri tek ekranda.</p>
            </div>
            <div className="report-badges">
              <span className="report-pill">Raporlar: {loading ? '...' : summary.reports}</span>
              <span className="report-pill">Öneri Maddesi: {loading ? '...' : summary.bulletItems}</span>
            </div>
          </div>

          <div className="reports-grid">
            {loading && <div className="reports-loading">Veri yükleniyor...</div>}
            {!loading && reports.length === 0 && <div className="reports-empty">Henüz AI raporu bulunmuyor.</div>}
            {!loading && reports.map(report => (
              <article key={report.id} className="report-card">
                <div className="report-card-header">
                  <div>
                    <p className="report-label">AI Raporu</p>
                    <h3>{report.baslik}</h3>
                  </div>
                  <span className="report-step">#{report.id}</span>
                </div>
                <ul className="report-bullets">
                  {report.maddeler.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <section className="insight-panel">
            <div className="panel-header insight-header">
              <Icon d={icons.brain} size={18} />
              <h3>AI Öngörüleri</h3>
            </div>
            <div className="insight-list">
              {defaultInsights.map((insight, index) => (
                <div key={index} className="insight-item">
                  <span>{index + 1}</span>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
