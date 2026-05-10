'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';

/* ── Inline SVG icons ─────────────────────────────────────────────── */
const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  building: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  dollar:   ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  tag:      ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z','M7 7h.01'],
  truck:    ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z','M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  chart:    ['M18 20V10','M12 20V4','M6 20v-6'],
  shopping: ['M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z','M3 6h18','M16 10a4 4 0 0 1-8 0'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  help:     ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z','M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3','M12 17h.01'],
  search:   ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  plus:     'M12 5v14M5 12h14',
  leaf:     'M17 8C8 10 5.9 16.17 3.82 19.93c-.37.65.43 1.3.99.75C7.61 17.82 12 17 17 17V8z M17 8l3-3',
  x:        'M18 6L6 18M6 6l12 12',
};

/* ── Data ─────────────────────────────────────────────────────────── */
const kpiData = [
  { icon: '🌾', label: 'Active Members',       value: '2,847', delta: '+12.4%', up: true,  pct: 76, color: 'green', deco: '🌿' },
  { icon: '💰', label: 'Monthly Revenue',      value: '₺4.2M', delta: '+8.1%',  up: true,  pct: 62, color: 'brown', deco: '🍎' },
  { icon: '🏘️', label: 'Active Cooperatives', value: '148',   delta: '−2.3%', up: false, pct: 48, color: 'red',   deco: '🌽' },
  { icon: '📦', label: 'Produce Volume (MTD)', value: '38.4t', delta: '+19.7%', up: true,  pct: 84, color: 'gold',  deco: '🍇' },
];

type StatusType = 'active' | 'pending' | 'review';

const cooperatives: { num: string; emoji: string; name: string; volume: string; revenue: string; trend: number[]; trendDown: boolean[]; status: StatusType }[] = [
  { num: '01', emoji: '🍅', name: 'İzmir Domates Koop.',    volume: '8.2t', revenue: '₺842K', trend: [12,18,14,20,22,24], trendDown: [false,false,false,false,false,false], status: 'active' },
  { num: '02', emoji: '🫒', name: 'Ege Zeytinyağı Koop.',   volume: '6.8t', revenue: '₺1.1M', trend: [16,16,18,17,18,18], trendDown: [false,false,false,false,false,false], status: 'active' },
  { num: '03', emoji: '🍇', name: 'Manisa Üzüm Koop.',      volume: '5.4t', revenue: '₺620K', trend: [10,8,12,14,13,15],  trendDown: [false,true,false,false,false,false],  status: 'pending' },
  { num: '04', emoji: '🌾', name: 'Aydın Buğday Koop.',     volume: '4.9t', revenue: '₺390K', trend: [18,16,14,12,10,9],  trendDown: [false,true,true,true,true,true],      status: 'review' },
  { num: '05', emoji: '🍓', name: 'Balıkesir Çilek Koop.',  volume: '4.1t', revenue: '₺510K', trend: [8,11,14,16,18,20],  trendDown: [false,false,false,false,false,false], status: 'active' },
];

const activities = [
  { icon: '🌾', title: 'New harvest registered',  desc: 'İzmir Domates Koop. — 2.4t tomatoes logged',     time: '2m ago' },
  { icon: '👤', title: 'Member onboarded',         desc: 'Fatma Şahin joined Ege Zeytinyağı Koop.',         time: '18m ago' },
  { icon: '💸', title: 'Payment processed',        desc: '₺128,400 disbursed to 6 cooperatives',            time: '1h ago' },
  { icon: '⚠️', title: 'Compliance alert',         desc: 'Aydın Buğday Q1 report overdue',                  time: '3h ago' },
  { icon: '🚚', title: 'Shipment dispatched',      desc: '8 pallets en route to Istanbul market',           time: '5h ago' },
  { icon: '📋', title: 'Audit completed',          desc: 'Balıkesir Çilek Koop. passed inspection',         time: 'Yesterday' },
];

