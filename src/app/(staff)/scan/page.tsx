'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, RotateCw, Check, X, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlan } from '@/hooks/usePlan';

interface ScanResult {
  ok: boolean;
  msg: string;
  customer?: string;
  stamps?: number;
  goal?: number;
}

export default function ScanPage() {
  // Business prefix for the customer code (e.g. "NOO" for "Nook Cafe").
  // Staff type ONLY the number; the prefix is added automatically.
  // Must match unique_key generation in backend customers.js.
  const { businessName } = usePlan();
  const prefix = (businessName || 'NOO')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const cooldownRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [retry, setRetry] = useState(0);
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  // ── Submit a code (from camera OR manual) ──────────────────
  const submitCode = useCallback(async (code: string) => {
    const clean = code.trim();
    if (!clean || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.scanStamp(clean, 'barcode');
      setResult({
        ok: true,
        msg: data.message,
        customer: data.customer_name,
        stamps: data.new_stamps ?? undefined,
        goal: data.goal_stamps ?? undefined,
      });
      setDigits('');
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Scan failed';
      try { msg = JSON.parse(msg).error ?? msg; } catch {}
      setResult({ ok: false, msg });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // ── Camera (ZXing — works on iPhone Safari + Android) ──────
  useEffect(() => {
    let stopped = false;
    setCameraError('');
    setCameraReady(false);

    function describeError(err: unknown): string {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'SecurityError')
        return 'Camera is blocked. Allow camera access, then tap Retry.';
      if (name === 'NotFoundError' || name === 'OverconstrainedError')
        return 'No camera found on this device.';
      if (name === 'NotReadableError')
        return 'Camera is used by another app. Close it and tap Retry.';
      return 'Cannot open camera. Type the number below instead.';
    }

    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser cannot use the camera. Type the number below.');
        return;
      }
      if (!videoRef.current) return;

      const reader = new BrowserMultiFormatReader();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onResult = (res: any) => {
        if (!res || stopped || cooldownRef.current) return;
        cooldownRef.current = true;
        submitCode(res.getText());
        setTimeout(() => { cooldownRef.current = false; }, 2500);
      };

      try {
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (res) => onResult(res),
        );
      } catch {
        try {
          controlsRef.current = await reader.decodeFromConstraints(
            { video: true },
            videoRef.current,
            (res) => onResult(res),
          );
        } catch (err2: unknown) {
          if (!stopped) setCameraError(describeError(err2));
          return;
        }
      }

      if (stopped) { try { controlsRef.current?.stop(); } catch {} return; }
      setCameraReady(true);
    }

    start();
    return () => {
      stopped = true;
      try { controlsRef.current?.stop(); } catch {}
    };
  }, [retry, submitCode]);

  function handleManualSubmit() {
    if (!digits) return;
    submitCode(prefix + digits);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0E', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Camera size={20} color="#7DD9B5" />
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Scan Customer</h1>
      </div>

      {/* Camera viewfinder */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'radial-gradient(circle at center, #15171D 0%, #0A0A0E 100%)' }}>
        {/* Video must stay mounted + visible (display:none breaks iOS Safari). */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: cameraReady ? 1 : 0, transition: 'opacity 200ms',
          }}
        />

        {/* Scan frame */}
        {cameraReady && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 220, height: 220, border: '3px solid #1D9E75', borderRadius: 16,
            boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45)',
          }} />
        )}

        {/* Status / error overlay */}
        {!cameraReady && (
          <div style={{ position: 'relative', textAlign: 'center', padding: 32, maxWidth: 320 }}>
            {cameraError ? (
              <>
                <X size={36} color="#FF8A9A" style={{ marginBottom: 10 }} />
                <div style={{ color: '#FF8A9A', fontSize: 14, lineHeight: 1.5 }}>{cameraError}</div>
                <button
                  onClick={() => setRetry((n) => n + 1)}
                  style={{
                    marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  }}
                >
                  <RotateCw size={16} /> Retry camera
                </button>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Starting camera…</div>
            )}
          </div>
        )}

        {/* Live hint */}
        {cameraReady && (
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: 'rgba(125,217,181,0.9)', fontWeight: 500 }}>
            Point at the customer&apos;s QR or barcode
          </div>
        )}
      </div>

      {/* Manual entry + result */}
      <div style={{ padding: '18px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {result && (
          <div style={{
            marginBottom: 14, padding: 14, borderRadius: 12,
            background: result.ok ? 'rgba(29,158,117,0.15)' : 'rgba(197,58,107,0.15)',
            border: `1px solid ${result.ok ? 'rgba(29,158,117,0.4)' : 'rgba(197,58,107,0.4)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: result.ok ? '#7DD9B5' : '#FF8A9A' }}>
              {result.ok ? <Check size={16} /> : <X size={16} />}
              {result.ok ? 'Stamp added' : 'Failed'}
            </div>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>{result.msg}</div>
            {result.customer && result.stamps != null && result.goal != null && (
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {result.customer} {String.fromCharCode(183)} {result.stamps}/{result.goal} stamps
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Hash size={13} /> Enter customer number (camera not working)
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Fixed prefix + numeric input */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'stretch', borderRadius: 10, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', padding: '0 12px',
              background: 'rgba(29,158,117,0.22)', color: '#7DD9B5',
              fontSize: 15, fontWeight: 700, letterSpacing: '0.06em',
              borderRight: '1px solid rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono)',
            }}>{prefix}</span>
            <input
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="12345"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              style={{
                flex: 1, minWidth: 0, padding: '12px 14px', border: 0, background: 'transparent',
                color: 'white', fontSize: 16, fontFamily: 'var(--font-mono)', outline: 'none', letterSpacing: '0.08em',
              }}
            />
          </div>
          <button
            onClick={handleManualSubmit}
            disabled={loading || !digits}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '12px 20px', borderRadius: 10, border: 0,
              background: (loading || !digits) ? 'rgba(29,158,117,0.4)' : '#1D9E75',
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: (loading || !digits) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : <><Check size={16} /> Add</>}
          </button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.4, marginTop: 8 }}>
          Type only the number — {prefix} is added automatically.
        </div>
      </div>
    </div>
  );
}
