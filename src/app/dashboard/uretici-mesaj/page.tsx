'use client';

import { useState, useRef, useEffect } from 'react';
import { postWhatsAppDemo, WhatsAppDemoResult, getHarvestMessages, HarvestMessagesResponse } from '@/lib/api/client';

interface ChatMessage {
  id: number;
  from: 'producer' | 'system';
  text: string;
  time: string;
  result?: WhatsAppDemoResult;
}

const QUICK_MESSAGES = [
  '100 kg domates hasat ettim, öğleye kadar getiririm',
  '50 kg biber hazır, bugün teslim edebilirim',
  '200 kg salatalık topladım',
  '80 kg kayısı var, yarın sabah 09:00 da getireceğim',
  '150 kg patlıcan hasat ettim',
];

const PRODUCERS = [
  { name: 'Ahmet Yılmaz', avatar: 'AY', location: 'Çukurova, Adana' },
  { name: 'Fatma Şahin', avatar: 'FŞ', location: 'Mut, Mersin' },
  { name: 'Mehmet Demir', avatar: 'MD', location: 'Silifke, Mersin' },
];

function fmt(date: Date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function ConfidenceBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    Yüksek: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Orta: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Düşük: 'bg-red-500/20 text-red-300 border-red-500/30',
    Hata: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[label] ?? colors['Orta']}`}>
      {label} Güven
    </span>
  );
}

function StockBar({ pct, critical }: { pct: number; critical: boolean }) {
  const color = critical ? 'bg-red-500' : pct < 30 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="w-full bg-white/10 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function UreticiMesajPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState(PRODUCERS[0]);
  const [activeTab, setActiveTab] = useState<'chat' | 'incoming' | 'info'>('chat');
  const [incoming, setIncoming] = useState<HarvestMessagesResponse | null>(null);
  const [incomingLoading, setIncomingLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gelen bildirimler sekmesi açıldığında ve her mesaj gönderilince yenile
  const refreshIncoming = async () => {
    setIncomingLoading(true);
    try {
      const data = await getHarvestMessages(20);
      setIncoming(data);
    } catch { /* sessiz */ }
    finally { setIncomingLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'incoming') refreshIncoming();
  }, [activeTab]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: ++idRef.current,
      from: 'producer',
      text: text.trim(),
      time: fmt(new Date()),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await postWhatsAppDemo(text.trim(), selectedProducer.name);
      const sysMsg: ChatMessage = {
        id: ++idRef.current,
        from: 'system',
        text: result.reply,
        time: fmt(new Date()),
        result,
      };
      setMessages(prev => [...prev, sysMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: ++idRef.current,
          from: 'system',
          text: 'Bir hata oluştu. Backend çalışıyor mu?',
          time: fmt(new Date()),
        },
      ]);
    } finally {
      setLoading(false);
      refreshIncoming(); // gelen bildirimler panelini güncelle
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* ── Başlık ── */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">
          📱
        </div>
        <div>
          <h1 className="font-semibold text-base">Üretici Mesaj Sistemi</h1>
          <p className="text-xs text-white/40">WhatsApp → AI → Otomatik Aksiyon Demo</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Canlı Demo
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sol: Telefon Simülatörü ── */}
        <div className="flex flex-col flex-1 max-w-md mx-auto p-4 gap-3">
          {/* Üretici Seçici */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[11px] text-white/40 mb-2 uppercase tracking-wider">Üretici olarak mesaj at</p>
            <div className="flex gap-2">
              {PRODUCERS.map(p => (
                <button
                  key={p.name}
                  onClick={() => setSelectedProducer(p)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all text-xs ${
                    selectedProducer.name === p.name
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                    {p.avatar}
                  </div>
                  <span className="truncate w-full text-center">{p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Ekranı */}
          <div className="flex-1 flex flex-col bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* WA Header */}
            <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
                🌾
              </div>
              <div>
                <p className="text-sm font-semibold text-white">CoopNet AI</p>
                <p className="text-[11px] text-white/50">çevrimiçi</p>
              </div>
              <div className="ml-auto text-white/40">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </div>
            </div>

            {/* Mesajlar */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-2"
              style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") #111b21' }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                  <div className="text-4xl">🌾</div>
                  <p className="text-white/30 text-sm text-center">
                    Üretici olarak bir mesaj gönder<br />AI otomatik işleyecek
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === 'producer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      msg.from === 'producer'
                        ? 'bg-[#005c4b] text-white rounded-tr-sm'
                        : 'bg-[#1f2c34] text-white rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <p className="text-[10px] text-white/40 text-right mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#1f2c34] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-[#1f2c34] p-2 flex items-center gap-2">
              <input
                className="flex-1 bg-[#2a3942] text-white text-sm rounded-full px-4 py-2.5 outline-none placeholder:text-white/30"
                placeholder="Mesaj yaz..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center disabled:opacity-40 hover:bg-emerald-500 transition-colors"
              >
                <svg className="w-5 h-5 text-white rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Hızlı Mesajlar */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[11px] text-white/40 mb-2 uppercase tracking-wider">Örnek mesajlar</p>
            <div className="flex flex-col gap-1.5">
              {QUICK_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(msg)}
                  disabled={loading}
                  className="text-left text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-all disabled:opacity-40"
                >
                  💬 {msg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sağ: Analiz Paneli ── */}
        <div className="w-80 border-l border-white/10 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex gap-2">
            {([
              { id: 'chat', label: '🤖 AI Analizi' },
              { id: 'incoming', label: '📨 Gelen Mesajlar' },
              { id: 'info', label: 'ℹ️ Nasıl Çalışır' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.filter(m => m.from === 'system' && m.result).length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="text-3xl">🤖</div>
                  <p className="text-white/30 text-sm">
                    Sol taraftan bir mesaj gönder,<br />AI analizi burada görünecek
                  </p>
                </div>
              ) : (
                messages
                  .filter(m => m.from === 'system' && m.result)
                  .slice(-1)
                  .map(msg => {
                    const r = msg.result!;
                    return (
                      <div key={msg.id} className="space-y-3">
                        {/* Parsed */}
                        {r.parsed && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">AI Parse</p>
                              <ConfidenceBadge label={r.confidence_label} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-[10px] text-white/40">Ürün</p>
                                <p className="text-sm font-semibold capitalize">{r.parsed.product_name}</p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-[10px] text-white/40">Miktar</p>
                                <p className="text-sm font-semibold">{r.parsed.quantity} {r.parsed.unit}</p>
                              </div>
                              {r.parsed.available_time && (
                                <div className="col-span-2 bg-white/5 rounded-lg p-2">
                                  <p className="text-[10px] text-white/40">Teslim Saati</p>
                                  <p className="text-sm font-semibold">{r.parsed.available_time}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Stok */}
                        {r.stock_status && (
                          <div className={`border rounded-xl p-3 space-y-2 ${
                            r.stock_status.is_critical
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}>
                            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Stok Durumu</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{r.stock_status.current_quantity} {r.stock_status.unit} mevcut</span>
                              <span className={`text-xs font-bold ${
                                r.stock_status.is_critical ? 'text-red-400' : 'text-emerald-400'
                              }`}>
                                %{Math.round(r.stock_status.fill_percentage)}
                              </span>
                            </div>
                            <StockBar pct={r.stock_status.fill_percentage} critical={r.stock_status.is_critical} />
                            {r.stock_status.is_critical && (
                              <p className="text-xs text-red-400">⚠️ Kritik stok — otomatik uyarı gönderildi</p>
                            )}
                          </div>
                        )}

                        {/* Aksiyonlar */}
                        {r.executed_actions.length > 0 && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                              Otomatik Aksiyonlar
                            </p>
                            <div className="space-y-1.5">
                              {r.executed_actions.map((a, i) => (
                                <p key={i} className="text-xs text-white/80">{a}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Uyarı */}
                        {r.confidence_warning && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                            <p className="text-xs text-amber-300">{r.confidence_warning}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          ) : activeTab === 'incoming' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-white/40 uppercase tracking-wider">WhatsApp'tan Gelen Bildirimler</p>
                <button
                  onClick={refreshIncoming}
                  disabled={incomingLoading}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                >
                  {incomingLoading ? '⟳ Yükleniyor...' : '↻ Yenile'}
                </button>
              </div>

              {incomingLoading && !incoming && (
                <div className="flex justify-center py-8">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              {incoming && incoming.messages.length === 0 && (
                <div className="text-center py-8 text-white/30 text-sm">
                  Henüz mesaj yok.<br />WhatsApp'tan bir mesaj gönder.
                </div>
              )}

              {/* Gelen mesajlar */}
              {incoming && incoming.messages.map(msg => (
                <div key={msg.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm flex-shrink-0">
                      📱
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">"{msg.message}"</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{msg.time}</p>
                    </div>
                  </div>
                  {msg.impact && (
                    <div className="ml-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                      <p className="text-[11px] text-emerald-300">⚡ {msg.impact}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Hasat görevleri */}
              {incoming && incoming.tasks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider">Oluşturulan Görevler</p>
                  {incoming.tasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                      task.done
                        ? 'bg-white/5 border-white/10 opacity-50'
                        : task.priority === 'yuksek'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        task.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{task.title}</p>
                        <p className="text-[10px] text-white/40">
                          {task.priority === 'yuksek' ? '🔴 Yüksek' : task.priority === 'orta' ? '🟡 Orta' : '🟢 Düşük'} öncelik
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    icon: '📱',
                    title: 'Üretici mesaj atar',
                    desc: 'WhatsApp\'tan "100 kg domates hasat ettim" gibi serbest metin mesajı gönderir.',
                    color: 'bg-blue-500/10 border-blue-500/20',
                  },
                  {
                    step: '2',
                    icon: '🤖',
                    title: 'AI mesajı parse eder',
                    desc: 'Gemini AI ürün adı, miktar, birim ve teslim saatini çıkarır. Güven skoru hesaplar.',
                    color: 'bg-purple-500/10 border-purple-500/20',
                  },
                  {
                    step: '3',
                    icon: '📊',
                    title: 'Stok kontrolü',
                    desc: 'Mevcut depo stoku sorgulanır, kritik eşiğe bakılır.',
                    color: 'bg-emerald-500/10 border-emerald-500/20',
                  },
                  {
                    step: '4',
                    icon: '⚡',
                    title: 'Otomatik aksiyonlar',
                    desc: 'Depo görevi oluşturulur. Kritikse yöneticiye uyarı gönderilir. Tümü otomatik.',
                    color: 'bg-amber-500/10 border-amber-500/20',
                  },
                  {
                    step: '5',
                    icon: '💬',
                    title: 'WhatsApp yanıtı',
                    desc: 'Üretici anında geri bildirim alır — ne yapıldığını görür.',
                    color: 'bg-teal-500/10 border-teal-500/20',
                  },
                ].map(item => (
                  <div key={item.step} className={`border rounded-xl p-3 ${item.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-xl mt-0.5">{item.icon}</div>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-white/50 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
                  <p className="text-xs font-semibold text-white/60 mb-1">Gerçek WhatsApp için</p>
                  <p className="text-xs text-white/40">
                    Twilio WhatsApp Sandbox → webhook URL:{' '}
                    <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">
                      /api/webhook/whatsapp
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