const donutData = [
  { label: 'Vegetables', pct: 34, color: '#38996a', emoji: '🥬' },
  { label: 'Fruits',     pct: 27, color: '#4db882', emoji: '🍎' },
  { label: 'Grains',     pct: 22, color: '#d4a97c', emoji: '🌾' },
  { label: 'Herbs',      pct: 10, color: '#c0392b', emoji: '🌿' },
  { label: 'Other',      pct: 7,  color: '#e2e6ea', emoji: '📦' },
];

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',       icon: 'grid',     section: 'OVERVIEW',    badge: null,  badgeRed: false },
  { id: 'members',      label: 'Members',         icon: 'users',    section: null,           badge: '3',   badgeRed: false },
  { id: 'cooperatives', label: 'Cooperatives',    icon: 'building', section: null,           badge: null,  badgeRed: false },
  { id: 'financials',   label: 'Financials',      icon: 'dollar',   section: null,           badge: null,  badgeRed: false },
  { id: 'catalog',      label: 'Produce Catalog', icon: 'tag',      section: 'OPERATIONS',   badge: null,  badgeRed: false },
  { id: 'logistics',    label: 'Logistics',       icon: 'truck',    section: null,           badge: null,  badgeRed: false },
  { id: 'reports',      label: 'Reports',         icon: 'chart',    section: null,           badge: null,  badgeRed: false },
  { id: 'marketplace',  label: 'Marketplace',     icon: 'shopping', section: null,           badge: '12',  badgeRed: true  },
  { id: 'settings',     label: 'Settings',        icon: 'settings', section: 'SETTINGS',     badge: null,  badgeRed: false },
];

/* ── Donut math ───────────────────────────────────────────────────── */
const R = 56, SW = 24, CIRC = 2 * Math.PI * R;
function buildSegments(data: typeof donutData) {
  let offset = 0;
  return data.map((d) => {
    const dash = (d.pct / 100) * CIRC;
    const seg = { ...d, dash, gap: CIRC - dash, offset };
    offset += dash;
    return seg;
  });
}
const segments = buildSegments(donutData);

const statusLabel: Record<StatusType, string> = { active: 'Active', pending: 'Pending', review: 'Review' };
const TABS = ['7D', '30D', '90D', 'YTD'] as const;

