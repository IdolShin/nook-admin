'use client';

// ─── NFC Tap-to-Collect page (Design v2 · i18n EN/KO) ────────
// Opened automatically when a customer taps the store's NFC stamp.
// URL: /t?picc_data={PICC}&cmac={CMAC}   (NTAG 424 DNA SDM)
//  or: /t?uid={UID}&ctr={CTR}&cmac={CMAC} (plaintext mirror mode)
//
// English is the default language; Korean via the header toggle.
// Reward redemption: customer self-redeems, then shows the staff a
// screenshot-proof confirmation (live ticking clock).

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, TapVerifyResult, TapCollectResult } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Design tokens (Headspace-inspired: warm, round, friendly) ─
const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const C = {
  ink:   '#26332C',   // soft dark green-charcoal
  deep:  '#0E5A43',
  brand: '#16A377',   // signature green (kept)
  mint:  '#DFF2E9',
  gold:  '#E3A93C',   // warm sunshine accent
  goldT: '#FBF0D7',
  paper: '#FAF6EE',   // warm cream (Headspace-style)
  card:  '#FFFFFF',
  line:  '#EDE6D8',
  sub:   '#7A8279',
};

type Lang = 'en' | 'ko';

function getLang(): Lang {
  try { return (localStorage.getItem('nook_lang') as Lang) || 'en'; } catch { return 'en'; }
}

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

// ── Eased number count-up (premium feel) ─────────────────────
function useCountUp(from: number, to: number, ms = 950, delay = 150) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / ms);
        const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setV(Math.round(from + (to - from) * e));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [from, to, ms, delay]);
  return v;
}

