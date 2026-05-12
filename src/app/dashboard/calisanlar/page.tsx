'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './calisanlar.css';
import { getEmployees, getOnDuty, type Employee, type OnDutyEntry } from '@/lib/api/client';

const DEPT_LABEL: Record<string, string> = {
  depo: 'Depo', lojistik: 'Lojistik', tarla: 'Tarla', muhasebe: 'Muhasebe', yonetim: 'Yönetim',
};
const DEPT_COLOR: Record<string, string> = {
  depo: '#6366f1', lojistik: '#f97316', tarla: '#22c55e', muhasebe: '#8b5cf6', yonetim: '#ef4444',
};
const DEPT_BG: Record<string, string> = {
  depo: '#eef2ff', lojistik: '#fff7ed', tarla: '#f0fdf4', muhasebe: '#f5f3ff', yonetim: '#fef2f2',
};

const Icon = ({ d, size = 18, cls = '' }: { d: string | string[]; size?: number; cls?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:    ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:     ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:     ['M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'],
  log:       ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  phone:     ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:   'M9 18l6-6-6-6',
  logout:    ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  search:    ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  plus:      ['M12 5v14','M5 12h14'],
  calendar:  ['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  edit:      ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
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
  { id: 'calisanlar',   label: 'Çalışanlar',        icon: 'users',     path: '/dashboard/calisanlar' },
  { id: 'uretici-mesaj',label: 'Üretici Mesaj',     icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

const ALL_DEPTS = ['depo', 'lojistik', 'tarla', 'muhasebe', 'yonetim'];

export default function CalisanlarPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('calisanlar');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [onDuty, setOnDuty] = useState<OnDutyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  useEffect(() => {
    Promise.all([getEmployees(), getOnDuty()])
      .then(([empData, dutyData]) => {
        setEmployees(empData.employees);
        setOnDuty(dutyData.on_duty);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  const filtered = employees.filter(e => {
    const matchDept   = filterDept === 'all' || e.departman === filterDept;
    const matchSearch = !search || e.ad.toLowerCase().includes(search.toLowerCase()) || e.rol.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  // Departman bazında grupla
  const byDept = ALL_DEPTS.reduce<Record<string, Employee[]>>((acc, d) => {
    const list = filtered.filter(e => e.departman === d);
    if (list.length) acc[d] = list;
    return acc;
  }, {});

  // KPI
  const totalActive  = employees.filter(e => e.aktif).length;
  const totalOnDuty  = onDuty.length;
  const deptCounts   = ALL_DEPTS.map(d => ({ dept: d, count: employees.filter(e => e.departman === d).length }));

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
          <div className="sidebar-logo-text"><h1>CoopNet</h1><p>Kooperatif Yönetim</p></div>
        </div>
        <div className="coop-name-sidebar">
          <span className="coop-name-icon">🌱</span>
          <span className="coop-name-label">Üreten Kadınlar Kooperatif</span>
        </div>
        <nav>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => navClick(item)}>
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
            <div className="user-chip-text"><h4>Üreten Kadınlar</h4><p>Admin Paneli</p></div>
          </div>
          <button className="logout-btn" onClick={() => router.push('/login')}>
            <Icon d={icons.logout} size={16} />
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="main">
        <header className="header">
          <div className="header-coop-title">
            <span style={{ fontSize: 22 }}>👥</span>
            <div>
              <h2 className="header-coop-name">Çalışanlar</h2>
              <p className="header-coop-sub">Kooperatif personel listesi ve vardiye durumu</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="İsim veya rol ara…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="header-actions">
            <button className="cal-btn" onClick={() => router.push('/dashboard/vardiye')}>
              <Icon d={icons.calendar} size={15} /> Vardiye Takvimi
            </button>
          </div>
        </header>

        <div className="content">

          {/* ── KPI Şeridi ── */}
          <div className="cal-kpi-row">
            <div className="cal-kpi">
              <span className="cal-kpi-val">{totalActive}</span>
              <span className="cal-kpi-label">Toplam Personel</span>
            </div>
            <div className="cal-kpi cal-kpi-green">
              <span className="cal-kpi-val">{totalOnDuty}</span>
              <span className="cal-kpi-label">Şu An Görevde</span>
            </div>
            {deptCounts.filter(d => d.count > 0).map(d => (
              <div key={d.dept} className="cal-kpi" style={{ '--dc': DEPT_COLOR[d.dept] } as React.CSSProperties}>
                <span className="cal-kpi-val" style={{ color: DEPT_COLOR[d.dept] }}>{d.count}</span>
                <span className="cal-kpi-label">{DEPT_LABEL[d.dept]}</span>
              </div>
            ))}
          </div>

          {/* ── Departman Filtresi ── */}
          <div className="dept-filter-row">
            <button className={`dept-filter-btn${filterDept === 'all' ? ' active' : ''}`}
              onClick={() => setFilterDept('all')}>Tümü</button>
            {ALL_DEPTS.map(d => (
              <button key={d}
                className={`dept-filter-btn${filterDept === d ? ' active' : ''}`}
                style={{ '--dc': DEPT_COLOR[d] } as React.CSSProperties}
                onClick={() => setFilterDept(d)}>
                {DEPT_LABEL[d]}
              </button>
            ))}
          </div>

          {/* ── Personel Listesi ── */}
          {loading ? (
            <div className="cal-loading-grid">
              {[1,2,3,4,5,6].map(i => <div key={i} className="emp-sk" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="cal-empty">
              <span>👥</span>
              <p>Personel bulunamadı.</p>
            </div>
          ) : filterDept !== 'all' ? (
            /* Tek departman — kart grid */
            <div className="emp-card-grid">
              {filtered.map(e => <EmployeeCard key={e.id} emp={e} onDuty={onDuty} router={router} />)}
            </div>
          ) : (
            /* Tümü — departmana göre gruplu */
            <div className="emp-dept-sections">
              {Object.entries(byDept).map(([dept, list]) => (
                <div key={dept} className="emp-dept-section">
                  <div className="emp-dept-header" style={{ '--dc': DEPT_COLOR[dept] } as React.CSSProperties}>
                    <span className="emp-dept-dot" />
                    <h3>{DEPT_LABEL[dept]}</h3>
                    <span className="emp-dept-count">{list.length} kişi</span>
                  </div>
                  <div className="emp-card-grid">
                    {list.map(e => <EmployeeCard key={e.id} emp={e} onDuty={onDuty} router={router} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmployeeCard({ emp, onDuty, router }: { emp: Employee; onDuty: OnDutyEntry[]; router: ReturnType<typeof useRouter> }) {
  const dutyEntry = onDuty.find(d => d.employee_id === emp.id);
  const color  = DEPT_COLOR[emp.departman] || '#64748b';
  const bg     = DEPT_BG[emp.departman]   || '#f8fafc';

  return (
    <div className={`emp-card${dutyEntry ? ' emp-card-active' : ''}`}>
      {/* Avatar + isim */}
      <div className="emp-card-top">
        <div className="emp-avatar-wrap">
          <div className="emp-avatar-circle" style={{ background: bg, border: `2px solid ${color}` }}>
            <span className="emp-avatar-emoji">{emp.avatar_emoji}</span>
          </div>
          {dutyEntry && <span className="emp-online-dot" />}
        </div>
        <div className="emp-info">
          <h4>{emp.ad}</h4>
          <span className="emp-rol">{emp.rol}</span>
        </div>
      </div>

      {/* Departman rozeti */}
      <div className="emp-badges">
        <span className="emp-dept-badge" style={{ background: color }}>{DEPT_LABEL[emp.departman]}</span>
      </div>

      {/* Vardiye durumu */}
      {dutyEntry ? (
        <div className="emp-duty-now">
          <span className="emp-duty-live" />
          Görevde · {dutyEntry.vardiye_label}
          <span className="emp-duty-time">{dutyEntry.baslangic}–{dutyEntry.bitis}</span>
        </div>
      ) : (
        <div className="emp-not-duty">Vardiyede değil</div>
      )}

      {/* İletişim + Vardiye linki */}
      <div className="emp-card-footer">
        {emp.telefon && (
          <span className="emp-phone">📞 {emp.telefon}</span>
        )}
        <button className="emp-schedule-btn"
          onClick={() => router.push('/dashboard/vardiye')}>
          Vardiye Takvimi →
        </button>
      </div>
    </div>
  );
}