/* ─────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [activeTab, setActiveTab]       = useState<string>('30D');
  const [barsReady, setBarsReady]       = useState(false);
  const [showNotif, setShowNotif]       = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* KPI bar animation */
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (id === 'cooperatives') {
      router.push('/dashboard/cooperative');
    }
  };

  return (
    <div className="coopnet-root">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" fill="rgba(255,255,255,0.2)" />
              <path d="M11 4c-2.8 0-5 2.2-5 5 0 2 1.1 3.7 2.8 4.6L11 18l2.2-4.4C14.9 12.7 16 11 16 9c0-2.8-2.2-5-5-5z"
                fill="#fff" opacity="0.9" />
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>CoopNet</h1>
            <p>Cooperative OS</p>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <span key={item.id}>
              {item.section && (
                <div className="nav-section-label">{item.section}</div>
              )}
              <div
                className={`nav-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon d={icons[item.icon as keyof typeof icons]} size={17} extra="nav-item-icon" />
                <span className="nav-item-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge${item.badgeRed ? ' red' : ''}`}>{item.badge}</span>
                )}
              </div>
            </span>
          ))}
        </nav>

        <div className="sidebar-deco">
          {['🌾','🍎','🌿','🌽','🌾'].map((e, i) => <span key={i}>{e}</span>)}
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">AY</div>
            <div className="user-chip-text">
              <h4>Ahmet Yılmaz</h4>
              <p>Region Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="main">

        {/* Header */}
        <header className="header">
          <div className="header-breadcrumb">
            <span>CoopNet</span>
            <span className="sep">›</span>
            <span>Dashboard</span>
          </div>

          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Search cooperatives, members…" />
          </div>

          <div className="header-actions">
            {/* Notification button */}
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} title="Notifications">
                <Icon d={icons.bell} size={18} />
                <span className="notif-dot" />
              </button>
              {showNotif && (
                <div style={{
                  position: 'absolute', top: 46, right: 0, width: 300,
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden'
                }}>
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
                    Notifications
                  </div>
                  {[
                    { icon: '⚠️', text: 'Aydın Buğday Q1 overdue', time: '3h ago' },
                    { icon: '🌾', text: 'Harvest report ready', time: '1d ago' },
                    { icon: '👤', text: '3 new member requests', time: '2d ago' },
                  ].map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: i < 2 ? '1px solid #f9fafb' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontSize: 16 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <button style={{ fontSize: 12, color: '#38996a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      See all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="icon-btn" title="Calendar">
              <Icon d={icons.calendar} size={18} />
            </button>
            <button className="icon-btn" title="Help" onClick={() => alert('CoopNet Help Center — coming soon')}>
              <Icon d={icons.help} size={18} />
            </button>
            <div className="header-avatar">AY</div>
          </div>
        </header>

        {/* Content */}
        <div className="content">

          {/* Alert strip */}
          {!alertDismissed && (
            <div className="alert-strip">
              <span className="alert-strip-icon">🌾</span>
              <div className="alert-strip-body">
                <strong>Harvest Season Report Ready — Aegean Region</strong>
                <p>Q2 2026 produce volume summary is available. 14 cooperatives submitted data.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="alert-strip-btn" onClick={() => router.push('/dashboard/reports')}>
                  View Report →
                </button>
                <button onClick={() => setAlertDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0 4px' }}>
                  <Icon d={icons.x} size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Page header */}
          <div className="page-header">
            <div className="page-header-left">
              <h2>Overview Dashboard</h2>
              <p>Last updated: May 10, 2026 · Aegean Region Cluster</p>
            </div>
            <div className="page-actions">
              <div className="filter-tabs">
                {TABS.map((t) => (
                  <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <button className="btn btn-outline" onClick={() => alert('Exporting data…')}>
                <Icon d={icons.download} size={14} /> Export
              </button>
              <button className="btn btn-primary" onClick={() => router.push('/dashboard/cooperative/new')}>
                <Icon d={icons.plus} size={14} /> Add Cooperative
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="kpi-grid">
            {kpiData.map((k, i) => (
              <div key={k.label} className={`kpi-card ${k.color}`}
                style={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/${k.label.toLowerCase().replace(/\s+/g,'-')}`)}>
                <div className="kpi-top">
                  <div className="kpi-icon">{k.icon}</div>
                  <span className={`kpi-delta ${k.up ? 'up' : 'down'}`}>
                    {k.up ? '↑' : '↓'} {k.delta}
                  </span>
                </div>
                <div className="kpi-value">{k.value}</div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-bar">
                  <div className="kpi-bar-track">
                    <div
                      className={`kpi-bar-fill ${k.color}`}
                      ref={(el) => { barRefs.current[i] = el; }}
                      style={{ width: barsReady ? `${k.pct}%` : '0%' }}
                    />
                  </div>
                </div>
                <span className="deco-fruit">{k.deco}</span>
              </div>
            ))}
          </div>

          {/* Content grid */}
          <div className="content-grid" style={{ marginBottom: 16 }}>

            {/* Revenue Bar Chart */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">📊</span>
                  <h3>Monthly Revenue</h3>
                  <span className="card-sub">Jan – Jun 2026 · {activeTab}</span>
                </div>
                <button className="card-action" onClick={() => router.push('/dashboard/financials')}>Full Report →</button>
              </div>
              <div className="chart-wrap">
                <svg className="chart-svg" viewBox="0 0 680 180" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38996a" /><stop offset="100%" stopColor="#2d7a52" />
                    </linearGradient>
                    <linearGradient id="barGradBrown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a97c" /><stop offset="100%" stopColor="#9c6b45" />
                    </linearGradient>
                  </defs>
                  {[0,1,2,3,4].map((i) => {
                    const y = 20 + i * 35;
                    return (
                      <g key={i}>
                        <line x1="44" y1={y} x2="672" y2={y} stroke="#f0f0f0" strokeWidth="1" />
                        <text x="38" y={y+4} textAnchor="end" fontSize="10" fill="#9ca3af">
                          {['5M','4M','3M','2M','1M'][i]}
                        </text>
                      </g>
                    );
                  })}
                  {[
                    { actual: 2.8, target: 3.2 },
                    { actual: 3.1, target: 3.4 },
                    { actual: 3.6, target: 3.8 },
                    { actual: 3.9, target: 4.0 },
                    { actual: 4.2, target: 4.0 },
                    { actual: null, target: 4.3 },
                  ].map((bar, i) => {
                    const x = 56 + i * 104, maxH = 140, scale = maxH / 5;
                    const aH = bar.actual !== null ? bar.actual * scale : 0;
                    const tH = bar.target * scale;
                    const isPreview = i === 5, isHighlight = i === 4;
                    return (
                      <g key={i}>
                        <rect x={x+22} y={160-tH} width={18} height={tH}
                          fill={isPreview ? 'none' : 'url(#barGradBrown)'}
                          stroke={isPreview ? '#d4a97c' : 'none'}
                          strokeDasharray={isPreview ? '4 2' : undefined}
                          strokeWidth={isPreview ? 1.5 : 0}
                          opacity={0.7} rx={3} />
                        {bar.actual !== null && (
                          <>
                            <rect x={x} y={160-aH} width={18} height={aH}
                              fill="url(#barGradGreen)" opacity={isHighlight ? 1 : 0.65} rx={3} />
                            {isHighlight && (
                              <g>
                                <rect x={x-8} y={160-aH-26} width={54} height={20} rx={10} fill="#1e3d2f" />
                                <text x={x+19} y={160-aH-12} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">₺4.2M</text>
                              </g>
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
                <div className="chart-x-labels">
                  {['Jan','Feb','Mar','Apr','May','Jun'].map((m) => (
                    <span key={m} className={m === 'May' ? 'active-month' : ''}>{m}</span>
                  ))}
                </div>
              </div>
              <div className="chart-legend">
                {[['#38996a','Actual Revenue'],['#d4a97c','Target'],['#d4a97c','Jun Forecast']].map(([c,l],i) => (
                  <div key={l} className="legend-item">
                    <div className="legend-dot" style={{ background: c, opacity: i === 2 ? 0.4 : 1 }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Donut */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🥧</span>
                  <h3>Produce Mix</h3>
                  <span className="card-sub">May 2026</span>
                </div>
              </div>
              <div className="donut-wrap">
                <div className="donut-svg-wrap">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    {segments.map((seg, i) => (
                      <circle key={i} cx="80" cy="80" r={R} fill="none"
                        stroke={seg.color} strokeWidth={SW}
                        strokeDasharray={`${seg.dash} ${seg.gap}`}
                        strokeDashoffset={-seg.offset + CIRC * 0.25}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
                      />
                    ))}
                  </svg>
                  <div className="donut-center-text">
                    <strong>38.4t</strong>
                    <small>Total Volume</small>
                  </div>
                </div>
                <div className="donut-legend">
                  {donutData.map((d) => (
                    <div key={d.label} className="donut-legend-item">
                      <div className="donut-legend-dot" style={{ background: d.color }} />
                      <span style={{ marginRight: 4 }}>{d.emoji}</span>
                      <span className="donut-legend-label">{d.label}</span>
                      <span className="donut-legend-pct">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom grid */}
          <div className="bottom-grid">

            {/* Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🏆</span>
                  <h3>Top Cooperatives</h3>
                  <span className="card-sub">by volume</span>
                </div>
                <button className="card-action" onClick={() => router.push('/dashboard/cooperative')}>View All →</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Cooperative</th><th>Volume</th><th>Revenue</th><th>Trend</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cooperatives.map((c) => (
                      <tr key={c.num} style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/dashboard/cooperative`)}>
                        <td style={{ color: 'var(--grey-400)', fontWeight: 700, fontSize: 12 }}>{c.num}</td>
                        <td><span className="produce-icon">{c.emoji}</span><span className="fw-700">{c.name}</span></td>
                        <td className="fw-700">{c.volume}</td>
                        <td>{c.revenue}</td>
                        <td>
                          <div className="trend-bars">
                            {c.trend.map((h, i) => (
                              <div key={i} className={`trend-bar${c.trendDown[i] ? ' down' : ''}`} style={{ height: `${h}px` }} />
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${c.status}`}>
                            <span className="pill-dot" />
                            {statusLabel[c.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">⚡</span>
                  <h3>Recent Activity</h3>
                </div>
                <button className="card-action" onClick={() => alert('Full activity log — coming soon')}>See All →</button>
              </div>
              <div className="activity-list">
                {activities.map((a, i) => (
                  <div key={i} className="activity-item" style={{ cursor: 'pointer' }}>
                    <div className="activity-dot">{a.icon}</div>
                    <div className="activity-body">
                      <strong>{a.title}</strong>
                      <p>{a.desc}</p>
                    </div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🗺️</span>
                  <h3>Regional Coverage</h3>
                  <span className="card-sub">Aegean Cluster</span>
                </div>
              </div>
              <div className="map-card-body">
                <div className="map-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <span>Interactive Map</span>
                  <small>14 clusters · 148 cooperatives</small>
                </div>
                <div className="map-pins">
                  {[{city:'İzmir',count:42},{city:'Manisa',count:28},{city:'Aydın',count:24},{city:'Balıkesir',count:18},{city:'Muğla',count:14},{city:'Denizli',count:22}].map((p) => (
                    <div key={p.city} className="map-pin" style={{ cursor: 'pointer' }}>
                      <div className="map-pin-dot" />{p.city} ({p.count})
                    </div>
                  ))}
                </div>
                <div className="map-growth-label">Member Growth · 2026</div>
                <svg className="sparkline-svg" viewBox="0 0 280 60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38996a" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38996a" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d="M10,48 L66,40 L122,32 L178,22 L234,16 L270,10 L270,58 L10,58 Z" fill="url(#sparkGrad)" />
                  <path d="M10,48 L66,40 L122,32 L178,22 L234,16 L270,10" fill="none" stroke="#38996a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {[[10,48],[66,40],[122,32],[178,22],[234,16],[270,10]].map(([cx,cy],i) => (
                    <circle key={i} cx={cx} cy={cy} r={3} fill="#38996a" />
                  ))}
                  {['Jan','Feb','Mar','Apr','May'].map((m,i) => (
                    <text key={m} x={10+i*56} y={58} fontSize="9" fill="#9ca3af" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
