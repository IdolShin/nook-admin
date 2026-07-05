'use client';

// ─── NFC Tap-to-Collect page ─────────────────────────────────
// Opened automatically when a customer taps the store's NFC stamp.
// URL: /t?picc_data={PICC}&cmac={CMAC}   (NTAG 424 DNA SDM)
//  or: /t?uid={UID}&ctr={CTR}&cmac={CMAC} (plaintext mirror mode)
//
// Flow: verify tap → known device? auto-credit instantly
//       → new device? quick identify (unique key) or 10-second join

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, TapVerifyResult, TapCollectResult } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type Membership = { customer_id: string; unique_key: string; user_id?: string; business_name?: string };

function getMemberships(): Record<string, Membership> {
  try {
    const raw = localStorage.getItem('nook_memberships');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveMembership(businessId: string, m: Membership) {
  try {
    const map = getMemberships();
    map[businessId] = m;
    localStorage.setItem('nook_memberships', JSON.stringify(map));
  } catch { /* non-fatal */ }
}

type Phase = 'verifying' | 'identify' | 'collecting' | 'success' | 'error';

function TapPageInner() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>('verifying');
  const [verify, setVerify] = useState<TapVerifyResult | null>(null);
  const [result, setResult] = useState<TapCollectResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');

  // identify form state
  const [mode, setMode] = useState<'choose' | 'existing' | 'new'>('choose');
  const [keyInput, setKeyInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const ran = useRef(false);

  const doCollect = useCallback(async (tapToken: string, uniqueKey: string, businessId: string) => {
    setPhase('collecting');
    try {
      const r = await api.tapCollect(tapToken, uniqueKey);
      saveMembership(businessId, {
        customer_id: r.customer_id,
        unique_key: r.unique_key ?? uniqueKey,
        user_id: r.user_id ?? undefined,
        business_name: r.business_name,
      });
      setResult(r);
      setPhase('success');
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'CUSTOMER_NOT_FOUND') {
        setPhase('identify');
        setMode('choose');
        setFormError('');
      } else {
        setErrorMsg(err.message);
        setErrorCode(err.code ?? '');
        setPhase('error');
      }
    }
  }, []);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const picc_data = params.get('picc_data') ?? params.get('e') ?? undefined;
    const cmac = params.get('cmac') ?? params.get('c') ?? '';
    const uid = params.get('uid') ?? undefined;
    const ctr = params.get('ctr') ?? undefined;

    if (!cmac || (!picc_data && !uid)) {
      setErrorMsg('잘못된 링크입니다. 매장의 NFC 스탬프에 휴대폰을 다시 대주세요.');
      setPhase('error');
      return;
    }

    (async () => {
      try {
        const v = await api.tapVerify({ picc_data, cmac, uid, ctr });
        setVerify(v);
        const member = getMemberships()[v.business.id];
        if (member?.unique_key) {
          await doCollect(v.tap_token, member.unique_key, v.business.id);
        } else {
          setPhase('identify');
        }
      } catch (e) {
        const err = e as Error & { code?: string };
        setErrorMsg(err.message);
        setErrorCode(err.code ?? '');
        setPhase('error');
      }
    })();
  }, [params, doCollect]);

  async function handleExisting() {
    if (!verify) return;
    const k = keyInput.trim();
    if (!k) { setFormError('카드 번호를 입력해주세요 · Enter your card key'); return; }
    setSending(true); setFormError('');
    try {
      await doCollect(verify.tap_token, k, verify.business.id);
    } catch { /* handled in doCollect */ }
    setSending(false);
  }

  async function handleNewJoin() {
    if (!verify) return;
    const uid = userIdInput.trim();
    if (!uid) { setFormError('닉네임을 입력해주세요 · Enter a nickname'); return; }
    const card = verify.cards[0];
    if (!card) { setFormError('이 매장에 활성화된 카드가 없습니다.'); return; }
    setSending(true); setFormError('');
    try {
      const res = await fetch(`${BASE}/api/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, user_id: uid, consent_push: true, consent_points: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '가입에 실패했습니다.');
      const uniqueKey: string = j.customer?.unique_key ?? '';
      saveMembership(verify.business.id, {
        customer_id: j.customer?.id, unique_key: uniqueKey, user_id: uid, business_name: verify.business.name,
      });
      await doCollect(verify.tap_token, uniqueKey, verify.business.id);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
    setSending(false);
  }

  function handleReview() {
    if (!result?.review || !verify) return;
    // register the review intent (reward arrives after days_to_wait), then open Google
    fetch(`${BASE}/api/reviews/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: result.customer_id, business_id: verify.business.id }),
    }).catch(() => { /* non-fatal */ });
    window.open(result.review.url, '_blank');
  }

  const color = result?.card_color || verify?.cards?.[0]?.color || '#1D9E75';
  const bizName = verify?.business?.name ?? '';
  const isMembership = result?.card_type === 'membership';

  return (
    <div style={{
      minHeight: '100dvh', background: '#F5F7F6', display: 'flex', flexDirection: 'column',
      alignItems: 'center', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        @keyframes nk-pop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.35); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes nk-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes nk-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes nk-burst { 0% { transform: scale(0.4); opacity: 0.9; } 100% { transform: scale(2.1); opacity: 0; } }
      `}</style>

      {/* Header */}
      <div style={{
        width: '100%', background: `linear-gradient(135deg, ${color} 0%, #085041 100%)`,
        padding: '22px 20px calc(30px + 4px)', color: 'white', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center',
      }}>
        {verify?.business?.logo_url ? (
          <img src={verify.business.logo_url} alt={bizName} style={{ width: 46, height: 46, borderRadius: 13, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.35)' }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800 }}>
            {bizName?.[0] ?? 'N'}
          </div>
        )}
        <div>
          <div style={{ fontSize: 12, opacity: 0.85, letterSpacing: 1.2, fontWeight: 600 }}>NOOK WALLET</div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{bizName || 'NFC Stamp'}</div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 430, padding: '26px 20px 40px', boxSizing: 'border-box', flex: 1 }}>

        {/* ── Verifying / Collecting ── */}
        {(phase === 'verifying' || phase === 'collecting') && (
          <div style={{ textAlign: 'center', paddingTop: 70 }}>
            <div style={{ fontSize: 46, animation: 'nk-pulse 1s ease-in-out infinite' }}>📡</div>
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 700, color: '#1A1A1F' }}>
              {phase === 'verifying' ? '탭 확인 중…' : '적립 중…'}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#8A8F98' }}>
              {phase === 'verifying' ? 'Verifying your tap' : 'Adding your stamp'}
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {phase === 'success' && result && (
          <div style={{ animation: 'nk-rise 320ms ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: 18, width: 60, height: 60, marginLeft: -30, borderRadius: '50%', border: `3px solid ${color}`, animation: 'nk-burst 700ms ease-out forwards' }} />
              <div style={{ fontSize: 54, animation: 'nk-pop 500ms cubic-bezier(0.2,1.4,0.4,1)' }}>{isMembership ? '⭐' : '✅'}</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#1A1A1F', marginTop: 8 }}>
                {isMembership ? '+100 포인트 적립!' : '스탬프 적립 완료!'}
              </div>
              <div style={{ fontSize: 13, color: '#8A8F98', marginTop: 4 }}>
                {result.user_id ? `${result.user_id} · ` : ''}{result.business_name}
              </div>
            </div>

            {/* Card visual */}
            <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 8px 28px rgba(8,80,65,0.10)', border: '1px solid #EBEBEB' }}>
              {isMembership ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 13, color: '#8A8F98', fontWeight: 600 }}>TOTAL POINTS</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: '#7C3AED', fontFamily: "'JetBrains Mono', monospace", animation: 'nk-pop 600ms ease-out' }}>
                    {(result.total_points ?? 0).toLocaleString()}<span style={{ fontSize: 18, marginLeft: 4 }}>pts</span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1F' }}>{result.card_name ?? 'Stamp Card'}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {result.new_stamps}/{result.goal_stamps}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(result.goal_stamps ?? 10, 5)}, 1fr)`, gap: 10 }}>
                    {Array.from({ length: result.goal_stamps ?? 10 }).map((_, i) => {
                      const filled = i < (result.new_stamps ?? 0);
                      const isNew = i === (result.new_stamps ?? 0) - 1;
                      return (
                        <div key={i} style={{
                          aspectRatio: '1', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 17, fontWeight: 700,
                          background: filled ? color : '#F0F2F1',
                          color: filled ? 'white' : '#C4C9C6',
                          border: filled ? 'none' : '2px dashed #D8DDDA',
                          animation: isNew ? 'nk-pop 550ms cubic-bezier(0.2,1.4,0.4,1) 150ms both' : undefined,
                        }}>
                          {filled ? '✓' : i + 1}
                        </div>
                      );
                    })}
                  </div>
                  {result.reward_ready && (
                    <div style={{ marginTop: 16, background: '#E8F7F2', border: `1.5px solid ${color}`, borderRadius: 12, padding: '13px 16px', textAlign: 'center', animation: 'nk-rise 400ms ease-out 300ms both' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#085041' }}>🎉 리워드 달성!</div>
                      <div style={{ fontSize: 13, color: '#085041', marginTop: 3 }}>
                        {result.reward_desc ? `"${result.reward_desc}" — 직원에게 보여주세요!` : '직원에게 보여주세요!'}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Tap Moments — the 3 seconds every customer looks at ── */}
            {result.welcome_coupon && (
              <a href={`/pass/${result.welcome_coupon.barcode}`} style={{
                display: 'block', marginTop: 14, padding: '15px 16px', borderRadius: 13, textDecoration: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', textAlign: 'center',
                animation: 'nk-rise 400ms ease-out 250ms both', boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
              }}>
                <div style={{ fontSize: 15.5, fontWeight: 800 }}>🎁 첫 방문 선물이 도착했어요!</div>
                <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3 }}>
                  {result.welcome_coupon.title} — 탭해서 쿠폰 받기 →
                </div>
              </a>
            )}

            {result.next_visit_free && (
              <div style={{
                marginTop: 14, padding: '14px 16px', borderRadius: 13, textAlign: 'center',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                animation: 'nk-rise 400ms ease-out 350ms both',
              }}>
                <div style={{ fontSize: 15.5, fontWeight: 800 }}>🔥 다음 방문은 무료!</div>
                <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 3 }}>
                  한 번만 더 오시면 {result.reward_desc ?? '리워드'}가 공짜예요
                </div>
              </div>
            )}

            {result.tap_promo && (
              <div style={{
                marginTop: 14, padding: '13px 16px', borderRadius: 13,
                background: '#FFF9E8', border: '1.5px solid #F0D48A',
                animation: 'nk-rise 400ms ease-out 450ms both',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#8C5A11', letterSpacing: 1 }}>📣 오늘의 소식</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#5A4A1A', marginTop: 3, lineHeight: 1.5 }}>
                  {result.tap_promo}
                </div>
              </div>
            )}

            {result.review && !result.welcome_coupon && (
              <button onClick={handleReview} style={{
                display: 'block', width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 13,
                background: 'white', border: '1.5px solid #F0D48A', cursor: 'pointer', textAlign: 'center',
                animation: 'nk-rise 400ms ease-out 500ms both', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#8C5A11' }}>
                  ⭐ 구글 리뷰 남기면 {result.review.reward_label}
                </span>
              </button>
            )}

            <a href="/wallet" style={{
              display: 'block', textAlign: 'center', marginTop: 16, padding: '14px', borderRadius: 13,
              background: 'white', border: `1.5px solid ${color}`, color: '#085041',
              fontSize: 14.5, fontWeight: 800, textDecoration: 'none',
            }}>
              내 월렛 보기 · View my wallet →
            </a>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5, color: '#8A8F98' }}>
              방문해 주셔서 감사합니다 · Thanks for visiting!
            </div>
          </div>
        )}

        {/* ── Identify (first tap on this device) ── */}
        {phase === 'identify' && verify && (
          <div style={{ animation: 'nk-rise 320ms ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1F' }}>거의 다 됐어요!</div>
              <div style={{ fontSize: 13, color: '#8A8F98', marginTop: 4 }}>
                이 휴대폰에서 첫 적립이에요. 딱 한 번만 확인할게요.<br />First tap on this phone — just once.
              </div>
            </div>

            {mode === 'choose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => { setMode('new'); setFormError(''); }} style={{
                  padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${color}, #085041)`, color: 'white', fontSize: 15.5, fontWeight: 800,
                }}>
                  처음이에요 — 10초 가입 · I&apos;m new
                </button>
                <button onClick={() => { setMode('existing'); setFormError(''); }} style={{
                  padding: '16px', borderRadius: 14, border: `1.5px solid ${color}`, cursor: 'pointer',
                  background: 'white', color: '#085041', fontSize: 15.5, fontWeight: 700,
                }}>
                  이미 카드가 있어요 · I have a card
                </button>
              </div>
            )}

            {mode === 'new' && (
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #EBEBEB' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1F' }}>닉네임 · Nickname</label>
                <input
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="예: 우상, John"
                  autoFocus
                  style={{ width: '100%', marginTop: 8, padding: '13px 15px', border: '1.5px solid #D4E6DB', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
                {formError && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 8 }}>{formError}</div>}
                <button onClick={handleNewJoin} disabled={sending} style={{
                  width: '100%', marginTop: 14, padding: '15px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: sending ? '#9CA3AF' : `linear-gradient(135deg, ${color}, #085041)`,
                  color: 'white', fontSize: 15, fontWeight: 800,
                }}>
                  {sending ? '적립 중…' : '가입하고 바로 적립 · Join & collect'}
                </button>
                <button onClick={() => setMode('choose')} style={{ width: '100%', marginTop: 8, padding: 10, border: 'none', background: 'none', color: '#8A8F98', fontSize: 13, cursor: 'pointer' }}>← 뒤로</button>
              </div>
            )}

            {mode === 'existing' && (
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #EBEBEB' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1F' }}>카드 번호 · Card key</label>
                <div style={{ fontSize: 12, color: '#8A8F98', marginTop: 3 }}>가입 시 받은 번호 (예: NOO12345, 숫자만 입력해도 돼요)</div>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  placeholder="NOO12345"
                  autoFocus
                  style={{ width: '100%', marginTop: 8, padding: '13px 15px', border: '1.5px solid #D4E6DB', borderRadius: 10, fontSize: 16, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, outline: 'none', boxSizing: 'border-box' }}
                />
                {formError && <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 8 }}>{formError}</div>}
                <button onClick={handleExisting} disabled={sending} style={{
                  width: '100%', marginTop: 14, padding: '15px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: sending ? '#9CA3AF' : `linear-gradient(135deg, ${color}, #085041)`,
                  color: 'white', fontSize: 15, fontWeight: 800,
                }}>
                  {sending ? '적립 중…' : '적립하기 · Collect stamp'}
                </button>
                <button onClick={() => setMode('choose')} style={{ width: '100%', marginTop: 8, padding: 10, border: 'none', background: 'none', color: '#8A8F98', fontSize: 13, cursor: 'pointer' }}>← 뒤로</button>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center', paddingTop: 60, animation: 'nk-rise 320ms ease-out' }}>
            <div style={{ fontSize: 44 }}>{errorCode === 'REPLAY' || errorCode === 'TOKEN_EXPIRED' ? '🔄' : '⚠️'}</div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: '#1A1A1F', marginTop: 12 }}>
              {errorCode === 'REPLAY' || errorCode === 'TOKEN_EXPIRED'
                ? '스탬프에 다시 탭해주세요'
                : '적립할 수 없어요'}
            </div>
            <div style={{ fontSize: 13.5, color: '#8A8F98', marginTop: 8, lineHeight: 1.6 }}>{errorMsg}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TapPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F5F7F6' }} />}>
      <TapPageInner />
    </Suspense>
  );
}
