'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

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
    <div className="login-root">
      {/* Background decorative blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" fill="rgba(255,255,255,0.2)" />
              <path
                d="M14 5c-3.5 0-6.3 2.8-6.3 6.3 0 2.5 1.4 4.6 3.5 5.7L14 23l2.8-6c2.1-1.1 3.5-3.2 3.5-5.7C20.3 7.8 17.5 5 14 5z"
                fill="#fff"
                opacity="0.95"
              />
            </svg>
          </div>
          <div className="login-logo-text">
            <h1>CoopNet</h1>
            <p>Kooperatif Yönetim Sistemi</p>
          </div>
        </div>

        {/* Welcome block */}
        <div className="login-welcome">
          <h2>Hoş Geldiniz</h2>
          <p>Kooperatif hesabınızla giriş yapın</p>
        </div>

        {/* Cooperative badge */}
        <div className="coop-badge">
          <span className="coop-badge-icon">🌱</span>
          <span className="coop-badge-name">Üreten Kadınlar Kooperatif</span>
        </div>

        {/* Form */}
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

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Beni hatırla</span>
            </label>
            <button type="button" className="forgot-btn" onClick={() => alert('Şifre sıfırlama — yakında aktif olacak.')}>
              Şifremi unuttum
            </button>
          </div>

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

        {/* Demo hint */}
        <div className="demo-hint">
          <span>Demo giriş:</span>
          <code>admin@uretenkadin.coop</code>
          <span>/</span>
          <code>kooperatif2026</code>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <span>© 2026 CoopNet · Üreten Kadınlar Kooperatif</span>
        </div>
      </div>
    </div>
  );
}
