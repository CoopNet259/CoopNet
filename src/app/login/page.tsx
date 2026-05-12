'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../onboarding/onboarding.css';
import './login.css';

const VEGGIES = [
  { e: '🍅', cls: 'vg-1' }, { e: '🥦', cls: 'vg-2' }, { e: '🥕', cls: 'vg-3' },
  { e: '🫑', cls: 'vg-4' }, { e: '🍋', cls: 'vg-5' }, { e: '🍇', cls: 'vg-6' },
  { e: '🥑', cls: 'vg-7' }, { e: '🌽', cls: 'vg-8' }, { e: '🍓', cls: 'vg-9' },
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('E-posta ve şifre alanları zorunludur.');
      return;
    }
    setLoading(true);
    // Simulate auth — replace with real auth later
    await new Promise((r) => setTimeout(r, 900));
    if (email === 'admin@uretenkadin.coop' && password === 'kooperatif2026') {
      router.push('/dashboard');
    } else {
      setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  return (
    <div className="login-root ob-root">
      <div className="ob-veggies" aria-hidden="true">
        {VEGGIES.map(({ e, cls }) => (
          <span key={cls} className={`vg ${cls}`}>{e}</span>
        ))}
      </div>

      <div className="login-shell">
        <div className="login-card">
            <div className="login-brand">
            <div className="login-logo-mark">
              <svg width="28" height="28" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                <circle cx="22" cy="22" r="18" fill="rgba(255,255,255,0.25)" />
                <path d="M22 8c-5.5 0-10 4.5-10 10 0 4 2.3 7.4 5.6 9.1L22 36l4.4-8.9c3.3-1.7 5.6-5.1 5.6-9.1 0-5.5-4.5-10-10-10z" fill="white" opacity="0.95" />
              </svg>
            </div>
            <div className="login-logo-text">
              <h1>CoopNet</h1>
              <p>Kooperatif Yönetim Sistemi</p>
            </div>
          </div>

          <div className="login-welcome">
            <p className="ob-eyebrow login-eyebrow">Kooperatif hesabınızla giriş yapın</p>
            <h2 className="login-heading">CoopNet’inizi hızlıca açın</h2>

          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">E-posta Adresi</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="ornek@uretenkadin.coop"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="show-pass-btn"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading} id="login-submit">
              {loading ? (
                <>
                  <span className="spinner" />
                  Giriş yapılıyor…
                </>
              ) : (
                <>
                  Giriş Yap
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-invite">CoopNet’ten davet isteyin veya mevcut kooperatif hesabınıza bağlanın.</p>        </div>      </div>
    </div>
  );
}
