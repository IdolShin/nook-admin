'use client';

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useBreakpoint } from '@/hooks/useBreakpoint';

function PhoneFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  const { isPhone } = useBreakpoint();
  const W = isPhone ? 272 : 320;
  const H = isPhone ? 560 : 660;
  const BR_OUTER = isPhone ? 38 : 44;
  const BR_INNER = isPhone ? 30 : 36;
  const NOTCH_W = isPhone ? 82 : 96;
  const NOTCH_H = isPhone ? 22 : 26;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: W, height: H, borderRadius: BR_OUTER, padding: 8,
        background: '#0E0E12',
        boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: NOTCH_W, height: NOTCH_H, borderRadius: 999, background: '#0E0E12', zIndex: 5,
        }} />
        <div style={{
          width: '100%', height: '100%', borderRadius: BR_INNER,
          overflow: 'hidden', background: 'white', color: '#1A1A1F',
          position: 'relative', display: 'flex', flexDirection: 'column',
        }}>
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
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.1em', opacity: 0.85 }}>NOOK CAFE</div>
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
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: '#1D9E75', textTransform: 'uppercase' }}>Nook Cafe</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>Get your loyalty card</div>
        <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 8, lineHeight: 1.5 }}>
          Earn a free latte after 10 stamps. Lives right inside your wallet -- no app to download.
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

function Step1({ name, phone, onNameChange, onPhoneChange, onNext, loading, error }: {
  name: string; phone: string;
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void;
  onNext: () => void; loading: boolean; error: string;
}) {
  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Join the program</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>Enter your details to get your loyalty card.</div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: '#8A8D94', marginBottom: 6 }}>Name</div>
        <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Your name"
          style={{ width: '100%', boxSizing: 'border-box' as const, padding: '0 12px', height: 50, border: '1px solid #EBEBEB', borderRadius: 12, fontSize: 16, fontFamily: 'inherit', outline: 0 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: '#8A8D94', marginBottom: 6 }}>Mobile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 50, border: '1px solid #EBEBEB', borderRadius: 12 }}>
          <span style={{ fontSize: 14, color: '#5C5F66', fontFamily: 'var(--font-mono)' }}>ðºð¸ +1</span>
          <input value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="(201) 555-0142"
            style={{ flex: 1, border: 0, outline: 0, fontSize: 16, fontFamily: 'inherit', letterSpacing: '0.5px' }} />
        </div>
      </div>
      {error && <div style={{ marginTop: 12, padding: '10px 14px', background: '#FBE2EC', borderRadius: 10, fontSize: 12, color: '#C53A6B' }}>{error}</div>}
      <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 16, lineHeight: 1.5 }}>
        By continuing, you agree to receive transactional and promotional messages from Nook CafÃ©. Reply STOP anytime.
      </div>
      <button onClick={onNext} disabled={loading} style={{ ...ctaStyle, marginTop: 22, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Registering...' : 'Continue'}
      </button>
    </div>
  );
}
function Step2({ onNext }: { onNext: () => void }) {
  const digits = ['1', '8', '2', ' ', ' ', ' '];
  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Enter the code</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>
        We sent a 6-digit code to +1 (201) 555-0142.
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
        Resend in 0:24
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
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>You are in!</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 8, lineHeight: 1.5 }}>
        Your Nook Cafe card is now in your wallet. Show it at checkout to start earning stamps.
      </div>
      <div style={{ marginTop: 24, padding: 14, background: '#F5F6FA', borderRadius: 12, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A8D94', letterSpacing: '.06em', textTransform: 'uppercase' }}>Welcome bonus</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>1 free stamp on us</div>
        <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 4 }}>Just 9 more to a free latte.</div>
      </div>
    </div>
  );
}

const STEP_LABELS = ['QR landing', 'Enter phone', 'Verify', 'Add to wallet', 'Done'];
const STEP_SHORT  = ['QR', 'Phone', 'Verify', 'Wallet', 'Done'];
const STEPS = [Step0, Step1, Step2, Step3, Step4];

