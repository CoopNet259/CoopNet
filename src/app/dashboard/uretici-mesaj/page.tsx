'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './uretici-mesaj.css';
import {
  postWhatsAppDemo,
  WhatsAppDemoResult,
  getHarvestMessages,
  HarvestMessagesResponse,
  getApprovals,
  approveRequest,
  rejectRequest,
  PendingApproval,
} from '@/lib/api/client';
import NotifBell from '../components/NotifBell';

// ── Tipler ──────────────────────────────────────────────────────────────
interface IncomingMessage {
  id: string;
  time: string;
  message: string;
  impact: string;
  source: string;
  // demo'dan gelenlerde AI sonucu da ekleriz
  analysisResult?: WhatsAppDemoResult;
}

// ── Sabitler ────────────────────────────────────────────────────────────
const QUICK_MESSAGES = [
  '100 kg domates hasat ettim, öğleye kadar getiririm',
  '50 kg biber hazır, bugün teslim edebilirim',
  '200 kg salatalık topladım',
  '80 kg kayısı var, yarın sabah 09:00 da getireceğim',
  '150 kg patlıcan hasat ettim',
];

const PRODUCERS = [
  { name: 'Ahmet Yılmaz', initials: 'AY', location: 'Çukurova' },
  { name: 'Fatma Şahin', initials: 'FŞ', location: 'Mut' },
  { name: 'Mehmet Demir', initials: 'MD', location: 'Silifke' },
];

// ── İkonlar ─────────────────────────────────────────────────────────────
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
  brain:     ['M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'],
  log:       ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  phone:     ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  chevron:   'M9 18l6-6-6-6',
  shift:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  logout:    ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  send:      'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z',
  check:     'M20 6L9 17l-5-5',
  refresh:   ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  flask:     ['M9 3h6','M11 3v5l-3 7a3 3 0 0 0 2.83 4h2.34A3 3 0 0 0 16 15l-3-7V3'],
  inbox:     ['M22 12h-6l-2 3h-4l-2-3H2','M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
};

