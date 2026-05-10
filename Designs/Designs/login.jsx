// LOGIN PAGE

function LoginPage({ onLogin }) {
  const [email, setEmail] = React.useState("asli.demir@uretenkadinlar.coop");
  const [pw, setPw] = React.useState("••••••••••");
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onLogin(); }, 600);
  };

  return (
    <div className="login-page" data-screen-label="01 Login">
      <div className="login-aside">
        <div className="mark">
          <div className="m">ÜK</div>
          <div>
            <div>CoopNet</div>
            <div style={{fontSize:11, color:"rgba(255,255,255,.55)", marginTop:1}}>Kooperatif Yönetim Paneli</div>
          </div>
        </div>

        <h2>Üretimi <em>kadınlar</em>, kararı veriler<br/>destekler.</h2>
        <div className="meta">
          <span>v4.2.1 · Mayıs 2026</span>
          <span>·</span>
          <span>14 üretici · 3 il</span>
          <span>·</span>
          <span>ISO 27001</span>
        </div>

        <div className="stat-strip">
          <div className="stat">
            <div className="v">184<span style={{fontSize:13, color:"rgba(255,255,255,.5)"}}> kg</span></div>
            <div className="l">Bu hafta önlenen israf</div>
          </div>
          <div className="stat">
            <div className="v">96<span style={{fontSize:13, color:"rgba(255,255,255,.5)"}}>%</span></div>
            <div className="l">Talep karşılama</div>
          </div>
          <div className="stat">
            <div className="v">₺48,6K</div>
            <div className="l">Dünkü ciro</div>
          </div>
        </div>
      </div>

      <div className="login-pane">
        <form className="login-card" onSubmit={submit}>
          <h3>Tekrar hoş geldiniz.</h3>
          <div className="sub">Kooperatif hesabınızla giriş yapın.</div>

          <label className="field">
            <span style={{display:"block", fontSize:12, fontWeight:500, color:"var(--ink-2)", marginBottom:6}}>E-posta</span>
            <div style={{position:"relative"}}>
              <I.Mail size={14} style={{position:"absolute", left:11, top:11, color:"var(--ink-3)"}}/>
              <input className="input" style={{paddingLeft:32}} value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </label>

          <label className="field">
            <span style={{display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:500, color:"var(--ink-2)", marginBottom:6}}>
              <span>Şifre</span>
              <a style={{color:"var(--ink-3)", fontWeight:400, cursor:"pointer"}}>Şifremi unuttum</a>
            </span>
            <div style={{position:"relative"}}>
              <I.Lock size={14} style={{position:"absolute", left:11, top:11, color:"var(--ink-3)"}}/>
              <input className="input" type="password" style={{paddingLeft:32, paddingRight:32}} value={pw} onChange={e=>setPw(e.target.value)} />
              <I.Eye size={14} style={{position:"absolute", right:11, top:11, color:"var(--ink-3)", cursor:"pointer"}}/>
            </div>
          </label>

          <div className="field-row">
            <label className="checkbox">
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
              <span className="box"/>
              <span>Beni hatırla</span>
            </label>
            <span className="mono" style={{fontSize:11}}>2FA · SMS</span>
          </div>

          <button className="btn primary" style={{width:"100%", justifyContent:"center", padding:"10px"}} disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
            {!loading && <I.Arrow size={14} style={{marginLeft:4}}/>}
          </button>

          <div className="login-foot">
            <span>Hesabınız yok mu? <a style={{color:"var(--ink)", fontWeight:500}}>Kooperatife başvur</a></span>
            <span>TR · v4.2.1</span>
          </div>
        </form>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;
