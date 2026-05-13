'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './vardiye.css';
import {
  getShiftSchedule, getOnDuty, getEmployees, getTasksWithAssignees, createShift, deleteShift, assignTask,
  type ScheduleDay, type OnDutyEntry, type Employee, type TaskWithAssignee, type ShiftEntry,
} from '@/lib/api/client';
import NotifBell from '../components/NotifBell';

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}
function weekLabel(start: string, end: string) {
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}
function shiftDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00'); // öğlen — DST ve UTC kaymasını önler
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function prevMonday(iso: string) { return shiftDays(iso, -7); }
function nextMonday(iso: string) { return shiftDays(iso, 7); }

const DEPT_LABEL: Record<string, string> = {
  depo: 'Depo', lojistik: 'Lojistik', tarla: 'Tarla', muhasebe: 'Muhasebe', yonetim: 'Yönetim',
};
const DEPT_COLOR: Record<string, string> = {
  depo: '#6366f1', lojistik: '#f97316', tarla: '#22c55e', muhasebe: '#8b5cf6', yonetim: '#ef4444',
};
const VARDIYE_COLOR: Record<string, string> = {
  sabah: '#3b82f6', tam_gun: '#10b981', ogleden_sonra: '#f59e0b',
};
const VARDIYE_LABEL: Record<string, string> = {
  sabah: 'Sabah 08-16', tam_gun: 'Tam Gün 08-18', ogleden_sonra: 'Öğleden Sonra 14-22',
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
  calendar:  ['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  clock:     ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z','M12 6v6l4 2'],
  plus:      ['M12 5v14','M5 12h14'],
  trash:     ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'],
  check:     'M20 6L9 17l-5-5',
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  search:    ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
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
  { id: 'vardiye',      label: 'Vardiya',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj',label: 'Üretici Mesaj',     icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

type Tab = 'takvim' | 'gorevde' | 'gorevler';

interface ShiftForm {
  employee_id: string;
  tarih: string;
  vardiye_turu: string;
  baslangic: string;
  bitis: string;
  departman: string;
  notlar: string;
}

export default function VardiyePage() {
  const router = useRouter();
  const [activeNav,  setActiveNav]  = useState('vardiye');
  const [activeTab,  setActiveTab]  = useState<Tab>('takvim');

  // Data
  const [days,       setDays]       = useState<ScheduleDay[]>([]);
  const [weekStart,  setWeekStart]  = useState('');
  const [weekEnd,    setWeekEnd]    = useState('');
  const [onDuty,     setOnDuty]     = useState<OnDutyEntry[]>([]);
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [tasks,      setTasks]      = useState<TaskWithAssignee[]>([]);

  // Loading
  const [loadingSched, setLoadingSched] = useState(true);
  const [loadingDuty,  setLoadingDuty]  = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Hafta navigasyonu
  const [currentWeek, setCurrentWeek] = useState<string | undefined>(undefined);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ShiftForm>({
    employee_id: '', tarih: '', vardiye_turu: 'tam_gun',
    baslangic: '08:00', bitis: '18:00', departman: 'depo', notlar: '',
  });
  const [saving, setSaving] = useState(false);

  // Seçili departman filtresi (takvim görünümü)
  const [filterDept, setFilterDept] = useState<string>('all');

  // Görev atama
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  async function handleAssign(taskId: number, empId: number | null) {
    setAssigningTaskId(taskId);
    setAssigningLoading(true);
    try {
      const res = await assignTask(taskId, empId);
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, assigned_to: empId ?? undefined, assigned_name: res.assigned_name ?? undefined, assigned_avatar: res.assigned_avatar ?? undefined, assigned_rol: res.assigned_rol ?? undefined }
          : t
      ));
    } catch (e) { console.error(e); }
    finally { setAssigningTaskId(null); setAssigningLoading(false); }
  }

  const loadSchedule = useCallback(async (week?: string) => {
    setLoadingSched(true);
    try {
      const data = await getShiftSchedule(week);
      setDays(data.days);
      setWeekStart(data.week_start);
      setWeekEnd(data.week_end);
    } catch (e) { console.error(e); }
    finally { setLoadingSched(false); }
  }, []);

  useEffect(() => {
    loadSchedule(currentWeek);
  }, [currentWeek, loadSchedule]);

  useEffect(() => {
    getOnDuty()
      .then(d => setOnDuty(d.on_duty))
      .catch(console.error)
      .finally(() => setLoadingDuty(false));

    getEmployees()
      .then(d => setEmployees(d.employees))
      .catch(console.error);

    getTasksWithAssignees()
      .then(d => setTasks(d.tasks))
      .catch(console.error)
      .finally(() => setLoadingTasks(false));
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  // Vardiye saat seçince başlangıç/bitiş otomatik ayarla
  const onVardiyeChange = (v: string) => {
    const map: Record<string, { baslangic: string; bitis: string }> = {
      sabah:          { baslangic: '08:00', bitis: '16:00' },
      tam_gun:        { baslangic: '08:00', bitis: '18:00' },
      ogleden_sonra:  { baslangic: '14:00', bitis: '22:00' },
    };
    setForm(f => ({ ...f, vardiye_turu: v, ...map[v] }));
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.tarih) return;
    setSaving(true);
    try {
      await createShift({
        employee_id: Number(form.employee_id),
        tarih:       form.tarih,
        vardiye_turu: form.vardiye_turu,
        baslangic:   form.baslangic,
        bitis:       form.bitis,
        departman:   form.departman,
        notlar:      form.notlar || undefined,
      });
      setShowModal(false);
      loadSchedule(currentWeek);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (shift_id: number) => {
    if (!confirm('Bu vardiyeyi silmek istiyor musunuz?')) return;
    await deleteShift(shift_id);
    loadSchedule(currentWeek);
  };

  // Tüm departmanlar (takvimden)
  const allDepts = Array.from(
    new Set(days.flatMap(d => Object.keys(d.shifts)))
  ).sort();

  // Şu an görevde — özet
  const dutyByDept = onDuty.reduce<Record<string, OnDutyEntry[]>>((acc, e) => {
    (acc[e.departman] = acc[e.departman] || []).push(e);
    return acc;
  }, {});

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
            <span style={{ fontSize: 22 }}>📅</span>
            <div>
              <h2 className="header-coop-name">Vardiye Yönetimi</h2>
              <p className="header-coop-sub">Personel takibi, görev atama ve haftalık program</p>
            </div>
          </div>
          <div className="header-actions">
            <NotifBell />
            <button className="vrd-btn-primary" onClick={() => setShowModal(true)}>
              <Icon d={icons.plus} size={15} /> Vardiye Ekle
            </button>
          </div>
        </header>

        <div className="content">

          {/* ── Şu An Görevde şeridi ── */}
          {(() => {
            const isActive = onDuty.length > 0 && (onDuty[0] as any).active !== false;
            return (
          <div className="duty-strip">
            <div className="duty-strip-title">
              <span className={`duty-dot${!isActive ? ' duty-dot-off' : ''}`} />
              <span>{isActive ? 'Şu An Görevde' : 'Bugünün Vardiyesi (Mesai Bitti)'}</span>
            </div>
            {loadingDuty ? (
              <div className="duty-loading">Yükleniyor…</div>
            ) : onDuty.length === 0 ? (
              <div className="duty-empty">Bugün için vardiye kaydı yok</div>
            ) : (
              <div className="duty-chips">
                {onDuty.map(e => (
                  <div key={e.shift_id} className={`duty-chip${!isActive ? ' duty-chip-off' : ''}`} style={{ '--dept-color': e.dept_color } as React.CSSProperties}>
                    <span className="duty-avatar">{e.avatar}</span>
                    <div className="duty-chip-info">
                      <span className="duty-name">{e.ad}</span>
                      <span className="duty-rol">{e.departman_label} · {e.vardiye_label}</span>
                    </div>
                    <span className="duty-time">{e.baslangic.slice(0,5)}–{e.bitis.slice(0,5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
            );
          })()}

          {/* ── Tab Bar ── */}
          <div className="vrd-tabs">
            {([['takvim','📅','Haftalık Takvim'],['gorevde','👥','Personel Listesi'],['gorevler','📋','Görev Atamaları']] as const).map(([id, emoji, label]) => (
              <button key={id} className={`vrd-tab${activeTab === id ? ' vrd-tab-active' : ''}`}
                onClick={() => setActiveTab(id)}>
                {emoji} {label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 1 — Haftalık Takvim                       */}
          {/* ══════════════════════════════════════════════ */}
          {activeTab === 'takvim' && (
            <div className="vrd-calendar-panel">
              {/* Hafta navigasyonu */}
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={() => setCurrentWeek(prevMonday(weekStart || new Date().toISOString().slice(0,10)))}>
                  ← Önceki Hafta
                </button>
                <span className="cal-nav-label">
                  <Icon d={icons.calendar} size={15} />
                  {weekStart && weekEnd ? weekLabel(weekStart, weekEnd) : '…'}
                </span>
                <button className="cal-nav-btn" onClick={() => setCurrentWeek(nextMonday(weekStart || new Date().toISOString().slice(0,10)))}>
                  Sonraki Hafta →
                </button>

                {/* Departman filtresi */}
                <div className="cal-dept-filter">
                  <button className={`dept-chip${filterDept === 'all' ? ' active' : ''}`} onClick={() => setFilterDept('all')}>Tümü</button>
                  {allDepts.map(d => (
                    <button key={d} className={`dept-chip${filterDept === d ? ' active' : ''}`}
                      style={{ '--dc': DEPT_COLOR[d] || '#64748b' } as React.CSSProperties}
                      onClick={() => setFilterDept(d)}>
                      {DEPT_LABEL[d] || d}
                    </button>
                  ))}
                </div>
              </div>

              {loadingSched ? (
                <div className="cal-loading">
                  {[1,2,3,4,5].map(i => <div key={i} className="cal-sk" />)}
                </div>
              ) : (
                <div className="cal-grid">
                  {days.map(day => {
                    const depts = filterDept === 'all' ? Object.entries(day.shifts) : Object.entries(day.shifts).filter(([d]) => d === filterDept);
                    const totalShifts = depts.reduce((s, [, arr]) => s + arr.length, 0);
                    return (
                      <div key={day.date} className={`cal-day${day.is_today ? ' cal-day-today' : ''}${day.is_weekend ? ' cal-day-weekend' : ''}`}>
                        <div className="cal-day-header">
                          <span className="cal-day-name">{day.day_name}</span>
                          <span className="cal-day-date">{fmtDate(day.date)}</span>
                          {totalShifts > 0 && <span className="cal-day-count">{totalShifts} kişi</span>}
                        </div>
                        {totalShifts === 0 ? (
                          <div className="cal-empty-day">İzin / Tatil</div>
                        ) : (
                          <div className="cal-day-body">
                            {depts.map(([dept, entries]) => (
                              <div key={dept} className="cal-dept-group">
                                <div className="cal-dept-label" style={{ color: DEPT_COLOR[dept] }}>
                                  {DEPT_LABEL[dept] || dept}
                                </div>
                                {entries.map(e => (
                                  <div key={e.shift_id} className="cal-shift-card"
                                    style={{ '--vc': e.vardiye_color } as React.CSSProperties}>
                                    <span className="cal-shift-avatar">{e.avatar}</span>
                                    <div className="cal-shift-info">
                                      <span className="cal-shift-name">{e.ad}</span>
                                      <span className="cal-shift-time">{e.baslangic.slice(0,5)}–{e.bitis.slice(0,5)}</span>
                                    </div>
                                    <span className="cal-shift-badge" style={{ background: e.vardiye_color }}>
                                      {e.vardiye === 'sabah' ? 'S' : e.vardiye === 'tam_gun' ? 'T' : 'Ö'}
                                    </span>
                                    <button className="cal-del-btn" title="Sil"
                                      onClick={() => handleDelete(e.shift_id)}>
                                      <Icon d={icons.trash} size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 2 — Personel Listesi                      */}
          {/* ══════════════════════════════════════════════ */}
          {activeTab === 'gorevde' && (
            <div className="vrd-employees-panel">
              <div className="emp-grid">
                {employees.map(e => {
                  const dutyEntry = onDuty.find(d => d.employee_id === e.id);
                  return (
                    <div key={e.id} className={`emp-card${dutyEntry ? ' emp-card-active' : ''}`}>
                      <div className="emp-card-top">
                        <div className="emp-avatar-wrap" style={{ '--dc': e.dept_color } as React.CSSProperties}>
                          <span className="emp-avatar">{e.avatar_emoji}</span>
                          {dutyEntry && <span className="emp-online-dot" />}
                        </div>
                        <div className="emp-info">
                          <h4>{e.ad}</h4>
                          <span className="emp-rol">{e.rol}</span>
                        </div>
                        <span className="emp-dept-badge" style={{ background: e.dept_color }}>
                          {e.departman_label}
                        </span>
                      </div>
                      {dutyEntry ? (
                        <div className="emp-duty-now">
                          <span className="emp-duty-dot" />
                          <span>Görevde · {dutyEntry.baslangic.slice(0,5)}–{dutyEntry.bitis.slice(0,5)}</span>
                        </div>
                      ) : (
                        <div className="emp-not-duty">Şu an vardiyede değil</div>
                      )}
                      {e.telefon && (
                        <div className="emp-phone">
                          <Icon d={icons.phone} size={13} /> {e.telefon}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 3 — Görev Atamaları                       */}
          {/* ══════════════════════════════════════════════ */}
          {activeTab === 'gorevler' && (
            <div className="vrd-tasks-panel">
              {loadingTasks ? (
                <div className="tasks-loading">Yükleniyor…</div>
              ) : tasks.length === 0 ? (
                <div className="tasks-empty">
                  <span>📋</span><p>Henüz görev kaydı yok.</p>
                </div>
              ) : (
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Görev</th>
                      <th>Departman</th>
                      <th>Öncelik</th>
                      <th>Atanan Kişi</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id}>
                        <td className="task-name">
                          <span>{t.is_name}</span>
                          {t.aciklama && <span className="task-desc">{t.aciklama}</span>}
                        </td>
                        <td>
                          {t.departman ? (
                            <span className="task-dept-badge" style={{ background: DEPT_COLOR[t.departman] || '#64748b' }}>
                              {DEPT_LABEL[t.departman] || t.departman}
                            </span>
                          ) : <span className="task-no-dept">—</span>}
                        </td>
                        <td>
                          <span className={`task-priority prio-${t.oncelik}`}>
                            {t.oncelik === 'yuksek' ? '🔴 Yüksek' : t.oncelik === 'orta' ? '🟡 Orta' : '🟢 Düşük'}
                          </span>
                        </td>
                        <td>
                          {assigningLoading && assigningTaskId === t.id ? (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Kaydediliyor…</span>
                          ) : (
                            <div className="assign-select-wrap">
                              {t.assigned_name && (
                                <div className="task-assignee" style={{ marginBottom: 4 }}>
                                  <span className="task-assignee-avatar">{t.assigned_avatar}</span>
                                  <div>
                                    <span className="task-assignee-name">{t.assigned_name}</span>
                                    <span className="task-assignee-rol">{t.assigned_rol}</span>
                                  </div>
                                </div>
                              )}
                              <select
                                className="assign-select"
                                value={t.assigned_to ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setAssigningTaskId(t.id);
                                  handleAssign(t.id, val ? Number(val) : null);
                                }}
                              >
                                <option value="">— Personel seç —</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.avatar_emoji} {emp.ad} ({DEPT_LABEL[emp.departman] || emp.departman})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`task-status${t.durum ? ' done' : ' open'}`}>
                            {t.durum ? <><Icon d={icons.check} size={13} /> Tamamlandı</> : '⏳ Açık'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ══════════════════════════════════════════════════ */}
      {/* MODAL — Vardiye Ekle                              */}
      {/* ══════════════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vardiye Ekle</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <label>Personel
                <select value={form.employee_id} onChange={e => {
                  const emp = employees.find(x => x.id === Number(e.target.value));
                  setForm(f => ({ ...f, employee_id: e.target.value, departman: emp?.departman || f.departman }));
                }}>
                  <option value="">— Seçin —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.avatar_emoji} {e.ad} ({e.departman_label})</option>
                  ))}
                </select>
              </label>

              <label>Tarih
                <input type="date" value={form.tarih}
                  onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))} />
              </label>

              <label>Vardiye Tipi
                <select value={form.vardiye_turu} onChange={e => onVardiyeChange(e.target.value)}>
                  <option value="sabah">☀️ Sabah (08:00 – 16:00)</option>
                  <option value="tam_gun">🌤 Tam Gün (08:00 – 18:00)</option>
                  <option value="ogleden_sonra">🌙 Öğleden Sonra (14:00 – 22:00)</option>
                </select>
              </label>

              <div className="modal-row">
                <label>Başlangıç
                  <input type="time" value={form.baslangic}
                    onChange={e => setForm(f => ({ ...f, baslangic: e.target.value }))} />
                </label>
                <label>Bitiş
                  <input type="time" value={form.bitis}
                    onChange={e => setForm(f => ({ ...f, bitis: e.target.value }))} />
                </label>
              </div>

              <label>Departman
                <select value={form.departman} onChange={e => setForm(f => ({ ...f, departman: e.target.value }))}>
                  {Object.entries(DEPT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>

              <label>Not (isteğe bağlı)
                <input type="text" placeholder="Örn: Stok sayımı yapılacak"
                  value={form.notlar} onChange={e => setForm(f => ({ ...f, notlar: e.target.value }))} />
              </label>
            </div>

            <div className="modal-footer">
              <button className="vrd-btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
              <button className="vrd-btn-primary" onClick={handleSave} disabled={saving || !form.employee_id || !form.tarih}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
