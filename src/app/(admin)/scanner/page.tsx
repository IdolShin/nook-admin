'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

type Mode = 'stamp' | 'coupon';
type StampView = 'scan' | 'success' | 'customer';
type CouponView = 'scan' | 'found' | 'success' | 'already_redeemed' | 'expired';

interface StampResult {
  customerId: string;
  customerName: string;
  cardType: string;
  newStamps: number;
  goalStamps: number;
  rewardReady: boolean;
  rewardDesc: string | null;
  rewardsEarned: number;
  totalPoints: number | null;
  pointsEarned: number | null;
}
interface CouponResult { customerName: string; couponTitle: string }

function ActionBtn({ primary, danger, amber, label, sub, onClick, disabled }: {
  primary?: boolean; danger?: boolean; amber?: boolean;
  label: string; sub?: string; onClick?: () => void; disabled?: boolean;
}) {
  const bg = primary ? '#1D9E75' : danger ? '#C53A6B' : amber ? '#C26B1F' : 'rgba(255,255,255,0.06)';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
      padding: '14px 16px', border: 0, borderRadius: 12,
      background: disabled ? 'rgba(255,255,255,0.04)' : bg,
      color: 'white', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      textAlign: 'left', width: '100%', opacity: disabled ? 0.5 : 1,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, opacity: 0.7 }}>{sub}</span>}
    </button>
  );
}

