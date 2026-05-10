// DASHBOARD PAGE

function Dashboard({ go }) {
  return (
    <div className="page" data-screen-label="02 Dashboard">
      <PageHead
        title="Genel Bakış"
        lede="Bugün öne çıkanlar — depo aciliyetleri, açık talepler ve önerilen üreticiler."
        actions={<>
          <button className="btn"><I.Calendar size={14}/> Bugün</button>
          <button className="btn"><I.Filter size={14}/> Filtre</button>
          <button className="btn primary"><I.Plus size={14}/> Yeni talep</button>
        </>}
      />

      <KpiStrip />

      <div className="three-col">
        <DashColumn
          title="Depo"
          subtitle="Aciliyet sırasına göre tedarik gerekenler"
          chip={{label:"3 acil", cls:"danger"}}
          onTitleClick={()=>go('depo')}
        >
          {MOCK.stock.slice(0,3).map((p,i)=>{
            const pct = Math.round((p.current/p.capacity)*100);
            const tier = pct < 15 ? 'urgent' : pct < 30 ? 'warn' : 'good';
            return (
              <div key={p.id} className={`tile-row ${tier}`} onClick={()=>go('depo')}>
                <div className="lead">{i+1}</div>
                <div className="main">
                  <div className="name">{p.name}
                    {tier==='urgent' && <span className="chip danger">kritik</span>}
                    {tier==='warn'   && <span className="chip warn">düşük</span>}
                  </div>
                  <div className="meta">
                    <span className="mono">%{pct}</span>
                    <span>·</span>
                    <span>SKT {p.expiresIn} gün</span>
                    <span>·</span>
                    <span>{p.supplier}</span>
                  </div>
                  <div className="bar" style={{marginTop:8}}>
                    <i style={{width: `${pct}%`, background: tier==='urgent'?'var(--danger)':tier==='warn'?'var(--warn)':'var(--good)'}}/>
                  </div>
                </div>
                <div className="right">
                  <div className="v tnum">{p.current}</div>
                  <div className="vs">/{p.capacity} {p.unit}</div>
                </div>
              </div>
            );
          })}
        </DashColumn>

        <DashColumn
          title="Talepler"
          subtitle="Bugünün açık talepleri"
          chip={{label:"5 aktif", cls:"accent"}}
          onTitleClick={()=>go('talepler')}
        >
          {MOCK.demands.slice(0,3).map((d,i)=>(
            <div key={d.id} className={`tile-row ${d.urgency}`} onClick={()=>go('talepler')}>
              <div className="lead mono">{d.id.slice(-2)}</div>
              <div className="main">
                <div className="name">{d.customer}</div>
                <div className="meta">
                  <span>{d.product}</span><span>·</span>
                  <span className="mono">{d.qty}</span><span>·</span>
                  <span><I.Clock size={11} style={{verticalAlign:-2}}/> {d.eta}</span>
                </div>
              </div>
              <div className="right">
                <span className={`chip ${d.urgency==='urgent'?'danger':d.urgency==='warn'?'warn':'good'}`}>{d.status}</span>
              </div>
            </div>
          ))}
        </DashColumn>

        <DashColumn
          title="Üreticiler"
          subtitle="Bu talebe uygun üreticiler"
          chip={{label:"6 hazır", cls:"olive"}}
          onTitleClick={()=>go('ureticiler')}
        >
          {MOCK.producers.slice(0,3).map((p,i)=>(
            <div key={p.name} className="tile-row" onClick={()=>go('ureticiler')}>
              <div className="lead" style={{background:"var(--olive-soft)", color:"var(--olive-ink)"}}>{p.init}</div>
              <div className="main">
                <div className="name">{p.name}</div>
                <div className="meta">
                  <span>{p.loc}</span><span>·</span>
                  <span><I.Truck size={11} style={{verticalAlign:-2}}/> {p.lead}</span>
                </div>
                <div style={{display:"flex", gap:4, marginTop:6}}>
                  {p.tags.map(t => <span key={t} className="chip">{t}</span>)}
                </div>
              </div>
              <div className="right">
                <div className="v tnum">{p.rate}<small>%</small></div>
                <div className="vs">uyum</div>
              </div>
            </div>
          ))}
        </DashColumn>
      </div>

      {/* === LOWER SCROLL SECTIONS === */}
      <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16, marginTop:24}}>
        <YesterdayCard/>
        <TodayTasksCard/>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1.2fr", gap:16, marginTop:16}}>
        <AILogsCard go={go}/>
        <AISummaryCard/>
      </div>
    </div>
  );
}

function DashColumn({ title, subtitle, chip, children, onTitleClick }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="col-header-link" onClick={onTitleClick} style={{flex:1}}>
          <div>
            <div className="title">{title} {chip && <span className={`chip ${chip.cls}`}>{chip.label}</span>}</div>
            <div className="sub">{subtitle}</div>
          </div>
          <div className="arrow"><I.Arrow size={14}/></div>
        </div>
      </div>
      <div className="card-body" style={{padding:"4px 16px 12px"}}>
        {children}
        <div className="see-all" style={{paddingTop:10, marginTop:6, borderTop:"1px solid var(--line)"}} onClick={onTitleClick}>
          Tümünü görüntüle <I.Arrow size={12}/>
        </div>
      </div>
    </div>
  );
}

