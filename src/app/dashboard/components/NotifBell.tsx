'use client';
import { useState, useEffect, useRef } from 'react';
import { getNotifications, Notification } from '@/lib/api/client';

/* ── Mini SVG helper (no external deps) ─────────────────────── */
function BellIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

const SEVERITY_COLOR: Record<string, string> = {
  kritik: '#ef4444',
  yuksek: '#f59e0b',
  orta:   '#3b82f6',
};

export default function NotifBell() {
  const [open, setOpen]     = useState(false);
  const [items, setItems]   = useState<Notification[]>([]);
  const [count, setCount]   = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* kapat: dropdown dışına tıklayınca */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  /* ilk açılışta + her toggle'da yükle */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications()
      .then(data => {
        setItems(data.notifications);
        setCount(data.unread_count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  /* badge sayısını arka planda da tazele (60 sn) */
  useEffect(() => {
    const refresh = () =>
      getNotifications()
        .then(d => setCount(d.unread_count))
        .catch(() => {});
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={() => setOpen(o => !o)}
        id="notif-btn"
        title="Bildirimler"
      >
        <BellIcon />
        {count > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            Bildirimler
            {count > 0 && (
              <span style={{
                marginLeft: 8, background: '#ef4444', color: '#fff',
                borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700,
              }}>{count}</span>
            )}
          </div>

          {loading ? (
            <div className="notif-item">
              <span>⏳</span>
              <div style={{ flex: 1 }}>
                <div className="notif-text">Yükleniyor…</div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="notif-item">
              <span>✅</span>
              <div style={{ flex: 1 }}>
                <div className="notif-text">Tüm sistemler normal</div>
                <div className="notif-time">Kritik uyarı yok</div>
              </div>
            </div>
          ) : (
            items.map(n => (
              <div key={n.id} className="notif-item">
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-time" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {n.time && <span>{n.time}</span>}
                    <span style={{
                      background: SEVERITY_COLOR[n.severity] + '22',
                      color: SEVERITY_COLOR[n.severity],
                      borderRadius: 4, padding: '0 5px', fontSize: 10, fontWeight: 600,
                    }}>{n.category}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="notif-footer">
            <button onClick={() => setOpen(false)}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
