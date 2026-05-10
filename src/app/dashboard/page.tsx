'use client';

import { useEffect, useRef } from 'react';
import './dashboard.css';

/* ── Inline SVG icons (Lucide-style) ─────────────────────────────── */
const Icon = ({
  d,
  size = 18,
  extra = '',
}: {
  d: string | string[];
  size?: number;
  extra?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={extra}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  building: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  dollar: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  box: ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
  tag: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  truck: ['M1 3h15v13H1z', 'M16 8h4l3 3v5h-7V8z', 'M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  chart: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  shopping: ['M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  calendar: ['M3 4h18v18H3z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  help: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'],
  search: ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z', 'M16 16l3.5 3.5'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  plus: 'M12 5v14M5 12h14',
  chevronRight: 'M9 18l6-6-6-6',
};

/* ── KPI data ─────────────────────────────────────────────────────── */
const kpiData = [
  {
    icon: '🌾',
    label: 'Active Members',
    value: '2,847',
    delta: '+12.4%',
    up: true,
    pct: 76,
    color: 'green',
    deco: '🌿',
  },
  {
    icon: '💰',
    label: 'Monthly Revenue',
    value: '₺4.2M',
    delta: '+8.1%',
    up: true,
    pct: 62,
    color: 'brown',
    deco: '🍎',
  },
  {
    icon: '🏘️',
    label: 'Active Cooperatives',
    value: '148',
    delta: '−2.3%',
    up: false,
    pct: 48,
    color: 'red',
    deco: '🌽',
  },
  {
    icon: '📦',
    label: 'Produce Volume (MTD)',
    value: '38.4t',
    delta: '+19.7%',
    up: true,
    pct: 84,
    color: 'gold',
    deco: '🍇',
  },
];

/* ── Cooperatives table data ──────────────────────────────────────── */
type StatusType = 'active' | 'pending' | 'review';

const cooperatives: {
  num: string;
  emoji: string;
  name: string;
  volume: string;
  revenue: string;
  trend: number[];
  trendDown: boolean[];
  status: StatusType;
}[] = [
  {
    num: '01',
    emoji: '🍅',
    name: 'İzmir Domates Koop.',
    volume: '8.2t',
    revenue: '₺842K',
    trend: [12, 18, 14, 20, 22, 24],
    trendDown: [false, false, false, false, false, false],
    status: 'active',
  },
  {
    num: '02',
    emoji: '🫒',
    name: 'Ege Zeytinyağı Koop.',
    volume: '6.8t',
    revenue: '₺1.1M',
    trend: [16, 16, 18, 17, 18, 18],
    trendDown: [false, false, false, false, false, false],
    status: 'active',
  },
  {
    num: '03',
    emoji: '🍇',
    name: 'Manisa Üzüm Koop.',
    volume: '5.4t',
    revenue: '₺620K',
    trend: [10, 8, 12, 14, 13, 15],
    trendDown: [false, true, false, false, false, false],
    status: 'pending',
  },
  {
    num: '04',
    emoji: '🌾',
    name: 'Aydın Buğday Koop.',
    volume: '4.9t',
    revenue: '₺390K',
    trend: [18, 16, 14, 12, 10, 9],
    trendDown: [false, true, true, true, true, true],
    status: 'review',
  },
  {
    num: '05',
    emoji: '🍓',
    name: 'Balıkesir Çilek Koop.',
    volume: '4.1t',
    revenue: '₺510K',
    trend: [8, 11, 14, 16, 18, 20],
    trendDown: [false, false, false, false, false, false],
    status: 'active',
  },
];

/* ── Activity data ────────────────────────────────────────────────── */
const activities = [
  {
    icon: '🌾',
    title: 'New harvest registered',
    desc: 'İzmir Domates Koop. — 2.4t tomatoes logged',
    time: '2m ago',
  },
  {
    icon: '👤',
    title: 'Member onboarded',
    desc: 'Fatma Şahin joined Ege Zeytinyağı Koop.',
    time: '18m ago',
  },
  {
    icon: '💸',
    title: 'Payment processed',
    desc: '₺128,400 disbursed to 6 cooperatives',
    time: '1h ago',
  },
  {
    icon: '⚠️',
    title: 'Compliance alert',
    desc: 'Aydın Buğday Q1 report overdue',
    time: '3h ago',
  },
  {
    icon: '🚚',
    title: 'Shipment dispatched',
    desc: '8 pallets en route to Istanbul market',
    time: '5h ago',
  },
  {
    icon: '📋',
    title: 'Audit completed',
    desc: 'Balıkesir Çilek Koop. passed inspection',
    time: 'Yesterday',
  },
];

/* ── Donut chart helper ────────────────────────────────────────────── */
function donutSegments(
  data: { pct: number; color: string }[],
  r: number,
  sw: number
) {
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return data.map((d) => {
    const dash = (d.pct / 100) * circ;
    const gap = circ - dash;
    const seg = { dash, gap, offset, ...d };
    offset += dash;
    return seg;
  });
}

const donutData = [
  { label: 'Vegetables', pct: 34, color: '#38996a', emoji: '🥬', tone: 'Dark Green' },
  { label: 'Fruits',     pct: 27, color: '#4db882', emoji: '🍎', tone: 'Light Green' },
  { label: 'Grains',     pct: 22, color: '#d4a97c', emoji: '🌾', tone: 'Brown' },
  { label: 'Herbs',      pct: 10, color: '#c0392b', emoji: '🌿', tone: 'Red' },
  { label: 'Other',      pct: 7,  color: '#e2e6ea', emoji: '📦', tone: 'Grey' },
];

const R = 56;
const SW = 24;
const segments = donutSegments(donutData, R, SW);
const circ = 2 * Math.PI * R;

/* ─────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    /* KPI bar animation */
    const timer = setTimeout(() => {
      barRefs.current.forEach((el, i) => {
        if (el) el.style.width = `${kpiData[i].pct}%`;
      });
    }, 120);

    /* Tab switcher */
    const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
    const handleTab = (e: Event) => {
      tabs.forEach((t) => t.classList.remove('active'));
      (e.currentTarget as HTMLButtonElement).classList.add('active');
    };
    tabs.forEach((t) => t.addEventListener('click', handleTab));

    /* Nav item active toggle */
    const navItems = document.querySelectorAll<HTMLDivElement>('.nav-item');
    const handleNav = (e: Event) => {
      navItems.forEach((n) => n.classList.remove('active'));
      (e.currentTarget as HTMLDivElement).classList.add('active');
    };
    navItems.forEach((n) => n.addEventListener('click', handleNav));

    return () => {
      clearTimeout(timer);
      tabs.forEach((t) => t.removeEventListener('click', handleTab));
      navItems.forEach((n) => n.removeEventListener('click', handleNav));
    };
  }, []);

  const statusLabel: Record<StatusType, string> = {
    active: 'Active',
    pending: 'Pending',
    review: 'Review',
  };

  return (
    <div className="coopnet-root">
      {/* ═══════════════════════════════════ SIDEBAR ═══════════════════════════════════ */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" fill="rgba(255,255,255,0.2)" />
              <path
                d="M11 4c-2.8 0-5 2.2-5 5 0 2 1.1 3.7 2.8 4.6L11 18l2.2-4.4C14.9 12.7 16 11 16 9c0-2.8-2.2-5-5-5z"
                fill="#fff"
                opacity="0.9"
              />
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>CoopNet</h1>
            <p>Cooperative OS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav>
          <div className="nav-section-label">Overview</div>

          <div className="nav-item active">
            <Icon d={icons.grid} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Dashboard</span>
          </div>

          <div className="nav-item">
            <Icon d={icons.users} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Members</span>
            <span className="nav-badge">3</span>
          </div>

          <div className="nav-item">
            <Icon d={icons.building} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Cooperatives</span>
          </div>

          <div className="nav-item">
            <Icon d={icons.dollar} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Financials</span>
          </div>

          <div className="nav-section-label">Operations</div>

          <div className="nav-item">
            <Icon d={icons.tag} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Produce Catalog</span>
          </div>

          <div className="nav-item">
            <Icon d={icons.truck} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Logistics</span>
          </div>

          <div className="nav-item">
            <Icon d={icons.chart} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Reports</span>
          </div>

          <div className="nav-item">
            <Icon d={icons.shopping} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Marketplace</span>
            <span className="nav-badge red">12</span>
          </div>

          <div className="nav-section-label">Settings</div>

          <div className="nav-item">
            <Icon d={icons.settings} size={17} extra="nav-item-icon" />
            <span className="nav-item-label">Settings</span>
          </div>
        </nav>

        {/* Decorative strip */}
        <div className="sidebar-deco">
          <span>🌾</span>
          <span>🍎</span>
          <span>🌿</span>
          <span>🌽</span>
          <span>🌾</span>
        </div>

        {/* User footer */}
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

      {/* ═══════════════════════════════════ MAIN ═══════════════════════════════════ */}
      <main className="main">
        {/* ─── Header ─── */}
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
            <button className="icon-btn" title="Notifications">
              <Icon d={icons.bell} size={18} />
              <span className="notif-dot" />
            </button>
            <button className="icon-btn" title="Calendar">
              <Icon d={icons.calendar} size={18} />
            </button>
            <button className="icon-btn" title="Help">
              <Icon d={icons.help} size={18} />
            </button>
            <div className="header-avatar">AY</div>
          </div>
        </header>

        {/* ─── Content ─── */}
        <div className="content">

          {/* Alert strip */}
          <div className="alert-strip">
            <span className="alert-strip-icon">🌾</span>
            <div className="alert-strip-body">
              <strong>Harvest Season Report Ready — Aegean Region</strong>
              <p>Q2 2026 produce volume summary is available. 14 cooperatives submitted data.</p>
            </div>
            <button className="alert-strip-btn">View Report →</button>
          </div>

          {/* Page header */}
          <div className="page-header">
            <div className="page-header-left">
              <h2>Overview Dashboard</h2>
              <p>Last updated: May 10, 2026 · Aegean Region Cluster</p>
            </div>
            <div className="page-actions">
              <div className="filter-tabs">
                <button className="tab">7D</button>
                <button className="tab active">30D</button>
                <button className="tab">90D</button>
                <button className="tab">YTD</button>
              </div>
              <button className="btn btn-outline">
                <Icon d={icons.download} size={14} />
                Export
              </button>
              <button className="btn btn-primary">
                <Icon d={icons.plus} size={14} />
                Add Cooperative
              </button>
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div className="kpi-grid">
            {kpiData.map((k, i) => (
              <div key={k.label} className={`kpi-card ${k.color}`}>
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
                    />
                  </div>
                </div>
                <span className="deco-fruit">{k.deco}</span>
              </div>
            ))}
          </div>

          {/* ── Content grid: Revenue chart + Donut ── */}
          <div className="content-grid" style={{ marginBottom: 16 }}>

            {/* Revenue Bar Chart */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">📊</span>
                  <h3>Monthly Revenue</h3>
                  <span className="card-sub">Jan – Jun 2026</span>
                </div>
                <button className="card-action">Full Report →</button>
              </div>
              <div className="chart-wrap">
                <svg
                  className="chart-svg"
                  viewBox="0 0 680 180"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38996a" />
                      <stop offset="100%" stopColor="#2d7a52" />
                    </linearGradient>
                    <linearGradient id="barGradBrown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a97c" />
                      <stop offset="100%" stopColor="#9c6b45" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = 20 + i * 35;
                    const label = ['5M', '4M', '3M', '2M', '1M'][i];
                    return (
                      <g key={i}>
                        <line x1="44" y1={y} x2="672" y2={y} stroke="#f0f0f0" strokeWidth="1" />
                        <text x="38" y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bar data: [actual, target] scaled to 160px max */}
                  {[
                    { actual: 2.8, target: 3.2 },
                    { actual: 3.1, target: 3.4 },
                    { actual: 3.6, target: 3.8 },
                    { actual: 3.9, target: 4.0 },
                    { actual: 4.2, target: 4.0 }, // May highlighted
                    { actual: null, target: 4.3 },  // Jun preview
                  ].map((bar, i) => {
                    const x = 56 + i * 104;
                    const maxH = 140;
                    const scale = maxH / 5;
                    const aH = bar.actual !== null ? bar.actual * scale : 0;
                    const tH = bar.target * scale;
                    const isHighlight = i === 4;
                    const isPreview = i === 5;

                    return (
                      <g key={i}>
                        {/* Target bar */}
                        <rect
                          x={x + 22}
                          y={160 - tH}
                          width={18}
                          height={tH}
                          fill={isPreview ? 'none' : 'url(#barGradBrown)'}
                          stroke={isPreview ? '#d4a97c' : 'none'}
                          strokeDasharray={isPreview ? '4 2' : undefined}
                          strokeWidth={isPreview ? 1.5 : 0}
                          opacity={0.7}
                          rx={3}
                        />
                        {/* Actual bar */}
                        {bar.actual !== null && (
                          <>
                            <rect
                              x={x}
                              y={160 - aH}
                              width={18}
                              height={aH}
                              fill={isHighlight ? 'url(#barGradGreen)' : 'url(#barGradGreen)'}
                              opacity={isHighlight ? 1 : 0.65}
                              rx={3}
                            />
                            {/* Tooltip for May */}
                            {isHighlight && (
                              <g>
                                <rect
                                  x={x - 8}
                                  y={160 - aH - 26}
                                  width={54}
                                  height={20}
                                  rx={10}
                                  fill="#1e3d2f"
                                />
                                <text
                                  x={x + 19}
                                  y={160 - aH - 12}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight="700"
                                  fill="#fff"
                                >
                                  ₺4.2M
                                </text>
                              </g>
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
                <div className="chart-x-labels">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
                    <span key={m} className={m === 'May' ? 'active-month' : ''}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#38996a' }} />
                  Actual Revenue
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#d4a97c' }} />
                  Target
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#d4a97c', opacity: 0.4 }} />
                  Jun Forecast
                </div>
              </div>
            </div>

            {/* Produce Mix Donut */}
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
                      <circle
                        key={i}
                        cx="80"
                        cy="80"
                        r={R}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={SW}
                        strokeDasharray={`${seg.dash} ${seg.gap}`}
                        strokeDashoffset={-seg.offset + circ * 0.25}
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

          {/* ── Bottom grid ── */}
          <div className="bottom-grid">

            {/* Cooperatives table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🏆</span>
                  <h3>Top Cooperatives</h3>
                  <span className="card-sub">by volume</span>
                </div>
                <button className="card-action">View All →</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cooperative</th>
                      <th>Volume</th>
                      <th>Revenue</th>
                      <th>Trend</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cooperatives.map((c) => (
                      <tr key={c.num}>
                        <td style={{ color: 'var(--grey-400)', fontWeight: 700, fontSize: 12 }}>
                          {c.num}
                        </td>
                        <td>
                          <span className="produce-icon">{c.emoji}</span>
                          <span className="fw-700">{c.name}</span>
                        </td>
                        <td className="fw-700">{c.volume}</td>
                        <td>{c.revenue}</td>
                        <td>
                          <div className="trend-bars">
                            {c.trend.map((h, i) => (
                              <div
                                key={i}
                                className={`trend-bar${c.trendDown[i] ? ' down' : ''}`}
                                style={{ height: `${h}px` }}
                              />
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

            {/* Activity feed */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">⚡</span>
                  <h3>Recent Activity</h3>
                </div>
                <button className="card-action">See All →</button>
              </div>
              <div className="activity-list">
                {activities.map((a, i) => (
                  <div key={i} className="activity-item">
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

            {/* Regional coverage */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🗺️</span>
                  <h3>Regional Coverage</h3>
                  <span className="card-sub">Aegean Cluster</span>
                </div>
              </div>
              <div className="map-card-body">
                {/* Map placeholder */}
                <div className="map-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <span>Interactive Map</span>
                  <small>14 clusters · 148 cooperatives</small>
                </div>

                {/* City pills */}
                <div className="map-pins">
                  {[
                    { city: 'İzmir', count: 42 },
                    { city: 'Manisa', count: 28 },
                    { city: 'Aydın', count: 24 },
                    { city: 'Balıkesir', count: 18 },
                    { city: 'Muğla', count: 14 },
                    { city: 'Denizli', count: 22 },
                  ].map((p) => (
                    <div key={p.city} className="map-pin">
                      <div className="map-pin-dot" />
                      {p.city} ({p.count})
                    </div>
                  ))}
                </div>

                {/* Member growth sparkline */}
                <div className="map-growth-label">Member Growth · 2026</div>
                <svg
                  className="sparkline-svg"
                  viewBox="0 0 280 60"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38996a" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38996a" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Area */}
                  <path
                    d="M10,48 L66,40 L122,32 L178,22 L234,16 L270,10 L270,58 L10,58 Z"
                    fill="url(#sparkGrad)"
                  />
                  {/* Line */}
                  <path
                    d="M10,48 L66,40 L122,32 L178,22 L234,16 L270,10"
                    fill="none"
                    stroke="#38996a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {[
                    [10, 48],
                    [66, 40],
                    [122, 32],
                    [178, 22],
                    [234, 16],
                    [270, 10],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r={3} fill="#38996a" />
                  ))}
                  {/* X-axis labels */}
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => (
                    <text
                      key={m}
                      x={10 + i * 56}
                      y={58}
                      fontSize="9"
                      fill="#9ca3af"
                      textAnchor="middle"
                    >
                      {m}
                    </text>
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
