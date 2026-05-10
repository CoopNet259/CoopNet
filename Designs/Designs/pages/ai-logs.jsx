// AI LOGS PAGE

function AILogsPage() {
  return (
    <div className="page" data-screen-label="07 AI Logs">
      <PageHead
        title="AI Logs"
        lede="İş akışı uyarıları ve yapay zekanın otomatik gerçekleştirdiği işlemlerin şeffaf kaydı."
        actions={<>
          <button className="btn"><I.Filter size={14}/> Filtre</button>
          <button className="btn"><I.Calendar size={14}/> Bugün</button>
          <button className="btn"><I.Download size={14}/> Dışa aktar</button>
        </>}
      />

      {/* === ALERTS (TOP) === */}
      <div className="flex between center mb-12">
        <div>
          <div className="h2"><I.Alert size={14} style={{verticalAlign:-2, color:"var(--danger)"}}/> Erken uyarı sistemi</div>
          <div className="muted small mt-4">İş akışını sekteye uğratabilecek riskli durumlar — depo, talep, üretici, finans, AI</div>
        </div>
        <div className="flex gap-6">
          <span className="chip danger">{MOCK.alerts.filter(a=>a.level==='danger').length} kritik</span>
          <span className="chip warn">{MOCK.alerts.filter(a=>a.level==='warn').length} uyarı</span>
          <span className="chip olive">{MOCK.alerts.filter(a=>a.level==='info').length} bilgi</span>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(420px, 1fr))", gap:10, marginBottom:28}}>
        {MOCK.alerts.map((a,i)=>(
          <div key={i} className={`alert-card ${a.level}`}>
            <div className="stripe"/>
            <div className="ic">
              {a.level==='danger' && <I.Alert size={16} style={{color:"var(--danger)"}}/>}
              {a.level==='warn'   && <I.Clock size={16} style={{color:"var(--warn)"}}/>}
              {a.level==='info'   && <I.Sparkle size={16} style={{color:"var(--olive)"}}/>}
            </div>
            <div className="body">
              <div className="ttl">{a.title}</div>
              <div className="desc">{a.desc}</div>
              <div className="meta">
                <span>{a.source}</span>
                <span>·</span>
                <span className="mono">{['09:42','09:31','09:18','08:55','08:30'][i]}</span>
              </div>
            </div>
            <div className="acts">
              <button className="btn sm">İncele</button>
            </div>
          </div>
        ))}
      </div>

      {/* === AI ACTING (BOTTOM) === */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="title"><I.Sparkle size={14}/> AI Acting <span className="chip ink">otomatik · onaysız</span></div>
            <div className="sub">Yapay zekanın gerçekleştirdiği işlemler, gerekçeleri ve iş akışı etkisi</div>
          </div>
          <div className="flex gap-6">
            <button className="btn sm ghost active">Tümü ({MOCK.aiLogs.length + 4})</button>
            <button className="btn sm ghost">Depo</button>
            <button className="btn sm ghost">Talep</button>
            <button className="btn sm ghost">Anomali</button>
          </div>
        </div>
        <div>
          {[...MOCK.aiLogs, ...EXTRA_LOGS].map((l,i)=>(
            <div key={i} className="log-row">
              <div className="ts">{l.time} · 9 May</div>
              <div className="ic"><I.Sparkle size={12}/></div>
              <div>
                <div className="ttl">{l.title}</div>
                <div className="why"><span className="muted-2 xsmall" style={{textTransform:"uppercase", letterSpacing:".05em", marginRight:4}}>NEDEN</span> {l.why}</div>
                <div className="ctx">
                  {l.ctx.map((c,j)=>(
                    <span key={j} className="chip" style={{background: j===0 ? 'var(--olive-soft)' : 'var(--bg-soft)', color: j===0 ? 'var(--olive-ink)' : 'var(--ink-2)'}}>{c}</span>
                  ))}
                  <span className="chip" style={{background:"transparent", color:"var(--ink-3)", border:"1px dashed var(--line-strong)"}}>etki: {l.impact || 'iş akışına dahil edildi'}</span>
                </div>
              </div>
              <div className="status-col">
                <div className="col" style={{alignItems:"flex-end", gap:4}}>
                  <span className={`chip ${l.status==='hazır'?'good':l.status==='onay'?'warn':l.status==='izleme'?'accent':'olive'}`}>{l.status}</span>
                  <span className="xsmall muted">güven %{l.confidence || 92}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 16px", borderTop:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div className="small muted">Son 24 saatte <strong style={{color:"var(--ink)"}}>17 otomatik işlem</strong> gerçekleştirildi · 2 işlem yönetici onayı bekliyor</div>
          <div className="see-all">Tüm günlüğü göster <I.Arrow size={12}/></div>
        </div>
      </div>
    </div>
  );
}

const EXTRA_LOGS = [
  { time:"07:24", title:"Mevsim modeli yeniden eğitildi", why:"Mayıs hafta 2 verisi ile model kalibre edildi; çilek talep sapması eklendi.", ctx:["AI","Model","Mevsim"], status:"bilgi", impact:"tahmin doğruluğu +%4", confidence:88 },
  { time:"06:55", title:"Soğuk hava deposu sıcaklığı düzeltildi", why:"Sensör 4°C üstüne çıktı, otomatik soğutma talimatı gönderildi.", ctx:["Depo","IoT","Sensör"], status:"uygulandı", impact:"ürün güvenliği korundu", confidence:99 },
  { time:"06:30", title:"Üretici skoru güncellendi", why:"Hatice Aksoy'un son 7 günlük teslimat performansı analiz edildi.", ctx:["Üretici","Skor"], status:"bilgi", impact:"96 → 97 puan", confidence:95 },
  { time:"05:12", title:"Günlük yedek alındı", why:"Sistem yedeği 02:00 GMT itibariyle başarıyla tamamlandı.", ctx:["Sistem","Backup"], status:"uygulandı", impact:"3.2 GB · şifrelendi", confidence:100 },
];

window.AILogsPage = AILogsPage;
