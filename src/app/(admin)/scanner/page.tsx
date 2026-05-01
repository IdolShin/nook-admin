'use client';

import { useState } from 'react';

type Mode = 'stamp' | 'coupon';
type StampView = 'scan' | 'success' | 'customer';
type CouponView = 'scan' | 'found' | 'success' | 'already_redeemed' | 'expired';

function ActionBtn({ primary, danger, amber, label, sub, onClick }: {
  primary?: boolean; danger?: boolean; amber?: boolean;
  label: string; sub?: string; onClick?: () => void;
}) {
  const bg = primary ? '#1D9E75' : danger ? '#C53A6B' : amber ? '#C26B1F' : 'rgba(255,255,255,0.06)';
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
      padding: '14px 16px', border: 0, borderRadius: 12,
      background: bg, color: 'white', cursor: 'pointer', fontFamily: 'inherit',
      textAlign: 'left', width: '100%',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, opacity: (primary || danger || amber) ? 0.7 : 0.55 }}>{sub}</span>}
    </button>
  );
}

function Viewfinder({ mode }: { mode: Mode }) {
  return (
    <div style={{
      flex: 1, borderRadius: 16,
      background: 'radial-gradient(circle at center, #15171D 0%, #0A0A0E 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 240, height: 240, borderRadius: 24,
          border: '2px solid rgba(125,217,181,0.5)',
          position: 'relative',
          boxShadow: '0 0 0 8px rgba(29,158,117,0.06)',
        }}>
          {[
            { top: -2, left: -2, borderTop: '3px solid #1D9E75', borderLeft: '3px solid #1D9E75', borderRadius: '0 0 16px 0' },
            { top: -2, right: -2, borderTop: '3px solid #1D9E75', borderRight: '3px solid #1D9E75', borderRadius: '0 0 0 16px' },
            { bottom: -2, left: -2, borderBottom: '3px solid #1D9E75', borderLeft: '3px solid #1D9E75', borderRadius: '0 16px 0 0' },
            { bottom: -2, right: -2, borderBottom: '3px solid #1D9E75', borderRight: '3px solid #1D9E75', borderRadius: '16px 0 0 0' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 36, height: 36, ...s }} />
          ))}
          <div style={{
            position: 'absolute', left: 8, right: 8, height: 2,
            background: 'linear-gradient(90deg, transparent, #1D9E75, transparent)',
            top: '50%', boxShadow: '0 0 12px #1D9E75',
          }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 14, opacity: 0.7 }}>
        {mode === 'stamp' ? "Hold the customer's QR or barcode in the frame" : 'Hold the coupon barcode in the frame'}
      </div>
    </div>
  );
}

/* ─── Stamp mode views ─────────────────────────────────────── */

function StampScanView() {
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <Viewfinder mode="stamp" />
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionBtn primary label="Add stamp" sub="+1 to current card" />
        <ActionBtn label="Redeem reward" sub="Free latte etc." />
        <ActionBtn label="Look up by phone" sub="If no card on hand" />
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.06em' }}>Today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12 }}>Stamps</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>42</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 12 }}>Redeems</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StampSuccessView() {
  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: 'rgba(29,158,117,0.18)', color: '#7DD9B5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(29,158,117,0.06)',
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22 }}>Stamp added</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>
        Min-jae Kim · Coffee lovers · <span style={{ fontFamily: 'var(--font-mono)' }}>7/10</span>
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 18 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{
            width: 18, height: 18, borderRadius: 999,
            background: i < 7 ? '#1D9E75' : 'rgba(255,255,255,0.12)',
            border: i >= 7 ? '1px dashed rgba(255,255,255,0.2)' : 'none',
          }} />
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>Auto-returning to scanner in 3s</div>
    </div>
  );
}

