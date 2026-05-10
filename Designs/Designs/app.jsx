// Main app — routing, login state, tweaks

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "accent": "#b3553a",
  "density": "comfortable"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ["#b3553a", "#6a7a3a", "#1f5e6e", "#8a3d6b"];

function App() {
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem('coopnet:authed') === '1';
  });
  const [route, setRoute] = useState(() => localStorage.getItem('coopnet:route') || 'dashboard');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => { localStorage.setItem('coopnet:authed', authed ? '1' : '0'); }, [authed]);
  useEffect(() => { localStorage.setItem('coopnet:route', route); }, [route]);

  // apply theme + accent
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme === 'slate' ? 'slate' : 'warm');
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    // derive accent-soft via mix
    const soft = mixWithWhite(tweaks.accent, 0.78);
    const ink  = mixWithBlack(tweaks.accent, 0.55);
    document.documentElement.style.setProperty('--accent-soft', soft);
    document.documentElement.style.setProperty('--accent-ink', ink);
  }, [tweaks.theme, tweaks.accent]);

  const navTitle = (NAV.find(n => n.id===route) || {label:'Genel Bakış'}).label;

  const PAGES = {
    dashboard:  <Dashboard go={setRoute}/>,
    depo:       <DepoPage/>,
    talepler:   <TaleplerPage/>,
    ureticiler: <UreticilerPage/>,
    finans:     <FinansPage/>,
    anomali:    <AnomaliPage/>,
    "ai-rapor": <AIRaporPage/>,
    "ai-logs":  <AILogsPage/>,
  };

  if (!authed) return (
    <>
      <LoginPage onLogin={() => setAuthed(true)} />
      <CoopTweaks tweaks={tweaks} setTweak={setTweak} />
    </>
  );

  return (
    <>
      <div className="app" data-density={tweaks.density}>
        <Sidebar route={route} setRoute={setRoute} />
        <div className="main">
          <Topbar title={navTitle} onLogout={() => setAuthed(false)} />
          {PAGES[route] || PAGES.dashboard}
        </div>
      </div>
      <CoopTweaks tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}

function CoopTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Tema">
        <TweakRadio label="Mod" value={tweaks.theme} onChange={(v)=>setTweak('theme', v)}
          options={[{value:'warm', label:'Sıcak krem'},{value:'slate', label:'Soğuk gri'}]}/>
      </TweakSection>
      <TweakSection title="Vurgu rengi">
        <TweakColor label="Accent" value={tweaks.accent} onChange={(v)=>setTweak('accent', v)}
          options={ACCENT_OPTIONS}/>
      </TweakSection>
      <TweakSection title="Yoğunluk">
        <TweakRadio label="Density" value={tweaks.density} onChange={(v)=>setTweak('density', v)}
          options={[{value:'compact', label:'Sıkı'},{value:'comfortable', label:'Rahat'}]}/>
      </TweakSection>
    </TweaksPanel>
  );
}

// ----- color helpers -----
function hexToRgb(h){ const x=h.replace('#',''); const n=parseInt(x.length===3?x.split('').map(c=>c+c).join(''):x,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join(''); }
function mixWithWhite(hex,t){ const [r,g,b]=hexToRgb(hex); return rgbToHex(r+(255-r)*t,g+(255-g)*t,b+(255-b)*t); }
function mixWithBlack(hex,t){ const [r,g,b]=hexToRgb(hex); return rgbToHex(r*(1-t),g*(1-t),b*(1-t)); }

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
