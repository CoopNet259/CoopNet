'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import './anomali.css';

const Icon = ({ d, size = 18, extra = '' }: { d: string | string[]; size?: number; extra?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons: Record<string, string | string[]> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  warehouse: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  clipboard: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  dollar: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  brain: ['M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'],
  log: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  chevron: 'M9 18l6-6-6-6',
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  search: ['M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z', 'M16 16l3.5 3.5'],
  info: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 16v-4', 'M12 8h.01'],
};

const navItems = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: 'grid', path: '/dashboard' },
  { id: 'depo', label: 'Depo', icon: 'warehouse', path: '/dashboard/depo' },
  { id: 'talepler', label: 'Talepler', icon: 'clipboard', path: '/dashboard/talepler' },
  { id: 'ureticiler', label: 'Üreticiler', icon: 'users', path: '/dashboard/ureticiler' },
  { id: 'finansal', label: 'Finansal Raporlar', icon: 'dollar', path: '/dashboard/finansal' },
  { id: 'anomali', label: 'Anomali', icon: 'alert', path: '/dashboard/anomali' },
  { id: 'ai-raporlar', label: 'AI Raporları', icon: 'brain', path: '/dashboard/ai-raporlar' },
  { id: 'ai-logs', label: 'AI Logs', icon: 'log', path: '/dashboard/ai-logs' },
];

interface Product {
  id: number;
  emoji: string;
  ad: string;
  mevcut_kg: number;
  kapasite_kg: number;
  kategori: string;
  son_guncelleme: string;
}

interface RequestItem {
  id: number;
  musteri: string;
  urun: string;
  miktar: string;
  saat: string;
  durum: string;
}

interface AiLog {
  id: number;
  zaman: string;
  tarih: string;
  tip: string;
  baslik: string;
  mesaj: string;
  kategori: string;
  detay_ne?: string;
}

interface StkAlert {
  id: number;
  urun: string;
  emoji: string;
  kalan_gun_mesaj: string;
  miktar: string;
  islem: string;
  kardesler: any;
}

interface Anomaly {
  id: string;
  title: string;
  description: string;
  severity: 'kritik' | 'yuksek' | 'orta' | 'bilgi';
  category: string;
  source: string;
  recommendation: string;
}

function normalizePercentage(value: number | null | undefined, capacity: number | null | undefined) {
  const current = Number(value || 0);
  const cap = Number(capacity || 1);
  return cap > 0 ? Math.round((current / cap) * 100) : 0;
}

function parseKardesler(value: any) {
  if (!value) return [];
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? value : [];
}