function StampCustomerView() {
  const cards = [
    { n: 'Coffee lovers', p: 6, max: 10, type: 'Stamp', note: null },
    { n: 'Welcome bonus', p: null, max: null, type: 'Coupon', note: 'Free pastry · expires May 14' },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <div style={{ flex: 1, padding: 22, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: '#1D9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, flexShrink: 0 }}>MK</div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Min-jae Kim</div>
            <div style={{ fontSize: 12, opacity: 0.55, fontFamily: 'var(--font-mono)' }}>+1 201 555 0142 · Member since Mar 2026</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(194,107,31,0.18)', color: '#E0A560', fontWeight: 500 }}>● VIP</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>38 stamps</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>2 cards</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Cards in wallet</div>
          {cards.map((c, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.n}</div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>{c.note || `${c.p} of ${c.max} stamps`}</div>
                </div>
                <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(29,158,117,0.18)', color: '#7DD9B5', fontWeight: 500 }}>{c.type}</div>
              </div>
              {c.p != null && c.max != null && (
                <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
                  {Array.from({ length: c.max }).map((_, j) => (
                    <span key={j} style={{ flex: 1, height: 6, borderRadius: 999, background: j < c.p! ? '#1D9E75' : 'rgba(255,255,255,0.10)' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionBtn primary label="+ Add stamp" sub="Coffee lovers" />
        <ActionBtn label="Redeem coupon" sub="Free pastry" />
        <ActionBtn label="View history" />
        <div style={{ flex: 1 }} />
        <button style={{ padding: '14px 16px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, background: 'transparent', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Coupon mode views ────────────────────────────────────── */

function CouponScanView() {
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <Viewfinder mode="coupon" />
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionBtn primary label="Scan barcode" sub="Point camera at coupon" />
        <ActionBtn label="Enter manually" sub="Type barcode number" />
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.06em' }}>Today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12 }}>Coupons redeemed</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CouponFoundView() {
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <div style={{ flex: 1, padding: 22, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Coupon card */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(135deg, #1D9E75 0%, #0D6B45 100%)',
          padding: 22,
        }}>
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Coupon</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>20% OFF</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>Welcome Bonus — Any purchase</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Customer</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Min-jae Kim</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Expires</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>May 14, 2026</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: '.06em' }}>BARCODE</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>487 293 104 855</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 11, opacity: 0.55 }}>Status</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#7DD9B5', marginTop: 2 }}>● Active</div>
          </div>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 11, opacity: 0.55 }}>Valid days left</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: 2 }}>13</div>
          </div>
        </div>
      </div>

      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionBtn primary label="Redeem Coupon" sub="Mark as used" />
        <ActionBtn label="Cancel" />
      </div>
    </div>
  );
}

function CouponSuccessView() {
  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: 'rgba(29,158,117,0.18)', color: '#7DD9B5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(29,158,117,0.06)',
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22 }}>Coupon redeemed</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>Min-jae Kim · 20% OFF</div>
      <div style={{ marginTop: 16, padding: '6px 16px', borderRadius: 999, background: 'rgba(29,158,117,0.16)', color: '#7DD9B5', fontSize: 12 }}>
        Welcome Bonus · Any purchase
      </div>
      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>Auto-returning to scanner in 3s</div>
    </div>
  );
}

function CouponAlreadyRedeemedView() {
  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: 'rgba(194,107,31,0.18)', color: '#E0A560',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(194,107,31,0.06)',
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22, color: '#E0A560' }}>Already Redeemed</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>This coupon was used on Apr 30, 2026</div>
      <div style={{ marginTop: 16, padding: '6px 16px', borderRadius: 999, background: 'rgba(194,107,31,0.16)', color: '#E0A560', fontSize: 12 }}>
        Min-jae Kim · Welcome Bonus
      </div>
      <button style={{
        marginTop: 24, height: 34, padding: '0 18px', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
      }}>Return to scanner</button>
    </div>
  );
}

function CouponExpiredView() {
  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: 'rgba(197,58,107,0.18)', color: '#E07090',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(197,58,107,0.06)',
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22, color: '#E07090' }}>Coupon Expired</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>Expired on Apr 14, 2026 — cannot be redeemed</div>
      <div style={{ marginTop: 16, padding: '6px 16px', borderRadius: 999, background: 'rgba(197,58,107,0.16)', color: '#E07090', fontSize: 12 }}>
        Min-jae Kim · Welcome Bonus
      </div>
      <button style={{
        marginTop: 24, height: 34, padding: '0 18px', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
      }}>Return to scanner</button>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

