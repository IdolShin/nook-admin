'use client';

import { useState } from 'react';

function PhoneFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 320, height: 660, borderRadius: 44, padding: 8,
        background: '#0E0E12',
        boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: 96, height: 26, borderRadius: 999, background: '#0E0E12', zIndex: 5,
        }} />
        <div style={{
          width: '100%', height: '100%', borderRadius: 36,
          overflow: 'hidden', background: 'white', color: '#1A1A1F',
          position: 'relative', display: 'flex', flexDirection: 'column',
        }}>
          {/* Status bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px 8px', fontSize: 12, fontWeight: 600 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>9:41</span>
            <span style={{ width: 80 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 8h2M5 6h2M9 4h2M13 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" /><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor" /></svg>
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        </div>
      </div>
      {label && <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>}
    </div>
  );
}

function MiniCard({ w = 200, h = 124 }: { w?: number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 14,
      background: 'linear-gradient(135deg, #0F4D38 0%, #1D9E75 100%)',
      color: 'white', padding: 14, position: 'relative', overflow: 'hidden',
      boxShadow: '0 12px 28px rgba(15,77,56,0.28)',
    }}>
      <div style={{ position: 'absolute', right: -8, bottom: -22, fontSize: 110, opacity: 0.12, fontWeight: 700, lineHeight: 1 }}>N</div>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.1em', opacity: 0.85 }}>NOOK CAFÉ</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Coffee lovers</div>
      <div style={{ fontSize: 9, opacity: 0.85, marginTop: 1 }}>Free latte after 10 stamps</div>
      <div style={{ position: 'absolute', bottom: 12, left: 14, display: 'flex', gap: 4 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ width: 9, height: 9, borderRadius: 999, background: i < 3 ? 'white' : 'rgba(255,255,255,0.2)', border: i >= 3 ? '1px dashed rgba(255,255,255,0.4)' : 'none' }} />
        ))}
      </div>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  width: '100%', height: 50, border: 0, borderRadius: 14,
  background: '#1A1A1F', color: 'white',
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

function Step0({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ padding: '12px 24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0 18px' }}>
        <MiniCard />
      </div>
      <div style={{ textAlign: 'center', padding: '0 4px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: '#1D9E75', textTransform: 'uppercase' }}>Nook Café</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>Get your loyalty card</div>
        <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 8, lineHeight: 1.5 }}>
          Earn a free latte after 10 stamps. Lives right inside your wallet — no app to download.
        </div>
      </div>
      <div style={{ marginTop: 24, padding: 14, background: '#F5F6FA', borderRadius: 12, fontSize: 12, color: '#5C5F66', display: 'grid', gap: 8 }}>
        {['Add the card to your wallet', 'Show it at checkout for stamps', 'Redeem rewards in-store'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, background: '#E8F7F2', color: '#085041', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <button onClick={onNext} style={{ ...ctaStyle, marginTop: 22 }}>Continue</button>
    </div>
  );
}

function Step1({ onNext }: { onNext: () => void }) {
  const [v, setV] = useState('');
  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Your phone number</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>We'll text you a 6-digit code. We never share your number.</div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, color: '#8A8D94', marginBottom: 6 }}>Mobile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 50, border: '1px solid #EBEBEB', borderRadius: 12 }}>
          <span style={{ fontSize: 14, color: '#5C5F66', fontFamily: 'var(--font-mono)' }}>🇺🇸 +1</span>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="(201) 555-0142"
            style={{ flex: 1, border: 0, outline: 0, fontSize: 16, fontFamily: 'inherit', letterSpacing: '0.5px' }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 16, lineHeight: 1.5 }}>
        By continuing, you agree to receive transactional and promotional messages from Nook Café. Reply STOP anytime.
      </div>
      <button onClick={onNext} style={{ ...ctaStyle, marginTop: 22 }}>Send code</button>
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const digits = ['1', '8', '2', ' ', ' ', ' '];
  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Enter the code</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>
        We sent a 6-digit code to <span style={{ fontFamily: 'var(--font-mono)' }}>+1 (201) 555-0142</span>.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 28, justifyContent: 'center' }}>
        {digits.map((c, i) => (
          <div key={i} style={{
            width: 38, height: 50, borderRadius: 10,
            border: c.trim() ? '2px solid #1D9E75' : '1px solid #EBEBEB',
            background: c.trim() ? '#E8F7F2' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)',
          }}>{c.trim()}</div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: '#8A8D94' }}>
        Didn't get it? <span style={{ color: '#085041', fontWeight: 500 }}>Resend in 0:24</span>
      </div>
      <button onClick={onNext} style={{ ...ctaStyle, marginTop: 28 }}>Verify</button>
    </div>
  );
}

function Step3({ onNext }: { onNext: () => void }) {
  const AppleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 11.97c-.03-2.92 2.39-4.32 2.5-4.39-1.36-1.99-3.48-2.27-4.24-2.3-1.81-.18-3.53 1.06-4.45 1.06-.93 0-2.34-1.04-3.85-1.01-1.98.03-3.81 1.15-4.83 2.93-2.06 3.57-.53 8.86 1.48 11.76.99 1.42 2.16 3.01 3.7 2.95 1.49-.06 2.05-.96 3.85-.96 1.79 0 2.31.96 3.88.93 1.6-.03 2.61-1.44 3.59-2.86 1.13-1.64 1.6-3.23 1.62-3.31-.04-.02-3.11-1.19-3.14-4.73zM14.07 3.97c.83-1 1.39-2.39 1.23-3.78-1.2.05-2.65.8-3.5 1.79-.77.88-1.44 2.29-1.26 3.66 1.34.1 2.7-.68 3.53-1.67z" />
    </svg>
  );
  return (
    <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Add to wallet</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>Your card is ready. Add it to keep it handy.</div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <MiniCard w={240} h={148} />
      </div>
      <button onClick={onNext} style={{
        ...ctaStyle, background: 'black',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <AppleLogo /> Add to Apple Wallet
      </button>
      <button onClick={onNext} style={{
        ...ctaStyle, marginTop: 8,
        background: 'white', color: '#1A1A1F',
        border: '1px solid #EBEBEB',
      }}>
        Save to Google Wallet
      </button>
    </div>
  );
}

function Step4() {
  return (
    <div style={{ padding: '60px 24px 28px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: 999, background: '#E8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>You're in!</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 8, lineHeight: 1.5 }}>
        Your Nook Café card is now in your wallet. Show it at checkout to start earning stamps.
      </div>
      <div style={{ marginTop: 24, padding: 14, background: '#F5F6FA', borderRadius: 12, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A8D94', letterSpacing: '.06em', textTransform: 'uppercase' }}>Welcome bonus</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>1 free stamp on us 🎉</div>
        <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 4 }}>It's already on your card. Just 9 more to a free latte.</div>
      </div>
    </div>
  );
}

const STEP_LABELS = ['QR landing', 'Enter phone', 'Verify', 'Add to wallet', 'Done'];

export default function RegisterPage() {
  const [step, setStep] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', padding: '24px 28px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 18, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">Customer registration flow</div>
              <div style={{ fontSize: 12, color: '#8A8D94' }}>What customers see when they scan a Nook QR code at the counter.</div>
            </div>
            <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
              {STEP_LABELS.map((s, i) => (
                <button key={i} onClick={() => setStep(i)} style={{
                  height: 26, padding: '0 10px', border: 0, borderRadius: 7,
                  background: step === i ? 'white' : 'transparent',
                  color: step === i ? '#1A1A1F' : '#5C5F66',
                  fontSize: 12, fontWeight: step === i ? 500 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: step === i ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>{i + 1}. {s}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <PhoneFrame label={`Step ${step + 1}: ${STEP_LABELS[step]}`}>
            {step === 0 && <Step0 onNext={() => setStep(1)} />}
            {step === 1 && <Step1 onNext={() => setStep(2)} />}
            {step === 2 && <Step2 onNext={() => setStep(3)} />}
            {step === 3 && <Step3 onNext={() => setStep(4)} />}
            {step === 4 && <Step4 />}
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
