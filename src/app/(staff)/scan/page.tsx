'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

/* ── Types ───────────────────────────────────────────────────── */
interface CustomerData {
  id: string;
  name: string;
  wallet_type: string;
  card: { name: string; goal_stamps: number; reward_desc: string };
  current_stamps: number;
  goal_stamps: number;
  rewards_earned: number;
}

type AppState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; customer: CustomerData; code: string }
  | { kind: 'acting' }
  | { kind: 'stamp_ok'; customer: CustomerData; newStamps: number; goalStamps: number; rewardReady: boolean }
  | { kind: 'redeem_ok'; customer: CustomerData }
  | { kind: 'error'; message: string };

declare class BarcodeDetector {
  constructor(opts?: { formats: string[] });
  detect(source: HTMLVideoElement | ImageBitmap): Promise<Array<{ rawValue: string; format: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}
function totalVisits(c: CustomerData) {
  return c.rewards_earned * c.goal_stamps + c.current_stamps;
}
function tryParseError(raw: string) {
  try { return (JSON.parse(raw) as { error?: string }).error ?? raw; } catch { return raw; }
}

/* ── Stamp dots ──────────────────────────────────────────────── */
function StampDots({ current, goal, size = 22 }: { current: number; goal: number; size?: number }) {
  const cap = Math.min(goal, 12);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: cap }).map((_, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: '50%',
          background: i < current ? '#1D9E75' : 'rgba(255,255,255,0.10)',
          border: i >= current ? '1.5px dashed rgba(255,255,255,0.2)' : 'none',
          transition: 'background 0.3s',
        }} />
      ))}
      {goal > 12 && <span style={{ fontSize: 12, opacity: 0.4, alignSelf: 'center' }}>+{goal - 12}</span>}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function ScanPage() {
  const [state, setState] = useState<AppState>({ kind: 'idle' });
  const [input, setInput] = useState('');
  const [bizName, setBizName] = useState('');
  const [todayStamps, setTodayStamps] = useState(0);
  const [todayRedeems, setTodayRedeems] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const scanningRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBizName(api.getBusinessName() || 'Nook');
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-return after success
  useEffect(() => {
    if (state.kind === 'stamp_ok' || state.kind === 'redeem_ok') {
      const t = setTimeout(reset, 3500);
      return () => clearTimeout(t);
    }
  }, [state.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart camera when back to idle
  useEffect(() => {
    if (state.kind === 'idle' && !manualMode) {
      startCamera();
    } else if (state.kind !== 'idle') {
      stopCamera();
    }
  }, [state.kind, manualMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = useCallback(async () => {
    setCameraError('');
    setCameraReady(false);
    try {
      // Check BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setCameraError('이 브라우저는 카메라 스캔을 지원하지 않아요.\n아래 수동 입력을 사용해주세요.');
        setManualMode(true);
        return;
      }

      // Setup detector
      if (!detectorRef.current) {
        detectorRef.current = new BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'itf'],
        });
      }

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        scanningRef.current = true;
        scanLoop();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
        setCameraError('카메라 권한이 거부됐어요.\n브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else {
        setCameraError('카메라를 열 수 없어요.\n수동 입력을 사용해주세요.');
      }
      setManualMode(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function stopCamera() {
    scanningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }

  function scanLoop() {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    detector.detect(video).then((barcodes) => {
      if (barcodes.length > 0 && scanningRef.current) {
        scanningRef.current = false;
        handleScanCode(barcodes[0].rawValue);
      } else {
        rafRef.current = requestAnimationFrame(scanLoop);
      }
    }).catch(() => {
      rafRef.current = requestAnimationFrame(scanLoop);
    });
  }

  function reset() {
    setState({ kind: 'idle' });
    setInput('');
    scanningRef.current = false;
  }

  async function handleScanCode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    stopCamera();
    setState({ kind: 'loading' });
    try {
      const res = await api.customerLookup(trimmed, 'barcode');
      setState({ kind: 'found', customer: res.customer as CustomerData, code: trimmed });
    } catch (e) {
      setState({ kind: 'error', message: tryParseError(e instanceof Error ? e.message : '고객을 찾을 수 없어요') });
    }
  }

  async function handleManualScan() {
    await handleScanCode(input);
  }

  async function handleAddStamp() {
    if (state.kind !== 'found') return;
    const { code, customer } = state;
    setState({ kind: 'acting' });
    try {
      const res = await api.scanStamp(code, 'barcode');
      setTodayStamps((n) => n + 1);
      setState({ kind: 'stamp_ok', customer, newStamps: res.new_stamps, goalStamps: res.goal_stamps, rewardReady: res.reward_ready });
    } catch (e) {
      setState({ kind: 'error', message: tryParseError(e instanceof Error ? e.message : '스탬프 추가 실패') });
    }
  }

  async function handleRedeemReward() {
    if (state.kind !== 'found') return;
    const { customer } = state;
    setState({ kind: 'acting' });
    try {
      await api.redeemStamp(customer.id);
      setTodayRedeems((n) => n + 1);
      setState({ kind: 'redeem_ok', customer });
    } catch (e) {
      setState({ kind: 'error', message: tryParseError(e instanceof Error ? e.message : '리딤 실패') });
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{
      height: '100svh', background: '#0A0A0E', color: 'white', overflow: 'hidden',
      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Inter", sans-serif)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes cornerPulse { 0%,100% { opacity:.6 } 50% { opacity:1 } }
        @keyframes scanLine { 0% { top:10% } 100% { top:90% } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 440, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px 12px',
          paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
          borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, background: '#1D9E75', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, lineHeight: 1, flexShrink: 0,
            }}>n</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{bizName || 'Nook'}</div>
              <div style={{ fontSize: 10, opacity: 0.3 }}>점원 스캐너</div>
            </div>
          </div>
          <div style={{ fontSize: 10, opacity: 0.2, textAlign: 'right' }}>
            스탬프 {todayStamps} · 리딤 {todayRedeems}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          overflow: 'hidden',
        }}>

          {/* ── IDLE — camera or manual ── */}
          {state.kind === 'idle' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

              {!manualMode ? (
                /* Camera view */
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {/* Video */}
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      background: '#111',
                    }}
                  />

                  {/* Overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(to bottom, rgba(10,10,14,0.6) 0%, transparent 25%, transparent 75%, rgba(10,10,14,0.85) 100%)',
                  }}>
                    {/* Scan frame */}
                    <div style={{ position: 'relative', width: 240, height: 240 }}>
                      {/* Corners */}
                      {[
                        { top: 0, left: 0, borderTop: '3px solid #1D9E75', borderLeft: '3px solid #1D9E75' },
                        { top: 0, right: 0, borderTop: '3px solid #1D9E75', borderRight: '3px solid #1D9E75' },
                        { bottom: 0, left: 0, borderBottom: '3px solid #1D9E75', borderLeft: '3px solid #1D9E75' },
                        { bottom: 0, right: 0, borderBottom: '3px solid #1D9E75', borderRight: '3px solid #1D9E75' },
                      ].map((style, i) => (
                        <div key={i} style={{
                          position: 'absolute', width: 28, height: 28, borderRadius: 4,
                          animation: 'cornerPulse 2s ease-in-out infinite',
                          ...style,
                        }} />
                      ))}
                      {/* Scan line */}
                      {cameraReady && (
                        <div style={{
                          position: 'absolute', left: 4, right: 4, height: 2,
                          background: 'linear-gradient(90deg, transparent, #1D9E75, transparent)',
                          animation: 'scanLine 2s ease-in-out infinite alternate',
                          borderRadius: 1,
                        }} />
                      )}
                      {/* Loading spinner if not ready */}
                      {!cameraReady && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            border: '2.5px solid rgba(29,158,117,0.2)',
                            borderTop: '2.5px solid #1D9E75',
                            animation: 'spin 0.75s linear infinite',
                          }} />
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 22, textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.9 }}>
                        {cameraReady ? 'QR / 바코드를 프레임 안에' : '카메라 시작 중...'}
                      </div>
                      {cameraReady && (
                        <div style={{ fontSize: 12, opacity: 0.4, marginTop: 5 }}>자동으로 인식됩니다</div>
                      )}
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '16px 20px',
                    display: 'flex', justifyContent: 'center',
                  }}>
                    <button
                      onClick={() => { stopCamera(); setManualMode(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                      style={{
                        background: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: 999, padding: '9px 22px',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      ✏️ 수동 입력
                    </button>
                  </div>
                </div>
              ) : (
                /* Manual input */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: '0 20px' }}>
                  {cameraError ? (
                    <div style={{ textAlign: 'center', padding: '0 10px' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
                      <div style={{ fontSize: 13, opacity: 0.4, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{cameraError}</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>수동 입력</div>
                      <div style={{ fontSize: 13, opacity: 0.35, marginTop: 6 }}>바코드 번호를 직접 입력하세요</div>
                    </div>
                  )}

                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                      placeholder="바코드 번호 입력..."
                      autoComplete="off"
                      inputMode="numeric"
                      style={{
                        width: '100%', padding: '18px 58px 18px 20px',
                        borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.05)', color: 'white',
                        fontSize: 16, fontFamily: 'inherit', outline: 'none',
                        boxSizing: 'border-box', caretColor: '#1D9E75',
                      }}
                    />
                    <button
                      onClick={handleManualScan}
                      disabled={!input.trim()}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        width: 40, height: 40, border: 0, borderRadius: 11,
                        background: input.trim() ? '#1D9E75' : 'rgba(255,255,255,0.06)',
                        color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {!cameraError && (
                    <button
                      onClick={() => { setManualMode(false); setInput(''); startCamera(); }}
                      style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.5)', borderRadius: 12,
                        padding: '11px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      📷 카메라로 돌아가기
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LOADING / ACTING ── */}
          {(state.kind === 'loading' || state.kind === 'acting') && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '3px solid rgba(29,158,117,0.15)', borderTop: '3px solid #1D9E75',
                animation: 'spin 0.75s linear infinite',
              }} />
              <div style={{ fontSize: 14, opacity: 0.38 }}>
                {state.kind === 'loading' ? '고객 확인 중...' : '처리 중...'}
              </div>
            </div>
          )}

          {/* ── FOUND ── */}
          {state.kind === 'found' && (() => {
            const c = state.customer;
            const visits = totalVisits(c);
            const canRedeem = c.current_stamps >= c.goal_stamps;
            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', padding: '16px 20px' }}>
                <button onClick={reset} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 0, color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: '4px 0', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  취소
                </button>

                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.07)', padding: 22, flex: 1, overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #1D9E75, #085041)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 700,
                    }}>{initials(c.name)}</div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{c.name}</div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', marginTop: 6,
                        padding: '3px 11px', borderRadius: 999,
                        background: visits > 0 ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.06)',
                        color: visits > 0 ? '#7DD9B5' : 'rgba(255,255,255,0.45)',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {visits === 0 ? '첫 방문 🎉' : `${visits}번째 방문`}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '16px 18px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>{c.card.name}</div>
                      <div style={{
                        fontFamily: 'var(--font-mono, monospace)', fontSize: 24, fontWeight: 700,
                        color: canRedeem ? '#7DD9B5' : 'white',
                      }}>
                        {c.current_stamps}
                        <span style={{ fontSize: 13, opacity: 0.3, fontWeight: 400 }}>/{c.goal_stamps}</span>
                      </div>
                    </div>
                    <StampDots current={c.current_stamps} goal={c.goal_stamps} />
                    {canRedeem && (
                      <div style={{
                        marginTop: 14, padding: '9px 14px', borderRadius: 10,
                        background: 'rgba(29,158,117,0.15)', color: '#7DD9B5',
                        fontSize: 13, fontWeight: 500, textAlign: 'center',
                      }}>
                        🎁 {c.card.reward_desc} — 리워드 사용 가능!
                      </div>
                    )}
                  </div>
                  {c.rewards_earned > 0 && (
                    <div style={{ marginTop: 10, fontSize: 11, opacity: 0.22, textAlign: 'center' }}>
                      누적 리워드 {c.rewards_earned}회 사용
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {canRedeem && (
                    <button onClick={handleRedeemReward} style={{
                      width: '100%', padding: '17px', border: 'none', borderRadius: 15,
                      background: 'linear-gradient(135deg, #1D9E75, #085041)',
                      color: 'white', fontSize: 17, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                    }}>🎁 리워드 사용하기</button>
                  )}
                  <button onClick={handleAddStamp} style={{
                    width: '100%', padding: '17px',
                    border: canRedeem ? '1px solid rgba(255,255,255,0.10)' : 'none', borderRadius: 15,
                    background: canRedeem ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #1D9E75, #085041)',
                    color: 'white', fontSize: 17, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                  }}>+ 스탬프 추가</button>
                </div>
              </div>
            );
          })()}

          {/* ── STAMP OK ── */}
          {state.kind === 'stamp_ok' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'rgba(29,158,117,0.18)', color: '#7DD9B5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 20px rgba(29,158,117,0.06)',
              }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {state.rewardReady ? '🎉 리워드 획득!' : '스탬프 추가!'}
                </div>
                <div style={{ fontSize: 14, opacity: 0.4, marginTop: 7 }}>
                  {state.customer.name} · {state.newStamps}/{state.goalStamps}
                </div>
                {state.rewardReady && (
                  <div style={{
                    display: 'inline-block', marginTop: 12, padding: '7px 16px', borderRadius: 999,
                    background: 'rgba(29,158,117,0.2)', color: '#7DD9B5', fontSize: 13,
                  }}>🎁 {state.customer.card.reward_desc}</div>
                )}
              </div>
              <StampDots current={state.newStamps} goal={state.goalStamps} />
              <div style={{ fontSize: 12, opacity: 0.28 }}>3초 후 자동 복귀...</div>
              <button onClick={reset} style={{
                background: 'none', border: 0, color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginTop: -12,
              }}>지금 돌아가기</button>
            </div>
          )}

          {/* ── REDEEM OK ── */}
          {state.kind === 'redeem_ok' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'rgba(194,107,31,0.18)', color: '#E0A560',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 20px rgba(194,107,31,0.06)', fontSize: 44,
              }}>🎁</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>리워드 사용 완료!</div>
                <div style={{ fontSize: 14, opacity: 0.4, marginTop: 7 }}>{state.customer.name}</div>
                <div style={{ fontSize: 13, opacity: 0.3, marginTop: 4 }}>{state.customer.card.reward_desc}</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.28 }}>3초 후 자동 복귀...</div>
              <button onClick={reset} style={{
                background: 'none', border: 0, color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              }}>지금 돌아가기</button>
            </div>
          )}

          {/* ── ERROR ── */}
          {state.kind === 'error' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
              <div style={{
                width: 74, height: 74, borderRadius: '50%',
                background: 'rgba(197,58,107,0.18)', color: '#E07090',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#E07090', textAlign: 'center', padding: '0 20px' }}>
                {state.message}
              </div>
              <button onClick={reset} style={{
                padding: '13px 30px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 13,
                background: 'transparent', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15,
              }}>다시 스캔</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
