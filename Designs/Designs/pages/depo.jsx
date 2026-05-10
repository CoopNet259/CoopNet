// DEPO PAGE

function DepoPage() {
  // sort: urgent first, by stock %
  const sorted = [...MOCK.stock].sort((a,b)=>(a.current/a.capacity) - (b.current/b.capacity));
  const sortedStaff = [...MOCK.staff].sort((a,b)=>{
    const order = {on:0, brb:1, off:2};
    return order[a.status]-order[b.status];
  });

  return (
    <div className="page" data-screen-label="03 Depo">
      <PageHead
        title="Depo"
        lede="Stok seviyeleri, çalışan müsaitliği ve trend bazlı talep öngörüsü."
        actions={<>
          <button className="btn"><I.Download size={14}/> Dışa aktar</button>
          <button className="btn"><I.Filter size={14}/> Filtre</button>
          <button className="btn primary"><I.Plus size={14}/> Sipariş aç</button>
        </>}
      />

      <div className="depo-grid">
        {/* === STAFF (LEFT) === */}
        <div className="card" style={{position:"sticky", top:80}}>
          <div className="card-head">
            <div>
              <div className="title">Depo ekibi</div>
              <div className="sub">3 müsait · 2 izinli/molada</div>
            </div>
          </div>
          <div className="card-body" style={{padding:"6px"}}>
            {sortedStaff.map((s,i)=>(
              <div key={s.name} className={`staff-row ${s.status==='on'?'active':''} ${s.status==='off'?'away':''}`}>
                <div className="avatar sm" style={{
                  background: s.status==='on' ? 'var(--good-soft)' : s.status==='brb' ? 'var(--warn-soft)' : 'var(--bg-sunken)',
                  color: s.status==='on' ? 'var(--good)' : s.status==='brb' ? 'var(--warn)' : 'var(--ink-3)'
                }}>{s.initials}</div>
                <div style={{minWidth:0, flex:1}}>
                  <div className="name">{s.name}</div>
                  <div className="role">{s.role} · {s.shift}</div>
                </div>
                <div className="status">
                  <span className={`status-dot ${s.status}`}/>
                </div>
              </div>
            ))}
          </div>
          <div className="card-body" style={{borderTop:"1px solid var(--line)", paddingTop:12}}>
            <div className="xsmall muted" style={{textTransform:"uppercase", letterSpacing:".05em"}}>Aktif görevler</div>
            <div className="row-actionable" style={{padding:"8px 0", borderBottom:"1px dashed var(--line)"}}>
              <div>
                <div className="label">Sevda K. → T-2410</div>
                <div className="meta">60 kg sivri biber · 18:00</div>
              </div>
              <span className="chip warn">aktif</span>
            </div>
            <div className="row-actionable" style={{padding:"8px 0"}}>
              <div>
                <div className="label">Meryem Y. → Stok sayım</div>
                <div className="meta">Soğuk hava deposu</div>
              </div>
              <span className="chip">aktif</span>
            </div>
          </div>
        </div>

        {/* === PRODUCTS GRID (CENTER) === */}
        <div>
          <div className="flex between center mb-12">
            <div className="tab-strip">
              <button className="active">Tümü ({sorted.length})</button>
              <button>Sebze</button>
              <button>Meyve</button>
              <button>İşlenmiş</button>
            </div>
            <div className="muted small">Aciliyet sırasına göre</div>
          </div>

          <div className="products-grid">
            {sorted.map(p => <ProductCard key={p.id} p={p}/>)}
          </div>
        </div>

        {/* === AI TRENDS (RIGHT) === */}
        <div className="col gap-12" style={{position:"sticky", top:80}}>
          <div className="card">
            <div className="card-head">
              <div className="title"><I.Sparkle size={14}/> Mevsim & trend</div>
            </div>
            <div className="card-body">
              <div className="ai-paragraph small" style={{lineHeight:1.55}}>
                Mayıs ortası için <mark>çilek</mark> ve <mark>biber</mark> talebinde
                geçen yıla kıyasla artış bekleniyor. <mark className="ai-mark-good">Kayısı hasadı</mark> 12 gün içinde
                pik yapacak — Malatya tedariği ön planlamaya alınmalı.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="title">7 günlük öngörü</div>
            </div>
            <div className="card-body" style={{padding:"4px 14px 12px"}}>
              {[
                {n:"Çilek",  delta:"+34%", tone:"up"},
                {n:"Biber",  delta:"+22%", tone:"up"},
                {n:"Salça",  delta:"+18%", tone:"up"},
                {n:"İncir",  delta:"+12%", tone:"up"},
                {n:"Patlıcan",delta:"−8%", tone:"down"},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom: i<4 ? "1px dashed var(--line)" : "0"}}>
                  <span style={{fontSize:13}}>{r.n}</span>
                  <Sparkline data={[2,3,3,4,r.tone==='up'?5:2,r.tone==='up'?5:2,r.tone==='up'?6:1]} hi={6} w={48}/>
                  <span className={`mono ${r.tone==='up'?'':''}`} style={{fontSize:12.5, color: r.tone==='up'?'var(--good)':'var(--danger)'}}>{r.delta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{background:"var(--accent-soft)", border:"1px solid #e8c0ad"}}>
            <div className="card-body">
              <div className="bold" style={{color:"var(--accent-ink)", marginBottom:6}}>Yönetici uyarısı</div>
              <div className="small" style={{color:"var(--accent-ink)"}}>
                Önümüzdeki 72 saatte <strong>çilek + biber</strong> talebi mevcut stoğu aşacak.
                İki üreticiye ön sipariş açmanız öneriliyor.
              </div>
              <button className="btn sm accent mt-12"><I.Sparkle size={12}/> AI ile sipariş hazırla</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ p }) {
  const pct = Math.round((p.current/p.capacity)*100);
  const urgent = pct <= 25;
  const warn   = pct > 25 && pct <= 50;
  return (
    <div className={`product-card ${urgent ? 'urgent' : ''}`}>
      <div className="head">
        <div className="ico" style={{background: urgent ? 'var(--danger-soft)' : 'var(--bg-soft)'}}>{p.icon}</div>
        <div style={{minWidth:0, flex:1}}>
          <div className="name">{p.name}</div>
          <div className="sku">{p.sku} · {p.supplier}</div>
        </div>
        {urgent && <span className="chip danger dot">acil</span>}
        {warn && <span className="chip warn dot">düşük</span>}
        {!urgent && !warn && <span className="chip good dot">yeterli</span>}
      </div>
      <div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
          <div className="num">{p.current}<small>/ {p.capacity} {p.unit}</small></div>
          <div className="mono medium" style={{fontSize:13, color: urgent ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--good)'}}>%{pct}</div>
        </div>
        <div className={`bar ${urgent ? 'danger' : warn ? 'warn' : 'good'}`} style={{marginTop:6}}>
          <i style={{width:`${pct}%`}}/>
        </div>
      </div>
      <div className="foot">
        <span><I.Clock size={11} style={{verticalAlign:-2}}/> SKT {p.expiresIn} gün</span>
        <span style={{color: urgent ? 'var(--danger)' : 'var(--ink-3)'}}>
          {urgent ? "→ Sipariş aç" : "→ Detay"}
        </span>
      </div>
    </div>
  );
}

window.DepoPage = DepoPage;
