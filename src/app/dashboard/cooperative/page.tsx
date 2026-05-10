'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../dashboard.css';
import './cooperative.css';

/* ── Icon helper ─────────────────────────────────────────────────── */
const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  users:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  building:  ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  dollar:    ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  tag:       ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z','M7 7h.01'],
  truck:     ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z','M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  chart:     ['M18 20V10','M12 20V4','M6 20v-6'],
  shopping:  ['M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z','M3 6h18','M16 10a4 4 0 0 1-8 0'],
  settings:  ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  bell:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  calendar:  ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  help:      ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z','M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3','M12 17h.01'],
  search:    ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  download:  ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  plus:      'M12 5v14M5 12h14',
  arrowLeft: ['M19 12H5','M12 19l-7-7 7-7'],
  check:     'M20 6L9 17l-5-5',
  edit:      ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],
  phone:     ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  mail:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  filter:    ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  x:         'M18 6L6 18M6 6l12 12',
};

/* ── Cooperative data ─────────────────────────────────────────────── */
type StatusType = 'active' | 'pending' | 'review';

const cooperativesData = [
  {
    id: 1, emoji: '🍅', name: 'İzmir Domates Kooperatifi', short: 'İzmir Domates',
    city: 'İzmir', founded: '2018', members: 142, volume: '8.2t', revenue: '₺842K',
    status: 'active' as StatusType, category: 'Vegetables',
    contact: 'Mehmet Yıldız', phone: '+90 532 111 2233', email: 'izmir@domates.coop',
    description: 'Ege\'nin en büyük domates üreticisi kooperatifi. Organik sertifikalı üretim.',
    monthlyData: [5.2, 6.1, 7.0, 7.8, 8.2, 8.5],
    members_list: [
      { name: 'Mehmet Yıldız', role: 'Başkan', joined: 'Mar 2018', produce: '1.2t' },
      { name: 'Ayşe Kaya',     role: 'Üye',    joined: 'Jun 2019', produce: '0.9t' },
      { name: 'Hasan Demir',   role: 'Üye',    joined: 'Jan 2020', produce: '0.8t' },
      { name: 'Fatma Çelik',   role: 'Üye',    joined: 'Apr 2021', produce: '0.7t' },
    ],
  },
  {
    id: 2, emoji: '🫒', name: 'Ege Zeytinyağı Kooperatifi', short: 'Ege Zeytinyağı',
    city: 'İzmir', founded: '2015', members: 98, volume: '6.8t', revenue: '₺1.1M',
    status: 'active' as StatusType, category: 'Olive Oil',
    contact: 'Zeynep Arslan', phone: '+90 532 222 3344', email: 'info@ege-zeytinyagi.coop',
    description: 'Premium zeytinyağı üretimi. 200 yıllık zeytin bahçelerinden soğuk sıkım.',
    monthlyData: [4.8, 5.2, 6.0, 6.4, 6.8, 7.1],
    members_list: [
      { name: 'Zeynep Arslan', role: 'Başkan', joined: 'Jan 2015', produce: '1.8t' },
      { name: 'Ali Öztürk',    role: 'Üye',    joined: 'Mar 2016', produce: '1.2t' },
      { name: 'Gülay Şahin',   role: 'Üye',    joined: 'Sep 2017', produce: '0.9t' },
    ],
  },
  {
    id: 3, emoji: '🍇', name: 'Manisa Üzüm Kooperatifi', short: 'Manisa Üzüm',
    city: 'Manisa', founded: '2019', members: 76, volume: '5.4t', revenue: '₺620K',
    status: 'pending' as StatusType, category: 'Fruits',
    contact: 'Kemal Bozkurt', phone: '+90 532 333 4455', email: 'manisa@uzum.coop',
    description: 'Sarı çekirdeksiz üzüm başta olmak üzere 12 çeşit üzüm üretimi.',
    monthlyData: [3.1, 3.8, 4.2, 4.9, 5.4, 5.8],
    members_list: [
      { name: 'Kemal Bozkurt', role: 'Başkan', joined: 'Feb 2019', produce: '1.1t' },
      { name: 'Sevim Yılmaz',  role: 'Üye',    joined: 'Jul 2020', produce: '0.8t' },
    ],
  },
  {
    id: 4, emoji: '🌾', name: 'Aydın Buğday Kooperatifi', short: 'Aydın Buğday',
    city: 'Aydın', founded: '2016', members: 210, volume: '4.9t', revenue: '₺390K',
    status: 'review' as StatusType, category: 'Grains',
    contact: 'Mustafa Eren', phone: '+90 532 444 5566', email: 'aydin@bugday.coop',
    description: 'Aydın ovasında buğday ve arpa üretimi. Q1 raporu eksik.',
    monthlyData: [6.1, 5.8, 5.4, 5.1, 4.9, 4.7],
    members_list: [
      { name: 'Mustafa Eren',  role: 'Başkan', joined: 'Apr 2016', produce: '0.8t' },
      { name: 'Cemil Ak',      role: 'Üye',    joined: 'Aug 2017', produce: '0.6t' },
      { name: 'Hatice Güneş',  role: 'Üye',    joined: 'Nov 2018', produce: '0.5t' },
    ],
  },
  {
    id: 5, emoji: '🍓', name: 'Balıkesir Çilek Kooperatifi', short: 'Balıkesir Çilek',
    city: 'Balıkesir', founded: '2021', members: 54, volume: '4.1t', revenue: '₺510K',
    status: 'active' as StatusType, category: 'Fruits',
    contact: 'Selin Koç', phone: '+90 532 555 6677', email: 'balikesir@cilek.coop',
    description: 'Genç girişimci kooperatifi. Yüksek kalite çilek ve yaban mersini.',
    monthlyData: [1.8, 2.4, 3.0, 3.6, 4.1, 4.5],
    members_list: [
      { name: 'Selin Koç',    role: 'Başkan', joined: 'May 2021', produce: '0.9t' },
      { name: 'Burak Yıldız', role: 'Üye',    joined: 'Jun 2021', produce: '0.7t' },
      { name: 'Merve Doğan',  role: 'Üye',    joined: 'Sep 2021', produce: '0.6t' },
    ],
  },
];

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',       icon: 'grid',     section: 'OVERVIEW' },
  { id: 'members',      label: 'Members',         icon: 'users',    section: null,       badge: '3' },
  { id: 'cooperatives', label: 'Cooperatives',    icon: 'building', section: null },
  { id: 'financials',   label: 'Financials',      icon: 'dollar',   section: null },
  { id: 'catalog',      label: 'Produce Catalog', icon: 'tag',      section: 'OPERATIONS' },
  { id: 'logistics',    label: 'Logistics',       icon: 'truck',    section: null },
  { id: 'reports',      label: 'Reports',         icon: 'chart',    section: null },
  { id: 'marketplace',  label: 'Marketplace',     icon: 'shopping', section: null, badge: '12', badgeRed: true },
  { id: 'settings',     label: 'Settings',        icon: 'settings', section: 'SETTINGS' },
];