const STAMP_VIEWS: { id: StampView; label: string }[] = [
  { id: 'scan',     label: 'Scan' },
  { id: 'success',  label: 'Stamp added' },
  { id: 'customer', label: 'Customer found' },
];

const COUPON_VIEWS: { id: CouponView; label: string }[] = [
  { id: 'scan',              label: 'Scan' },
  { id: 'found',             label: 'Coupon found' },
  { id: 'success',           label: 'Redeemed' },
  { id: 'already_redeemed',  label: 'Already redeemed' },
  { id: 'expired',           label: 'Expired' },
];

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>('stamp');
  const [stampView, setStampView] = useState<StampView>('scan');
  const [couponView, setCouponView] = useState<CouponView>('scan');

  const stampViewBtns = STAMP_VIEWS;
  const couponViewBtns = COUPON_VIEWS;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', padding: '24px 28px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">Staff scanner</div>
              <div style={{ fontSize: 12, color: '#8A8D94' }}>The tablet view shop staff use to add stamps and redeem coupons. Designed for one-handed use.</div>
            </div>
            {/* Outer preview switcher */}
            <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
              {mode === 'stamp'
                ? stampViewBtns.map((v) => (
                    <button key={v.id} onClick={() => setStampView(v.id)} style={{
                      height: 26, padding: '0 10px', border: 0, borderRadius: 7,
                      background: stampView === v.id ? 'white' : 'transparent',
                      color: stampView === v.id ? '#1A1A1F' : '#5C5F66',
                      fontSize: 12, fontWeight: stampView === v.id ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: stampView === v.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}>{v.label}</button>
                  ))
                : couponViewBtns.map((v) => (
                    <button key={v.id} onClick={() => setCouponView(v.id)} style={{
                      height: 26, padding: '0 10px', border: 0, borderRadius: 7,
                      background: couponView === v.id ? 'white' : 'transparent',
                      color: couponView === v.id ? '#1A1A1F' : '#5C5F66',
                      fontSize: 12, fontWeight: couponView === v.id ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: couponView === v.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}>{v.label}</button>
                  ))
              }
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          {/* Tablet frame */}
          <div style={{
            width: 720, height: mode === 'stamp' ? 480 : 500, borderRadius: 22,
            background: '#0A0A0E', color: 'white',
            boxShadow: '0 30px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)',
            padding: 18, position: 'relative', overflow: 'hidden',
            fontFamily: 'var(--font-sans)',
            transition: 'height 200ms',
          }}>
            {/* Topbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: '#1D9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>n</div>
                <div style={{ fontSize: 13 }}>Nook Café · <span style={{ opacity: 0.5 }}>Counter</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3 }}>
                  {(['stamp', 'coupon'] as Mode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)} style={{
                      height: 22, padding: '0 10px', border: 0, borderRadius: 6,
                      background: mode === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                      fontSize: 11, fontWeight: mode === m ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 120ms',
                    }}>
                      {m === 'stamp' ? 'Stamp Card' : 'Coupon'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', background: 'rgba(29,158,117,0.16)', color: '#7DD9B5', borderRadius: 999 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: '#1D9E75', display: 'inline-block' }} /> Online
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>9:41</div>
                <button style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer' }}>⏻</button>
              </div>
            </div>

            {/* Content */}
            {mode === 'stamp' && stampView === 'scan'     && <StampScanView />}
            {mode === 'stamp' && stampView === 'success'  && <StampSuccessView />}
            {mode === 'stamp' && stampView === 'customer' && <StampCustomerView />}

            {mode === 'coupon' && couponView === 'scan'             && <CouponScanView />}
            {mode === 'coupon' && couponView === 'found'            && <CouponFoundView />}
            {mode === 'coupon' && couponView === 'success'          && <CouponSuccessView />}
            {mode === 'coupon' && couponView === 'already_redeemed' && <CouponAlreadyRedeemedView />}
            {mode === 'coupon' && couponView === 'expired'          && <CouponExpiredView />}
          </div>
        </div>
      </div>
    </div>
  );
}
