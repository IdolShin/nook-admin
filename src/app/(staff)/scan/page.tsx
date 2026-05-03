'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { decodeToken } from '@/lib/permissions';

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
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: i < current ? '#1D9E75' : 'rgba(255,255,255,0.10)',
            border: i >= current ? '1.5px dashed rgba(255,255,255,0.2)' : 'none',
            transition: 'background 0.3s',
          }}
        />
      ))}
      {goal > 12 && <span style={{ fontSize: 12, opacity: 0.4, alignSelf: 'center' }}>+{goal - 12}</span>}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>({ kind: 'idle' });
  const [input, setInput] = useState('');
  const [bizName, setBizName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [todayStamps, setTodayStamps] = useState(0);
  const [todayRedeems, setTodayRedeems] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const decoded = decodeToken();
    if (!decoded) { router.replace('/auth'); return; }
    setBizName(api.getBusinessName());
    setStaffName(decoded.name || decoded.email || '');
    inputRef.current?.focus();
  }, [router]);

  // Auto-return after success / error
  useEffect(() => {
    if (state.kind === 'stamp_ok' || state.kind === 'redeem_ok') {
      const t = setTimeout(reset, 3500);
      return () => clearTimeout(t);
    }
  }, [state.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setState({ kind: 'idle' });
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function handleScan() {
    const code = input.trim();
    if (!code) return;
    setState({ kind: 'loading' });
    try {
      const res = await api.customerLookup(code, 'barcode');
      setState({ kind: 'found', customer: res.customer as CustomerData, code });
    } catch (e) {
      setState({ kind: 'error', message: tryParseError(e instanceof Error ? e.message : '고객을 찾을 수 없어요') });
    }
  }

  async function handleAddStamp() {
    if (state.kind !== 'found') return;
    const { code, customer } = state;
    setState({ kind: 'acting' });
    try {
      const res = await api.scanStamp(code, 'barcode');
      setTodayStamps((n) => n + 1);
      setState({
        kind: 'stamp_ok',
        customer,
        newStamps: res.new_stamps,
        goalStamps: res.goal_stamps,
        rewardReady: res.reward_ready,
      });
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
    <div
      style={{
        height: '100svh',
        background: '#0A0A0E',
        color: 'white',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Inter", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ width: '100%', maxWidth: 440, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Top bar ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px 12px',
            paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: 9,
                background: '#1D9E75', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, lineHeight: 1,
                flexShrink: 0,
              }}
            >
              n
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{bizName || 'Nook'}</div>
              <div style={{ fontSize: 10, opacity: 0.3 }}>점원 스캐너</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {staffName && <div style={{ fontSize: 11, opacity: 0.3 }}>{staffName}</div>}
            <div style={{ fontSize: 10, opacity: 0.2, marginTop: 1 }}>
              오늘 스탬프 {todayStamps} · 리딤 {todayRedeems}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            overflow: 'hidden',
          }}
        >
          {/* ── IDLE ── */}
          {state.kind === 'idle' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, opacity: 0.12 }}>
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14v7M14 21h7" />
                  </svg>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  고객 바코드 스캔
                </div>
                <div style={{ fontSize: 13, opacity: 0.35, marginTop: 7 }}>
                  QR코드 또는 바코드를 스캔하세요
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="바코드 입력 또는 스캔..."
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '18px 58px 18px 20px',
                    borderRadius: 16,
                    border: '1.5px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: 16,
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    caretColor: '#1D9E75',
                  }}
                />
                <button
                  onClick={handleScan}
                  disabled={!input.trim()}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40, height: 40,
                    border: 0, borderRadius: 11,
                    background: input.trim() ? '#1D9E75' : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── LOADING / ACTING ── */}
          {(state.kind === 'loading' || state.kind === 'acting') && (
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 20,
            }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  border: '3px solid rgba(29,158,117,0.15)',
                  borderTop: '3px solid #1D9E75',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
                {/* Cancel */}
                <button
                  onClick={reset}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 0,
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                    padding: '4px 0', flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  취소
                </button>

                {/* Customer card */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.07)',
                    padding: 22,
                    flex: 1,
                    overflowY: 'auto',
                  }}
                >
                  {/* Avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                    <div
                      style={{
                        width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #1D9E75, #085041)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700,
                      }}
                    >
                      {initials(c.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                        {c.name}
                      </div>
                      {/* Visit badge */}
                      <div
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          marginTop: 6, padding: '3px 11px', borderRadius: 999,
                          background: visits > 0
                            ? 'rgba(29,158,117,0.18)'
                            : 'rgba(255,255,255,0.06)',
                          color: visits > 0 ? '#7DD9B5' : 'rgba(255,255,255,0.45)',
                          fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {visits === 0 ? '첫 방문 🎉' : `${visits}번째 방문`}
                      </div>
                    </div>
                  </div>

                  {/* Stamp progress */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: 14, padding: '16px 18px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'baseline', marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 13, opacity: 0.6 }}>{c.card.name}</div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 24, fontWeight: 700,
                          color: canRedeem ? '#7DD9B5' : 'white',
                        }}
                      >
                        {c.current_stamps}
                        <span style={{ fontSize: 13, opacity: 0.3, fontWeight: 400 }}>
                          /{c.goal_stamps}
                        </span>
                      </div>
                    </div>
                    <StampDots current={c.current_stamps} goal={c.goal_stamps} />
                    {canRedeem && (
                      <div
                        style={{
                          marginTop: 14, padding: '9px 14px', borderRadius: 10,
                          background: 'rgba(29,158,117,0.15)', color: '#7DD9B5',
                          fontSize: 13, fontWeight: 500, textAlign: 'center',
                        }}
                      >
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

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {canRedeem && (
                    <button
                      onClick={handleRedeemReward}
                      style={{
                        width: '100%', padding: '17px',
                        border: 'none', borderRadius: 15,
                        background: 'linear-gradient(135deg, #1D9E75, #085041)',
                        color: 'white', fontSize: 17, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                      }}
                    >
                      🎁 리워드 사용하기
                    </button>
                  )}
                  <button
                    onClick={handleAddStamp}
                    style={{
                      width: '100%', padding: '17px',
                      border: canRedeem ? '1px solid rgba(255,255,255,0.10)' : 'none',
                      borderRadius: 15,
                      background: canRedeem
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg, #1D9E75, #085041)',
                      color: 'white', fontSize: 17, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                    }}
                  >
                    + 스탬프 추가
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── STAMP OK ── */}
          {state.kind === 'stamp_ok' && (
            <div
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 24,
              }}
            >
              <div
                style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'rgba(29,158,117,0.18)', color: '#7DD9B5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 20px rgba(29,158,117,0.06)',
                }}
              >
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
                  <div
                    style={{
                      display: 'inline-block', marginTop: 12,
                      padding: '7px 16px', borderRadius: 999,
                      background: 'rgba(29,158,117,0.2)', color: '#7DD9B5', fontSize: 13,
                    }}
                  >
                    🎁 {state.customer.card.reward_desc}
                  </div>
                )}
              </div>
              <StampDots current={state.newStamps} goal={state.goalStamps} />
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.28 }}>3초 후 자동 복귀...</div>
              <button
                onClick={reset}
                style={{
                  background: 'none', border: 0,
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginTop: -12,
                }}
              >
                지금 돌아가기
              </button>
            </div>
          )}

          {/* ── REDEEM OK ── */}
          {state.kind === 'redeem_ok' && (
            <div
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 24,
              }}
            >
              <div
                style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'rgba(194,107,31,0.18)', color: '#E0A560',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 20px rgba(194,107,31,0.06)',
                  fontSize: 44,
                }}
              >
                🎁
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  리워드 사용 완료!
                </div>
                <div style={{ fontSize: 14, opacity: 0.4, marginTop: 7 }}>
                  {state.customer.name}
                </div>
                <div style={{ fontSize: 13, opacity: 0.3, marginTop: 4 }}>
                  {state.customer.card.reward_desc}
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.28 }}>3초 후 자동 복귀...</div>
              <button
                onClick={reset}
                style={{
                  background: 'none', border: 0,
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                }}
              >
                지금 돌아가기
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {state.kind === 'error' && (
            <div
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 18,
              }}
            >
              <div
                style={{
                  width: 74, height: 74, borderRadius: '50%',
                  background: 'rgba(197,58,107,0.18)', color: '#E07090',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#E07090', textAlign: 'center' }}>
                {state.message}
              </div>
              <button
                onClick={reset}
                style={{
                  padding: '13px 30px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 13,
                  background: 'transparent', color: 'white',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 15,
                }}
              >
                다시 스캔
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