const statusLabel: Record<StatusType, string> = { active: 'Active', pending: 'Pending', review: 'Review' };
const CATS = ['All', 'Vegetables', 'Fruits', 'Grains', 'Olive Oil'];

/* ─────────────────────────────────────────────────────────────────── */

export default function CooperativePage() {
  const router = useRouter();
  const [search, setSearch]               = useState('');
  const [filterCat, setFilterCat]         = useState('All');
  const [filterStatus, setFilterStatus]   = useState<'all' | StatusType>('all');
  const [selected, setSelected]           = useState<typeof cooperativesData[0] | null>(null);
  const [detailTab, setDetailTab]         = useState<'overview' | 'members' | 'financials'>('overview');
  const [barsReady, setBarsReady]         = useState(false);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  /* Filter logic */
  const filtered = cooperativesData.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || c.category === filterCat;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  /* Summary KPIs */
  const totalMembers  = cooperativesData.reduce((s, c) => s + c.members, 0);
  const activeCount   = cooperativesData.filter((c) => c.status === 'active').length;
  const pendingCount  = cooperativesData.filter((c) => c.status === 'pending').length;
  const reviewCount   = cooperativesData.filter((c) => c.status === 'review').length;

  return (
    <div className="coopnet-root">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" fill="rgba(255,255,255,0.2)" />
              <path d="M11 4c-2.8 0-5 2.2-5 5 0 2 1.1 3.7 2.8 4.6L11 18l2.2-4.4C14.9 12.7 16 11 16 9c0-2.8-2.2-5-5-5z" fill="#fff" opacity="0.9" />
            </svg>
          </div>
          <div className="sidebar-logo-text"><h1>CoopNet</h1><p>Cooperative OS</p></div>
        </div>

        <nav>
          {navItems.map((item) => (
            <span key={item.id}>
              {item.section && <div className="nav-section-label">{item.section}</div>}
              <div
                className={`nav-item${item.id === 'cooperatives' ? ' active' : ''}`}
                onClick={() => item.id === 'dashboard' ? router.push('/dashboard') : undefined}
              >
                <Icon d={icons[item.icon as keyof typeof icons]} size={17} extra="nav-item-icon" />
                <span className="nav-item-label">{item.label}</span>
                {'badge' in item && item.badge && (
                  <span className={`nav-badge${'badgeRed' in item && item.badgeRed ? ' red' : ''}`}>{item.badge}</span>
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
            <div className="user-chip-text"><h4>Ahmet Yılmaz</h4><p>Region Manager</p></div>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="main">

        {/* Header */}
        <header className="header">
          <div className="header-breadcrumb">
            <span style={{ cursor: 'pointer', color: 'var(--grey-500)' }} onClick={() => router.push('/dashboard')}>CoopNet</span>
            <span className="sep">›</span>
            <span>Cooperatives</span>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Search cooperatives, cities…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="header-actions">
            <button className="icon-btn"><Icon d={icons.bell} size={18} /><span className="notif-dot" /></button>
            <button className="icon-btn"><Icon d={icons.calendar} size={18} /></button>
            <div className="header-avatar">AY</div>
          </div>
        </header>

        <div className="content">

          {/* Back + Page header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="btn btn-outline" style={{ padding: '7px 12px' }} onClick={() => router.push('/dashboard')}>
              <Icon d={icons.arrowLeft} size={14} />
            </button>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--grey-900)', margin: 0 }}>Cooperatives</h2>
              <p style={{ fontSize: 12.5, color: 'var(--grey-500)', margin: '3px 0 0' }}>
                {cooperativesData.length} cooperatives · {totalMembers} total members · Aegean Region
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button className="btn btn-outline">
                <Icon d={icons.download} size={14} /> Export
              </button>
              <button className="btn btn-primary">
                <Icon d={icons.plus} size={14} /> Add Cooperative
              </button>
            </div>
          </div>

          {/* Summary KPI row */}
          <div className="coop-kpi-row">
            {[
              { label: 'Total Cooperatives', value: cooperativesData.length, icon: '🏘️', color: 'var(--green-100)', text: 'var(--green-700)' },
              { label: 'Active',   value: activeCount,  icon: '✅', color: 'var(--green-100)', text: 'var(--green-700)' },
              { label: 'Pending',  value: pendingCount, icon: '⏳', color: 'var(--gold-100)',  text: '#92400e' },
              { label: 'Review',   value: reviewCount,  icon: '⚠️', color: 'var(--red-100)',   text: 'var(--red-600)' },
              { label: 'Total Members', value: totalMembers, icon: '👥', color: '#ede9fe', text: '#6d28d9' },
            ].map((k) => (
              <div key={k.label} className="coop-kpi-item">
                <div className="coop-kpi-icon" style={{ background: k.color }}>
                  <span>{k.icon}</span>
                </div>
                <div>
                  <div className="coop-kpi-value" style={{ color: k.text }}>{k.value}</div>
                  <div className="coop-kpi-label">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="coop-filters">
            <div className="filter-tabs" style={{ flex: 1 }}>
              {CATS.map((c) => (
                <button key={c} className={`tab${filterCat === c ? ' active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['all','active','pending','review'] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    border: filterStatus === s ? '1.5px solid var(--green-500)' : '1px solid var(--grey-200)',
                    background: filterStatus === s ? 'var(--green-50)' : '#fff',
                    color: filterStatus === s ? 'var(--green-700)' : 'var(--grey-500)',
                  }}>
                  {s === 'all' ? 'All Status' : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Main panel: list + detail */}
          <div className="coop-layout">

            {/* List */}
            <div className="coop-list">
              {filtered.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--grey-400)', fontSize: 13 }}>
                  No cooperatives found.
                </div>
              )}
              {filtered.map((c) => (
                <div key={c.id}
                  className={`coop-list-item${selected?.id === c.id ? ' selected' : ''}`}
                  onClick={() => { setSelected(c); setDetailTab('overview'); }}>
                  <div className="coop-list-emoji">{c.emoji}</div>
                  <div className="coop-list-body">
                    <div className="coop-list-name">{c.name}</div>
                    <div className="coop-list-meta">
                      📍 {c.city} · 👥 {c.members} members · {c.category}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`status-pill ${c.status}`}>
                      <span className="pill-dot" />{statusLabel[c.status]}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--grey-700)' }}>{c.volume}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selected ? (
              <div className="coop-detail card">
                {/* Detail header */}
                <div className="coop-detail-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="coop-detail-emoji">{selected.emoji}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--grey-900)' }}>{selected.name}</h3>
                      <div style={{ fontSize: 12.5, color: 'var(--grey-500)', marginTop: 3 }}>
                        📍 {selected.city} · Est. {selected.founded}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`status-pill ${selected.status}`}>
                      <span className="pill-dot" />{statusLabel[selected.status]}
                    </span>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }}>
                      <Icon d={icons.edit} size={13} /> Edit
                    </button>
                  </div>
                </div>

                {/* Detail tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--grey-100)', padding: '0 20px' }}>
                  {(['overview','members','financials'] as const).map((t) => (
                    <button key={t} onClick={() => setDetailTab(t)}
                      style={{
                        padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, borderBottom: detailTab === t ? '2px solid var(--green-500)' : '2px solid transparent',
                        color: detailTab === t ? 'var(--green-700)' : 'var(--grey-500)',
                        marginBottom: -1,
                      }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="coop-detail-body">

                  {/* ── Overview tab ── */}
                  {detailTab === 'overview' && (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--grey-600)', lineHeight: 1.6, marginBottom: 20 }}>
                        {selected.description}
                      </p>

                      {/* Stats grid */}
                      <div className="coop-stat-grid">
                        {[
                          { label: 'Members',  value: selected.members, icon: '👥' },
                          { label: 'Volume',   value: selected.volume,  icon: '📦' },
                          { label: 'Revenue',  value: selected.revenue, icon: '💰' },
                          { label: 'Category', value: selected.category, icon: '🏷️' },
                        ].map((s) => (
                          <div key={s.label} className="coop-stat-item">
                            <span style={{ fontSize: 18 }}>{s.icon}</span>
                            <div className="coop-stat-value">{s.value}</div>
                            <div className="coop-stat-label">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Volume trend */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--grey-700)', marginBottom: 10 }}>
                          Volume Trend (last 6 months)
                        </div>
                        <svg viewBox="0 0 340 80" style={{ width: '100%', height: 80 }}>
                          <defs>
                            <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38996a" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#38996a" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const data = selected.monthlyData;
                            const max = Math.max(...data);
                            const min = Math.min(...data) * 0.8;
                            const points = data.map((v, i) => [
                              20 + i * 60,
                              65 - ((v - min) / (max - min)) * 55
                            ]);
                            const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
                            const area = path + ` L${points[points.length-1][0]},72 L${points[0][0]},72 Z`;
                            const months = ['Jan','Feb','Mar','Apr','May','Jun'];
                            return (
                              <>
                                <path d={area} fill="url(#detailGrad)" />
                                <path d={path} fill="none" stroke="#38996a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                {points.map(([cx, cy], i) => (
                                  <g key={i}>
                                    <circle cx={cx} cy={cy} r={4} fill="#38996a" />
                                    <text x={cx} y={cy - 8} fontSize="9" fill="#38996a" textAnchor="middle" fontWeight="600">
                                      {data[i]}t
                                    </text>
                                    <text x={cx} y={75} fontSize="8.5" fill="#9ca3af" textAnchor="middle">{months[i]}</text>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Contact */}
                      <div style={{ background: 'var(--grey-50)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grey-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Contact</div>
                        <div style={{ fontWeight: 700, color: 'var(--grey-800)', marginBottom: 8 }}>{selected.contact}</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <a href={`tel:${selected.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--green-600)', textDecoration: 'none', fontWeight: 600 }}>
                            <Icon d={icons.phone} size={13} /> {selected.phone}
                          </a>
                          <a href={`mailto:${selected.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--green-600)', textDecoration: 'none', fontWeight: 600 }}>
                            <Icon d={icons.mail} size={13} /> {selected.email}
                          </a>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Members tab ── */}
                  {detailTab === 'members' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ fontSize: 13, color: 'var(--grey-600)', fontWeight: 600 }}>
                          {selected.members} registered members
                        </div>
                        <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                          <Icon d={icons.plus} size={12} /> Add Member
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selected.members_list.map((m, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            background: 'var(--grey-50)', borderRadius: 10, border: '1px solid var(--grey-100)'
                          }}>
                            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12, background: `hsl(${i * 60 + 140}, 50%, 45%)` }}>
                              {m.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--grey-800)' }}>{m.name}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--grey-500)' }}>{m.role} · Joined {m.joined}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-700)' }}>{m.produce}</div>
                              <div style={{ fontSize: 11, color: 'var(--grey-400)' }}>this month</div>
                            </div>
                            <button className="icon-btn" style={{ width: 30, height: 30 }}>
                              <Icon d={icons.eye} size={14} />
                            </button>
                          </div>
                        ))}
                        {selected.members > selected.members_list.length && (
                          <div style={{ textAlign: 'center', padding: '12px', fontSize: 12.5, color: 'var(--green-600)', fontWeight: 600, cursor: 'pointer' }}>
                            +{selected.members - selected.members_list.length} more members — View All
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Financials tab ── */}
                  {detailTab === 'financials' && (
                    <div>
                      <div className="coop-stat-grid" style={{ marginBottom: 20 }}>
                        {[
                          { label: 'Monthly Revenue', value: selected.revenue,  icon: '💰', color: 'var(--green-100)', tc: 'var(--green-700)' },
                          { label: 'Volume (MTD)',     value: selected.volume,   icon: '📦', color: 'var(--gold-100)',  tc: '#92400e' },
                          { label: 'Per Member',       value: '₺' + Math.round(parseInt(selected.revenue.replace(/[₺KM,]/g,'')) * (selected.revenue.includes('M') ? 1000 : 1) / selected.members).toLocaleString(), icon: '👤', color: '#ede9fe', tc: '#6d28d9' },
                          { label: 'Growth',           value: '+12%',            icon: '📈', color: 'var(--green-100)', tc: 'var(--green-700)' },
                        ].map((s) => (
                          <div key={s.label} className="coop-stat-item" style={{ background: s.color }}>
                            <span style={{ fontSize: 20 }}>{s.icon}</span>
                            <div className="coop-stat-value" style={{ color: s.tc }}>{s.value}</div>
                            <div className="coop-stat-label">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Payment history */}
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--grey-700)', marginBottom: 10 }}>Recent Payments</div>
                      {[
                        { date: 'May 8',  desc: 'Monthly disbursement', amount: '₺140,000', status: 'Completed' },
                        { date: 'Apr 10', desc: 'Monthly disbursement', amount: '₺132,500', status: 'Completed' },
                        { date: 'Mar 9',  desc: 'Monthly disbursement', amount: '₺128,000', status: 'Completed' },
                        { date: 'Feb 8',  desc: 'Q1 advance payment',   amount: '₺50,000',  status: 'Completed' },
                      ].map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                          borderBottom: i < 3 ? '1px solid var(--grey-100)' : 'none'
                        }}>
                          <div style={{ width: 36, height: 36, background: 'var(--green-100)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💸</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-800)' }}>{p.desc}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--grey-400)' }}>{p.date} 2026</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-700)' }}>{p.amount}</div>
                            <div style={{ fontSize: 11, color: 'var(--green-600)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                              <Icon d={icons.check} size={11} /> {p.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="coop-detail card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--grey-400)' }}>
                <span style={{ fontSize: 48 }}>🌾</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-500)' }}>Select a cooperative</div>
                <div style={{ fontSize: 12.5, color: 'var(--grey-400)' }}>Click any row to see details</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
