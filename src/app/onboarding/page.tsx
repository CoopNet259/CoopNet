'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './onboarding.css';

const SLIDES = 4;

const VEGGIES = [
  { e: '🍅', cls: 'vg-1'  }, { e: '🥦', cls: 'vg-2'  }, { e: '🥕', cls: 'vg-3'  },
  { e: '🫑', cls: 'vg-4'  }, { e: '🍋', cls: 'vg-5'  }, { e: '🍇', cls: 'vg-6'  },
  { e: '🥑', cls: 'vg-7'  }, { e: '🌽', cls: 'vg-8'  }, { e: '🍓', cls: 'vg-9'  },
  { e: '🥔', cls: 'vg-10' }, { e: '🥒', cls: 'vg-11' }, { e: '🌶️', cls: 'vg-12' },
  { e: '🍊', cls: 'vg-13' }, { e: '🧅', cls: 'vg-14' }, { e: '🍆', cls: 'vg-15' },
  { e: '🌿', cls: 'vg-16' }, { e: '🫐', cls: 'vg-17' }, { e: '🥬', cls: 'vg-18' },
  { e: '🍑', cls: 'vg-19' }, { e: '🌱', cls: 'vg-20' }, { e: '🍒', cls: 'vg-21' },
  { e: '🫒', cls: 'vg-22' }, { e: '🥝', cls: 'vg-23' }, { e: '🌰', cls: 'vg-24' },
  { e: '🍐', cls: 'vg-25' }, { e: '🧄', cls: 'vg-26' }, { e: '🥭', cls: 'vg-27' },
  { e: '🍈', cls: 'vg-28' }, { e: '🌾', cls: 'vg-29' }, { e: '🥜', cls: 'vg-30' },
  { e: '🍠', cls: 'vg-31' }, { e: '🫚', cls: 'vg-32' }, { e: '🍄', cls: 'vg-33' },
  { e: '🥗', cls: 'vg-34' }, { e: '🫛', cls: 'vg-35' }, { e: '🍏', cls: 'vg-36' },
  { e: '🍌', cls: 'vg-37' }, { e: '🥥', cls: 'vg-38' }, { e: '🫙', cls: 'vg-39' },
  { e: '🍞', cls: 'vg-40' }, { e: '🥐', cls: 'vg-41' }, { e: '🫘', cls: 'vg-42' },
  { e: '🌻', cls: 'vg-43' }, { e: '🍯', cls: 'vg-44' }, { e: '🫗', cls: 'vg-45' },
  { e: '🥧', cls: 'vg-46' }, { e: '🌴', cls: 'vg-47' }, { e: '🪴', cls: 'vg-48' },
  { e: '🍁', cls: 'vg-49' }, { e: '🌸', cls: 'vg-50' },
];

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {dir === 'left'
        ? <path d="M11 4 L6 9 L11 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M7 4 L12 9 L7 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function Slide1({ active }: { active: boolean }) {
  return (
    <section className={`ob-slide${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div className="ob-vis">
        <div className="ob-hero-brand">
          <div className="ob-logo-circle">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <circle cx="22" cy="22" r="18" fill="rgba(255,255,255,0.25)" />
              <path d="M22 8c-5.5 0-10 4.5-10 10 0 4 2.3 7.4 5.6 9.1L22 36l4.4-8.9c3.3-1.7 5.6-5.1 5.6-9.1 0-5.5-4.5-10-10-10z" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <span className="ob-logo-name">CoopNet</span>
        </div>
      </div>

      <div className="ob-feature-row">
        {[
          { icon: '🌾', label: 'Hasat' },
          { icon: '📦', label: 'Stok' },
          { icon: '🛒', label: 'Sipariş' },
          { icon: '💬', label: 'İletişim' },
          { icon: '📊', label: 'Raporlar' },
        ].map((f, i) => (
          <div key={f.label} className="ob-feat-pill" style={{ animationDelay: `${200 + i * 120}ms` }}>
            <span className="ob-feat-pill-icon">{f.icon}</span>
            <span className="ob-feat-pill-label">{f.label}</span>
          </div>
        ))}
      </div>

      <p className="ob-eyebrow">Tanışın</p>
      <h2 className="ob-heading">{"Kooperatifçilik,\nDijitalde"}</h2>
      <p className="ob-sub">Dağınık tablolar, WhatsApp grupları ve kağıt kayıtlar yerine — tüm kooperatif operasyonlarınız tek platformda.</p>
    </section>
  );
}

function Slide2({ active }: { active: boolean }) {
  return (
    <section className={`ob-slide${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div className="ob-vis">
        <div className="ob-pain-list">
          <div className="pain-card">
            <span className="pain-x">❌</span>
            <span className="pain-text">Stok takibi Excel'de, WhatsApp'ta, kafada</span>
          </div>
          <div className="pain-card">
            <span className="pain-x">❌</span>
            <span className="pain-text">Sipariş geldi mi, teslim edildi mi? Belirsiz.</span>
          </div>
          <div className="pain-card">
            <span className="pain-x">❌</span>
            <span className="pain-text">Ayda bir rapor mu? Kimse yazmıyor.</span>
          </div>
          <div className="ob-solution-tag">
            <span>✓</span> CoopNet çözüyor
          </div>
        </div>
      </div>
      <p className="ob-eyebrow">Sorun</p>
      <h2 className="ob-heading">{"Tanıdık mı\nGeliyor?"}</h2>
      <p className="ob-sub">Birçok kooperatif hâlâ parçalı araçlarla çalışıyor. Biz bunu değiştiriyoruz.</p>
    </section>
  );
}

function Slide3({ active }: { active: boolean }) {
  return (
    <section className={`ob-slide${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div className="ob-vis">
        <div className="ob-feat-grid">
          <div className="feat-card">
            <div className="feat-icon-wrap">📦</div>
            <div className="feat-title">Stok & Hasat</div>
            <div className="feat-desc">Anlık stok takibi, hasat kaydı ve uyarılar</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon-wrap">🛒</div>
            <div className="feat-title">Sipariş Yönetimi</div>
            <div className="feat-desc">Sipariş al, takip et, zamanında teslim et</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon-wrap">🤖</div>
            <div className="feat-title">AI Raporları</div>
            <div className="feat-desc">Gemini AI günlük analiz ve öneriler üretir</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon-wrap">💬</div>
            <div className="feat-title">WhatsApp</div>
            <div className="feat-desc">Üretici ve müşterilerle entegre iletişim</div>
          </div>
        </div>
      </div>
      <p className="ob-eyebrow">Çözüm</p>
      <h2 className="ob-heading">{"Her Şey\nBir Arada"}</h2>
      <p className="ob-sub">Stoktan siparişe, hasattan rapora — kooperatifinizin tüm ihtiyaçları tek çatı altında.</p>
    </section>
  );
}

function Slide4({ active }: { active: boolean }) {
  return (
    <section className={`ob-slide${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div className="ob-vis" style={{ flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div className="ob-check-wrap">
          <div className="ob-check-circle">
            <svg viewBox="0 0 50 50" fill="none">
              <path className="ob-check-path" d="M12 26 L22 36 L38 16"
                stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="ob-ripple" />
        </div>
        <div className="ob-trust-list">
          <div className="trust-item"><span className="trust-check">✓</span>Kurulum 5 dakika</div>
          <div className="trust-item"><span className="trust-check">✓</span>Her boyutta kooperatif için</div>
          <div className="trust-item"><span className="trust-check">✓</span>Türkçe tam destek</div>
        </div>
      </div>
      <p className="ob-eyebrow">Hazır mısınız?</p>
      <h2 className="ob-heading">{"Kooperatifinizi\nDijitale Taşıyın"}</h2>
      <p className="ob-sub">Birkaç dakika içinde kooperatifinizi CoopNet'e tanıtın, yönetimi kolaylaştırın.</p>
    </section>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // useEffect(() => {
  //   try {
  //     if (localStorage.getItem('coopnet_onboarding_seen') === '1') {
  //       router.replace('/login');
  //     }
  //   } catch {}
  // }, [router]);

  const finish = useCallback(() => {
    try { localStorage.setItem('coopnet_onboarding_seen', '1'); } catch {}
    setLeaving(true);
    setTimeout(() => router.push('/login'), 400);
  }, [router]);

  const go = useCallback((n: number) => {
    if (n < 0 || n > SLIDES - 1) return;
    setIndex(n);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(Math.min(SLIDES - 1, index + 1));
      if (e.key === 'ArrowLeft')  go(Math.max(0, index - 1));
      if (e.key === 'Escape')     finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go, finish]);

  const isLast = index === SLIDES - 1;

  return (
    <div className={`ob-root${leaving ? ' is-leaving' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      <div className="ob-veggies" aria-hidden="true">
        {VEGGIES.map(({ e, cls }) => (
          <span key={cls} className={`vg ${cls}`}>{e}</span>
        ))}
      </div>

      <button className={`ob-skip${isLast ? ' is-hidden' : ''}`} onClick={finish} aria-label="Atla">
        Atla
      </button>

      <div className="ob-track" style={{ transform: `translateX(-${index * 25}%)` }}>
        <Slide1 active={index === 0} />
        <Slide2 active={index === 1} />
        <Slide3 active={index === 2} />
        <Slide4 active={index === 3} />
      </div>

      <nav className="ob-nav" aria-label="Navigasyon">
        <div className="nav-side">
          <button className={`ob-nav-btn${index === 0 ? ' is-hidden' : ''}`} onClick={() => go(index - 1)} aria-label="Önceki">
            <Chevron dir="left" />
          </button>
        </div>
        <div className="ob-dots" role="tablist">
          {Array.from({ length: SLIDES }).map((_, i) => (
            <button key={i} role="tab" aria-selected={i === index} aria-label={`Slayt ${i + 1}`}
              className={`ob-dot${i === index ? ' is-active' : ''}`} onClick={() => go(i)} />
          ))}
        </div>
        <div className="nav-side">
          {isLast
            ? <button className="ob-cta" onClick={finish}>Başlayalım →</button>
            : <button className="ob-nav-btn" onClick={() => go(index + 1)} aria-label="Sonraki"><Chevron dir="right" /></button>
          }
        </div>
      </nav>
    </div>
  );
}
