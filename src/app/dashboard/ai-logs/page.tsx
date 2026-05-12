'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './ai-logs.css';
import { getAILogs, getAgentDecisions, getAnomalySummary, type AgentDecisionItem, type AnomalyItem } from '@/lib/api/client';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function todayTr(): string { const n = new Date(); return `${n.getDate()} ${TR_MONTHS[n.getMonth()]} ${n.getFullYear()}`; }

const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse:['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  clipboard:['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  dollar:   ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert:    ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  brain:    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
  log:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  phone:    ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:  'M9 18l6-6-6-6',
  logout:   ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:   ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z','M16 16l3.5 3.5'],
  info:     ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z','M12 16v-4','M12 8h.01'],
  check:    'M20 6L9 17l-5-5',
};

const navItems = [
  { id: 'dashboard',   label: 'Ana Sayfa',         icon: 'grid',      path: '/dashboard' },
  { id: 'depo',        label: 'Depo',              icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',    label: 'Talepler',          icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',  label: 'Üreticiler',        icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',    label: 'Finansal Raporlar', icon: 'dollar',    path: '/dashboard/finansal' },
  { id: 'anomali',     label: 'Anomali',           icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar', label: 'AI Raporları',      icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',     label: 'AI Logs',           icon: 'log',       path: '/dashboard/ai-logs' },
  { id: 'uretici-mesaj', label: 'Üretici Mesaj',  icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

// Kategori → ikon
function warningIcon(category: string): string {
  const c = category.toLowerCase();
  if (c === 'depo')      return 'warehouse';
  if (c === 'israf')     return 'alert';
  if (c === 'talep')     return 'info';
  if (c === 'lojistik')  return 'info';
  if (c === 'stk')       return 'bell';
  return 'alert';
}

export default function AILogsPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('ai-logs');
  const [aiActing, setAiActing] = useState<any[]>([]);
  const [aiActingLoading, setAiActingLoading] = useState(true);
  const [warnings, setWarnings] = useState<AnomalyItem[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [decisions, setDecisions] = useState<AgentDecisionItem[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'decisions'>('logs');

  useEffect(() => {
    // Gerçek uyarılar — anomali API'sinden, sadece kritik/yüksek, max 8
    getAnomalySummary()
      .then(data => {
        const critical = (data.anomalies as AnomalyItem[])
          .filter(a => a.severity === 'kritik' || a.severity === 'yuksek')
          .slice(0, 8);
        setWarnings(critical);
      })
      .catch(console.error)
      .finally(() => setWarningsLoading(false));

    // AI işlem logları
    getAILogs()
      .then(data => {
        if (data.actions && data.actions.length > 0) {
          setAiActing(data.actions.map(item => ({
            id: item.id,
            saat: item.time,
            tarih: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            baslik: item.title,
            kategori: item.ctx?.join(' · ') || 'Genel',
            detay_ne: item.title,
            detay_neden: item.why,
            detay_veri: `Güven skoru: %${item.confidence}. ${item.impact}`,
            detay_etki: item.impact,
          })));
        }
      })
      .catch(err => console.error('AI Logs çekilemedi:', err))
      .finally(() => setAiActingLoading(false));

    getAgentDecisions(100)
      .then(data => setDecisions(data.items))
      .catch(console.error)
      .finally(() => setDecisionsLoading(false));
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

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
              <p>Admin Paneli</p>
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
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <h2 className="header-coop-name">AI Logs & Erken Uyarı Sistemi</h2>
              <p className="header-coop-sub">Yapay Zeka İşlem Kayıtları ve Risk Analizleri · {todayTr()}</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Log, uyarı veya işlem ara…" />
          </div>
          <div className="header-actions">
            {warnings.length > 0 && (
              <span className="header-warn-badge">{warnings.length} uyarı</span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="content">

          {/* Tab bar */}
          <div className="logs-tab-bar">
            <button
              className={`logs-tab${activeTab === 'logs' ? ' logs-tab-active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              🤖 AI İşlem Kayıtları
              <span className="logs-tab-count">{aiActing.length}</span>
            </button>
            <button
              className={`logs-tab${activeTab === 'decisions' ? ' logs-tab-active' : ''}`}
              onClick={() => setActiveTab('decisions')}
            >
              📋 Ajan Kararları
              <span className="logs-tab-count">{decisions.length}</span>
            </button>
          </div>

          {/* ── Ajan Kararları Tab ── */}
          {activeTab === 'decisions' && (
            <div className="decisions-panel">
              <div className="decisions-header-row">
                <div>
                  <h3>Ajan Kararları</h3>
                  <p>Teklif gönderme, depo görevi, WhatsApp hasat onayı gibi tüm ajan aksiyonları</p>
                </div>
              </div>

              {decisionsLoading && (
                <div className="decisions-loading">Yükleniyor…</div>
              )}

              {!decisionsLoading && decisions.length === 0 && (
                <div className="decisions-empty">
                  <span>📋</span>
                  <p>Henüz kayıtlı ajan kararı yok.</p>
                </div>
              )}

              {!decisionsLoading && decisions.length > 0 && (
                <div className="decisions-table-wrap">
                  <table className="decisions-table">
                    <thead>
                      <tr>
                        <th>Zaman</th>
                        <th>Ajan</th>
                        <th>Karar</th>
                        <th>Açıklama</th>
                        <th>Tetikleyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decisions.map(d => (
                        <tr key={d.id}>
                          <td className="td-time">
                            <span className="td-saat">{d.saat}</span>
                            <span className="td-tarih">{d.tarih}</span>
                          </td>
                          <td>
                            <span className="td-ajan">
                              {d.ajan_icon} {d.ajan_label}
                            </span>
                          </td>
                          <td>
                            <span className={`td-karar karar-${d.karar}`}>
                              {d.karar_label}
                            </span>
                          </td>
                          <td className="td-aciklama">{d.aciklama}</td>
                          <td className="td-tetikleyen">{d.tetikleyen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Mevcut Logs Tab ── */}
          {activeTab === 'logs' && (
          <div className="ai-logs-layout">

            {/* 1. Uyarılar (Erken Uyarı Sistemi) — gerçek anomali verisi */}
            <section className="ai-logs-panel">
              <div className="panel-header warning-header">
                <Icon d={icons.alert} size={18} />
                <h3>Uyarılar (Erken Uyarı Sistemi)</h3>
                {!warningsLoading && (
                  <span className="panel-badge red">
                    Aktif: {warnings.length} Risk
                  </span>
                )}
              </div>

              {warningsLoading && (
                <div className="warnings-loading">
                  <div className="warn-sk" /><div className="warn-sk" /><div className="warn-sk" />
                </div>
              )}

              {!warningsLoading && warnings.length === 0 && (
                <div className="warnings-empty">
                  <span>✅</span>
                  <p>Şu an aktif kritik/yüksek risk uyarısı yok.</p>
                </div>
              )}

              {!warningsLoading && warnings.length > 0 && (
                <div className="warnings-grid">
                  {warnings.map(a => (
                    <div key={a.id} className={`warning-card ${a.severity}`}>
                      <div className="warning-card-top">
                        <div className={`warning-icon warn-icon-${a.severity}`}>
                          <Icon d={icons[warningIcon(a.category)] || icons.alert} size={20} />
                        </div>
                        <div className="warning-info">
                          <strong>{a.title}</strong>
                          <p>{a.description}</p>
                        </div>
                      </div>
                      <span className="warning-source">{a.category} · {a.source}</span>
                      <div className="warning-rec">💡 {a.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. AI Acting (Şeffaf İşlem Kayıtları) */}
            <section className="ai-logs-panel">
              <div className="panel-header acting-header">
                <Icon d={icons.brain} size={18} />
                <h3>AI Acting (Yapay Zeka Otonom İşlemleri)</h3>
                {!aiActingLoading && (
                  <span className="panel-badge blue">Son 24 Saat: {aiActing.length} İşlem</span>
                )}
              </div>

              {aiActingLoading && (
                <div className="warnings-loading">
                  <div className="warn-sk" /><div className="warn-sk" />
                </div>
              )}

              {!aiActingLoading && aiActing.length === 0 && (
                <div className="warnings-empty">
                  <span>📋</span>
                  <p>Son 24 saatte kayıtlı AI işlemi yok.</p>
                </div>
              )}

              <div className="acting-list">
                {aiActing.map(log => (
                  <div key={log.id} className="acting-item">
                    <div className="acting-time">
                      <span className="time-val">{log.saat}</span>
                      <span className="date-val">{log.tarih}</span>
                    </div>
                    <div className="acting-content">
                      <div className="acting-title">
                        <strong>{log.baslik}</strong>
                        <span className="acting-badge">{log.kategori}</span>
                      </div>
                      <div className="acting-details">
                        <div className="detail-col">
                          <span className="detail-label">Ne Yaptı?</span>
                          <span className="detail-value">{log.detay_ne}</span>
                        </div>
                        <div className="detail-col">
                          <span className="detail-label">Neden Yaptı?</span>
                          <span className="detail-value">{log.detay_neden}</span>
                        </div>
                        <div className="detail-col">
                          <span className="detail-label">Hangi Veriye Dayandı?</span>
                          <span className="detail-value">{log.detay_veri}</span>
                        </div>
                        <div className="detail-col">
                          <span className="detail-label">İş Akışına Etkisi</span>
                          <span className="detail-value impact">{log.detay_etki}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
          )} {/* end logs tab */}

        </div>
      </main>
    </div>
  );
}
