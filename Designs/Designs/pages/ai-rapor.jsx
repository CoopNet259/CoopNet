// AI RAPORLARI PAGE — quad layout

function AIRaporPage() {
  return (
    <div className="page" data-screen-label="06 AI Raporları">
      <PageHead
        title="AI Raporları"
        lede="Bugünün iş akışı, dünün özeti, haftalık performans ve gidişat önerileri."
        actions={<>
          <button className="btn"><I.Calendar size={14}/> 9 May</button>
          <button className="btn"><I.RefreshCw size={14}/> Yenile</button>
          <button className="btn primary"><I.Download size={14}/> PDF rapor</button>
        </>}
      />

      <div className="quad">
        {/* TOP-LEFT — Today */}
        <div className="card">
          <div className="card-head">
            <div className="title"><I.Check size={14}/> Bugün yapılacaklar</div>
            <span className="chip">{MOCK.todayTasks.filter(t=>!t.done).length} / {MOCK.todayTasks.length}</span>
          </div>
          <div className="card-body" style={{padding:"4px 16px 12px"}}>
            <div className="xsmall muted" style={{textTransform:"uppercase", letterSpacing:".05em", marginTop:6, marginBottom:4}}>İş akışı · sabah</div>
            {MOCK.todayTasks.slice(0,3).map((t,i)=>(
              <div key={i} className={`task-row ${t.done?'done':''}`}>
                <div className="check"/>
                <div className="body">
                  <div>{t.title}</div>
                  <div className="meta">{t.meta}</div>
                </div>
              </div>
            ))}
            <div className="xsmall muted" style={{textTransform:"uppercase", letterSpacing:".05em", marginTop:14, marginBottom:4}}>Öğleden sonra</div>
            {MOCK.todayTasks.slice(3).map((t,i)=>(
              <div key={i} className={`task-row ${t.done?'done':''}`}>
                <div className="check"/>
                <div className="body">
                  <div>{t.title}</div>
                  <div className="meta">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP-RIGHT — Yesterday */}
        <div className="card">
          <div className="card-head">
            <div className="title"><I.Clock size={14}/> Dünün raporu</div>
            <span className="chip">8 Mayıs · Çar</span>
          </div>
          <div className="card-body">
            <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:14}}>
              <YStat l="Karşılanan" v="18" sub="talep" tone="good"/>
              <YStat l="Geciken" v="2" sub="ort. 28 dk" tone="warn"/>
              <YStat l="Ciro" v="₺48.620" sub="brüt"/>
              <YStat l="İşlenen" v="142 kg" sub="9 ürün"/>
            </div>
            <div className="divider"/>
            <div className="h3 mb-12">Öne çıkanlar</div>
            <ul style={{margin:0, paddingLeft:18, fontSize:13, color:"var(--ink-2)", lineHeight:1.7}}>
              <li>En çok hareket gören ürün <strong>domates</strong> (320 kg).</li>
              <li>Sevkiyat performansı: zamanında %86, geciken 2 talep.</li>
              <li>1 talep iptal edildi (Üsküdar, ödeme sorunu).</li>
              <li>Yeni 2 üretici kayıt başvurusu Aydın bölgesinden.</li>
            </ul>
          </div>
        </div>

        {/* BOTTOM-LEFT — AI paragraph (gidişat) */}
        <div className="card" style={{background:"linear-gradient(180deg, #fff, var(--accent-soft) 220%)"}}>
          <div className="card-head">
            <div className="title"><I.Sparkle size={14}/> Gidişata göre · kısa AI özeti</div>
            <span className="chip olive">öneri</span>
          </div>
          <div className="card-body">
            <p className="ai-paragraph">
              Hafta ortasındayız ve operasyon <mark className="ai-mark-good">%96 karşılama</mark> oranıyla
              hedefin üzerinde gidiyor. Ancak <mark>incir + çilek</mark> için 72 saatlik bir tedarik
              boşluğu görünüyor — Fadime Hn. ile ön sipariş açılması ve Mersin'den ek çilek alımı
              <mark className="ai-mark-warn">öncelikli</mark>. <strong>Naciye</strong> ve <strong>Nurten Hn.</strong> ile
              kardeş üretici eşleşmeleri devreye alınırsa, mevcut SKT riski olan
              <strong> ~80 kg</strong> ürün israf yerine ciroya dönecek.
            </p>
            <div className="divider"/>
            <div className="h3 mb-12">Önerilen aksiyonlar</div>
            <div className="col gap-8">
              <RecRow tone="danger" t="Fadime Hn. ile incir siparişi" m="Tahmini 320 kg · 2 günlük lead"/>
              <RecRow tone="warn"   t="23 kg domates → Naciye Hn. salça" m="₺2.180 ciro / israf önleme"/>
              <RecRow tone="good"   t="Çilek talebi için Ayşe Hn. genişlet" m="+44% talep sapması algılandı"/>
            </div>
          </div>
        </div>

        {/* BOTTOM-RIGHT — Weekly */}
        <div className="card">
          <div className="card-head">
            <div className="title"><I.Chart size={14}/> Haftalık rapor</div>
            <span className="chip">3–9 May</span>
          </div>
          <div className="card-body">
            <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:14}}>
              <YStat l="Karşılama" v="96%" sub="hedef 92%" tone="good"/>
              <YStat l="Ort. lead" v="1.4g" sub="−0.3g" tone="good"/>
              <YStat l="Önlenen israf" v="184 kg" sub="₺6.420 değer" tone="good"/>
              <YStat l="Yeni üretici" v="2" sub="Aydın · Bursa"/>
            </div>
            <div className="h3 mb-12">Günlük talep</div>
            <div style={{display:"flex", alignItems:"flex-end", gap:6, height:80}}>
              {MOCK.weekly.sales.map((v,i)=>{
                const max = Math.max(...MOCK.weekly.sales);
                const labels = ['P','S','Ç','P','C','C','P'];
                return (
                  <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
                    <div style={{width:"100%", height: `${(v/max)*100}%`, background: i===6 ? 'var(--accent)' : 'var(--ink-4)', borderRadius:"4px 4px 0 0", opacity: i===6 ? 1 : .7}}/>
                    <div className="xsmall muted">{labels[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecRow({ tone, t, m }) {
  const cls = tone==='good' ? 'good' : tone==='warn' ? 'warn' : 'danger';
  return (
    <div className="row-actionable" style={{background:"var(--bg-elev)", border:"1px solid var(--line)"}}>
      <div style={{flex:1, minWidth:0}}>
        <div className="label">{t}</div>
        <div className="meta">{m}</div>
      </div>
      <span className={`chip ${cls}`}>{tone==='danger'?'acil':tone==='warn'?'yakın':'fırsat'}</span>
      <button className="btn sm ghost" style={{marginLeft:6}}><I.Arrow size={12}/></button>
    </div>
  );
}

window.AIRaporPage = AIRaporPage;