function RegisterPage() {
  const [step, setStep] = useState(0);
  const { isPhone } = useBreakpoint();
  const searchParams = useSearchParams();
  const cardId = searchParams?.get('card_id') ?? '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');

  async function handleRegister() {
    if (!name.trim()) { setRegError('Please enter your name.'); return; }
    if (!phone.trim()) { setRegError('Please enter your phone number.'); return; }
    setRegError('');
    setLoading(true);
    try {
      await api.registerCustomer({ card_id: cardId, name: name.trim(), phone: phone.trim() });
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e: unknown) {
      setRegError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const advance = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', padding: isPhone ? '16px' : '24px 28px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header card */}
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: isPhone ? '14px 16px' : 18, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ fontSize: isPhone ? 15 : undefined }}>Customer registration flow</div>
            <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>What customers see when they scan a Nook QR code at the counter.</div>
          </div>

          {/* Step tabs â scrollable on mobile */}
          <div style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            <div style={{
              display: 'flex',
              gap: 4,
              background: '#F0F1F4',
              borderRadius: 9,
              padding: 3,
              width: 'max-content',
              minWidth: '100%',
            }}>
              {(isPhone ? STEP_SHORT : STEP_LABELS).map((s, i) => (
                <button key={i} onClick={() => setStep(i)} style={{
                  height: 28,
                  padding: '0 10px',
                  border: 0,
                  borderRadius: 7,
                  background: step === i ? 'white' : 'transparent',
                  color: step === i ? '#1A1A1F' : '#5C5F66',
                  fontSize: isPhone ? 11 : 12,
                  fontWeight: step === i ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  boxShadow: step === i ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  flexShrink: 0,
                }}>
                  {i + 1}. {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phone mockup + description */}
        <div style={{
          display: 'flex',
          flexDirection: isPhone ? 'column' : 'row',
          gap: isPhone ? 20 : 32,
          alignItems: isPhone ? 'center' : 'flex-start',
        }}>
          <div style={{ flexShrink: 0 }}>
            <PhoneFrame label={`Step ${step + 1} of ${STEP_LABELS.length}`}>
              {step === 0 && <Step0 onNext={advance} />}
              {step === 1 && <Step1 name={name} phone={phone} onNameChange={setName} onPhoneChange={setPhone} onNext={handleRegister} loading={loading} error={regError} />}
              {step === 2 && <Step2 onNext={advance} />}
              {step === 3 && <Step3 onNext={advance} />}
              {step === 4 && <Step4 />}
            </PhoneFrame>
          </div>

          {/* Description panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: isPhone ? 16 : 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                Step {step + 1} â {STEP_LABELS[step]}
              </div>

              {step === 0 && (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1A1A1F' }}>Customer scans the QR code on the counter or printed material and lands on this page.</div>
                  <ul style={{ fontSize: 13, color: '#5C5F66', lineHeight: 1.8, marginTop: 10, paddingLeft: 18 }}>
                    <li>Shows the loyalty card with your brand colors</li>
                    <li>Explains the reward (e.g. free latte after 10 stamps)</li>
                    <li>One-tap flow â no app download needed</li>
                  </ul>
                </>
              )}
              {step === 1 && (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1A1A1F' }}>Customer enters name and phone number. Calls POST /api/customers/register with card_id from URL param.</div>
                  <ul style={{ fontSize: 13, color: '#5C5F66', lineHeight: 1.8, marginTop: 10, paddingLeft: 18 }}>
                    <li>card_id read from ?card_id= URL parameter (set by QR code)</li>
                    <li>Consent defaults to true for both push and points</li>
                    <li>Customer appears instantly in your Customers list</li>
                  </ul>
                </>
              )}
              {step === 2 && (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1A1A1F' }}>A 6-digit OTP is sent via SMS. Customer enters it to verify ownership of the number.</div>
                  <ul style={{ fontSize: 13, color: '#5C5F66', lineHeight: 1.8, marginTop: 10, paddingLeft: 18 }}>
                    <li>Code expires in 10 minutes</li>
                    <li>Resend available after 30 seconds</li>
                    <li>Powered by Twilio (or Resend SMS)</li>
                  </ul>
                </>
              )}
              {step === 3 && (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1A1A1F' }}>Customer adds the card to Apple or Google Wallet. Pre-loaded with their stamp count.</div>
                  <ul style={{ fontSize: 13, color: '#5C5F66', lineHeight: 1.8, marginTop: 10, paddingLeft: 18 }}>
                    <li>Google Wallet: live â passes already working</li>
                    <li>Apple Wallet: requires $99/yr Apple Developer account</li>
                    <li>Pass updates automatically when stamps are added</li>
                  </ul>
                </>
              )}
              {step === 4 && (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1A1A1F' }}>Registration complete. A welcome stamp is optionally issued and the customer is ready to earn.</div>
                  <ul style={{ fontSize: 13, color: '#5C5F66', lineHeight: 1.8, marginTop: 10, paddingLeft: 18 }}>
                    <li>Welcome bonus stamp configurable per card</li>
                    <li>Customer appears instantly in your Customers list</li>
                    <li>Push notifications enabled if consent was given</li>
                  </ul>
                </>
              )}

              <div style={{ marginTop: 16, padding: '10px 14px', background: '#F5F6FA', borderRadius: 9, fontSize: 12, color: '#5C5F66' }}>
                ð¡ Click the phone screen or use the tabs above to navigate between steps.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegisterPage />
    </Suspense>
  )
}
