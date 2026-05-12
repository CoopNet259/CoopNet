'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './talepler.css';
import {
  getWasteRisk,
  getDemandTrends,
  sendWasteOffer,
  createWasteTask,
  testWhatsApp,
  type WasteRiskItem,
  type DemandTrendItem,
} from '@/lib/api/client';
import NotifBell from '../components/NotifBell';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function todayTr(): string { const n = new Date(); return `${n.getDate()} ${TR_MONTHS[n.getMonth()]} ${n.getFullYear()}`; }

const URUN_EMOJI: Record<string, string> = {
  domates:'🍅', biber:'🫑', patlıcan:'🍆', salatalık:'🥒', kayısı:'🍑',
  incir:'🟣', havuç:'🥕', soğan:'🧅', mısır:'🌽', üzüm:'🍇',
  elma:'🍎', armut:'🍐', kiraz:'🍒', erik:'🟤', şeftali:'🍑',
  limon:'🍋', portakal:'🍊', çilek:'🍓',
};
function emojiFor(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(URUN_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return '📦';
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const Icon = ({ d, size = 18, cls = '' }: { d: string | string[]; size?: number; cls?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS: Record<string, string | string[]> = {
  grid:       'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse:  ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard:  ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:      ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:     ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:      ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:      'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
  log:        ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6'],
  phone:      ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:    'M9 18l6-6-6-6',
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  logout:     ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:       ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:     ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  refresh:    ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  send:       ['M22 2L11 13','M22 2l-7 20-4-9-9-4 20-7z'],
  truck:      ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 16A1.5 1.5 0 1 0 5.5 19 1.5 1.5 0 1 0 5.5 16z','M17.5 16A1.5 1.5 0 1 0 17.5 19 1.5 1.5 0 1 0 17.5 16z'],
  check:      'M20 6L9 17l-5-5',
  trendUp:    ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  trendDown:  ['M23 18l-9.5-9.5-5 5L1 6','M17 18h6v-6'],
  heart:      ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  finansal:   ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
};

// ─── Nav ─────────────────────────────────────────────────────────────────────

const navItems = [
  { id: 'dashboard',     label: 'Ana Sayfa',         icon: 'grid',      path: '/dashboard' },
  { id: 'depo',          label: 'Depo',              icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',      label: 'Talepler',          icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',    label: 'Üreticiler',        icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',      label: 'Finansal Raporlar', icon: 'finansal',  path: '/dashboard/finansal' },
  { id: 'anomali',       label: 'Anomali',           icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar',   label: 'AI Raporları',      icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',       label: 'AI Logs',           icon: 'log',       path: '/dashboard/ai-logs' },
  { id: 'vardiye',      label: 'Vardiye',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj', label: 'Üretici Mesaj',     icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function urgencyLevel(days: number): 'critical' | 'urgent' | 'warn' | 'info' {
  if (days <= 1) return 'critical';
  if (days <= 2) return 'urgent';
  if (days <= 3) return 'warn';
  return 'info';
}

function urgencyLabel(days: number): string {
  if (days <= 1) return `${days} GÜN KALDI`;
  if (days <= 2) return `${days} Gün Kaldı`;
  if (days <= 3) return `${days} Gün Kaldı`;
  return `${days} Gün Kaldı`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

type DoneAction = 'offer' | 'task';

export default function TaleplerPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('talepler');

  // Data
  const [riskItems,  setRiskItems]  = useState<WasteRiskItem[]>([]);
  const [trendsUp,   setTrendsUp]   = useState<DemandTrendItem[]>([]);
  const [trendsDown, setTrendsDown] = useState<DemandTrendItem[]>([]);

  // UI state
  const [loading,     setLoading]     = useState(true);
  const [trendTab,    setTrendTab]    = useState<'up' | 'down'>('up');
  const [loadingMap,  setLoadingMap]  = useState<Record<string, boolean>>({});
  const [doneMap,     setDoneMap]     = useState<Record<string, DoneAction>>({});
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [testingWA,   setTestingWA]   = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [riskData, trendsData] = await Promise.all([
        getWasteRisk(),
        getDemandTrends(),
      ]);
      setRiskItems(riskData.items);
      setTrendsUp(trendsData.up);
      setTrendsDown(trendsData.down);
    } catch (err) {
      console.error(err);
      showToast('Veriler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSendOffer = async (item: WasteRiskItem) => {
    const key = `offer_${item.id}`;
    setLoadingMap(p => ({ ...p, [key]: true }));
    try {
      await sendWasteOffer(item.urun, item.surplus_kg, item.days_left);
      setDoneMap(p => ({ ...p, [item.id]: 'offer' }));
      showToast(`${item.kardesler.length} kardeş üreticiye teklif gönderildi`);
    } catch {
      showToast('Teklif gönderilemedi', 'error');
    } finally {
      setLoadingMap(p => ({ ...p, [key]: false }));
    }
  };

  const handleCreateTask = async (item: WasteRiskItem) => {
    const key = `task_${item.id}`;
    setLoadingMap(p => ({ ...p, [key]: true }));
    try {
      await createWasteTask(item.urun, item.surplus_kg, item.days_left);
      setDoneMap(p => ({ ...p, [item.id]: 'task' }));
      showToast(`${item.urun} için depo görevi oluşturuldu`);
    } catch {
      showToast('Görev oluşturulamadı', 'error');
    } finally {
      setLoadingMap(p => ({ ...p, [key]: false }));
    }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSurplus    = riskItems.reduce((s, r) => s + r.surplus_kg, 0);
  const avgDays         = riskItems.length > 0
    ? Math.round(riskItems.reduce((s, r) => s + r.days_left, 0) / riskItems.length)
    : 0;
  const sistersMatched  = riskItems.filter(r => r.kardesler.length > 0).length;

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="coopnet-root">

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

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
            <div key={item.id}
              className={`nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => navClick(item)}
            >
              <Icon d={ICONS[item.icon]} size={17} />
              <span className="nav-item-label">{item.label}</span>
              {activeNav === item.id && <Icon d={ICONS.chevron} size={14} />}
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
            <Icon d={ICONS.logout} size={16} />
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="main">

        {/* Header */}
        <header className="header">
          <div className="header-coop-title">
            <span style={{ fontSize: 22 }}>♻️</span>
            <div>
              <h2 className="header-coop-name">Talepler & İşbirlikleri</h2>
              <p className="header-coop-sub">Talep Trendleri · STK İsraf Önleme · {todayTr()}</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn-wa-test"
              disabled={testingWA}
              onClick={async () => {
                setTestingWA(true);
                try {
                  const r = await testWhatsApp();
                  if (r.status === 'sent') showToast(`✅ WhatsApp gönderildi → ${r.to}`);
                  else if (r.status === 'simulated') showToast('⚠️ Twilio henüz aktif değil (simülasyon)', 'error');
                  else showToast(r.message || 'Hata', 'error');
                } catch { showToast('Bağlantı hatası', 'error'); }
                finally { setTestingWA(false); }
              }}
            >
              {testingWA ? <span className="btn-spinner btn-spinner-dark" /> : '📱'}
              {testingWA ? 'Gönderiliyor…' : 'WA Test'}
            </button>
            <button className="btn-refresh-header" onClick={loadData}>
              <Icon d={ICONS.refresh} size={15} />
              Yenile
            </button>
            <NotifBell />
          </div>
        </header>

        {/* KPI Bar */}
        <div className="kpi-bar">
          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-red">
              <span>⚠️</span>
            </div>
            <div className="kpi-text">
              <div className="kpi-value">{loading ? '—' : riskItems.length}</div>
              <div className="kpi-label">İsraf Riski</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-orange">
              <span>📦</span>
            </div>
            <div className="kpi-text">
              <div className="kpi-value">{loading ? '—' : `${totalSurplus.toFixed(0)} kg`}</div>
              <div className="kpi-label">Fazla Stok</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-blue">
              <span>⏱️</span>
            </div>
            <div className="kpi-text">
              <div className="kpi-value">{loading ? '—' : riskItems.length > 0 ? `${avgDays} gün` : '—'}</div>
              <div className="kpi-label">Ort. Kalan Süre</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-green">
              <span>🤝</span>
            </div>
            <div className="kpi-text">
              <div className="kpi-value">{loading ? '—' : sistersMatched}</div>
              <div className="kpi-label">Kardeş Eşleşti</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-purple">
              <span>📈</span>
            </div>
            <div className="kpi-text">
              <div className="kpi-value">{loading ? '—' : trendsUp.length + trendsDown.length}</div>
              <div className="kpi-label">Trend Sinyali</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          <div className="talepler-layout">

            {/* ── Sol: İsraf Riski Ana Panel ── */}
            <div className="stk-main">

              <div className="panel-title-row">
                <div className="panel-title-left">
                  <span className="panel-icon">♻️</span>
                  <div>
                    <h3>İsraf Riski Takibi</h3>
                    <p>Son kullanım tarihi yaklaşan ürünler · Kardeş üretici eşleştirmesi</p>
                  </div>
                </div>
                <div className="panel-title-right">
                  {!loading && riskItems.length > 0 && (
                    <span className="risk-count-badge">{riskItems.length} ürün risk altında</span>
                  )}
                </div>
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="skeleton-list">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-card">
                      <div className="sk-line sk-title" />
                      <div className="sk-line sk-sub" />
                      <div className="sk-line sk-bar" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && riskItems.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h4>Harika! İsraf Riski Yok</h4>
                  <p>Şu an son kullanım tarihi yaklaşan fazla stok bulunmuyor.</p>
                </div>
              )}

              {/* Risk cards */}
              {!loading && riskItems.length > 0 && (
                <div className="stk-list">
                  {riskItems.map(item => {
                    const level     = urgencyLevel(item.days_left);
                    const daysPct   = Math.min(100, Math.round((item.days_left / 7) * 100));
                    const offerDone = doneMap[item.id] === 'offer';
                    const taskDone  = doneMap[item.id] === 'task';
                    const offerLoading = loadingMap[`offer_${item.id}`];
                    const taskLoading  = loadingMap[`task_${item.id}`];

                    return (
                      <div key={item.id} className={`stk-card level-${level}`}>

                        {/* Left urgency accent */}
                        <div className={`stk-accent accent-${level}`} />

                        <div className="stk-card-inner">

                          {/* Top row */}
                          <div className="stk-top">
                            <div className="stk-product">
                              <span className="stk-emoji">{item.emoji}</span>
                              <div className="stk-product-info">
                                <strong>{item.urun}</strong>
                                {item.kategori && (
                                  <span className="stk-kategori">{item.kategori}</span>
                                )}
                              </div>
                            </div>
                            <div className="stk-badges">
                              <span className={`urgency-chip chip-${level}`}>
                                {urgencyLabel(item.days_left)}
                              </span>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="stk-stats-row">
                            <div className="stk-stat">
                              <span className="stk-stat-label">Mevcut Stok</span>
                              <span className="stk-stat-val">{item.mevcut_kg} kg</span>
                            </div>
                            <div className="stk-stat-divider" />
                            <div className="stk-stat">
                              <span className="stk-stat-label">Fazla Miktar</span>
                              <span className={`stk-stat-val surplus-${level}`}>+{item.surplus_kg} kg</span>
                            </div>
                            <div className="stk-stat-divider" />
                            <div className="stk-stat">
                              <span className="stk-stat-label">Günlük Tüketim</span>
                              <span className="stk-stat-val">~{item.daily_est_kg} kg</span>
                            </div>
                          </div>

                          {/* Days progress bar */}
                          <div className="days-progress">
                            <div className="days-bar-bg">
                              <div
                                className={`days-bar-fill fill-${level}`}
                                style={{ width: `${daysPct}%` }}
                              />
                            </div>
                            <span className="days-progress-label">
                              {item.days_left} gün raf ömrü kaldı
                            </span>
                          </div>

                          {/* Sister producers */}
                          {item.kardesler.length > 0 ? (
                            <div className="kardes-section">
                              <div className="kardes-header">
                                <Icon d={ICONS.heart} size={12} cls="kardes-heart-icon" />
                                <span>{item.kardesler.length} Kardeş Üretici Eşleşti</span>
                              </div>
                              <div className="kardes-chips">
                                {item.kardesler.map((k, i) => (
                                  <div key={i} className="kardes-chip">
                                    <div className="kardes-avatar-sm">{k.avatar}</div>
                                    <span className="kardes-name">{k.ad}</span>
                                    {k.lokasyon && (
                                      <span className="kardes-loc">{k.lokasyon}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="no-sister-warn">
                              ⚠️ Uygun kardeş üretici bulunamadı — manuel aksiyon gerekli
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="stk-actions">
                            {(level === 'critical' || level === 'urgent') ? (
                              /* Critical/urgent: agent already sent automatically — show info badge */
                              <div className="action-agent-auto">
                                <span className="agent-auto-icon">🤖</span>
                                <div className="agent-auto-text">
                                  <span className="agent-auto-title">Ajan Otomatik Gönderdi</span>
                                  <span className="agent-auto-sub">Kardeş üreticilere WhatsApp teklifi iletildi</span>
                                </div>
                              </div>
                            ) : offerDone ? (
                              <div className="action-done">
                                <Icon d={ICONS.check} size={14} /> Teklif Gönderildi
                              </div>
                            ) : (
                              <button
                                className="btn-offer"
                                disabled={!item.kardesler.length || !!offerLoading}
                                onClick={() => handleSendOffer(item)}
                              >
                                {offerLoading
                                  ? <span className="btn-spinner" />
                                  : <Icon d={ICONS.send} size={14} />
                                }
                                {offerLoading ? 'Gönderiliyor…' : 'Teklif Gönder'}
                              </button>
                            )}
                            {taskDone ? (
                              <div className="action-done action-done-secondary">
                                <Icon d={ICONS.check} size={14} /> Görev Oluşturuldu
                              </div>
                            ) : (
                              <button
                                className="btn-task"
                                disabled={!!taskLoading}
                                onClick={() => handleCreateTask(item)}
                              >
                                {taskLoading
                                  ? <span className="btn-spinner btn-spinner-dark" />
                                  : <Icon d={ICONS.truck} size={14} />
                                }
                                {taskLoading ? 'Oluşturuluyor…' : 'Depo Görevi'}
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Sağ: Talep Trendleri ── */}
            <div className="trends-sidebar">

              <div className="trends-panel">
                <div className="trends-panel-header">
                  <h3>Talep Trendleri</h3>
                  <span className="week-chip">Bu Hafta</span>
                </div>

                {/* Tabs */}
                <div className="trend-tabs">
                  <button
                    className={`trend-tab-btn${trendTab === 'up' ? ' tab-active' : ''}`}
                    onClick={() => setTrendTab('up')}
                  >
                    <Icon d={ICONS.trendUp} size={13} />
                    Artan
                    <span className="tab-count">{trendsUp.length}</span>
                  </button>
                  <button
                    className={`trend-tab-btn${trendTab === 'down' ? ' tab-active tab-down' : ''}`}
                    onClick={() => setTrendTab('down')}
                  >
                    <Icon d={ICONS.trendDown} size={13} />
                    Azalan
                    <span className="tab-count">{trendsDown.length}</span>
                  </button>
                </div>

                {/* Trend list */}
                <div className="trend-list">
                  {loading && (
                    <div className="trend-skeleton">
                      {[1,2,3].map(i => <div key={i} className="sk-line sk-trend" />)}
                    </div>
                  )}

                  {!loading && (trendTab === 'up' ? trendsUp : trendsDown).length === 0 && (
                    <div className="trend-empty">
                      <span>{trendTab === 'up' ? '📊' : '📉'}</span>
                      <p>
                        {trendTab === 'up'
                          ? 'Bu hafta belirgin artış sinyali yok.'
                          : 'Bu hafta belirgin düşüş sinyali yok.'
                        }
                      </p>
                    </div>
                  )}

                  {!loading && (trendTab === 'up' ? trendsUp : trendsDown).map((t, i) => (
                    <div key={i} className="trend-item">
                      <div className="trend-emoji-wrap">{emojiFor(t.name)}</div>
                      <div className="trend-info">
                        <strong>{t.name}</strong>
                        <span>
                          Bu hafta {t.this_week_kg} kg
                          <span className="trend-prev"> / önceki {t.last_week_kg} kg</span>
                        </span>
                      </div>
                      <span className={`trend-delta ${t.up ? 'delta-up' : 'delta-down'}`}>
                        {t.delta}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                {!loading && (trendsUp.length > 0 || trendsDown.length > 0) && (
                  <div className="trends-footer">
                    Geçen haftayla karşılaştırma · Sipariş verisinden
                  </div>
                )}
              </div>

              {/* Info card */}
              <div className="info-card">
                <div className="info-card-title">Sistem Nasıl Çalışır?</div>
                <ul className="info-list">
                  <li>
                    <span className="info-dot dot-red" />
                    Son 7 günde sona erecek ürünler otomatik tespit edilir
                  </li>
                  <li>
                    <span className="info-dot dot-green" />
                    Uygun kardeş üreticilerle eşleştirilir
                  </li>
                  <li>
                    <span className="info-dot dot-blue" />
                    Her 6 saatte bir sistem otomatik tarama yapar
                  </li>
                  <li>
                    <span className="info-dot dot-purple" />
                    Onay verilince depo görevi oluşturulur
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
