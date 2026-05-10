// TALEPLER PAGE

function TaleplerPage() {
  return (
    <div className="page" data-screen-label="04 Talepler">
      <PageHead
        title="Talepler"
        lede="Talep dalgalanması, STK risk listesi ve kardeş üretici eşleşmeleri."
        actions={<>
          <button className="btn"><I.Calendar size={14}/> Bu hafta</button>
          <button className="btn"><I.Filter size={14}/> Filtre</button>
          <button className="btn primary"><I.Plus size={14}/> Yeni talep</button>
        </>}
      />

      <div className="demand-split">
        {/* === LEFT: Producer reasons / needs analysis === */}
        <div className="col gap-12">
          <div className="card">
            <div className="card-head">
              <div className="title">Üretici sebepleri</div>
              <span className="chip">analiz</span>
            </div>
            <div className="card-body" style={{padding:"4px 16px 12px"}}>
              <ReasonRow icon="↑" tone="good" label="Hatice Aksoy"
                meta="Sera hasadı +35%, 2 gün depolama kapasitesi"
                tag="biber fazlası"/>
              <ReasonRow icon="↓" tone="warn" label="Sevim Demirkan"
                meta="Yeni hasat 12 gün ileride, mevcut stok düşük"
                tag="kayısı yetersiz"/>
              <ReasonRow icon="↑" tone="good" label="Zeynep Çiftçioğlu"
                meta="Soğuk hava deposu boş, sevkiyat hazır"
                tag="domates hazır"/>
              <ReasonRow icon="↓" tone="danger" label="Fadime Yılmaz"
                meta="Don zararı raporu, 18 saat içinde tahmin yenilenecek"
                tag="incir riski"/>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="title">Atanacak depo görevleri</div>
              <span className="chip warn">3 bekliyor</span>
            </div>
            <div className="card-body" style={{padding:"6px 12px 12px"}}>
              <DeliveryTask name="60 kg sivri biber → T-2410" who="Sevda K." status="aktif"/>
              <DeliveryTask name="180 kg domates → Kadıköy" who="Atanmadı" status="bekliyor"/>
              <DeliveryTask name="23 kg domates → Naciye Hn." who="Onay bekleniyor" status="kardeş"/>
              <DeliveryTask name="14 kg incir → Nurten Hn."  who="Onay bekleniyor" status="kardeş"/>
            </div>
          </div>
        </div>

        {/* === RIGHT MAIN === */}
        <div className="col gap-16">
          {/* TOP: increasing / decreasing */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
            <div className="card">
              <div className="card-head">
                <div className="title"><I.ArrowUp size={14} style={{color:"var(--good)"}}/> Artan talepler</div>
                <span className="chip good">+18% ortalama</span>
              </div>
              <div className="card-body" style={{padding:"4px 16px 12px"}}>
                {MOCK.trendsUp.map((t,i)=>(
                  <div key={i} className="trend-row">
                    <div>
                      <div className="name">{t.name}</div>
                      <div className="ts">{t.note}</div>
                    </div>
                    <Sparkline data={[2,3,3,4,5,5,6]} hi={6} w={56}/>
                    <div className="delta up">{t.delta}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="title"><I.ArrowDown size={14} style={{color:"var(--danger)"}}/> Azalan talepler</div>
                <span className="chip danger">-10% ortalama</span>
              </div>
              <div className="card-body" style={{padding:"4px 16px 12px"}}>
                {MOCK.trendsDown.map((t,i)=>(
                  <div key={i} className="trend-row">
                    <div>
                      <div className="name">{t.name}</div>
                      <div className="ts">{t.note}</div>
                    </div>
                    <Sparkline data={[6,5,5,4,3,3,2]} hi={6} w={56}/>
                    <div className="delta down">{t.delta}</div>
                  </div>
                ))}
                <div className="row-actionable" style={{marginTop:6, color:"var(--ink-3)", fontSize:12.5}}>
                  Tümünü görüntüle <I.Arrow size={12}/>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: Sister producer matches (waste prevention) */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="title"><I.Heart size={14}/> Kardeş üretici eşleşmeleri <span className="chip accent">STK riski</span></div>
                <div className="sub">Son tüketim tarihi yaklaşan ürünler için israf önleme zinciri</div>
              </div>
              <div className="see-all">Üreticiler sayfası <I.Arrow size={12}/></div>
            </div>
            <div className="card-body" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              {MOCK.matches.map((m,i)=>(
                <div key={i} className="match-card">
                  <div className="src">
                    <div className="lbl">Kaynak · depo</div>
                    <div className="medium" style={{fontSize:13.5}}>{m.src}</div>
                    <div className="muted small mt-4">{m.flow}</div>
                  </div>
                  <div className="arrow"><I.Arrow size={20}/></div>
                  <div className="dst">
                    <div className="lbl">Kardeş üretici</div>
                    <div className="medium" style={{fontSize:13.5}}>{m.dst}</div>
                    <div className="mt-4 flex gap-6 center">
                      <span className="chip good">+{m.saving}</span>
                      <span className={`chip ${m.status==='eşleşti'?'good':m.status==='onay bekliyor'?'warn':'olive'}`}>{m.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-body" style={{borderTop:"1px solid var(--line)", paddingTop:12, display:"flex", gap:10, alignItems:"center"}}>
              <I.Sparkle size={14}/>
              <span className="small muted">AI öneri: bu dönemde toplam <strong style={{color:"var(--ink)"}}>~₺7.480</strong> ciro/israf önleme potansiyeli var.</span>
              <button className="btn sm primary" style={{marginLeft:"auto"}}>Tümünü onayla</button>
            </div>
          </div>

          {/* Today's demands list */}
          <div className="card">
            <div className="card-head">
              <div className="title">Bugünün talepleri</div>
              <div className="see-all">Tablo görünümü <I.Arrow size={12}/></div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>Müşteri</th><th>Ürün</th><th>Miktar</th><th>ETA</th><th>Durum</th><th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK.demands.map(d => (
                  <tr key={d.id}>
                    <td className="mono muted">{d.id}</td>
                    <td className="medium">{d.customer}</td>
                    <td>{d.product}</td>
                    <td className="mono">{d.qty}</td>
                    <td>{d.eta}</td>
                    <td>
                      <span className={`chip ${d.urgency==='urgent'?'danger':d.urgency==='warn'?'warn':'good'}`}>{d.status}</span>
                    </td>
                    <td><I.More size={14} style={{color:"var(--ink-3)"}}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasonRow({ icon, tone, label, meta, tag }) {
  const color = tone==='good' ? 'var(--good)' : tone==='warn' ? 'var(--warn)' : 'var(--danger)';
  const bg    = tone==='good' ? 'var(--good-soft)' : tone==='warn' ? 'var(--warn-soft)' : 'var(--danger-soft)';
  return (
    <div style={{display:"flex", gap:10, padding:"10px 0", borderBottom:"1px dashed var(--line)"}}>
      <div style={{width:22, height:22, borderRadius:6, background:bg, color:color, display:"grid", placeItems:"center", fontWeight:700, fontSize:12, flexShrink:0, marginTop:1}}>{icon}</div>
      <div style={{flex:1, minWidth:0}}>
        <div className="medium" style={{fontSize:13}}>{label}</div>
        <div className="muted small mt-4" style={{lineHeight:1.4}}>{meta}</div>
        <span className={`chip ${tone==='good'?'good':tone==='warn'?'warn':'danger'}`} style={{marginTop:6}}>{tag}</span>
      </div>
    </div>
  );
}

function DeliveryTask({ name, who, status }) {
  const cls = status==='aktif' ? 'good' : status==='kardeş' ? 'accent' : 'warn';
  return (
    <div className="row-actionable" style={{padding:"8px 0", borderBottom:"1px dashed var(--line)"}}>
      <div style={{minWidth:0, flex:1}}>
        <div className="label" style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{name}</div>
        <div className="meta">{who}</div>
      </div>
      <span className={`chip ${cls}`}>{status}</span>
    </div>
  );
}

window.TaleplerPage = TaleplerPage;
