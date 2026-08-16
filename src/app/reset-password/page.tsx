'use client';

// ─── Set a new password ───────────────────────────────────────
// Reached from the emailed link: /reset-password?token=…&scope=…
// Customers get logged straight in afterwards; owners go to /auth.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const T = {
  ink: '#26332C', brand: '#16A377', mint: '#DFF2E9',
  paper: '#FAF6EE', card: '#FFFFFF', line: '#EDE6D8', sub: '#7A8279',
};

type Lang = 'en' | 'ko';

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const scope = params.get('scope') === 'business' ? 'business' : 'customer';

  const [lang, setLang] = useState<Lang>('en');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { setLang((localStorage.getItem('nook_lang') as Lang) || 'en'); } catch { /* default en */ }
  }, []);

  const t = (en: string, ko: string) => (lang === 'en' ? en : ko);

  const tooShort = pw.length > 0 && pw.length < 6;
  const mismatch = pw2.length > 0 && pw !== pw2;
  const canSubmit = pw.length >= 6 && pw === pw2 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true); setError('');
    try {
      const path = scope === 'business' ? '/api/auth/reset-password' : '/api/account/reset-password';
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not reset password');

      // Customers come back with a session — log them in on the spot.
      if (scope === 'customer' && j.token) {
        try {
          localStorage.setItem('nook_customer_token', j.token);
          if (j.account) localStorage.setItem('nook_customer_account', JSON.stringify(j.account));
        } catch { /* non-fatal */ }
      }
      setDone(true);
      setTimeout(() => router.replace(scope === 'business' ? '/auth' : '/wallet'), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset password');
    }
    setBusy(false);
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '15px 46px 15px 18px', borderRadius: 18, boxSizing: 'border-box',
    border: `1.5px solid ${T.line}`, background: T.card, color: T.ink,
    fontSize: 16, fontFamily: FONT, outline: 'none', marginTop: 8,
  };

  return (
    <div style={{
      minHeight: '100dvh', background: T.paper, color: T.ink, fontFamily: FONT,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      WebkitFontSmoothing: 'antialiased', position: 'relative', overflow: 'hidden',
    }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" />
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes rp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes rp-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes rp-pop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        .rp-press { transition: transform 180ms cubic-bezier(0.3,1.3,0.5,1); }
        .rp-press:active { transform: scale(0.965); }
        input:focus { border-color: ${T.brand} !important; box-shadow: 0 0 0 3px ${T.mint}; }
      `}</style>

      <div style={{ position: 'absolute', width: 230, height: 230, left: -105, top: -60, borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%', background: T.mint, opacity: 0.6, animation: 'rp-float 7s ease-in-out infinite' }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '54px 20px 50px', boxSizing: 'border-box', position: 'relative', animation: 'rp-rise 380ms ease-out' }}>

        {!token ? (
          <div style={{ background: T.card, borderRadius: 24, padding: '30px 24px', border: `1px solid ${T.line}`, textAlign: 'center' }}>
            <AlertTriangle size={34} color="#D98324" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: DISPLAY }}>
              {t('This link is incomplete', '링크가 올바르지 않아요')}
            </div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 10, lineHeight: 1.6 }}>
              {t('Please open the reset link straight from your email, or request a new one.',
                 '메일에 있는 링크를 그대로 열어주시거나, 새 링크를 요청해주세요.')}
            </div>
            <a href={`/forgot-password?scope=${scope}`} className="rp-press" style={{
              display: 'block', marginTop: 20, padding: '15px', borderRadius: 999,
              background: T.brand, color: 'white', textDecoration: 'none',
              fontSize: 15, fontWeight: 800, fontFamily: DISPLAY,
            }}>
              {t('Request a new link', '새 링크 요청하기')}
            </a>
          </div>
        ) : done ? (
          <div style={{ background: T.card, borderRadius: 24, padding: '32px 24px', border: `1px solid ${T.line}`, textAlign: 'center' }}>
            <div style={{
              width: 62, height: 62, borderRadius: 999, background: T.mint, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'rp-pop 460ms cubic-bezier(0.3,1.3,0.5,1)',
            }}>
              <CheckCircle2 size={32} color={T.brand} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, fontFamily: DISPLAY }}>
              {t('All set!', '완료됐어요!')}
            </div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 10, lineHeight: 1.65 }}>
              {scope === 'business'
                ? t('Your password is updated. Taking you to the login page…', '비밀번호가 변경됐어요. 로그인 화면으로 이동할게요…')
                : t('Your password is updated and you’re logged in. Opening your wallet…', '비밀번호가 변경되고 로그인됐어요. 월렛을 여는 중…')}
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 800, color: T.brand }}>
                {scope === 'business' ? 'NOOK DASHBOARD' : 'NOOK WALLET'}
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8, fontFamily: DISPLAY, letterSpacing: '-0.02em' }}>
                {t('Choose a new password', '새 비밀번호 설정')}
              </div>
              <div style={{ fontSize: 13.5, color: T.sub, marginTop: 8, lineHeight: 1.6 }}>
                {t('At least 6 characters. Something you’ll remember.', '6자 이상 · 기억하기 쉬운 걸로요.')}
              </div>
            </div>

            <div style={{ background: T.card, borderRadius: 24, padding: 22, border: `1px solid ${T.line}`, boxShadow: '0 2px 10px rgba(38,51,44,0.05)' }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color={T.sub} /> {t('New password', '새 비밀번호')}
              </label>
              <div style={{ position: 'relative' }}>
                <input value={pw} onChange={(e) => setPw(e.target.value)} type={show ? 'text' : 'password'}
                  autoComplete="new-password" autoFocus placeholder={t('6+ characters', '6자 이상')} style={input} />
                <button onClick={() => setShow(!show)} aria-label="toggle" style={{
                  position: 'absolute', right: 12, top: 20, border: 'none', background: 'none',
                  cursor: 'pointer', color: T.sub, padding: 6,
                }}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {tooShort && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 6 }}>{t('Too short — 6 characters minimum.', '너무 짧아요 — 최소 6자.')}</div>}

              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginTop: 16 }}>
                {t('Confirm password', '비밀번호 확인')}
              </label>
              <input value={pw2} onChange={(e) => setPw2(e.target.value)} type={show ? 'text' : 'password'}
                autoComplete="new-password" onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={t('Type it again', '한 번 더 입력')} style={{ ...input, paddingRight: 18 }} />
              {mismatch && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 6 }}>{t('These don’t match yet.', '두 비밀번호가 아직 달라요.')}</div>}

              {error && (
                <div style={{ background: '#FDF2F2', border: '1px solid #F4CFCF', borderRadius: 12, padding: '11px 13px', marginTop: 14, fontSize: 12.5, color: '#B04141', lineHeight: 1.55 }}>
                  {error}
                </div>
              )}

              <button className="rp-press" onClick={submit} disabled={!canSubmit} style={{
                width: '100%', marginTop: 18, padding: '17px', borderRadius: 999, border: 'none',
                cursor: canSubmit ? 'pointer' : 'default',
                fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 800, color: 'white',
                background: canSubmit ? T.brand : '#9AA5A0',
                boxShadow: canSubmit ? '0 6px 18px rgba(22,163,119,0.3)' : 'none',
              }}>
                {busy ? t('Saving…', '저장 중…') : t('Save new password', '새 비밀번호 저장')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#FAF6EE' }} />}>
      <Inner />
    </Suspense>
  );
}
