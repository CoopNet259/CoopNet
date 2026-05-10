// ÜRETİCİLER PAGE

function UreticilerPage() {
  const [tab, setTab] = React.useState('all');
  const matchByDemand = MOCK.producers.filter(p=>p.active);

  return (
    <div className="page" data-screen-label="05 Üreticiler">
      <PageHead
        title="Üreticiler"
        lede="Talep, sözleşmeli ve kardeş üreticilerin tek görünümü."
        actions={<>
          <button className="btn"><I.Download size={14}/> CSV</button>
          <button className="btn primary"><I.Plus size={14}/> Üretici ekle</button>
        </>}
      />

      <div className="tab-strip">
        <button className={tab==='all'?'active':''} onClick={()=>setTab('all')}>Talebe göre ({matchByDemand.length})</button>
        <button className={tab==='general'?'active':''} onClick={()=>setTab('general')}>Genel ({MOCK.producers.length})</button>
        <button className={tab==='sister'?'active':''} onClick={()=>setTab('sister')}>Kardeş ({MOCK.sisterProducers.length})</button>
      </div>

      {tab==='all' && (
        <Section title="Talebe göre üreticiler" sub="Bugünün açık talebine en uygun ilk eşleşmeler"
          chip={<span className="chip accent">{matchByDemand.length} eşleşme</span>}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:12}}>
            {matchByDemand.map(p => <ProducerCard key={p.name} p={p} matched/>)}
          </div>
        </Section>
      )}

      {tab==='general' && (
        <Section title="Genel üreticiler" sub="Kooperatifin düzenli çalıştığı tüm üreticiler">
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:12}}>
            {MOCK.producers.map(p => <ProducerCard key={p.name} p={p}/>)}
          </div>
        </Section>
      )}

      {tab==='sister' && (
        <Section title="Kardeş üreticiler" sub="İsraf önleme & ürün dönüşüm partnerleri"
          chip={<span className="chip olive">eşleşme zinciri</span>}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:12}}>
            {MOCK.sisterProducers.map(p => <SisterCard key={p.name} p={p}/>)}
          </div>
        </Section>
      )}

      {tab==='all' && (
        <>
          <Section title="Genel üreticiler" sub="Tüm aktif sözleşmeler" className="mt-28">
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:12}}>
              {MOCK.producers.map(p => <ProducerCard key={p.name} p={p}/>)}
            </div>
          </Section>

          <Section title="Kardeş üreticiler" sub="Karşılıklı destek & israf önleme" className="mt-28"
            chip={<span className="chip olive">{MOCK.sisterProducers.length} ortak</span>}>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:12}}>
              {MOCK.sisterProducers.map(p => <SisterCard key={p.name} p={p}/>)}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, sub, chip, children, className='' }) {
  return (
    <div className={className}>
      <div className="flex between center mb-12" style={{marginBottom:14}}>
        <div>
          <div className="h2" style={{display:"flex", gap:10, alignItems:"center"}}>{title} {chip}</div>
          <div className="muted small mt-4">{sub}</div>
        </div>
        <div className="see-all">Tümünü görüntüle <I.Arrow size={12}/></div>
      </div>
      {children}
    </div>
  );
}

function ProducerCard({ p, matched }) {
  return (
    <div className="producer-card">
      <div className="head">
        <div className="av">{p.init}</div>
        <div style={{flex:1, minWidth:0}}>
          <div className="name">{p.name}</div>
          <div className="loc"><I.Leaf size={11} style={{verticalAlign:-2}}/> {p.loc}</div>
        </div>
        {matched && <span className="chip accent">eşleşti</span>}
        {!p.active && !matched && <span className="chip">pasif</span>}
      </div>
      <div className="tags">
        {p.tags.map(t => <span key={t} className="chip olive">{t}</span>)}
      </div>
      <div className="stats">
        <div className="stat"><div className="v">{p.rate}%</div><div className="l">uyum</div></div>
        <div className="stat"><div className="v">{p.lead}</div><div className="l">teslim</div></div>
        <div className="stat"><div className="v" style={{fontSize:12}}>{p.capacity}</div><div className="l">kapasite</div></div>
      </div>
    </div>
  );
}

function SisterCard({ p }) {
  return (
    <div className="producer-card" style={{background:"linear-gradient(180deg, var(--accent-soft), var(--bg-elev))", borderColor:"#e8c0ad"}}>
      <div className="head">
        <div className="av" style={{background:"#fff", color:"var(--accent-ink)"}}>{p.init}</div>
        <div style={{flex:1, minWidth:0}}>
          <div className="name">{p.name}</div>
          <div className="loc"><I.Heart size={11} style={{verticalAlign:-2}}/> {p.loc}</div>
        </div>
        <span className="chip" style={{background:"#fff", color:"var(--accent-ink)"}}>kardeş</span>
      </div>
      <div className="muted small" style={{lineHeight:1.5}}>{p.desc}</div>
      <div className="tags">
        {p.tags.map(t => <span key={t} className="chip" style={{background:"#fff", color:"var(--accent-ink)"}}>{t}</span>)}
      </div>
      <div style={{padding:"8px 10px", background:"rgba(255,255,255,.5)", borderRadius:6, fontSize:11.5}}>
        <div className="xsmall" style={{color:"var(--accent-ink)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:2}}>Eşleşme</div>
        <div className="medium" style={{color:"var(--accent-ink)"}}>{p.match}</div>
      </div>
    </div>
  );
}

window.UreticilerPage = UreticilerPage;