const navItems = [
  { id: 'dashboard',      label: 'Ana Sayfa',         icon: 'grid',      path: '/dashboard' },
  { id: 'depo',           label: 'Depo',              icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler',       label: 'Talepler',          icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler',     label: 'Üreticiler',        icon: 'users',     path: '/dashboard/ureticiler' },
  { id: 'finansal',       label: 'Finansal Raporlar', icon: 'dollar',    path: '/dashboard/finansal' },
  { id: 'anomali',        label: 'Anomali',           icon: 'alert',     path: '/dashboard/anomali' },
  { id: 'ai-raporlar',   label: 'AI Raporları',      icon: 'brain',     path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs',        label: 'AI Logs',           icon: 'log',       path: '/dashboard/ai-logs' },
  { id: 'vardiye',      label: 'Vardiye',           icon: 'shift',     path: '/dashboard/vardiye' },
  { id: 'uretici-mesaj', label: 'Üretici Mesaj',     icon: 'phone',     path: '/dashboard/uretici-mesaj' },
];

// ── Yardımcı ─────────────────────────────────────────────────────────────
function fmt(d: Date) {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function confClass(label: string) {
  if (label === 'Yüksek') return 'high';
  if (label === 'Orta') return 'mid';
  return 'low';
}
function stockClass(pct: number, crit: boolean) {
  if (crit) return 'crit';
  if (pct < 30) return 'warn';
  return 'ok';
}
function actionCount(impact: string) {
  const m = impact.match(/(\d+)\s*otomatik/i);
  return m ? parseInt(m[1]) : null;
}

// ── Sayfa ────────────────────────────────────────────────────────────────
export default function UreticiMesajPage() {
  const router = useRouter();

  // Sekme
  const [activeTab, setActiveTab] = useState<'messages' | 'approvals'>('messages');

  // Feed state
  const [feedData, setFeedData] = useState<HarvestMessagesResponse | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Onay kuyruğu state
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{id: number; type: 'ok' | 'err'; msg: string} | null>(null);

  // Demo/test paneli
  const [showTest, setShowTest] = useState(false);
  const [testProducer, setTestProducer] = useState(PRODUCERS[0]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const data = await getHarvestMessages(30);
      setFeedData(data);
      // Mesajları dönüştür — yeni gelenler üstte
      const mapped: IncomingMessage[] = data.messages.map(m => ({
        id: m.id,
        time: m.time,
        message: m.message,
        impact: m.impact,
        source: 'WhatsApp',
      }));
      setMessages(mapped);
    } catch {
      // sessiz
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const loadApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const data = await getApprovals();
      setApprovals(data);
    } catch { /* sessiz */ }
    finally { setApprovalsLoading(false); }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);
  useEffect(() => { if (activeTab === 'approvals') loadApprovals(); }, [activeTab, loadApprovals]);

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      const res = await approveRequest(id);
      setActionFeedback({ id, type: 'ok', msg: res.message ?? 'Onaylandı, depo görevi oluşturuldu.' });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (e: unknown) {
      setActionFeedback({ id, type: 'err', msg: e instanceof Error ? e.message : 'Hata oluştu.' });
    } finally { setActionLoading(null); }
  }

  async function handleReject(id: number) {
    setActionLoading(id);
    try {
      await rejectRequest(id);
      setActionFeedback({ id, type: 'ok', msg: 'Talep reddedildi.' });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (e: unknown) {
      setActionFeedback({ id, type: 'err', msg: e instanceof Error ? e.message : 'Hata oluştu.' });
    } finally { setActionLoading(null); }
  }

  // Seçili mesaj
  const selected = messages.find(m => m.id === selectedId) ?? null;

  // Demo mesaj gönder
  async function sendTest(text: string) {
    if (!text.trim() || testLoading) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await postWhatsAppDemo(text.trim(), testProducer.name);
      const decisions = result.results ?? [];
      const label = decisions.map(r => {
        if (r.decision === 'otomatik_kabul')   return `✅ ${r.product}: kabul (${r.needed} kg)`;
        if (r.decision === 'ihtiyac_yok')      return `❌ ${r.product}: ihtiyaç yok`;
        if (r.decision === 'onay_bekleniyor')  return `⏳ ${r.product}: yönetici onayı bekleniyor`;
        return r.product;
      }).join(' · ') || 'İşlendi';
      setTestResult(`${label}`);
      setTestInput('');
      // Feed'i yenile
      await loadFeed();
    } catch {
      setTestResult('❌ Hata: Backend çalışıyor mu?');
    } finally {
      setTestLoading(false);
    }
  }

  // İstatistikler
  const totalMessages  = messages.length;
  const totalTasks     = feedData?.tasks.length ?? 0;
  const criticalTasks  = feedData?.tasks.filter(t => t.priority === 'yuksek').length ?? 0;
  const pendingTasks   = feedData?.tasks.filter(t => !t.done).length ?? 0;
  const pendingApprovalCount = approvals.length;

  return (
    <div className="coopnet-root">
      {/* ── Sidebar ── */}
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
            <div
              key={item.id}
              className={`nav-item${item.id === 'uretici-mesaj' ? ' active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              <Icon d={icons[item.icon]} size={17} />
              <span className="nav-item-label">{item.label}</span>
              {item.id === 'uretici-mesaj' && <Icon d={icons.chevron} size={14} />}
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

      {/* ── Ana Alan ── */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="header-title-block">
            <span className="header-icon">📱</span>
            <div>
              <h1 className="header-title">Üretici Mesaj Yönetimi</h1>
              <p className="header-sub">WhatsApp'tan gelen hasat bildirimlerini takip et ve yönet</p>
            </div>
          </div>
          <div className="header-right">
            <div className="wa-status-badge">
              <span className="wa-dot" />
              WhatsApp Aktif
            </div>
            <button
              className={`test-btn${showTest ? ' active' : ''}`}
              onClick={() => setShowTest(v => !v)}
            >
              <Icon d={icons.flask} size={14} />
              Test Gönder
            </button>
            <NotifBell />
          </div>
        </header>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon-wrap green">📨</div>
            <div>
              <div className="stat-label">Gelen Mesaj</div>
              <div className="stat-value">{feedLoading ? '—' : totalMessages}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap blue">✅</div>
            <div>
              <div className="stat-label">Oluşturulan Görev</div>
              <div className="stat-value">{feedLoading ? '—' : totalTasks}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap red">⚠️</div>
            <div>
              <div className="stat-label">Yüksek Öncelik</div>
              <div className="stat-value">{feedLoading ? '—' : criticalTasks}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap yellow">🕐</div>
            <div>
              <div className="stat-label">Bekleyen Görev</div>
              <div className="stat-value">{feedLoading ? '—' : pendingTasks}</div>
            </div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('approvals')}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>⏳</div>
            <div>
              <div className="stat-label">Onay Bekleyen</div>
              <div className="stat-value" style={{ color: pendingApprovalCount > 0 ? '#d97706' : undefined }}>
                {approvalsLoading ? '—' : pendingApprovalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="tab-bar">
          <button
            className={`tab-btn${activeTab === 'messages' ? ' active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            📨 Gelen Mesajlar
            {totalMessages > 0 && <span className="tab-badge">{totalMessages}</span>}
          </button>
          <button
            className={`tab-btn${activeTab === 'approvals' ? ' active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            ⏳ Bekleyen Onaylar
            {pendingApprovalCount > 0 && (
              <span className="tab-badge warn">{pendingApprovalCount}</span>
            )}
          </button>
        </div>

        {/* ── ONAY SEKMESİ ── */}
        {activeTab === 'approvals' && (
          <div className="approvals-panel">
            <div className="approvals-header">
              <span className="approvals-title">Yönetici Onay Kuyruğu</span>
              <button className="refresh-btn" onClick={loadApprovals} disabled={approvalsLoading}>
                <Icon d={icons.refresh} size={13} />
                {approvalsLoading ? 'Yükleniyor…' : 'Yenile'}
              </button>
            </div>

            {approvalsLoading && <div className="loading-dots"><span /><span /><span /></div>}

            {!approvalsLoading && approvals.length === 0 && (
              <div className="approvals-empty">
                <div style={{ fontSize: 40 }}>✅</div>
                <div className="feed-empty-title">Bekleyen onay yok</div>
                <div className="feed-empty-sub">
                  Stok %25–75 arasında olan hasat teklifleri burada görünecek.
                </div>
              </div>
            )}

            <div className="approvals-list">
              {approvals.map(a => {
                const isBusy  = actionLoading === a.id;
                const feedback = actionFeedback?.id === a.id ? actionFeedback : null;
                const timeAgo  = new Date(a.olusturuldu).toLocaleString('tr-TR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                const hoursLeft = Math.max(0, 12 - Math.round(
                  (Date.now() - new Date(a.olusturuldu).getTime()) / 3600000
                ));

                return (
                  <div key={a.id} className="approval-card">
                    <div className="approval-card-top">
                      <div className="approval-producer">
                        <div className="approval-avatar">
                          {a.uretici_adi.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="approval-name">{a.uretici_adi}</div>
                          <div className="approval-phone">{a.uretici_telefon}</div>
                        </div>
                      </div>
                      <div className="approval-timer">
                        <span className="approval-timer-icon">⏱️</span>
                        <span>{hoursLeft}s kaldı</span>
                      </div>
                    </div>

                    <div className="approval-body">
                      <div className="approval-msg">"{a.ham_mesaj}"</div>
                      <div className="approval-details">
                        <div className="approval-detail-item">
                          <span className="approval-detail-label">Ürün</span>
                          <span className="approval-detail-value">{a.urun_adi}</span>
                        </div>
                        <div className="approval-detail-item">
                          <span className="approval-detail-label">Talep</span>
                          <span className="approval-detail-value">{a.talep_miktari} {a.birim}</span>
                        </div>
                        <div className="approval-detail-item">
                          <span className="approval-detail-label">Alabiliriz</span>
                          <span className="approval-detail-value" style={{ color: 'var(--green-600)', fontWeight: 700 }}>
                            {a.kabul_miktari} {a.birim}
                          </span>
                        </div>
                        <div className="approval-detail-item">
                          <span className="approval-detail-label">Stok</span>
                          <span className="approval-detail-value">
                            <span className={`stock-pct-badge ${a.stok_doluluk < 40 ? 'warn' : 'ok'}`}>
                              %{a.stok_doluluk}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="approval-time-note">📅 {timeAgo}</div>
                    </div>

                    {feedback ? (
                      <div className={`approval-feedback ${feedback.type}`}>
                        {feedback.type === 'ok' ? '✅' : '❌'} {feedback.msg}
                      </div>
                    ) : (
                      <div className="approval-actions">
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(a.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? <span className="spinner-sm" /> : '✓'} Onayla
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleReject(a.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? <span className="spinner-sm" /> : '✕'} Reddet
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'messages' && (
        <div className="umesaj-content">
          {/* ── Sol: Gelen mesaj akışı ── */}
          <div className="feed-column">
            <div className="feed-header">
              <div>
                <span className="feed-title">Gelen Bildirimler</span>
                {!feedLoading && messages.length > 0 && (
                  <span className="msg-count-badge" style={{ marginLeft: 8 }}>{messages.length}</span>
                )}
              </div>
              <div className="feed-actions">
                <button className="refresh-btn" onClick={loadFeed} disabled={feedLoading}>
                  <Icon d={icons.refresh} size={13} extra="inline-block" />
                  {' '}{feedLoading ? 'Yükleniyor…' : 'Yenile'}
                </button>
              </div>
            </div>

            <div className="feed-list">
              {feedLoading && (
                <div className="loading-dots"><span /><span /><span /></div>
              )}

              {!feedLoading && messages.length === 0 && (
                <div className="feed-empty">
                  <div className="feed-empty-icon">📭</div>
                  <div className="feed-empty-title">Henüz mesaj yok</div>
                  <div className="feed-empty-sub">
                    Üreticiler WhatsApp'tan mesaj gönderdiğinde burada görünecek.<br />
                    Test için üstteki "Test Gönder" butonunu kullanabilirsin.
                  </div>
                </div>
              )}

              {messages.map(msg => {
                const count = actionCount(msg.impact);
                const isCrit = msg.impact?.toLowerCase().includes('kritik');
                return (
                  <div
                    key={msg.id}
                    className={`msg-item${selectedId === msg.id ? ' selected' : ''}`}
                    onClick={() => setSelectedId(msg.id === selectedId ? null : msg.id)}
                  >
                    <div className="msg-item-top">
                      <div className="msg-source-avatar">📱</div>
                      <div className="msg-item-body">
                        <div className="msg-item-header">
                          <span className="msg-source-name">WhatsApp Üreticisi</span>
                          <span className="msg-time">{msg.time}</span>
                        </div>
                        <div className="msg-text-preview">"{msg.message}"</div>
                      </div>
                    </div>
                    {(count !== null || msg.impact) && (
                      <div className="msg-item-footer">
                        {count !== null && (
                          <span className={`action-badge${isCrit ? ' critical' : ''}`}>
                            ⚡ {count} otomatik aksiyon
                          </span>
                        )}
                        {isCrit && (
                          <span className="action-badge critical">⚠️ Kritik stok</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Sağ: Detay / Analiz ── */}
          <div className="detail-column">
            {!selected ? (
              /* Boş durum + görev listesi */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="detail-empty">
                  <div className="detail-empty-icon">👆</div>
                  <div className="detail-empty-title">Mesaj seç</div>
                  <div className="detail-empty-sub">
                    Sol taraftan bir mesaja tıkla — AI'nın ne parse ettiğini, stok durumunu ve alınan aksiyonları gör.
                  </div>
                </div>

                {/* Görev listesi — her zaman görünür */}
                {feedData && feedData.tasks.length > 0 && (
                  <div style={{ padding: '0 22px 22px' }}>
                    <div className="tasks-section">
                      <div className="tasks-header">
                        <span className="tasks-title">Oluşturulan Görevler ({feedData.tasks.length})</span>
                      </div>
                      <div className="tasks-list">
                        {feedData.tasks.map(t => (
                          <div key={t.id} className={`task-row${t.priority === 'yuksek' ? ' urgent' : ''}`}>
                            <div className={`task-check${t.done ? ' done' : ''}`}>
                              {t.done && <Icon d={icons.check} size={10} extra="text-white" />}
                            </div>
                            <span className="task-name">{t.title}</span>
                            <span className={`task-prio ${t.priority === 'yuksek' ? 'high' : t.priority === 'orta' ? 'med' : 'low'}`}>
                              {t.priority === 'yuksek' ? 'Yüksek' : t.priority === 'orta' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Mesaj detayı */
              <>
                <div className="detail-msg-header">
                  <div className="detail-avatar">📱</div>
                  <div>
                    <div className="detail-source-name">WhatsApp Üreticisi</div>
                    <div className="detail-source-meta">Twilio Sandbox · {selected.source}</div>
                  </div>
                  <div className="detail-time-badge">{selected.time}</div>
                </div>

                <div className="detail-msg-bubble">
                  <div className="detail-bubble-label">Gelen mesaj</div>
                  <div className="detail-bubble">{selected.message}</div>
                </div>

                <div className="detail-body">
                  {/* Eğer demo'dan gelen ve analiz verisi varsa göster */}
                  {selected.analysisResult ? (
                    <>
                      {(selected.analysisResult.results ?? []).map((r, i) => (
                        <div key={i} className="analysis-section">
                          <div className="analysis-section-header">
                            <span className="analysis-section-title">{r.product.charAt(0).toUpperCase() + r.product.slice(1)}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                              background: r.decision === 'otomatik_kabul' ? 'rgba(56,153,106,0.1)' : r.decision === 'ihtiyac_yok' ? 'var(--red-100)' : '#fef3c7',
                              color: r.decision === 'otomatik_kabul' ? 'var(--green-600)' : r.decision === 'ihtiyac_yok' ? 'var(--red-500)' : '#d97706' }}>
                              {r.decision === 'otomatik_kabul' ? '✅ Otomatik Kabul' : r.decision === 'ihtiyac_yok' ? '❌ İhtiyaç Yok' : '⏳ Onay Bekliyor'}
                            </span>
                          </div>
                          <div className="analysis-section-body">
                            <div className="kv-grid">
                              <div className="kv-item">
                                <div className="kv-label">Teklif</div>
                                <div className="kv-value">{r.quantity} kg</div>
                              </div>
                              <div className="kv-item">
                                <div className="kv-label">Alınacak</div>
                                <div className="kv-value" style={{ color: 'var(--green-600)' }}>{r.needed} kg</div>
                              </div>
                              <div className="kv-item">
                                <div className="kv-label">Stok</div>
                                <div className="kv-value">%{r.fill_pct}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--grey-50)', borderRadius: 6, fontSize: 13, color: 'var(--grey-600)', lineHeight: 1.5 }}>
                              {r.reply_line}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    /* DB'den gelen eski mesaj — impact metni var ama detaylı analiz yok */
                    <>
                      {selected.impact && (
                        <div className="actions-section">
                          <div className="actions-header">
                            <span className="actions-title">Alınan Aksiyonlar</span>
                          </div>
                          <div className="actions-list">
                            <div className="action-row">
                              <span className="action-icon">⚡</span>
                              <span className="action-text">{selected.impact}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{
                        background: 'var(--grey-50)', border: '1px solid var(--grey-200)',
                        borderRadius: 'var(--radius-md)', padding: '14px 16px',
                        fontSize: 12.5, color: 'var(--grey-500)', lineHeight: 1.65
                      }}>
                        💡 Bu mesaj gerçek WhatsApp'tan alındı. Detaylı analiz verisi arşivde.<br />
                        <strong>"Test Gönder"</strong> ile yeni bir mesaj gönderirsen tam AI analizi burada görünür.
                      </div>
                    </>
                  )}

                  {/* İlgili görevler */}
                  {feedData && feedData.tasks.length > 0 && (
                    <div className="tasks-section">
                      <div className="tasks-header">
                        <span className="tasks-title">İlgili Görevler</span>
                      </div>
                      <div className="tasks-list">
                        {feedData.tasks.slice(0, 5).map(t => (
                          <div key={t.id} className={`task-row${t.priority === 'yuksek' ? ' urgent' : ''}`}>
                            <div className={`task-check${t.done ? ' done' : ''}`}>
                              {t.done && <Icon d={icons.check} size={10} extra="text-white" />}
                            </div>
                            <span className="task-name">{t.title}</span>
                            <span className={`task-prio ${t.priority === 'yuksek' ? 'high' : t.priority === 'orta' ? 'med' : 'low'}`}>
                              {t.priority === 'yuksek' ? 'Yüksek' : t.priority === 'orta' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* ── Test Paneli (overlay — sağ altta) ── */}
        {showTest && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, width: 400, zIndex: 200 }}>
            <div className="test-panel">
              <div className="test-panel-header">
                <div>
                  <div className="test-panel-title">
                    🧪 Mesaj Simülatörü
                  </div>
                  <div className="test-panel-sub">Sistemi test etmek için demo mesaj gönder</div>
                </div>
                <button className="close-btn" onClick={() => setShowTest(false)}>✕</button>
              </div>
              <div className="test-panel-body">
                {/* Üretici seç */}
                <div className="test-producer-row">
                  {PRODUCERS.map(p => (
                    <button
                      key={p.name}
                      className={`test-producer-btn${testProducer.name === p.name ? ' sel' : ''}`}
                      onClick={() => setTestProducer(p)}
                    >
                      <div className="test-prod-av">{p.initials}</div>
                      <span className="test-prod-name">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Giriş */}
                <div className="test-input-row">
                  <input
                    className="test-input"
                    placeholder="Hasat mesajı yaz…"
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendTest(testInput)}
                    disabled={testLoading}
                  />
                  <button
                    className="test-send-btn"
                    onClick={() => sendTest(testInput)}
                    disabled={testLoading || !testInput.trim()}
                  >
                    <Icon d={icons.send} size={14} />
                    {testLoading ? 'İşleniyor…' : 'Gönder'}
                  </button>
                </div>

                {/* Hızlı mesajlar */}
                <div className="test-quick-list">
                  {QUICK_MESSAGES.map((msg, i) => (
                    <button
                      key={i}
                      className="test-quick-btn"
                      onClick={() => sendTest(msg)}
                      disabled={testLoading}
                    >
                      💬 {msg}
                    </button>
                  ))}
                </div>

                {testResult && (
                  <div className="test-result">{testResult}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
