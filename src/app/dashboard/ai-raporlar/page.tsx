'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './ai-raporlar.css';
import { getAIReports, postWeeklyInsight } from '@/lib/api/client';

const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:    ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:     ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:     'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z',
  log:       ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  phone:     ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevronL:  'M15 18l-6-6 6-6',
  chevronR:  'M9 18l6-6-6-6',
  chevron:   'M9 18l6-6-6-6',
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  logout:    ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:    ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  calendar:  ['M8 2v4','M16 2v4','M3 10h18','M21 8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z'],
  truck:     ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z','M18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  arrowUpRight: 'M7 17L17 7M7 7h10v10',
  zap:       ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  bulb:      ['M9 21h6','M12 3a6 6 0 0 1 4.24 10.24c-.9.9-1.24 2.1-1.24 2.76H9c0-.66-.34-1.86-1.24-2.76A6 6 0 0 1 12 3z'],
};

const navItems = [
  { id: 'dashboard',    label: 'Ana Sayfa',        icon: 'grid',      path: '/dashboard' },
  { id: 'depo',         label: 'Depo',             icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',     label: 'Talepler',          icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',   label: 'Üreticiler',        icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',     label: 'Finansal Raporlar', icon: 'dollar',    path: '/dashboard/finansal' },
  { id: 'anomali',      label: 'Anomali',           icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar',  label: 'AI Raporları',      icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',      label: 'AI Logs',           icon: 'log',       path: '/dashboard/ai-logs' },
  { id: 'vardiye',      label: 'Vardiye',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj',label: 'Üretici Mesaj',     icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

const TR_MONTHS: Record<string, string> = {
  'Ocak':'01','Şubat':'02','Mart':'03','Nisan':'04','Mayıs':'05','Haziran':'06',
  'Temmuz':'07','Ağustos':'08','Eylül':'09','Ekim':'10','Kasım':'11','Aralık':'12',
};
const TR_MONTH_NAMES = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAY_NAMES = ['Pt','Sa','Ça','Pe','Cu','Ct','Pa'];

function extractIsoDate(baslik: string): string | null {
  const m = baslik.match(/(\d+)\s+([\wÇçĞğİıÖöŞşÜü]+)\s+(\d{4})/u);
  if (!m) return null;
  const mon = TR_MONTHS[m[2]];
  if (!mon) return null;
  return `${m[3]}-${mon}-${m[1].padStart(2, '0')}`;
}

function bulletIcon(text: string): { d: string | string[]; cls: string } {
  const t = text.toLowerCase();
  if (t.startsWith('öneri') || t.startsWith('tavsiye')) return { d: icons.bulb,         cls: 'bi-purple' };
  if (t.includes('kritik') || t.includes('acil') || t.includes('uyarı')) return { d: icons.alert,   cls: 'bi-red' };
  if (t.includes('transfer'))                 return { d: icons.arrowUpRight, cls: 'bi-blue' };
  if (t.includes('teslimat') || t.includes('teslim alındı')) return { d: icons.truck, cls: 'bi-yellow' };
  if (t.includes('₺') || t.includes('gelir') || t.includes('sipariş')) return { d: icons.zap,   cls: 'bi-green' };
  return { d: icons.chevronR, cls: 'bi-grey' };
}

function getMondayOf(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

interface WeeklyInsight {
  week_start: string; week_end: string;
  stats: { total_orders: number; delivered_orders: number; delayed_orders: number; fulfillment_rate: number; critical_items: { name: string; current: number; unit: string }[] };
  insight: string; highlights: string[];
  recommended_actions: { tone: string; title: string; meta: string }[];
  week_score: number;
}

function parseReportItems(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return [value]; } }
  return [];
}

interface ReportItem { id: number; baslik: string; maddeler: string[]; isoDate: string | null; }

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const offset = (firstDay === 0 ? 6 : firstDay - 1);     // Mon-based
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AIRaporlarPage() {
  const router = useRouter();
  const [reports, setReports]         = useState<ReportItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calYear, setCalYear]         = useState(2026);
  const [calMonth, setCalMonth]       = useState(5);
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  // Hafta başlangıcı → insight önbelleği (aynı haftaya tekrar AI çağrısı yapılmaz)
  const weeklyCache = useRef<Map<string, WeeklyInsight>>(new Map());

  useEffect(() => {
    getAIReports()
      .then(data => {
        if (!Array.isArray(data)) return;
        const formatted: ReportItem[] = data.map(item => ({
          id: item.id,
          baslik: item.baslik,
          maddeler: parseReportItems(item.maddeler),
          isoDate: extractIsoDate(item.baslik),
        }));
        setReports(formatted);
        // En son tarihin raporunu varsayılan seç
        const withDate = formatted.filter(r => r.isoDate).sort((a, b) => b.isoDate!.localeCompare(a.isoDate!));
        if (withDate.length > 0) {
          setSelectedDate(withDate[0].isoDate);
          const d = new Date(withDate[0].isoDate!);
          setCalYear(d.getFullYear());
          setCalMonth(d.getMonth() + 1);
        }
      })
      .catch(err => console.error('AI raporları çekilemedi:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const monday = getMondayOf(selectedDate);

    // Önbellekte varsa direkt göster
    if (weeklyCache.current.has(monday)) {
      setWeeklyInsight(weeklyCache.current.get(monday)!);
      return;
    }

    setWeeklyInsight(null);
    setWeeklyLoading(true);
    postWeeklyInsight(monday)
      .then(data => {
        const insight = data as WeeklyInsight;
        weeklyCache.current.set(monday, insight);
        setWeeklyInsight(insight);
      })
      .catch(() => {
        // Başarısız olsa da null bırakma — sonraki render'da tekrar denenebilir
        setWeeklyInsight(null);
      })
      .finally(() => setWeeklyLoading(false));
  }, [selectedDate]);

  const reportDateSet = useMemo(() => new Set(reports.map(r => r.isoDate).filter(Boolean)), [reports]);
  const selectedReport = useMemo(() => reports.find(r => r.isoDate === selectedDate) ?? null, [reports, selectedDate]);
  const sortedDates = useMemo(() => [...reportDateSet].sort() as string[], [reportDateSet]);

  const calDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = () => { if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); } else setCalMonth(m => m + 1); };

  const isoOf = (day: number) => `${calYear}-${String(calMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const todayIso = new Date().toISOString().split('T')[0];

  const prevReport = sortedDates[sortedDates.indexOf(selectedDate!) - 1] ?? null;
  const nextReport = sortedDates[sortedDates.indexOf(selectedDate!) + 1] ?? null;

  const navClick = (item: typeof navItems[0]) => router.push(item.path);

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
          <div className="sidebar-logo-text"><h1>CoopNet</h1><p>Kooperatif Yönetim</p></div>
        </div>
        <div className="coop-name-sidebar">
          <span className="coop-name-icon">🌱</span>
          <span className="coop-name-label">Üreten Kadınlar Kooperatif</span>
        </div>
        <nav>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${item.id === 'ai-raporlar' ? ' active' : ''}`} onClick={() => navClick(item)}>
              <Icon d={icons[item.icon]} size={17} />
              <span className="nav-item-label">{item.label}</span>
              {item.id === 'ai-raporlar' && <Icon d={icons.chevron} size={14} />}
            </div>
          ))}
        </nav>
        <div className="sidebar-deco">{['🌾','🍅','🌿','🫑','🍆'].map((e,i)=><span key={i}>{e}</span>)}</div>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">ÜK</div>
            <div className="user-chip-text"><h4>Üreten Kadınlar</h4><p>Admin Paneli</p></div>
          </div>
          <button className="logout-btn" onClick={() => router.push('/login')}><Icon d={icons.logout} size={16} /></button>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-coop-title">
            <span className="header-coop-icon">🤖</span>
            <div>
              <h1 className="header-coop-name">AI Raporları</h1>
              <p className="header-coop-sub">Günlük operasyon analizleri — tarihe göre inceleyin</p>
            </div>
          </div>
          <div className="header-actions" style={{ marginLeft: 'auto' }}>
            <div className="arap-stat-chip"><span>{loading ? '…' : reports.length}</span> rapor</div>
            <div className="arap-stat-chip"><span>{loading ? '…' : reports.reduce((s,r)=>s+r.maddeler.length,0)}</span> madde</div>
          </div>
        </header>

        <div className="arap-layout">

          {/* SOL: TAKVİM */}
          <aside className="arap-sidebar">
            <div className="cal-card">
              <div className="cal-header">
                <button className="cal-nav-btn" onClick={prevMonth}><Icon d={icons.chevronL} size={16} /></button>
                <span className="cal-month-label">{TR_MONTH_NAMES[calMonth]} {calYear}</span>
                <button className="cal-nav-btn" onClick={nextMonth}><Icon d={icons.chevronR} size={16} /></button>
              </div>
              <div className="cal-grid">
                {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                {calDays.map((day, i) => {
                  if (!day) return <div key={i} className="cal-cell cal-empty" />;
                  const iso = isoOf(day);
                  const hasReport = reportDateSet.has(iso);
                  const isSelected = iso === selectedDate;
                  const isToday = iso === todayIso;
                  return (
                    <button
                      key={i}
                      className={`cal-cell${hasReport ? ' has-report' : ''}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                      onClick={() => hasReport && setSelectedDate(iso)}
                      disabled={!hasReport}
                    >
                      {day}
                      {hasReport && !isSelected && <span className="cal-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rapor listesi (mini) */}
            <div className="cal-report-list">
              <p className="cal-list-title"><Icon d={icons.calendar} size={13} /> Tüm Raporlar</p>
              {sortedDates.slice().reverse().map(iso => {
                const r = reports.find(x => x.isoDate === iso);
                if (!r) return null;
                const [y, m, d] = iso.split('-');
                const label = `${parseInt(d)} ${TR_MONTH_NAMES[parseInt(m)]}`;
                return (
                  <button
                    key={iso}
                    className={`cal-list-item${selectedDate === iso ? ' selected' : ''}`}
                    onClick={() => { setSelectedDate(iso); setCalMonth(parseInt(m)); setCalYear(parseInt(y)); }}
                  >
                    <span className="cal-list-date">{label}</span>
                    <span className="cal-list-count">{r.maddeler.length} madde</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* SAĞ: RAPOR DETAYI */}
          <section className="arap-detail">
            {loading && (
              <div className="arap-empty"><div className="arap-spinner" /><p>Raporlar yükleniyor…</p></div>
            )}
            {!loading && !selectedReport && (
              <div className="arap-empty">
                <Icon d={icons.calendar} size={40} extra="arap-empty-icon" />
                <p>Takvimden bir tarih seçin</p>
              </div>
            )}
            {!loading && selectedReport && (
              <div className="arap-report-view">

                {/* ÜST SATIR: günlük + haftalık yan yana */}
                <div className="arv-two-col">

                  {/* SOL: Günlük Rapor */}
                  <div className="arv-card">
                    <div className="arv-card-header">
                      <div className="arv-header-left">
                        <span className="arv-badge">Günlük Rapor</span>
                        <h2 className="arv-title">{selectedReport.baslik}</h2>
                      </div>
                      <div className="arv-nav">
                        <button className="arv-nav-btn" disabled={!prevReport} onClick={() => prevReport && setSelectedDate(prevReport)} title="Önceki gün">
                          <Icon d={icons.chevronL} size={16} />
                        </button>
                        <button className="arv-nav-btn" disabled={!nextReport} onClick={() => nextReport && setSelectedDate(nextReport)} title="Sonraki gün">
                          <Icon d={icons.chevronR} size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="arv-bullets">
                      {selectedReport.maddeler.map((item, idx) => {
                        const { d, cls } = bulletIcon(item);
                        return (
                          <div key={idx} className={`arv-bullet ${cls}`}>
                            <div className="arv-bullet-icon"><Icon d={d} size={15} /></div>
                            <p>{item}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SAĞ: Haftalık Rapor */}
                  <div className="arv-card">
                    <div className="arv-card-header">
                      <div className="arv-header-left">
                        <span className="arv-badge arv-badge-green">Haftalık Rapor</span>
                        <h2 className="arv-title">
                          {weeklyInsight
                            ? (() => {
                                const [sy, sm, sd] = weeklyInsight.week_start.split('-');
                                const [ey, em, ed] = weeklyInsight.week_end.split('-');
                                return `${parseInt(sd)} – ${parseInt(ed)} ${TR_MONTH_NAMES[parseInt(em)]} ${ey}`;
                              })()
                            : 'Haftalık Özet'}
                        </h2>
                        {weeklyInsight && (() => {
                          const nextDay = new Date(weeklyInsight.week_end);
                          nextDay.setDate(nextDay.getDate() + 1);
                          const label = nextDay.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
                          return <span className="arv-valid-until">Geçerli: {label}'e kadar</span>;
                        })()}
                      </div>
                    </div>

                    {weeklyLoading && (
                      <div className="arv-weekly-loading"><div className="arap-spinner" /><span>Haftalık analiz hazırlanıyor…</span></div>
                    )}

                    {!weeklyLoading && weeklyInsight && (
                      <>
                        <div className="arv-weekly-stats">
                          <div className="arv-wscore">
                            <div className="arv-wscore-ring" style={{ '--score': weeklyInsight.week_score } as React.CSSProperties}>
                              <span>{weeklyInsight.week_score}</span>
                              <small>/ 100</small>
                            </div>
                            <p>Haftalık Puan</p>
                          </div>
                          <div className="arv-wstat-grid">
                            <div className="arv-wstat"><span>{(weeklyInsight.stats as any).total_orders}</span><p>Sipariş</p></div>
                            <div className="arv-wstat"><span>{(weeklyInsight.stats as any).delivered_orders}</span><p>Teslim</p></div>
                            <div className="arv-wstat"><span>%{(weeklyInsight.stats as any).fulfillment_rate}</span><p>Karşılama</p></div>
                            <div className="arv-wstat arv-wstat-warn"><span>{(weeklyInsight.stats as any).critical_items?.length ?? 0}</span><p>Kritik Stok</p></div>
                          </div>
                        </div>

                        {/* En çok talep gören ürünler */}
                        {((weeklyInsight.stats as any).top_products?.length > 0) && (
                          <div className="arv-top-products">
                            <p className="arv-tp-title">📦 Bu Hafta En Çok Sipariş Edilen</p>
                            <div className="arv-tp-list">
                              {(weeklyInsight.stats as any).top_products.map((p: any, i: number) => (
                                <div key={i} className="arv-tp-item">
                                  <span className="arv-tp-rank">#{i+1}</span>
                                  <span className="arv-tp-name">{p.name}</span>
                                  <span className="arv-tp-kg">{p.kg} kg</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {weeklyInsight.insight && <p className="arv-weekly-insight">{weeklyInsight.insight}</p>}
                        {weeklyInsight.highlights?.length > 0 && (
                          <div className="arv-weekly-highlights">
                            {weeklyInsight.highlights.map((h, i) => (
                              <div key={i} className="arv-weekly-hl">
                                <Icon d={icons.chevronR} size={13} extra="arv-hl-icon" />
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {weeklyInsight.recommended_actions?.length > 0 && (
                          <div className="arv-weekly-actions">
                            {weeklyInsight.recommended_actions.map((a, i) => (
                              <div key={i} className={`arv-waction arv-waction-${a.tone}`}>
                                <strong>{a.title}</strong>
                                <span>{a.meta}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {!weeklyLoading && !weeklyInsight && (
                      <div className="arv-weekly-empty-state">
                        <Icon d={icons.calendar} size={32} extra="arv-empty-icon" />
                        <p>Haftalık rapor yüklenemedi.</p>
                        <span>Backend bağlantısını kontrol edin.</span>
                        <button
                          className="arv-retry-btn"
                          onClick={() => {
                            if (!selectedDate) return;
                            const monday = getMondayOf(selectedDate);
                            weeklyCache.current.delete(monday); // önbelleği temizle
                            setWeeklyLoading(true);
                            postWeeklyInsight(monday)
                              .then(d => { weeklyCache.current.set(monday, d as WeeklyInsight); setWeeklyInsight(d as WeeklyInsight); })
                              .catch(() => setWeeklyInsight(null))
                              .finally(() => setWeeklyLoading(false));
                          }}
                        >
                          Tekrar Dene
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ALT: Günlük Aksiyon Önerileri — sadece bu günün raporundan türetilmiş */}
                {(() => {
                  const ACTION_KW = /kritik|acil|öneri|uyarı|risk|transfer|tedarik|planla|kontrol|takip/i;
                  const dailyActions = selectedReport.maddeler.filter(m => ACTION_KW.test(m));
                  if (dailyActions.length === 0) return null;

                  return (
                    <div className="arv-insights">
                      <div className="arv-insights-header">
                        <Icon d={icons.bulb} size={16} />
                        <h3>Günlük Aksiyon Önerileri</h3>
                        <span className="arv-insights-badge">{dailyActions.length} madde</span>
                      </div>
                      <div className="arv-insights-list">
                        {dailyActions.map((item, idx) => {
                          const { d, cls } = bulletIcon(item);
                          return (
                            <div key={idx} className={`arv-insight-item arv-insight-colored ${cls}`}>
                              <div className="arv-insight-icon"><Icon d={d} size={14} /></div>
                              <p>{item.replace(/^öneri:\s*/i, '')}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="arv-footer">
                  <span className="arv-footer-tag">🤖 Gemini AI tarafından üretildi</span>
                  <span className="arv-footer-tag">📊 Gerçek operasyon verilerine dayalı</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