function detectAnomalies(
  products: Product[],
  requests: RequestItem[],
  aiLogs: AiLog[],
  stkAlerts: StkAlert[],
) {
  const anomalies: Anomaly[] = [];

  const productMap = new Map(products.map(product => [product.ad.toLowerCase(), product]));

  products.forEach((product) => {
    const pct = normalizePercentage(product.mevcut_kg, product.kapasite_kg);
    const ageRisk = /Dün|Yarın|Saat|Bugün/i.test(product.son_guncelleme);

    if (pct <= 20) {
      anomalies.push({
        id: `stock-${product.id}`,
        title: `${product.ad} stok seviyesi kritik`,
        description: `${product.emoji} ${product.ad} stok seviyesi ${pct}% olarak ölçüldü. Acil sipariş planlayın.`,
        severity: 'kritik',
        category: 'Depo',
        source: 'Stok Analizi',
        recommendation: 'Satın alma desteği ile ek stok talebi oluşturun.'
      });
    } else if (pct <= 40) {
      anomalies.push({
        id: `stock-${product.id}`,
        title: `${product.ad} stoku düşük`,
        description: `${product.emoji} ${product.ad} şu anda ${pct}% dolulukta. Talep artışı riski mevcut.`,
        severity: 'yuksek',
        category: 'Depo',
        source: 'Stok Analizi',
        recommendation: 'Tedarikçi ve üretim planını kontrol edin.'
      });
    }

    if (ageRisk && pct <= 50) {
      anomalies.push({
        id: `age-${product.id}`,
        title: `${product.ad} raporlama gecikmesi`,
        description: `Son güncelleme ${product.son_guncelleme}. Stok verilerini güncelleyerek daha kesin risk raporu alın.`,
        severity: 'orta',
        category: 'Veri Kalitesi',
        source: 'Zaman Analizi',
        recommendation: 'Depo giriş-çıkışını yeniden teyit edin.'
      });
    }
  });

  requests.forEach((request) => {
    const product = productMap.get(request.urun.toLowerCase());
    if (!product) {
      anomalies.push({
        id: `request-${request.id}`,
        title: `${request.urun} için stok eşleşmesi yok`,
        description: `${request.musteri} talebi sisteme kaydedildi ancak ilgili ürün stok verisi bulunamadı.`,
        severity: 'yuksek',
        category: 'Talep',
        source: 'Talep Analizi',
        recommendation: 'Ürün adı koşullarını kontrol edin ve depo kaydını güncelleyin.'
      });
      return;
    }

    const pct = normalizePercentage(product.mevcut_kg, product.kapasite_kg);
    if (pct <= 35) {
      anomalies.push({
        id: `request-stock-${request.id}`,
        title: `${request.urun} için talep açığı`,
        description: `${request.musteri} talebi için mevcut stok yalnızca ${pct}% seviyesinde. Dağıtım planını tekrar değerlendirin.`,
        severity: 'yuksek',
        category: 'Talep',
        source: 'Talep vs Stok',
        recommendation: 'Alternatif üreticiler veya hızlı tedarik kanalı kullanın.'
      });
    }
  });

  aiLogs
    .filter(log => log.tip?.toLowerCase() === 'anomali' || log.kategori?.toLowerCase() === 'depo')
    .forEach((log) => {
      anomalies.push({
        id: `ai-${log.id}`,
        title: log.baslik,
        description: log.mesaj || log.detay_ne || 'Yapay zeka tarafından kritik anomali tespit edildi.',
        severity: 'kritik',
        category: 'AI Tespiti',
        source: 'AI Görüşü',
        recommendation: 'Olayı kontrol edin ve gerekirse depo operasyonunu biçimlendirin.'
      });
    });

  stkAlerts.forEach((alert) => {
    const cards = parseKardesler(alert.kardesler);
    const line = cards.length ? `Kardeş üreticiler: ${cards.map((c: any) => c.ad).join(', ')}.` : '';
    anomalies.push({
      id: `stk-${alert.id}`,
      title: `${alert.urun} için STK risk uyarısı`,
      description: `${alert.emoji} ${alert.urun} için ${alert.kalan_gun_mesaj}. ${line}`.trim(),
      severity: 'yuksek',
      category: 'STK',
      source: 'STK İzleme',
      recommendation: 'Riskli ürünü hızlıca kardeş üretici ile eşleştirin.'
    });
  });

  return anomalies.sort((a, b) => {
    const order = { kritik: 0, yuksek: 1, orta: 2, bilgi: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export default function AnomaliPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('anomali');
  const [showNotif, setShowNotif] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  const summary = useMemo(() => ({
    total: anomalies.length,
    kritik: anomalies.filter(a => a.severity === 'kritik').length,
    yuksek: anomalies.filter(a => a.severity === 'yuksek').length,
    orta: anomalies.filter(a => a.severity === 'orta').length,
  }), [anomalies]);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()).catch(() => []),
      fetch('/api/requests').then(res => res.json()).catch(() => []),
      fetch('/api/ai-logs').then(res => res.json()).catch(() => []),
      fetch('/api/stk-alerts').then(res => res.json()).catch(() => []),
    ]).then(([products, requests, aiLogs, stkAlerts]) => {
      const productList = Array.isArray(products) ? products : [];
      const requestList = Array.isArray(requests) ? requests : [];
      const aiLogList = Array.isArray(aiLogs) ? aiLogs : [];
      const stkAlertList = Array.isArray(stkAlerts) ? stkAlerts : [];
      setAnomalies(detectAnomalies(productList, requestList, aiLogList, stkAlertList));
    }).finally(() => setLoading(false));
  }, []);

  const navClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

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
            <div key={item.id} className={`nav-item${activeNav === item.id ? ' active' : ''}`} onClick={() => navClick(item)} id={`nav-${item.id}`}>
              <Icon d={icons[item.icon]} size={17} />
              <span className="nav-item-label">{item.label}</span>
              {activeNav === item.id && <Icon d={icons.chevron} size={14} />}
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

      <main className="main">
        <header className="header">
          <div className="header-coop-title">
            <span className="header-coop-icon">⚠️</span>
            <div>
              <h1 className="header-coop-name">Anomali Yönetimi</h1>
              <p className="header-coop-sub">AI tabanlı anomali analizleri ile öncelikli risklerinizi görün</p>
            </div>
          </div>
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input type="text" placeholder="Anomali, ürün veya kategori ara…" />
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} id="notif-btn">
                <Icon d={icons.bell} size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="anomali-summary-grid">
            <div className="summary-card critical">
              <span>Toplam Anomali</span>
              <strong>{loading ? '...' : summary.total}</strong>
            </div>
            <div className="summary-card warning">
              <span>Kritik Seviye</span>
              <strong>{loading ? '...' : summary.kritik}</strong>
            </div>
            <div className="summary-card alert">
              <span>Yüksek Risk</span>
              <strong>{loading ? '...' : summary.yuksek}</strong>
            </div>
            <div className="summary-card normal">
              <span>Orta Risk</span>
              <strong>{loading ? '...' : summary.orta}</strong>
            </div>
          </div>

          <section className="anomali-panel">
            <div className="panel-header anomaly-header">
              <Icon d={icons.alert} size={18} />
              <h3>AI Destekli Anomali Tespiti</h3>
              <span className="panel-badge red">Otomasyon</span>
            </div>
            <div className="anomaly-description">
              <p>Depo, talep ve STK verilerini bir arada analiz ederek öncelikli riskleri listeliyoruz. Bu sayfada kritik alarmlar, talep eşleşme sorunları ve yapay zeka tarafından tespit edilen anomali kayıtları bulunuyor.</p>
            </div>
            <div className="anomaly-list">
              {loading && <div className="anomali-loading">Veri yükleniyor...</div>}
              {!loading && anomalies.length === 0 && <div className="anomali-empty">Şu anda kritik anomali tespiti yok.</div>}
              {!loading && anomalies.map(anomaly => (
                <div key={anomaly.id} className={`anomaly-card ${anomaly.severity}`}>
                  <div className="anomaly-card-top">
                    <div>
                      <strong>{anomaly.title}</strong>
                      <p>{anomaly.category} · {anomaly.source}</p>
                    </div>
                    <span className={`anomaly-pill ${anomaly.severity}`}>{anomaly.severity.toUpperCase()}</span>
                  </div>
                  <p className="anomaly-description-text">{anomaly.description}</p>
                  <div className="anomaly-footer">
                    <span>Öneri:</span>
                    <p>{anomaly.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
