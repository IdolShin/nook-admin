'use client';

// ─── Customer login / sign-up (wallet users) ─────────────────
// One account → your cards follow you to any device.
// Google one-tap first, email as fallback. Session lasts a year.

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { account, getAccountToken } from '@/lib/account';

const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const T = {
  ink: '#26332C', brand: '#16A377', mint: '#DFF2E9',
  paper: '#FAF6EE', card: '#FFFFFF', line: '#EDE6D8', sub: '#7A8279',
};

type Lang = 'en' | 'ko';
function getLang(): Lang {
  try { return (localStorage.getItem('nook_lang') as Lang) || 'en'; } catch { return 'en'; }
}

interface GoogleCredentialResponse { credential: string }
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (o: { client_id: string; callback: (r: GoogleCredentialResponse) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
          renderButton: (el: HTMLElement, o: Record<string, string>) => void;
        };
      };
    };
  }
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/wallet';

  const [lang, setLang] = useState<Lang>('en');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleCbRef = useRef<(r: GoogleCredentialResponse) => void>(() => {});

  const t = useCallback((en: string, ko: string) => (lang === 'en' ? en : ko), [lang]);

  useEffect(() => {
    setLang(getLang());
    if (getAccountToken()) router.replace(next);
  }, [router, next]);

  const handleGoogle = useCallback(async (r: GoogleCredentialResponse) => {
    setBusy(true); setError('');
    try {
      await account.google(r.credential);
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google login failed');
      setBusy(false);
    }
  }, [router, next]);
  googleCbRef.current = handleGoogle;

  // Google Identity Services
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: (r) => googleCbRef.current(r),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      const el = googleBtnRef.current;
      if (el) {
        window.google.accounts.id.renderButton(el, {
          type: 'standard', theme: 'outline', size: 'large',
          width: String(el.offsetWidth || 340), text: 'continue_with', shape: 'pill',
        });
      }
    }
    if (window.google?.accounts?.id) { init(); return; }
    const iv = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(iv); init(); } }, 80);
    return () => clearInterval(iv);
  }, []);

  async function submit() {
    if (!email.trim() || !password) {
      setError(t('Please enter your email and password', '이메일과 비밀번호를 입력해주세요'));
      return;
    }
    setBusy(true); setError('');
    try {
      if (mode === 'signup') {
        await account.register({ email: email.trim(), password, name: name.trim() || undefined });
      } else {
        await account.login(email.trim(), password);
      }
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setBusy(false);
    }
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '15px 18px', borderRadius: 18, boxSizing: 'border-box',
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
      <script src="https://accounts.google.com/gsi/client" async defer />
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes lg-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes lg-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .lg-press { transition: transform 180ms cubic-bezier(0.3,1.3,0.5,1); }
        .lg-press:active { transform: scale(0.965); }
        input:focus { border-color: ${T.brand} !important; box-shadow: 0 0 0 3px ${T.mint}; }
      `}</style>

      <div style={{ position: 'absolute', width: 240, height: 240, left: -110, top: -70, borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%', background: T.mint, opacity: 0.6, animation: 'lg-float 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 170, height: 170, right: -80, top: 180, borderRadius: '45% 55% 48% 52% / 55% 45% 55% 45%', background: '#FBF0D7', opacity: 0.6, animation: 'lg-float 8.5s ease-in-out 900ms infinite' }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px 50px', boxSizing: 'border-box', position: 'relative', animation: 'lg-rise 380ms ease-out' }}>

        <div style={{ paddingTop: 54, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 800, color: T.brand }}>NOOK WALLET</div>
          <div className="nk" style={{ fontSize: 27, fontWeight: 900, marginTop: 8, fontFamily: DISPLAY, letterSpacing: '-0.02em' }}>
            {mode === 'login' ? t('Welcome back', '다시 오셨네요') : t('Create your wallet', '내 월렛 만들기')}
          </div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 8, lineHeight: 1.6 }}>
            {lang === 'en'
              ? <>Log in once — your stamp cards follow you<br />to any phone, forever.</>
              : <>한 번만 로그인하면 내 스탬프 카드가<br />어느 폰에서든 그대로 따라와요.</>}
          </div>
        </div>

        {/* Google */}
        <div style={{ marginTop: 28 }}>
          <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
          {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div style={{ fontSize: 12, color: T.sub, textAlign: 'center' }}>
              {t('(Google login not configured yet)', '(구글 로그인 미설정)')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: T.line }} />
          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t('or', '또는')}</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>

        {/* Email form */}
        <div style={{ background: T.card, borderRadius: 24, padding: 20, border: `1px solid ${T.line}`, boxShadow: '0 2px 10px rgba(38,51,44,0.05)' }}>
          {mode === 'signup' && (
            <>
              <label style={{ fontSize: 13, fontWeight: 700 }}>{t('Name', '이름')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('e.g. John', '예: 우상')} style={input} />
            </>
          )}
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginTop: mode === 'signup' ? 14 : 0 }}>
            {t('Email', '이메일')}
          </label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email"
            autoComplete="email" placeholder="you@email.com" style={input} />

          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginTop: 14 }}>
            {t('Password', '비밀번호')}
          </label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('6+ characters', '6자 이상')} style={input} />

          {error && <div style={{ color: '#C0392B', fontSize: 12.5, marginTop: 10 }}>{error}</div>}

          <button className="lg-press" onClick={submit} disabled={busy} style={{
            width: '100%', marginTop: 18, padding: '17px', borderRadius: 999, border: 'none',
            cursor: 'pointer', fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 800, color: 'white',
            background: busy ? '#9AA5A0' : T.brand, boxShadow: '0 6px 18px rgba(22,163,119,0.3)',
          }}>
            {busy ? t('Please wait…', '잠시만요…') : (mode === 'login' ? t('Log in', '로그인') : t('Create account', '가입하기'))}
          </button>

          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} style={{
            width: '100%', marginTop: 10, padding: 10, border: 'none', background: 'none',
            color: T.sub, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
          }}>
            {mode === 'login'
              ? t("Don't have an account? Sign up", '계정이 없으신가요? 가입하기')
              : t('Already have an account? Log in', '이미 계정이 있어요 · 로그인')}
          </button>
        </div>

        <a href="/wallet" style={{
          display: 'block', textAlign: 'center', marginTop: 18, fontSize: 13, color: T.sub, textDecoration: 'none',
        }}>
          {t('Skip for now — use this phone only →', '나중에 할게요 · 이 폰에서만 사용 →')}
        </a>

        <div style={{ textAlign: 'center', marginTop: 26 }}>
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

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#FAF6EE' }} />}>
      <LoginInner />
    </Suspense>
  );
}
