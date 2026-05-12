'use client';

import { useState } from 'react';
import Link from 'next/link';
import './invite.css';

export default function InvitePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Lütfen bir e-posta adresi girin.');
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="invite-root">
      <div className="invite-shell">
        <div className="invite-card">
          <div className="invite-brand">
            <div className="invite-logo-mark">
              <svg width="28" height="28" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                <circle cx="22" cy="22" r="18" fill="rgba(255,255,255,0.25)" />
                <path d="M22 8c-5.5 0-10 4.5-10 10 0 4 2.3 7.4 5.6 9.1L22 36l4.4-8.9c3.3-1.7 5.6-5.1 5.6-9.1 0-5.5-4.5-10-10-10z" fill="white" opacity="0.95" />
              </svg>
            </div>
            <div className="invite-logo-text">
              <h1>CoopNet</h1>
              <p>Davet Talep Formu</p>
            </div>
          </div>

          <div className="invite-welcome">
            <p className="invite-eyebrow">Davet talebi</p>
            <h2>CoopNet'e katılmak için mailinizi bırakın</h2>
            <p className="invite-description">CoopNet ekibi, e-posta adresinizle sizinle iletişime geçecek.</p>
          </div>

          {submitted ? (
            <div className="invite-success">
              <strong>Davet talebiniz alındı.</strong>
              <p>CoopNet ekibi sizinle iletişime geçecektir.</p>
            </div>
          ) : (
            <form className="invite-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="invite-email">E-posta Adresi</label>
                <div className="input-wrap">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="invite-email"
                    type="email"
                    placeholder="ornek@uretenkadin.coop"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="invite-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="invite-btn">
                Gönder
              </button>
            </form>
          )}

          <div className="invite-footer">
            <Link href="/login" className="invite-link">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
