// FİNANSAL RAPORLAR + ANOMALİ — lighter pages to round out the sidebar

function FinansPage() {
  return (
    <div className="page" data-screen-label="08 Finans">
      <PageHead title="Finansal Raporlar" lede="Aylık ciro, üretici ödemeleri ve kardeş üretici akışı."
        actions={<><button className="btn"><I.Calendar size={14}/> Mayıs 2026</button><button className="btn primary"><I.Download size={14}/> PDF</button></>}/>

      <div className="kpi-strip" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        {[
          {l:"Aylık ciro", v:"₺612K", s:"+8% (Nis)", up:true, spark:[3,3,4,4,5,5,6]},
          {l:"Açık fatura", v:"₺38.2K", s:"6 belge", spark:[2,3,3,2,2,3,3]},
          {l:"Üretici ödemeleri", v:"₺214K", s:"Bu ay", spark:[3,4,4,5,5,6,6]},
          {l:"Kardeş ciro", v:"₺6.4K", s:"+22%", up:true, spark:[1,2,2,3,4,4,5]},
        ].map((x,i)=>(
          <div key={i} className="kpi">
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <div><div className="l">{x.l}</div><div className="v">{x.v}</div></div>
              <Sparkline data={x.spark} hi={6}/>
            </div>
            <div className="s">{x.up ? <span className="delta up">↑ {x.s}</span> : x.s}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginTop:8}}>
        <div className="card">
          <div className="card-head"><div className="title">Mayıs gelir akışı</div><span className="chip">günlük</span></div>
          <div className="card-body" style={{height:280, display:"flex", alignItems:"flex-end", gap:4}}>
            {Array.from({length:30}).map((_,i)=>{
              const v = 30 + Math.sin(i*0.5)*15 + Math.random()*20;
              return <div key={i} style={{flex:1, height:`${v*1.5}%`, background: i===8 ? 'var(--accent)' : 'var(--olive)', opacity: i<9 ? 1 : .25, borderRadius:"3px 3px 0 0"}}/>;
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="title">Bekleyen ödemeler</div><span className="chip warn">6 belge</span></div>
          <table className="tbl">
            <thead><tr><th>Belge</th><th>Müşteri</th><th>Tutar</th><th>Vade</th></tr></thead>
            <tbody>
              {[
                ["F-2410","Şişli Restoran G.","₺8.420","2 gün"],
                ["F-2398","Beyoğlu Coop","₺5.180","5 gün"],
                ["F-2387","Ataşehir Catering","₺12.640","gecikti"],
                ["F-2381","Üsküdar Halk P.","₺4.220","8 gün"],
                ["F-2375","Kadıköy Pazar","₺7.760","11 gün"],
              ].map((r,i)=>(
                <tr key={i}>
                  <td className="mono muted">{r[0]}</td>
                  <td className="medium">{r[1]}</td>
                  <td className="mono">{r[2]}</td>
                  <td>{r[3]==='gecikti' ? <span className="chip danger">{r[3]}</span> : <span className="muted">{r[3]}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnomaliPage() {
  const items = [
    { sev:"danger", title:"Çilek talebinde +44% sapma", desc:"3 günlük ortalamaya kıyasla mevsimsel olmayan ani artış. Dış kaynak tetikleyici (basın haberi?) inceleniyor.", time:"Bugün · 08:30", source:"Talep modeli" },
    { sev:"warn",   title:"İncir tedarikinde gerileme", desc:"Aydın bölgesi don raporu, 2 üretici teslimat tarihi 36 saat geri çekti.", time:"Bugün · 07:55", source:"Üretici sinyali" },
    { sev:"warn",   title:"Sevkiyat çakışması", desc:"16:00 saatinde iki müşteriye paralel teslimat, depo ekibi yetersiz.", time:"Bugün · 09:12", source:"Operasyon" },
    { sev:"info",   title:"Yeni üretici başvurusu", desc:"Aydın Germencik bölgesinden 2 yeni üretici sözleşme talebi.", time:"Dün · 16:40", source:"CRM" },
  ];
  return (
    <div className="page" data-screen-label="09 Anomali">
      <PageHead title="Anomali" lede="Talep, tedarik, sevkiyat ve operasyon verisindeki anormallikler."
        actions={<><button className="btn"><I.Filter size={14}/> Önem</button><button className="btn primary"><I.Sparkle size={14}/> AI ile incele</button></>}/>

      <div className="col gap-10">
        {items.map((a,i)=>(
          <div key={i} className={`alert-card ${a.sev}`}>
            <div className="stripe"/>
            <div className="ic">
              {a.sev==='danger' ? <I.Alert size={16} style={{color:"var(--danger)"}}/> :
               a.sev==='warn'   ? <I.Clock size={16} style={{color:"var(--warn)"}}/> :
                                  <I.Sparkle size={16} style={{color:"var(--olive)"}}/>}
            </div>
            <div className="body">
              <div className="ttl">{a.title}</div>
              <div className="desc">{a.desc}</div>
              <div className="meta"><span>{a.source}</span><span>·</span><span className="mono">{a.time}</span></div>
            </div>
            <div className="acts">
              <button className="btn sm ghost">Yoksay</button>
              <button className="btn sm primary">İncele</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.FinansPage = FinansPage;
window.AnomaliPage = AnomaliPage;