// ─── Live camera viewfinder with BarcodeDetector ──────────────
function Viewfinder({ mode, onDetect }: { mode: Mode; onDetect?: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [autoScan, setAutoScan] = useState(false);

  useEffect(() => {
    let stopped = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);

        // BarcodeDetector — Chrome/Edge/Android/iOS 17+
        if ('BarcodeDetector' in window && onDetect) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
          });
          setAutoScan(true);

          function loop() {
            if (stopped || !videoRef.current) return;
            if (!cooldownRef.current && videoRef.current.readyState >= 2) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              detector.detect(videoRef.current).then((codes: any[]) => {
                if (codes.length > 0 && !cooldownRef.current) {
                  cooldownRef.current = true;
                  onDetect(codes[0].rawValue);
                  // 2.5s cooldown to avoid double-triggering
                  setTimeout(() => { cooldownRef.current = false; }, 2500);
                }
              }).catch(() => {});
            }
            rafRef.current = requestAnimationFrame(loop);
          }
          rafRef.current = requestAnimationFrame(loop);
        }
      } catch (err: unknown) {
        if (!stopped) {
          const name = (err as { name?: string }).name;
          setCameraError(
            name === 'NotAllowedError' ? 'Camera permission denied' :
            name === 'NotFoundError'   ? 'No camera found' :
            'Camera unavailable'
          );
        }
      }
    }

    start();
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      flex: 1, borderRadius: 16,
      background: 'radial-gradient(circle at center, #15171D 0%, #0A0A0E 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* CSS animation for scan line */}
      <style>{`
        @keyframes scan-sweep {
          0%   { top: 15%; opacity: 1; }
          48%  { top: 85%; opacity: 1; }
          50%  { opacity: 0; }
          52%  { top: 15%; opacity: 0; }
          54%  { opacity: 1; }
          100% { top: 15%; opacity: 1; }
        }
        .scanner-line { animation: scan-sweep 2.4s ease-in-out infinite; }
      `}</style>

      {/* Live camera feed */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          display: cameraReady ? 'block' : 'none',
        }}
        autoPlay muted playsInline
      />

      {/* Scanning frame overlay */}
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
          {/* Animated scan line */}
          {cameraReady && (
            <div className="scanner-line" style={{
              position: 'absolute', left: 8, right: 8, height: 2,
              background: 'linear-gradient(90deg, transparent, #1D9E75, transparent)',
              boxShadow: '0 0 10px #1D9E75',
            }} />
          )}
        </div>
      </div>

      {/* Status message */}
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 12, padding: '0 12px' }}>
        {cameraError ? (
          <span style={{ color: '#FF8A9A' }}>{cameraError} — enter code manually →</span>
        ) : !cameraReady ? (
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Starting camera…</span>
        ) : autoScan ? (
          <span style={{ color: 'rgba(125,217,181,0.9)', fontWeight: 500 }}>
            Auto-scanning · hold {mode === 'stamp' ? 'QR or barcode' : 'coupon barcode'} steady
          </span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>
            Camera live · auto-scan not supported — enter code manually →
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Stamp mode views ─────────────────────────────────────── */

function StampScanView({ code, setCode, onAddStamp, onCameraDetect, loading, error }: {
  code: string; setCode: (v: string) => void;
  onAddStamp: () => void; onCameraDetect: (c: string) => void;
  loading: boolean; error: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <Viewfinder mode="stamp" onDetect={onCameraDetect} />
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddStamp()}
            placeholder="Barcode or QR code…"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
              color: 'white', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ fontSize: 11, color: '#FF8A9A', padding: '4px 0' }}>{error}</div>}
        </div>
        <ActionBtn primary label={loading ? 'Adding…' : 'Add stamp'} sub="+1 to current card" onClick={onAddStamp} disabled={loading || !code.trim()} />
        <ActionBtn label="Redeem reward" sub="Free latte etc." />
        <ActionBtn label="Look up by phone" sub="If no card on hand" />
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.06em' }}>Today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12 }}>Stamps</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>—</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 12 }}>Redeems</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>—</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StampSuccessView({ data, onBack, onRedeem, redeeming }: {
  data: StampResult | null; onBack: () => void;
  onRedeem: () => void; redeeming: boolean;
}) {
  const name = data?.customerName ?? '—';
  const isMembership = data?.cardType === 'membership';

  if (isMembership) {
    const totalPts = data?.totalPoints ?? 0;
    const earned = data?.pointsEarned ?? 100;
    return (
      <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 999,
          background: 'rgba(99,102,241,0.18)', color: '#A5B4FC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 14px rgba(99,102,241,0.06)',
        }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22 }}>Points added!</div>
        <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>{name}</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <div style={{ padding: '14px 22px', borderRadius: 14, background: 'rgba(99,102,241,0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Earned</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#A5B4FC', fontFamily: 'var(--font-mono)', marginTop: 4 }}>+{earned}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>pts</div>
          </div>
          <div style={{ padding: '14px 22px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Total</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4 }}>{totalPts.toLocaleString()}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>pts</div>
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>Auto-returning in 4s</div>
        <button onClick={onBack} style={{ marginTop: 12, fontSize: 12, background: 'none', border: 0, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Return now</button>
      </div>
    );
  }

  const stamps = data?.newStamps ?? 0;
  const goal = data?.goalStamps ?? 10;
  const rewardsEarned = data?.rewardsEarned ?? 0;
  const rewardDesc = data?.rewardDesc;

  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: data?.rewardReady ? 'rgba(255,193,7,0.18)' : 'rgba(29,158,117,0.18)',
        color: data?.rewardReady ? '#FFD54F' : '#7DD9B5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: data?.rewardReady ? '0 0 0 14px rgba(255,193,7,0.08)' : '0 0 0 14px rgba(29,158,117,0.06)',
      }}>
        {data?.rewardReady
          ? <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
          : <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
        }
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 20, textAlign: 'center' }}>
        {data?.rewardReady ? 'Reward Earned!' : 'Stamp Added'}
      </div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 5 }}>
        {name} {String.fromCharCode(183)} <span style={{ fontFamily: 'var(--font-mono)' }}>{stamps}/{goal}</span>
        {rewardsEarned > 0 && (
          <span style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontSize: 11 }}>
            {rewardsEarned}x redeemed
          </span>
        )}
      </div>

      {/* Stamp grid */}
      <div style={{ display: 'flex', gap: 5, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
        {Array.from({ length: goal }).map((_, i) => (
          <span key={i} style={{
            width: 16, height: 16, borderRadius: 999,
            background: i < stamps ? '#1D9E75' : 'rgba(255,255,255,0.12)',
            border: i >= stamps ? '1px dashed rgba(255,255,255,0.2)' : 'none',
          }} />
        ))}
      </div>

      {/* Reward ready — big action area */}
      {data?.rewardReady && (
        <div style={{
          marginTop: 18, width: '100%', maxWidth: 320,
          background: 'rgba(255,193,7,0.12)', border: '1.5px solid rgba(255,193,7,0.35)',
          borderRadius: 14, padding: '16px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#FFD54F', opacity: 0.8 }}>Give customer</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#FFD54F', marginTop: 4, letterSpacing: '-0.01em' }}>
            {rewardDesc || 'Free reward'}
          </div>
          <button
            onClick={onRedeem}
            disabled={redeeming}
            style={{
              marginTop: 12, width: '100%', height: 44, borderRadius: 10,
              background: redeeming ? 'rgba(255,193,7,0.3)' : 'rgba(255,193,7,0.85)',
              color: '#1A1A00', border: 0, fontSize: 14, fontWeight: 700,
              cursor: redeeming ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}
          >
            {redeeming ? 'Processing...' : 'Confirm Reward Given'}
          </button>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>Tap after handing out the reward</div>
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.5 }}>Auto-returning in 4s</div>
      <button onClick={onBack} style={{ marginTop: 8, fontSize: 12, background: 'none', border: 0, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Return now</button>
    </div>
  );
}

function StampCustomerView() {
  const cards = [
    { n: 'Coffee lovers', p: 6, max: 10, type: 'Stamp', note: null },
    { n: 'Welcome bonus', p: null, max: null, type: 'Coupon', note: `Free pastry ${String.fromCharCode(183)} expires May 14` },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <div style={{ flex: 1, padding: 22, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: '#1D9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, flexShrink: 0 }}>MK</div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Min-jae Kim</div>
            <div style={{ fontSize: 12, opacity: 0.55, fontFamily: 'var(--font-mono)' }}>+1 201 555 0142 {String.fromCharCode(183)} Member since Mar 2026</div>
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

function CouponScanView({ code, setCode, onRedeem, onCameraDetect, loading, error }: {
  code: string; setCode: (v: string) => void;
  onRedeem: () => void; onCameraDetect: (c: string) => void;
  loading: boolean; error: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 50px)' }}>
      <Viewfinder mode="coupon" onDetect={onCameraDetect} />
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onRedeem()}
            placeholder="Coupon barcode…"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
              color: 'white', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ fontSize: 11, color: '#FF8A9A', padding: '4px 0' }}>{error}</div>}
        </div>
        <ActionBtn primary label={loading ? 'Redeeming…' : 'Redeem coupon'} sub="Mark as used" onClick={onRedeem} disabled={loading || !code.trim()} />
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.06em' }}>Today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12 }}>Coupons redeemed</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>—</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CouponSuccessView({ data, onBack }: { data: CouponResult | null; onBack: () => void }) {
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
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>{data?.customerName ?? '—'} {String.fromCharCode(183)} {data?.couponTitle ?? '—'}</div>
      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>Auto-returning in 4s</div>
      <button onClick={onBack} style={{ marginTop: 12, fontSize: 12, background: 'none', border: 0, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Return now</button>
    </div>
  );
}

function CouponAlreadyRedeemedView({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: 'rgba(194,107,31,0.18)', color: '#E0A560',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(194,107,31,0.06)',
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22, color: '#E0A560' }}>Already Redeemed</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>This coupon has already been used</div>
      <button onClick={onBack} style={{ marginTop: 24, height: 34, padding: '0 18px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Return to scanner</button>
    </div>
  );
}

function CouponExpiredView({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: 'rgba(197,58,107,0.18)', color: '#E07090',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(197,58,107,0.06)',
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22, color: '#E07090' }}>Coupon Expired</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>This coupon cannot be redeemed</div>
      <button onClick={onBack} style={{ marginTop: 24, height: 34, padding: '0 18px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Return to scanner</button>
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
  { id: 'scan',             label: 'Scan' },
  { id: 'found',            label: 'Coupon found' },
  { id: 'success',          label: 'Redeemed' },
  { id: 'already_redeemed', label: 'Already redeemed' },
  { id: 'expired',          label: 'Expired' },
];

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>('stamp');
  const [stampView, setStampView] = useState<StampView>('scan');
  const [couponView, setCouponView] = useState<CouponView>('scan');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stampData, setStampData] = useState<StampResult | null>(null);
  const [couponData, setCouponData] = useState<CouponResult | null>(null);

  // ── Core stamp handler ─────────────────────────────────────
  const doAddStamp = useCallback(async (scanCode: string) => {
    if (!scanCode.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.scanStamp(scanCode.trim(), 'barcode');
      setStampData({
        customerId:    res.customer_id,
        customerName:  res.customer_name,
        cardType:      res.card_type || 'stamp',
        newStamps:     res.new_stamps ?? 0,
        goalStamps:    res.goal_stamps ?? 10,
        rewardReady:   res.reward_ready,
        rewardDesc:    res.reward_desc ?? null,
        rewardsEarned: res.rewards_earned ?? 0,
        totalPoints:   res.total_points ?? null,
        pointsEarned:  res.points_earned ?? null,
      });
      setStampView('success');
      setCode('');
      setTimeout(() => { setStampData(null); setStampView('scan'); }, 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Scan failed';
      try { setError(JSON.parse(msg).error ?? msg); } catch { setError(msg); }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  async function handleAddStamp() { await doAddStamp(code); }

  // ── Core coupon handler ────────────────────────────────────
  const doRedeemCoupon = useCallback(async (scanCode: string) => {
    if (!scanCode.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.redeemCoupon(scanCode.trim());
      setCouponData({ customerName: res.customer.name, couponTitle: res.coupon.title });
      setCouponView('success');
      setCode('');
      setTimeout(() => { setCouponData(null); setCouponView('scan'); }, 4000);
    } catch (e) {
      const msg = (e instanceof Error ? e.message : '').toLowerCase();
      if (msg.includes('already') || msg.includes('redeemed')) {
        setCouponView('already_redeemed'); setCode('');
      } else if (msg.includes('expired')) {
        setCouponView('expired'); setCode('');
      } else {
        const raw = e instanceof Error ? e.message : 'Redeem failed';
        try { setError(JSON.parse(raw).error ?? raw); } catch { setError(raw); }
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  async function handleRedeemCoupon() { await doRedeemCoupon(code); }

  // ── Camera auto-detect callbacks ───────────────────────────
  const handleCamDetectStamp = useCallback((detected: string) => {
    setCode(detected);
    doAddStamp(detected);
  }, [doAddStamp]);

  const handleCamDetectCoupon = useCallback((detected: string) => {
    setCode(detected);
    doRedeemCoupon(detected);
  }, [doRedeemCoupon]);

  // ── Redeem directly from stamp success view ───────────────
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeemFromSuccess = useCallback(async () => {
    if (!stampData?.customerId || redeeming) return;
    setRedeeming(true);
    try {
      const res = await api.redeemStamp(stampData.customerId);
      // Show brief redeemed confirmation then reset
      setStampData(prev => prev ? { ...prev, rewardReady: false } : null);
      toast(`"${res.reward_desc || 'Reward'}" confirmed!`, 'success');
      setTimeout(() => { setStampData(null); setStampView('scan'); }, 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Redeem failed';
      toast(msg, 'error');
    } finally {
      setRedeeming(false);
    }
  }, [stampData, redeeming]);

  const resetStamp  = () => { setStampView('scan');  setStampData(null);  setError(''); setCode(''); };
  const resetCoupon = () => { setCouponView('scan'); setCouponData(null); setError(''); setCode(''); };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', padding: '24px 28px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">Staff scanner</div>
              <div style={{ fontSize: 12, color: '#8A8D94' }}>Scan a customer&apos;s QR or barcode to add stamps and redeem coupons.</div>
            </div>
            {/* View switcher */}
            <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
              {mode === 'stamp'
                ? STAMP_VIEWS.map((v) => (
                    <button key={v.id} onClick={() => setStampView(v.id)} style={{
                      height: 26, padding: '0 10px', border: 0, borderRadius: 7,
                      background: stampView === v.id ? 'white' : 'transparent',
                      color: stampView === v.id ? '#1A1A1F' : '#5C5F66',
                      fontSize: 12, fontWeight: stampView === v.id ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: stampView === v.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}>{v.label}</button>
                  ))
                : COUPON_VIEWS.map((v) => (
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
                <div style={{ fontSize: 13 }}>Nook Café {String.fromCharCode(183)} <span style={{ opacity: 0.5 }}>Counter</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3 }}>
                  {(['stamp', 'coupon'] as Mode[]).map((m) => (
                    <button key={m} onClick={() => { setMode(m); setCode(''); setError(''); }} style={{
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
              </div>
            </div>

            {/* Content */}
            {mode === 'stamp' && stampView === 'scan'     && <StampScanView code={code} setCode={setCode} onAddStamp={handleAddStamp} onCameraDetect={handleCamDetectStamp} loading={loading} error={error} />}
            {mode === 'stamp' && stampView === 'success'  && <StampSuccessView data={stampData} onBack={resetStamp} onRedeem={handleRedeemFromSuccess} redeeming={redeeming} />}
            {mode === 'stamp' && stampView === 'customer' && <StampCustomerView />}

            {mode === 'coupon' && couponView === 'scan'             && <CouponScanView code={code} setCode={setCode} onRedeem={handleRedeemCoupon} onCameraDetect={handleCamDetectCoupon} loading={loading} error={error} />}
            {mode === 'coupon' && couponView === 'success'          && <CouponSuccessView data={couponData} onBack={resetCoupon} />}
            {mode === 'coupon' && couponView === 'already_redeemed' && <CouponAlreadyRedeemedView onBack={resetCoupon} />}
            {mode === 'coupon' && couponView === 'expired'          && <CouponExpiredView onBack={resetCoupon} />}
          </div>
        </div>
      </div>
    </div>
  );
}