// ── Confetti burst (pure CSS, brand colors) ──────────────────
function Confetti({ big }: { big: boolean }) {
  const pieces = useMemo(() => {
    const colors = ['#16A377', '#0E5A43', '#E8C578', '#B8862B', '#7DE3C0'];
    return Array.from({ length: big ? 44 : 20 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 350,
      dur: 1500 + Math.random() * 1100,
      w: 6 + Math.random() * 6,
      rot: Math.random() * 360,
      color: colors[i % colors.length],
      drift: -60 + Math.random() * 120,
      round: Math.random() > 0.6,
    }));
  }, [big]);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 40 }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', top: -14, left: `${p.left}%`,
            width: p.w, height: p.round ? p.w : p.w * 0.45,
            background: p.color, borderRadius: p.round ? 99 : 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `nk-fall ${p.dur}ms cubic-bezier(0.25,0.4,0.45,1) ${p.delay}ms both`,
            ['--drift' as string]: `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Infographic progress ring ─────────────────────────────────
function ProgressRing({ from, to, max, color, children }: {
  from: number; to: number; max: number; color: string; children: React.ReactNode;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 150); return () => clearTimeout(t); }, []);
  const R = 62, CIRC = 2 * Math.PI * R;
  const pct = Math.max(0.015, Math.min(1, (on ? to : from) / max));
  return (
    <div style={{ position: 'relative', width: 156, height: 156, margin: '0 auto' }}>
      {/* Headspace-style floating blobs */}
      <div style={{
        position: 'absolute', width: 74, height: 74, left: -44, top: 8, borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%',
        background: '#DFF2E9', animation: 'nk-float 4.5s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 52, height: 52, right: -34, bottom: 4, borderRadius: '45% 55% 48% 52% / 55% 45% 55% 45%',
        background: '#FBF0D7', animation: 'nk-float 5.4s ease-in-out 700ms infinite',
      }} />
      <svg width={156} height={156} viewBox="0 0 156 156" style={{ position: 'relative' }}>
        <circle cx={78} cy={78} r={R} fill="none" stroke={C.line} strokeWidth={12} />
        <circle
          cx={78} cy={78} r={R} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${CIRC * pct} ${CIRC}`} transform="rotate(-90 78 78)"
          style={{
            transition: 'stroke-dasharray 1100ms cubic-bezier(0.22,0.9,0.28,1)',
            filter: `drop-shadow(0 0 7px ${color}55)`,
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Unified "moment" card ─────────────────────────────────────
function Moment({ icon, title, sub, tone, delay, href, onClick }: {
  icon: string; title: string; sub?: string; tone: 'mint' | 'gold' | 'plain';
  delay: number; href?: string; onClick?: () => void;
}) {
  const tint = tone === 'mint' ? C.mint : tone === 'gold' ? C.goldT : C.paper;
  const body = (
    <div className="nk-press" style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px',
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 24,
      boxShadow: '0 2px 8px rgba(38,51,44,0.05)',
      animation: `nk-rise 420ms cubic-bezier(0.22,0.9,0.28,1) ${delay}ms both`,
      cursor: href || onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 999, flexShrink: 0, background: tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      {(href || onClick) && <span style={{ color: C.sub, fontSize: 15, flexShrink: 0 }}>→</span>}
    </div>
  );
  if (href) return <a href={href} style={{ textDecoration: 'none', display: 'block', marginTop: 10 }}>{body}</a>;
  if (onClick) return <button onClick={onClick} style={{ all: 'unset', display: 'block', width: '100%', marginTop: 10, boxSizing: 'border-box' }}>{body}</button>;
  return <div style={{ marginTop: 10 }}>{body}</div>;
}

// ── Redemption overlay: confirm → live gold certificate ──────
function RedeemOverlay({ rewardDesc, businessName, uniqueKey, lang, onClose, onRedeemed }: {
  rewardDesc: string; businessName: string; uniqueKey: string; lang: Lang;
  onClose: () => void; onRedeemed?: () => void;
}) {
  const t = (en: string, ko: string) => (lang === 'en' ? en : ko);
  const [step, setStep] = useState<'confirm' | 'done'>('confirm');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (step !== 'done') return;
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, [step]);

  async function confirm() {
    setBusy(true); setErr('');
    try {
      await api.redeemReward(uniqueKey);
      setStep('done');
      if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 120]);
      onRedeemed?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
    setBusy(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,20,15,0.55)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: step === 'done' ? '#14100A' : C.card,
        borderRadius: '26px 26px 0 0', padding: '26px 22px calc(30px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box', animation: 'nk-rise 320ms cubic-bezier(0.22,0.9,0.28,1)',
      }}>
        {step === 'confirm' ? (
          <>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: C.line, margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 62, height: 62, borderRadius: 20, background: C.goldT, margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>🏆</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginTop: 14, letterSpacing: '-0.02em' }}>
                {t('Use your reward?', '리워드를 사용할까요?')}
              </div>
              <div style={{ fontSize: 14, color: C.sub, marginTop: 6, lineHeight: 1.6 }}>
                <b style={{ color: C.ink }}>{rewardDesc}</b> · {businessName}<br />
                {t('Press this at the counter, in front of staff.', '카운터에서 직원이 보는 앞에서 눌러주세요.')}
              </div>
            </div>
            {err && <div style={{ color: '#C0392B', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{err}</div>}
            <button className="nk-press" onClick={confirm} disabled={busy} style={{
              width: '100%', marginTop: 20, padding: '18px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: busy ? '#9AA5A0' : C.ink, color: 'white', fontSize: 15.5, fontWeight: 800, fontFamily: DISPLAY,
            }}>
              {busy ? t('Redeeming…', '사용 처리 중…') : t('Redeem now', '지금 사용하기')}
            </button>
            <button onClick={onClose} style={{
              width: '100%', marginTop: 8, padding: 12, border: 'none', background: 'none',
              color: C.sub, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
            }}>
              {t('Not yet', '나중에 쓸게요')}
            </button>
          </>
        ) : (
          <>
            {/* Screenshot-proof live certificate — show to staff */}
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 15px', borderRadius: 999,
                background: 'rgba(232,197,120,0.15)', border: '1px solid rgba(232,197,120,0.45)',
                fontSize: 12, fontWeight: 800, color: '#E8C578', letterSpacing: '0.08em',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: '#E8C578', animation: 'nk-pulse 1s ease-in-out infinite' }} />
                {t('LIVE · SHOW TO STAFF', 'LIVE · 직원에게 보여주세요')}
              </div>
              <div style={{ fontSize: 52, marginTop: 18, animation: 'nk-pop 500ms cubic-bezier(0.2,1.3,0.4,1)' }}>🏆</div>
              <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 8 }}>{rewardDesc}</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{businessName}</div>

              <div style={{
                margin: '20px auto 0', padding: '14px 18px', borderRadius: 16, maxWidth: 260,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
                  {now.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ko-KR', { hour12: false })}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                  {now.toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 14, lineHeight: 1.6 }}>
                {t('Redeemed — hand the customer their reward 🎉', '사용 완료 — 손님에게 리워드를 전달해주세요 🎉')}
              </div>
              <button onClick={onClose} style={{
                width: '100%', marginTop: 18, padding: '15px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
                background: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>
                {t('Done', '확인')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TapPageInner() {
  const params = useSearchParams();
  const [lang, setLang] = useState<Lang>('en');
  const [phase, setPhase] = useState<Phase>('verifying');
  const [verify, setVerify] = useState<TapVerifyResult | null>(null);
  const [result, setResult] = useState<TapCollectResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  // identify form state
  const [mode, setMode] = useState<'choose' | 'existing' | 'new'>('choose');
  const [keyInput, setKeyInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const ran = useRef(false);

  const t = useCallback((en: string, ko: string) => (lang === 'en' ? en : ko), [lang]);

  useEffect(() => { setLang(getLang()); }, []);
  function toggleLang() {
    const next: Lang = lang === 'en' ? 'ko' : 'en';
    setLang(next);
    try { localStorage.setItem('nook_lang', next); } catch { /* non-fatal */ }
  }

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

    // basic-mode tags carry only a uid; SDM tags carry picc_data/uid + cmac
    if (!picc_data && !uid) {
      setErrorMsg(getLang() === 'en'
        ? 'Invalid link. Please tap the NFC stamp at the store again.'
        : '잘못된 링크입니다. 매장의 NFC 스탬프에 휴대폰을 다시 대주세요.');
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
    if (!k) { setFormError(t('Please enter your card number', '카드 번호를 입력해주세요')); return; }
    setSending(true); setFormError('');
    try {
      await doCollect(verify.tap_token, k, verify.business.id);
    } catch { /* handled in doCollect */ }
    setSending(false);
  }

  async function handleNewJoin() {
    if (!verify) return;
    const uid = userIdInput.trim();
    if (!uid) { setFormError(t('Please enter a nickname', '닉네임을 입력해주세요')); return; }
    const card = verify.cards[0];
    if (!card) { setFormError(t('This store has no active card.', '이 매장에 활성화된 카드가 없습니다.')); return; }
    setSending(true); setFormError('');
    try {
      const res = await fetch(`${BASE}/api/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, user_id: uid, consent_push: true, consent_points: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? t('Sign-up failed.', '가입에 실패했습니다.'));
      const uniqueKey: string = j.customer?.unique_key ?? '';
      saveMembership(verify.business.id, {
        customer_id: j.customer?.id, unique_key: uniqueKey, user_id: uid, business_name: verify.business.name,
      });
      await doCollect(verify.tap_token, uniqueKey, verify.business.id);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('Something went wrong.', '오류가 발생했습니다.'));
    }
    setSending(false);
  }

  function handleReview() {
    if (!result?.review || !verify) return;
    fetch(`${BASE}/api/reviews/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: result.customer_id, business_id: verify.business.id }),
    }).catch(() => { /* non-fatal */ });
    window.open(result.review.url, '_blank');
  }

  const brand = result?.card_color || verify?.cards?.[0]?.color || C.brand;
  const bizName = verify?.business?.name ?? '';
  const isMembership = result?.card_type === 'membership';
  const rewardAvailable = !!result?.reward_ready && !redeemed;

  // premium number count-ups
  const stampCount = useCountUp(result?.prev_stamps ?? 0, result?.new_stamps ?? 0);
  const pointsCount = useCountUp(
    Math.max(0, (result?.total_points ?? 0) - (result?.points_earned ?? 100)),
    result?.total_points ?? 0
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 18px', borderRadius: 18, boxSizing: 'border-box',
    border: `1.5px solid ${C.line}`, background: C.card, color: C.ink,
    fontSize: 16, fontFamily: FONT, outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100dvh', background: C.paper, display: 'flex', flexDirection: 'column',
      alignItems: 'center', fontFamily: FONT, color: C.ink,
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" />
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        button, a { touch-action: manipulation; }
        .nk-display { font-family: ${DISPLAY}; }
        @keyframes nk-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes nk-pop { 0% { transform: scale(0.4); opacity: 0; } 65% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes nk-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes nk-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes nk-fall {
          from { transform: translate3d(0, -14px, 0) rotate(0deg); opacity: 1; }
          to   { transform: translate3d(var(--drift), 108vh, 0) rotate(560deg); opacity: 0.85; }
        }
        .nk-press { transition: transform 180ms cubic-bezier(0.3,1.3,0.5,1); }
        .nk-press:active { transform: scale(0.965); }
        input:focus { border-color: ${C.brand} !important; box-shadow: 0 0 0 3px ${C.mint}; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px 44px', boxSizing: 'border-box', flex: 1 }}>

        {/* ── Top: business identity + language toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '22px 2px 6px' }}>
          {verify?.business?.logo_url ? (
            <img src={verify.business.logo_url} alt="" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'cover', border: `1px solid ${C.line}` }} />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: brand, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
            }}>
              {bizName?.[0] ?? 'N'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: C.sub }}>NOOK WALLET</div>
            <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.02em' }}>{bizName || 'NFC Stamp'}</div>
          </div>
          <button onClick={toggleLang} style={{
            padding: '7px 13px', borderRadius: 999, border: `1px solid ${C.line}`, background: C.card,
            fontSize: 12, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT,
          }}>
            {lang === 'en' ? '한국어' : 'EN'}
          </button>
        </div>

        {/* ── Verifying / Collecting ── */}
        {(phase === 'verifying' || phase === 'collecting') && (
          <div style={{ textAlign: 'center', paddingTop: 110 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 22, background: C.mint, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              animation: 'nk-pulse 1.1s ease-in-out infinite',
            }}>
              📡
            </div>
            <div style={{ marginTop: 18, fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {phase === 'verifying' ? t('Verifying your tap', '탭 확인 중') : t('Adding your stamp', '적립하는 중')}
            </div>
            <div style={{ marginTop: 5, fontSize: 13, color: C.sub }}>{t('Just a second', '잠시만요, 1초면 돼요')}</div>
          </div>
        )}

        {/* ── Success ── */}
        {phase === 'success' && result && (
          <div style={{ animation: 'nk-rise 360ms cubic-bezier(0.22,0.9,0.28,1)', paddingTop: 22 }}>
            <Confetti big={!!result.reward_ready || !!result.next_visit_free || !!result.welcome_coupon} />

            {isMembership ? (
              <ProgressRing from={0.72} to={1} max={1} color={C.gold}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: '0.1em' }}>POINTS</div>
                <div className="nk-display" style={{ fontSize: 31, fontWeight: 900, letterSpacing: '-0.02em', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {pointsCount.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginTop: 1 }}>+{result.points_earned ?? 100}</div>
              </ProgressRing>
            ) : (
              <ProgressRing
                from={result.prev_stamps ?? 0}
                to={result.new_stamps ?? 0}
                max={result.goal_stamps ?? 10}
                color={brand}
              >
                <div className="nk-display" style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                  {stampCount}
                  <span style={{ fontSize: 17, color: C.sub, fontWeight: 800 }}>/{result.goal_stamps}</span>
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, letterSpacing: '0.1em', marginTop: 1 }}>STAMPS</div>
              </ProgressRing>
            )}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                background: C.mint, borderRadius: 999, fontSize: 12.5, fontWeight: 800, color: C.deep,
                animation: 'nk-pop 460ms cubic-bezier(0.2,1.3,0.4,1) 200ms both',
              }}>
                ✓ {t('Collected', '적립 완료')}
              </div>
              <div className="nk-display" style={{ fontSize: 23, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 10 }}>
                {isMembership ? t('Points added!', '포인트가 쌓였어요!') : t('Stamp collected!', '스탬프가 찍혔어요!')}
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                {result.user_id ? `${result.user_id} · ` : ''}{result.business_name}
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              {!isMembership && !rewardAvailable && (
                <span style={{ padding: '7px 13px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, fontSize: 12, fontWeight: 700, color: C.sub }}>
                  {lang === 'en'
                    ? <><b style={{ color: C.ink }}>{Math.max(0, (result.goal_stamps ?? 10) - (result.new_stamps ?? 0))}</b> to reward</>
                    : <>리워드까지 <b style={{ color: C.ink }}>{Math.max(0, (result.goal_stamps ?? 10) - (result.new_stamps ?? 0))}개</b></>}
                </span>
              )}
              <span style={{ padding: '7px 13px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, fontSize: 12, fontWeight: 700, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>
                {result.unique_key}
              </span>
            </div>

            {/* ── Moments ── */}
            <div style={{ marginTop: 22 }}>
              {rewardAvailable && (
                <Moment icon="🏆" tone="gold" delay={250}
                  title={lang === 'en' ? `${result.reward_desc ?? 'Reward'} — ready to use!` : `${result.reward_desc ?? '리워드'} 사용 가능!`}
                  sub={t('Tap to redeem at the counter', '카운터에서 탭해서 사용하세요')}
                  onClick={() => setShowRedeem(true)}
                />
              )}
              {redeemed && (
                <Moment icon="✅" tone="mint" delay={0}
                  title={t('Reward redeemed', '리워드 사용 완료')}
                  sub={t('Enjoy! Your card keeps collecting.', '맛있게 드세요! 카드는 계속 적립돼요.')}
                />
              )}
              {result.welcome_coupon && (
                <Moment icon="🎁" tone="mint" delay={330}
                  title={t('A welcome gift has arrived', '첫 방문 선물이 도착했어요')}
                  sub={`${result.welcome_coupon.title} · ${t('Tap to open your coupon', '탭해서 쿠폰 받기')}`}
                  href={`/pass/${result.welcome_coupon.barcode}`}
                />
              )}
              {result.next_visit_free && (
                <Moment icon="⚡" tone="gold" delay={330}
                  title={t('Next visit is FREE!', '다음 방문은 무료!')}
                  sub={lang === 'en'
                    ? `Just one more visit for your free ${result.reward_desc ?? 'reward'}`
                    : `한 번만 더 오시면 ${result.reward_desc ?? '리워드'}가 공짜예요`}
                />
              )}
              {result.tap_promo && (
                <Moment icon="📣" tone="plain" delay={410}
                  title={t("Today's news", '오늘의 소식')}
                  sub={result.tap_promo}
                />
              )}
              {result.review && !result.welcome_coupon && (
                <Moment icon="⭐" tone="gold" delay={490}
                  title={lang === 'en' ? `Leave a Google review, get ${result.review.reward_label}` : `구글 리뷰 남기면 ${result.review.reward_label}`}
                  sub={t('Takes 30 seconds', '30초면 충분해요')}
                  onClick={handleReview}
                />
              )}
            </div>

            {/* CTA */}
            <a href="/wallet" className="nk-press nk-display" style={{
              display: 'block', textAlign: 'center', marginTop: 20, padding: '17px', borderRadius: 999,
              background: C.brand, color: 'white', fontSize: 15.5, fontWeight: 800, letterSpacing: '0.01em',
              boxShadow: '0 6px 18px rgba(22,163,119,0.32)',
              textDecoration: 'none', animation: 'nk-rise 420ms ease-out 550ms both',
            }}>
              {t('Open my wallet', '내 월렛 보기')}
            </a>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: C.sub }}>
              {t('Thanks for visiting 🌿', '방문해 주셔서 감사합니다 🌿')}
            </div>
          </div>
        )}

        {/* ── Identify (first tap on this device) ── */}
        {phase === 'identify' && verify && (
          <div style={{ animation: 'nk-rise 360ms ease-out', paddingTop: 34 }}>
            <div style={{ marginBottom: 22 }}>
              <div className="nk-display" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {t('Almost there!', '거의 다 됐어요!')}
              </div>
              <div style={{ fontSize: 13.5, color: C.sub, marginTop: 6, lineHeight: 1.6 }}>
                {lang === 'en'
                  ? <>First tap on this phone.<br />Confirm once — after that, just tap.</>
                  : <>이 휴대폰에서 첫 적립이에요.<br />딱 한 번만 확인하면 다음부터는 탭만 하면 돼요.</>}
              </div>
            </div>

            {mode === 'choose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="nk-press" onClick={() => { setMode('new'); setFormError(''); }} style={{
                  padding: '18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: C.brand, color: 'white', fontSize: 15.5, fontWeight: 800, fontFamily: DISPLAY,
                  boxShadow: '0 6px 18px rgba(22,163,119,0.32)',
                }}>
                  {t("I'm new · 10-second sign-up", '처음이에요 · 10초 가입')}
                </button>
                <button className="nk-press" onClick={() => { setMode('existing'); setFormError(''); }} style={{
                  padding: '18px', borderRadius: 999, border: `1.5px solid ${C.line}`, cursor: 'pointer',
                  background: C.card, color: C.ink, fontSize: 15.5, fontWeight: 800, fontFamily: DISPLAY,
                }}>
                  {t('I already have a card', '이미 카드가 있어요')}
                </button>
              </div>
            )}

            {mode === 'new' && (
              <div style={{ background: C.card, borderRadius: 20, padding: 22, border: `1px solid ${C.line}` }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{t('Nickname', '닉네임')}</label>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2, marginBottom: 10 }}>
                  {t('Any name the store can call you', '매장에서 불릴 이름이면 충분해요')}
                </div>
                <input
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder={t('e.g. John', '예: 우상')}
                  autoFocus
                  style={inputStyle}
                />
                {formError && <div style={{ color: '#C0392B', fontSize: 12.5, marginTop: 8 }}>{formError}</div>}
                <button onClick={handleNewJoin} disabled={sending} style={{
                  width: '100%', marginTop: 14, padding: '17px', borderRadius: 999, border: 'none',
                  cursor: 'pointer', fontFamily: DISPLAY,
                  boxShadow: '0 6px 18px rgba(22,163,119,0.28)',
                  background: sending ? '#9AA5A0' : C.brand, color: 'white', fontSize: 15, fontWeight: 800,
                }}>
                  {sending ? t('Collecting…', '적립 중…') : t('Join & collect', '가입하고 바로 적립')}
                </button>
                <button onClick={() => setMode('choose')} style={{ width: '100%', marginTop: 6, padding: 10, border: 'none', background: 'none', color: C.sub, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                  ← {t('Back', '뒤로')}
                </button>
              </div>
            )}

            {mode === 'existing' && (
              <div style={{ background: C.card, borderRadius: 20, padding: 22, border: `1px solid ${C.line}` }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{t('Card number', '카드 번호')}</label>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2, marginBottom: 10 }}>
                  {t('From sign-up · digits only is fine', '가입 시 받은 번호 · 숫자만 입력해도 돼요')}
                </div>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  placeholder="NOO12345"
                  autoFocus
                  style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.06em' }}
                />
                {formError && <div style={{ color: '#C0392B', fontSize: 12.5, marginTop: 8 }}>{formError}</div>}
                <button onClick={handleExisting} disabled={sending} style={{
                  width: '100%', marginTop: 14, padding: '17px', borderRadius: 999, border: 'none',
                  cursor: 'pointer', fontFamily: DISPLAY,
                  boxShadow: '0 6px 18px rgba(22,163,119,0.28)',
                  background: sending ? '#9AA5A0' : C.brand, color: 'white', fontSize: 15, fontWeight: 800,
                }}>
                  {sending ? t('Collecting…', '적립 중…') : t('Collect stamp', '적립하기')}
                </button>
                <button onClick={() => setMode('choose')} style={{ width: '100%', marginTop: 6, padding: 10, border: 'none', background: 'none', color: C.sub, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                  ← {t('Back', '뒤로')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center', paddingTop: 96, animation: 'nk-rise 360ms ease-out' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 22, margin: '0 auto',
              background: errorCode === 'REPLAY' || errorCode === 'TOKEN_EXPIRED' ? C.mint : '#FBEAE8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              {errorCode === 'REPLAY' || errorCode === 'TOKEN_EXPIRED' ? '🔄' : '⚠️'}
            </div>
            <div style={{ fontSize: 17.5, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
              {errorCode === 'REPLAY' || errorCode === 'TOKEN_EXPIRED'
                ? t('Please tap the stamp again', '스탬프에 다시 탭해주세요')
                : t("Couldn't collect", '적립할 수 없어요')}
            </div>
            <div style={{ fontSize: 13.5, color: C.sub, marginTop: 8, lineHeight: 1.6 }}>{errorMsg}</div>
          </div>
        )}
      </div>

      {/* ── Redeem overlay ── */}
      {showRedeem && result && (
        <RedeemOverlay
          rewardDesc={result.reward_desc ?? 'Reward'}
          businessName={result.business_name}
          uniqueKey={result.unique_key ?? ''}
          lang={lang}
          onClose={() => setShowRedeem(false)}
          onRedeemed={() => setRedeemed(true)}
        />
      )}
    </div>
  );
}

export default function TapPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F6F8F7' }} />}>
      <TapPageInner />
    </Suspense>
  );
}
