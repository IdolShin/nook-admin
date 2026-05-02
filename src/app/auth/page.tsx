'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import NookMark from '@/components/NookMark';
import { useBreakpoint } from '@/hooks/useBreakpoint';

function Field({ label, type = 'text', placeholder, hint, value, onChange, onKeyDown }: {
  label: string; type?: string; placeholder: string; hint?: React.ReactNode;
  value?: string; onChange?: (v: string) => void; onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 12, color: '#5C5F66', fontWeight: 500 }}>{label}</label>
        {hint}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', height: 42, padding: '0 12px',
          border: '1px solid #EBEBEB', borderRadius: 10,
          fontSize: 14, fontFamily: 'inherit', outline: 'none',
          color: '#1A1A1F',
        }}
      />
    </div>
  );
}

const GoogleLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
    <path d="M17.05 11.97c-.03-2.92 2.39-4.32 2.5-4.39-1.36-1.99-3.48-2.27-4.24-2.3-1.81-.18-3.53 1.06-4.45 1.06-.93 0-2.34-1.04-3.85-1.01-1.98.03-3.81 1.15-4.83 2.93-2.06 3.57-.53 8.86 1.48 11.76.99 1.42 2.16 3.01 3.7 2.95 1.49-.06 2.05-.96 3.85-.96 1.79 0 2.31.96 3.88.93 1.6-.03 2.61-1.44 3.59-2.86 1.13-1.64 1.6-3.23 1.62-3.31-.04-.02-3.11-1.19-3.14-4.73zM14.07 3.97c.83-1 1.39-2.39 1.23-3.78-1.2.05-2.65.8-3.5 1.79-.77.88-1.44 2.29-1.26 3.66 1.34.1 2.7-.68 3.53-1.67z" />
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isPhone } = useBreakpoint();

  useEffect(() => {
    try {
      if (localStorage.getItem('nook_token')) router.replace('/dashboard');
    } catch(e) {}
  }, [router]);

  async function handleSubmit() {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.login(email, password);
      router.push('/dashboard');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error ?? msg);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F6FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isPhone ? 0 : 24,
      /* Safe area for notch */
      paddingTop: isPhone ? 'env(safe-area-inset-top)' : 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 860,
        background: 'white',
        borderRadius: isPhone ? 0 : 13,
        border: isPhone ? 'none' : '1px solid #EBEBEB',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr',
        minHeight: isPhone ? '100vh' : 580,
        boxShadow: isPhone ? 'none' : '0 8px 30px rgba(0,0,0,0.06)',
      }}>
        {/* Left: form */}
        <div style={{ padding: isPhone ? '40px 24px 32px' : '48px 56px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 36 }}>
            <NookMark size={32} showText textColor="#1A1A1F" />
          </div>

          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Welcome back' : 'Start your loyalty program'}
          </div>
          <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>
            {mode === 'login' ? 'Log in to your Nook workspace.' : 'Free for 14 days. No credit card. Set up your first card in 5 minutes.'}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <button style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #EBEBEB', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              <GoogleLogo /> Continue with Google
            </button>
            <button style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #EBEBEB', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              <AppleLogo /> Continue with Apple
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#8A8D94', fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: '#EBEBEB' }} />
            OR
            <div style={{ flex: 1, height: 1, background: '#EBEBEB' }} />
          </div>

          {mode === 'signup' && <Field label="Business name" placeholder="e.g. Nook Café" />}
          <Field
            label="Email" type="email" placeholder="you@yourbusiness.com"
            value={email} onChange={setEmail}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Field
            label="Password" type="password" placeholder="••••••••"
            value={password} onChange={setPassword}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            hint={mode === 'login' ? <a href="#" style={{ color: '#085041', textDecoration: 'none', fontWeight: 500, fontSize: 12 }}>Forgot?</a> : undefined}
          />

          {error && (
            <div style={{ fontSize: 12, color: '#9C2848', marginBottom: 8, padding: '8px 12px', background: '#FBE2EC', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: 8, height: 44,
              border: 0, borderRadius: 10, background: loading ? '#8A8D94' : '#1D9E75', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Logging in…' : mode === 'login' ? 'Log in' : 'Create workspace'}
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 24, textAlign: 'center' }}>
            {mode === 'login'
              ? <>New to Nook? <button onClick={() => setMode('signup')} style={{ background: 'none', border: 0, color: '#085041', textDecoration: 'none', fontWeight: 500, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}>Create a workspace</button></>
              : <>Already have an account? <button onClick={() => setMode('login')} style={{ background: 'none', border: 0, color: '#085041', fontWeight: 500, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}>Log in</button></>
            }
          </div>
        </div>

        {/* Right: marketing panel — hidden on phones */}
        {!isPhone && <div style={{
          background: 'linear-gradient(135deg, #0F4D38 0%, #1D9E75 100%)',
          color: 'white', padding: '48px 48px',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ position: 'absolute', right: -20, bottom: -60, fontSize: 360, fontWeight: 700, opacity: 0.06, lineHeight: 1, letterSpacing: '-0.05em', pointerEvents: 'none' }}>n</div>

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.85 }}>
            Loyalty, in the wallet
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 12, lineHeight: 1.2 }}>
            Run a punch-card program your customers actually use.
          </div>

          <div style={{ display: 'grid', gap: 18, marginTop: 30, position: 'relative' }}>
            {[
              { t: 'Apple & Google Wallet', d: 'No app to download. Lives where customers already are.' },
              { t: 'QR enrollment in 30s', d: 'Scan, enter phone, done. Tap-to-stamp at checkout.' },
              { t: 'Push that converts', d: 'Wallet pushes hit the lock screen — 60%+ open rates.' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.t}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ marginTop: 30, padding: 16, background: 'rgba(255,255,255,0.10)', borderRadius: 12 }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: 'italic' }}>
              &quot;We launched Nook in a weekend. By month two, we&apos;d issued more punch cards than we did in a year of paper.&quot;
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>JK</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Jisoo K. · Owner, Nook Café</div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
