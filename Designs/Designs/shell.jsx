// CoopNet shell — Sidebar + Topbar + Page wrapper

const NAV = [
  { id:"dashboard",  label:"Genel Bakış",        icon:"Chart" },
  { id:"depo",       label:"Depo",                icon:"Box",     count:"8" },
  { id:"talepler",   label:"Talepler",            icon:"Inbox",   count:"5" },
  { id:"ureticiler", label:"Üreticiler",          icon:"Users" },
  { id:"finans",     label:"Finansal Raporlar",   icon:"Logs" },
  { id:"anomali",    label:"Anomali",             icon:"Alert",   dot:true },
  { id:"ai-rapor",   label:"AI Raporları",        icon:"Sparkle" },
  { id:"ai-logs",    label:"AI Logs",             icon:"Logs" },
];

function Sidebar({ route, setRoute }) {
  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="brand">
        <div className="brand-mark">ÜK</div>
        <div>
          <div className="brand-text">CoopNet</div>
          <div className="brand-sub">Üreten Kadınlar</div>
        </div>
      </div>

      <div className="nav-section">Operasyon</div>
      {NAV.slice(0,5).map(n => (
        <NavItem key={n.id} item={n} active={route===n.id} onClick={()=>setRoute(n.id)} />
      ))}

      <div className="nav-section">Zekâ</div>
      {NAV.slice(5).map(n => (
        <NavItem key={n.id} item={n} active={route===n.id} onClick={()=>setRoute(n.id)} />
      ))}

      <div className="footer">
        <div className="avatar">AD</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>Aslı Demir</div>
          <div style={{fontSize:11, color:"var(--ink-3)"}}>Yönetici</div>
        </div>
        <button className="icon-btn" style={{marginLeft:"auto", width:28, height:28}} title="Ayarlar"><I.Settings size={14}/></button>
      </div>
    </aside>
  );
}

function NavItem({ item, active, onClick }) {
  const IconC = I[item.icon];
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <IconC className="nav-icon" />
      <span>{item.label}</span>
      {item.count && <span className="nav-count">{item.count}</span>}
      {item.dot && <span className="dot"/>}
    </div>
  );
}

function Topbar({ title, crumb, onLogout }) {
  return (
    <header className="topbar">
      <h1>
        <span className="crumb">{MOCK.cooperative}</span>
        <span className="sep">/</span>
        <span>{title}</span>
      </h1>
      <div className="search">
        <I.Search size={14}/>
        <input placeholder="Ürün, talep, üretici ara..." />
        <span className="kbd">⌘K</span>
      </div>
      <div className="top-actions">
        <button className="icon-btn icon-btn-wrap" title="Bildirimler">
          <I.Bell size={16}/>
          <span className="badge"/>
        </button>
        <button className="icon-btn" title="Yenile"><I.RefreshCw size={16}/></button>
        <button className="icon-btn" title="Çıkış" onClick={onLogout}><I.X size={16}/></button>
      </div>
    </header>
  );
}

function PageHead({ title, lede, actions }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {lede && <div className="lede">{lede}</div>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

function Sparkline({ data, hi=null, w=64, h=24 }) {
  const max = Math.max(...data);
  return (
    <div className="spark" style={{width:w, height:h}}>
      {data.map((v,i)=>(
        <i key={i} className={hi===i ? 'hi' : ''} style={{height: `${(v/max)*100}%`}}/>
      ))}
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, PageHead, Sparkline, NAV });
