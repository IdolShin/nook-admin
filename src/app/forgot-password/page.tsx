'use client';

// ─── Forgot password — one page, both audiences ───────────────
// ?scope=business  → shop owner (dashboard login)
// ?scope=customer  → wallet customer (default)
// We always show the same confirmation, so nobody can use this
// page to find out which emails have accounts.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const T = {
  ink: '#26332C', brand: '#16A377', mint: '#DFF2E9',
  paper: '#FAF6EE', card: '#FFFFFF', line: '#EDE6D8', sub: '#7A8279',
};

type Lang = 'en' | 'ko';

function Inner() {
  const params = useSearchParams();
  const scope = params.get('scope') === 'business' ? 'business' : 'customer';

  const [lang, setLang] = useState<Lang>('en');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try { setLang((localStorage.getItem('nook_lang') as Lang) || 'en'); } catch { /* default en */ }
  }, []);

  const t = (en: string, ko: string) => (lang === 'en' ? en : ko);
  const backHref = scope === 'business' ? '/auth' : '/login';

  async function submit() {
    if (!email.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const path = scope === 'business' ? '/api/auth/forgot-password' : '/api/account/forgot-password';
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Something went wrong');
      setNote(j.message || '');
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
    setBusy(false);
  }

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
        @keyframes fp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fp-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .fp-press { transition: transform 180ms cubic-bezier(0.3,1.3,0.5,1); }
        .fp-press:active { transform: scale(0.965); }
        input:focus { border-color: ${T.brand} !important; box-shadow: 0 0 0 3px ${T.mint}; }
      `}</style>

      <div style={{ position: 'absolute', width: 230, height: 230, left: -105, top: -60, borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%', background: T.mint, opacity: 0.6, animation: 'fp-float 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 160, height: 160, right: -75, top: 200, borderRadius: '45% 55% 48% 52% / 55% 45% 55% 45%', background: '#FBF0D7', opacity: 0.6, animation: 'fp-float 8.5s ease-in-out 900ms infinite' }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px 50px', boxSizing: 'border-box', position: 'relative', animation: 'fp-rise 380ms ease-out' }}>

        <div style={{ paddingTop: 30 }}>
          <a href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: T.sub, textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={15} /> {t('Back to log in', '로그인으로 돌아가기')}
          </a>
        </div>

        <div style={{ paddingTop: 26, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 800, color: T.brand }}>
            {scope === 'business' ? 'NOOK DASHBOARD' : 'NOOK WALLET'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8, fontFamily: DISPLAY, letterSpacing: '-0.02em' }}>
            {t('Forgot your password?', '비밀번호를 잊으셨나요?')}
          </div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 8, lineHeight: 1.6 }}>
            {t('Enter your email and we’ll send you a link to set a new one.',
               '가입하신 이메일을 입력하시면 재설정 링크를 보내드려요.')}
          </div>
        </div>

        {sent ? (
          <div style={{ background: T.card, borderRadius: 24, padding: '28px 22px', border: `1px solid ${T.line}`, marginTop: 26, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999, background: T.mint, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={28} color={T.brand} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: DISPLAY }}>
              {t('Check your email', '메일함을 확인해주세요')}
            </div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 10, lineHeight: 1.65 }}>
              {note || t('If that email is registered, a reset link is on its way.',
                         '등록된 이메일이라면 재설정 링크가 발송됐어요.')}
            </div>
            <div style={{ fontSize: 12.5, color: T.sub, marginTop: 14, background: T.paper, borderRadius: 12, padding: '11px 14px', lineHeight: 1.6 }}>
              {t('The link expires in 1 hour. Don’t see it? Check your spam folder.',
                 '링크는 1시간 후 만료돼요. 안 보이면 스팸함도 확인해주세요.')}
            </div>
            <a href={backHref} className="fp-press" style={{
              display: 'block', marginTop: 20, padding: '15px', borderRadius: 999,
              background: T.brand, color: 'white', textDecoration: 'none',
              fontSize: 15, fontWeight: 800, fontFamily: DISPLAY,
            }}>
              {t('Back to log in', '로그인하러 가기')}
            </a>
          </div>
        ) : (
          <div style={{ background: T.card, borderRadius: 24, padding: 22, border: `1px solid ${T.line}`, marginTop: 26, boxShadow: '0 2px 10px rgba(38,51,44,0.05)' }}>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} color={T.sub} /> {t('Email', '이메일')}
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              type="email" inputMode="email" autoComplete="email" autoFocus
              placeholder="you@email.com"
              style={{
                width: '100%', padding: '15px 18px', borderRadius: 18, boxSizing: 'border-box',
                border: `1.5px solid ${T.line}`, background: T.card, color: T.ink,
                fontSize: 16, fontFamily: FONT, outline: 'none', marginTop: 8,
              }}
            />
            {error && <div style={{ color: '#C0392B', fontSize: 12.5, marginTop: 10 }}>{error}</div>}

            <button className="fp-press" onClick={submit} disabled={busy || !email.trim()} style={{
              width: '100%', marginTop: 18, padding: '17px', borderRadius: 999, border: 'none',
              cursor: busy || !email.trim() ? 'default' : 'pointer',
              fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 800, color: 'white',
              background: busy || !email.trim() ? '#9AA5A0' : T.brand,
              boxShadow: '0 6px 18px rgba(22,163,119,0.3)',
            }}>
              {busy ? t('Sending…', '보내는 중…') : t('Send reset link', '재설정 링크 보내기')}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => {
            const n: Lang = lang === 'en' ? 'ko' : 'en';
            setLang(n);
            try { localStorage.setItem('nook_lang', n); } catch { /* non-fatal */ }
          }} style={{
            padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT,
            background: T.card, border: `1px solid ${T.line}`, color: T.sub, fontSize: 12, fontWeight: 700,
          }}>
            {lang === 'en' ? '한국어' : 'EN'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#FAF6EE' }} />}>
      <Inner />
    </Suspense>
  );
}