function KpiStrip() {
  const k = [
    { l:"Açık talepler",    v:"24",      s:"+3", up:true,  spark:[2,3,2,4,3,5,4] },
    { l:"Stok aciliyeti",    v:"3",       s:"kritik", danger:true, spark:[1,1,2,2,3,3,3] },
    { l:"Müsait personel",   v:"3 / 5",   s:"%60", spark:[3,4,3,3,4,3,3] },
    { l:"Önlenen israf",     v:"184 kg",  s:"+22%", up:true, spark:[1,2,2,3,3,4,5] },
  ];
  return (
    <div className="kpi-strip">
      {k.map((x,i)=>(
        <div key={i} className="kpi">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
            <div>
              <div className="l">{x.l}</div>
              <div className="v">{x.v}</div>
            </div>
            <Sparkline data={x.spark} hi={x.spark.length-1}/>
          </div>
          <div className="s">
            {x.danger ? <span style={{color:"var(--danger)"}}>● {x.s}</span> :
             x.up ? <span className="delta up">↑ {x.s}</span> : <span>{x.s}</span>}
            <span style={{marginLeft:"auto"}}>7g</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function YesterdayCard() {
  const y = MOCK.yesterdaySummary;
  return (
    <div className="card">
      <div className="card-head">
        <div className="title">Dünün özeti <span className="chip">9 May</span></div>
        <div className="see-all">Detaylı rapor <I.Arrow size={12}/></div>
      </div>
      <div className="card-body">
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14}}>
          <YStat l="Karşılanan"    v={y.fulfilled} sub="talep"     tone="good"/>
          <YStat l="Geciken"        v={y.late}       sub="talep"   tone="warn"/>
          <YStat l="İptal"          v={y.canceled}   sub="talep"   tone="danger"/>
          <YStat l="Ciro"           v={y.revenue}    sub="brüt"/>
        </div>
        <div className="muted small">{y.notes} En çok hareket gören ürün: <span className="medium" style={{color:"var(--ink)"}}>{y.topProduct}</span>.</div>
      </div>
    </div>
  );
}

function YStat({ l, v, sub, tone }) {
  const color = tone==='good' ? 'var(--good)' : tone==='warn' ? 'var(--warn)' : tone==='danger' ? 'var(--danger)' : 'var(--ink)';
  return (
    <div style={{padding:"12px 14px", background:"var(--bg-soft)", borderRadius:8}}>
      <div className="xsmall muted" style={{textTransform:"uppercase", letterSpacing:".05em"}}>{l}</div>
      <div className="mono" style={{fontSize:22, color, marginTop:2}}>{v}</div>
      <div className="xsmall muted">{sub}</div>
    </div>
  );
}

function TodayTasksCard() {
  return (
    <div className="card">
      <div className="card-head">
        <div className="title">Bugün yapılması gerekenler <span className="chip">{MOCK.todayTasks.filter(t=>!t.done).length} açık</span></div>
        <div className="see-all">Listeye git <I.Arrow size={12}/></div>
      </div>
      <div className="card-body" style={{padding:"4px 16px 14px"}}>
        {MOCK.todayTasks.slice(0,5).map((t,i)=>(
          <div key={i} className={`task-row ${t.done ? 'done' : ''}`}>
            <div className="check"/>
            <div className="body">
              <div>{t.title}</div>
              <div className="meta">{t.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AILogsCard({ go }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="title"><I.Sparkle size={14}/> AI Logs <span className="chip ink">son 2 saat</span></div>
        <div className="see-all" onClick={()=>go('ai-logs')}>Hepsini gör <I.Arrow size={12}/></div>
      </div>
      <div className="card-body" style={{padding:"4px 0"}}>
        {MOCK.aiLogs.slice(0,3).map((l,i)=>(
          <div key={i} className="log-row" style={{padding:"12px 16px"}}>
            <div className="ts">{l.time}</div>
            <div className="ic"><I.Sparkle size={12}/></div>
            <div>
              <div className="ttl">{l.title}</div>
              <div className="why">{l.why}</div>
            </div>
            <div className="status-col">
              <span className={`chip ${l.status==='hazır'?'good':l.status==='onay'?'warn':'olive'}`}>{l.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AISummaryCard() {
  return (
    <div className="card" style={{background:"linear-gradient(180deg, var(--bg-elev), var(--bg))"}}>
      <div className="card-head">
        <div className="title"><I.Sparkle size={14}/> AI özet · gidişat</div>
        <span className="chip olive">otomatik · 09:55</span>
      </div>
      <div className="card-body">
        <p className="ai-paragraph" style={{margin:0}}>
          Bugün <mark>3 ürün kritik stok</mark> seviyesinde — özellikle <strong>incir</strong> 18 saatlik
          rezervde ve Fadime Hn. ile sipariş açılması <mark className="ai-mark-warn">öncelikli</mark>.
          Talep tarafında <strong>çilek</strong> mevsimsel olmayan <mark className="ai-mark-warn">+%44</mark> sapma gösteriyor;
          Ayşe Hn.'nin Mersin tedariği genişletilebilir. Son tüketim tarihi yaklaşan
          <strong> 23 kg domates</strong> ve <strong>14 kg incir</strong>, kardeş üreticiler
          <strong> Naciye Hn.</strong> ve <strong>Nurten Hn.</strong> ile eşleştirilirse
          <mark className="ai-mark-good">~₺3.820 israf önlenebilir</mark>.
          Sevkiyat tarafında 16:00'da iki çakışma var; Hatice Aslan molada olduğu için
          AI tarafından T-2410 görevi <strong>Sevda Korkmaz</strong>'a yeniden atandı.
        </p>
        <div style={{display:"flex", gap:8, marginTop:14, flexWrap:"wrap"}}>
          <button className="btn sm"><I.Check size={12}/> Önerileri uygula</button>
          <button className="btn sm ghost">Detaylı rapor</button>
          <button className="btn sm ghost">Bana sor</button>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
