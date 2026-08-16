'use client';

// ─── Customer Wallet (Headspace-inspired warm light theme) ───
// Stacked business cards, search, location-aware sorting, and
// self-serve reward redemption with a live certificate.
// English default · Korean via toggle (shared 'nook_lang').

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, WalletCard } from '@/lib/api';
import { account as acct, getAccount, getAccountToken, clearSession, CustomerAccount } from '@/lib/account';
import AddToHome from '@/components/AddToHome';
import EnableNotifications from '@/components/EnableNotifications';

const CARD_H = 172;
const PEEK = 66;
const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const T = {
  ink:   '#26332C',
  brand: '#16A377',
  mint:  '#DFF2E9',
  gold:  '#E3A93C',
  goldT: '#FBF0D7',
  paper: '#FAF6EE',
  card:  '#FFFFFF',
  line:  '#EDE6D8',
  sub:   '#7A8279',
};

type Lang = 'en' | 'ko';
function getLang(): Lang {
  try { return (localStorage.getItem('nook_lang') as Lang) || 'en'; } catch { return 'en'; }
}

type Membership = { customer_id?: string; unique_key: string; user_id?: string; business_name?: string };

function getMemberships(): Record<string, Membership> {
  try {
    const raw = localStorage.getItem('nook_memberships');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function timeAgo(iso: string | null, lang: Lang): string {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return lang === 'en' ? 'today' : '오늘';
  if (d === 1) return lang === 'en' ? 'yesterday' : '어제';
  if (d < 30) return lang === 'en' ? `${d}d ago` : `${d}일 전`;
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric' });
}

function couponLabel(c: WalletCard['coupons'][number], lang: Lang): string {
  if (c.free_item_name) return lang === 'en' ? `Free ${c.free_item_name}` : `무료 ${c.free_item_name}`;
  if (c.discount_type === 'percent' && c.discount_value) return lang === 'en' ? `${c.discount_value}% off` : `${c.discount_value}% 할인`;
  if (c.discount_type === 'fixed' && c.discount_value) return lang === 'en' ? `$${c.discount_value} off` : `$${c.discount_value} 할인`;
  return c.title;
}

// ── Card face (business-branded gradient — pops on warm cream) ─
function CardFace({ c, distKm, nearby, lang }: { c: WalletCard; distKm: number | null; nearby: boolean; lang: Lang }) {
  const isMembership = c.card_type === 'membership';
  return (
    <div style={{
      height: CARD_H, boxSizing: 'border-box', borderRadius: 26, padding: '16px 20px',
      background: `linear-gradient(135deg, ${c.color} 0%, #06382E 135%)`,
      boxShadow: '0 10px 26px rgba(38,51,44,0.18)',
      border: '1px solid rgba(255,255,255,0.14)',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', right: -34, top: -34, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
      <div style={{ position: 'absolute', left: -50, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative' }}>
        {c.business?.logo_url ? (
          <img src={c.business.logo_url} alt="" style={{ width: 38, height: 38, borderRadius: 999, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.4)' }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, fontFamily: DISPLAY }}>
            {c.business?.name?.[0] ?? 'N'}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: 'white', fontSize: 16.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: DISPLAY }}>
              {c.business?.name ?? (lang === 'en' ? 'Store' : '매장')}
            </span>
            {nearby && (
              <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.94)', color: '#085041', borderRadius: 999, padding: '3px 9px', flexShrink: 0 }}>
                📍 {lang === 'en' ? 'NEAR' : '근처'}
              </span>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 11.5 }}>
            {c.card_name}{distKm != null ? ` · ${distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {isMembership ? (
            <>
              <div style={{ color: 'white', fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: DISPLAY }}>
                {(c.total_points ?? 0).toLocaleString()}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 10.5, marginTop: 2 }}>POINTS</div>
            </>
          ) : (
            <>
              <div style={{ color: 'white', fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: DISPLAY }}>
                {c.current_stamps}<span style={{ fontSize: 13, opacity: 0.7 }}>/{c.goal_stamps}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 10.5, marginTop: 2 }}>STAMPS</div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'auto', position: 'relative' }}>
        {!isMembership && (
          <div style={{ height: 8, background: 'rgba(0,0,0,0.26)', borderRadius: 99, overflow: 'hidden', marginBottom: 9 }}>
            <div style={{
              width: `${Math.min(100, ((c.current_stamps ?? 0) / (c.goal_stamps ?? 10)) * 100)}%`,
              height: '100%', background: 'rgba(255,255,255,0.94)', borderRadius: 99, transition: 'width 400ms ease',
            }} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 11.5 }}>
            {c.reward_ready
              ? (lang === 'en' ? '🏆 Reward ready!' : '🏆 리워드 사용 가능!')
              : c.reward_desc
                ? (lang === 'en' ? `Reward · ${c.reward_desc}` : `리워드 · ${c.reward_desc}`)
                : ''}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 11.5 }}>
            {c.coupons.length > 0 ? `🎟️ ${c.coupons.length} · ` : ''}{lang === 'en' ? 'visited' : '방문'} {timeAgo(c.last_visit, lang)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Redeem overlay (confirm → live gold certificate) ─────────
// Handles both stamp rewards and membership point tiers.
function RedeemOverlay({ rewardDesc, businessName, uniqueKey, lang, points, onClose, onRedeemed }: {
  rewardDesc: string; businessName: string; uniqueKey: string; lang: Lang;
  points?: number;   // when set → membership point redemption
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
      if (points) await api.redeemPointsPublic(uniqueKey, points, rewardDesc);
      else await api.redeemReward(uniqueKey);
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
      position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(38,51,44,0.45)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: step === 'done' ? '#14100A' : T.card,
        borderRadius: '30px 30px 0 0', padding: '26px 22px calc(30px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box', animation: 'wk-rise 320ms cubic-bezier(0.22,0.9,0.28,1)',
      }}>
        {step === 'confirm' ? (
          <>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: T.line, margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 66, height: 66, borderRadius: 999, background: T.goldT, margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 29,
              }}>🏆</div>
              <div style={{ fontSize: 21, fontWeight: 900, color: T.ink, marginTop: 14, fontFamily: DISPLAY }}>
                {t('Use your reward?', '리워드를 사용할까요?')}
              </div>
              <div style={{ fontSize: 14, color: T.sub, marginTop: 6, lineHeight: 1.6 }}>
                <b style={{ color: T.ink }}>{rewardDesc}</b>{points ? ` · ${points.toLocaleString()}p` : ''} · {businessName}<br />
                {t('Press this at the counter, in front of staff.', '카운터에서 직원이 보는 앞에서 눌러주세요.')}
              </div>
            </div>
            {err && <div style={{ color: '#C0392B', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{err}</div>}
            <button className="wk-press" onClick={confirm} disabled={busy} style={{
              width: '100%', marginTop: 20, padding: '18px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: busy ? '#9AA5A0' : T.ink, color: 'white', fontSize: 15.5, fontWeight: 800, fontFamily: DISPLAY,
            }}>
              {busy ? t('Redeeming…', '사용 처리 중…') : t('Redeem now', '지금 사용하기')}
            </button>
            <button onClick={onClose} style={{
              width: '100%', marginTop: 8, padding: 12, border: 'none', background: 'none',
              color: T.sub, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
            }}>
              {t('Not yet', '나중에 쓸게요')}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 15px', borderRadius: 999,
              background: 'rgba(232,197,120,0.15)', border: '1px solid rgba(232,197,120,0.45)',
              fontSize: 12, fontWeight: 800, color: '#E8C578', letterSpacing: '0.08em',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: '#E8C578', animation: 'wk-pulse 1s ease-in-out infinite' }} />
              {t('LIVE · SHOW TO STAFF', 'LIVE · 직원에게 보여주세요')}
            </div>
            <div style={{ fontSize: 52, marginTop: 18 }}>🏆</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8, fontFamily: DISPLAY }}>{rewardDesc}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{businessName}</div>

            <div style={{
              margin: '20px auto 0', padding: '14px 18px', borderRadius: 20, maxWidth: 260,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: 31, fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontFamily: DISPLAY }}>
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
              width: '100%', marginTop: 18, padding: '16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)',
              background: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: DISPLAY,
            }}>
              {t('Done', '확인')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);
  const [redeemFor, setRedeemFor] = useState<WalletCard | null>(null);
  const [redeemTier, setRedeemTier] = useState<{ label: string; points: number } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<WalletCard | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<CustomerAccount | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const t = useCallback((en: string, ko: string) => (lang === 'en' ? en : ko), [lang]);

  useEffect(() => { setLang(getLang()); }, []);
  function toggleLang() {
    const next: Lang = lang === 'en' ? 'ko' : 'en';
    setLang(next);
    try { localStorage.setItem('nook_lang', next); } catch { /* non-fatal */ }
  }

  const load = useCallback(async () => {
    const members = getMemberships();
    let keys = Object.values(members).map((m) => m.unique_key).filter(Boolean);

    // Logged in? The account is the source of truth — its cards work on any device.
    if (getAccountToken()) {
      const info = await acct.me();
      if (info) {
        setMe(info.account);
        const merged = new Set([...(info.keys || []), ...keys]);
        keys = Array.from(merged);
        // quietly attach any device-only card to the account
        for (const k of keys) {
          if (!(info.keys || []).includes(k)) acct.link(k).catch(() => {});
        }
      } else {
        setMe(null);
      }
    } else {
      setMe(getAccount());
    }

    if (keys.length === 0) { setCards([]); setLoading(false); return; }
    try {
      const r = await api.walletCards(keys);
      setCards(r.cards);
      try {
        const map = getMemberships();
        for (const c of r.cards) {
          if (c.business?.id) {
            map[c.business.id] = {
              ...(map[c.business.id] ?? {}),
              unique_key: c.unique_key, user_id: c.user_id ?? undefined, business_name: c.business.name,
            };
          }
        }
        localStorage.setItem('nook_memberships', JSON.stringify(map));
      } catch { /* non-fatal */ }
    } catch { /* keep old */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* denied — recent-visit order */ },
      { timeout: 5000, maximumAge: 120000 }
    );
  }, []);

  const withDist = useMemo(() => cards.map((c) => {
    const b = c.business;
    const distKm = (geo && b?.lat != null && b?.lng != null)
      ? haversineKm(geo, { lat: b.lat, lng: b.lng })
      : null;
    return { c, distKm };
  }), [cards, geo]);

  const sorted = useMemo(() => [...withDist].sort((a, b) => {
    if (a.distKm != null && b.distKm != null && a.distKm !== b.distKm) return a.distKm - b.distKm;
    if (a.distKm != null && b.distKm == null) return -1;
    if (a.distKm == null && b.distKm != null) return 1;
    const av = a.c.last_visit ? new Date(a.c.last_visit).getTime() : 0;
    const bv = b.c.last_visit ? new Date(b.c.last_visit).getTime() : 0;
    return bv - av;
  }), [withDist]);

  useEffect(() => {
    if (autoOpened || selected || sorted.length === 0) return;
    const nearest = sorted[0];
    if (nearest.distKm != null && nearest.distKm <= 0.25) {
      setSelected(nearest.c.unique_key);
      setAutoOpened(true);
    }
  }, [sorted, autoOpened, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(({ c }) =>
      (c.business?.name ?? '').toLowerCase().includes(q) ||
      c.card_name.toLowerCase().includes(q) ||
      c.unique_key.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const sel = selected ? sorted.find(({ c }) => c.unique_key === selected) ?? null : null;
  const rest = sel ? sorted.filter(({ c }) => c.unique_key !== selected) : [];
  const ownerName = me?.name ?? cards[0]?.user_id ?? '';

  async function handleAdd() {
    const k = keyInput.trim().toUpperCase();
    if (!k) { setAddError(t('Please enter your card number.', '카드 번호를 입력해주세요.')); return; }
    setAdding(true); setAddError('');
    try {
      const r = await api.walletCards([k]);
      const card = r.cards[0];
      if (!card) {
        setAddError(t('Card not found. Check the number (e.g. NOO12345)', '카드를 찾을 수 없어요. 번호를 확인해주세요 (예: NOO12345)'));
        setAdding(false);
        return;
      }
      try {
        const map = getMemberships();
        map[card.business?.id ?? k] = { unique_key: card.unique_key, user_id: card.user_id ?? undefined, business_name: card.business?.name };
        localStorage.setItem('nook_memberships', JSON.stringify(map));
      } catch { /* non-fatal */ }
      setKeyInput(''); setShowAdd(false);
      await load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : t('Something went wrong.', '오류가 발생했어요.'));
    }
    setAdding(false);
  }

  const isMembershipSel = sel?.c.card_type === 'membership';

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    if (navigator.vibrate) navigator.vibrate(20);
    setTimeout(() => setRefreshing(false), 450);
  }

  function removeCard(card: WalletCard) {
    try {
      const map = getMemberships();
      const bizId = card.business?.id;
      if (bizId && map[bizId]) delete map[bizId];
      // also clear any entry stored under the raw key
      if (map[card.unique_key]) delete map[card.unique_key];
      localStorage.setItem('nook_memberships', JSON.stringify(map));
    } catch { /* non-fatal */ }
    setConfirmRemove(null);
    setSelected(null);
    setCards((prev) => prev.filter((c) => c.unique_key !== card.unique_key));
  }

  return (
    <div style={{
      minHeight: '100dvh', background: T.paper,
      fontFamily: FONT, color: T.ink, display: 'flex', flexDirection: 'column', alignItems: 'center',
      WebkitFontSmoothing: 'antialiased', position: 'relative', overflow: 'hidden',
    }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" />
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        button, a { touch-action: manipulation; }
        @keyframes wk-rise { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes wk-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes wk-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes wk-select {
          0%   { transform: translateY(22px) scale(0.96); opacity: 0.55; }
          62%  { transform: translateY(-5px) scale(1.008); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wk-detail {
          from { opacity: 0; transform: translateY(-14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .wk-card { transition: transform 240ms cubic-bezier(0.3,1.25,0.45,1); cursor: pointer; }
        .wk-card:hover { transform: translateY(-6px); }
        .wk-card:active { transform: translateY(-1px) scale(0.97); }
        .wk-press { transition: transform 180ms cubic-bezier(0.3,1.3,0.5,1); }
        .wk-press:active { transform: scale(0.965); }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* soft background blobs */}
      <div style={{ position: 'absolute', width: 260, height: 260, left: -120, top: -80, borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%', background: T.mint, opacity: 0.55, animation: 'wk-float 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 180, height: 180, right: -90, top: 140, borderRadius: '45% 55% 48% 52% / 55% 45% 55% 45%', background: T.goldT, opacity: 0.6, animation: 'wk-float 8.5s ease-in-out 900ms infinite' }} />

      <div style={{ width: '100%', maxWidth: 460, padding: '0 18px calc(60px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', position: 'relative' }}>

        {/* ── Header ── */}
        <div style={{ padding: '26px 4px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 800, color: T.brand }}>NOOK WALLET</div>
            <div className="nk" style={{ fontSize: 24, fontWeight: 900, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: DISPLAY }}>
              {ownerName
                ? (lang === 'en' ? `${ownerName}'s Wallet` : `${ownerName}님의 월렛`)
                : t('My Wallet', '내 월렛')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            <button className="wk-press" onClick={handleRefresh} aria-label="Refresh" style={{
              width: 42, height: 42, borderRadius: 999, cursor: 'pointer',
              background: T.card, border: `1px solid ${T.line}`, color: T.sub, fontSize: 15,
            }}>
              <span style={{ display: 'inline-block', transition: 'transform 600ms cubic-bezier(0.3,1.1,0.4,1)', transform: refreshing ? 'rotate(360deg)' : 'none' }}>↻</span>
            </button>
            <button className="wk-press" onClick={toggleLang} style={{
              padding: '9px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT,
              background: T.card, border: `1px solid ${T.line}`, color: T.sub, fontSize: 12, fontWeight: 700,
            }}>
              {lang === 'en' ? '한국어' : 'EN'}
            </button>
            {me ? (
              <button className="wk-press" onClick={() => {
                if (confirm(t('Log out of this wallet?', '로그아웃할까요?'))) { clearSession(); setMe(null); load(); }
              }} aria-label="Account" style={{
                width: 42, height: 42, borderRadius: 999, cursor: 'pointer', fontFamily: DISPLAY,
                background: T.mint, border: `1px solid ${T.brand}`, color: '#0E5A43', fontSize: 15, fontWeight: 900,
              }}>
                {(me.name ?? 'N').trim().charAt(0).toUpperCase()}
              </button>
            ) : (
              <a href="/login" className="wk-press" style={{
                padding: '10px 15px', borderRadius: 999, textDecoration: 'none', fontFamily: DISPLAY,
                background: T.brand, color: 'white', fontSize: 12.5, fontWeight: 800,
                boxShadow: '0 4px 12px rgba(22,163,119,0.28)',
              }}>
                {t('Log in', '로그인')}
              </a>
            )}
            <button className="wk-press" onClick={() => { setSearchOpen(!searchOpen); setQuery(''); setSelected(null); }} aria-label="Search" style={{
              width: 42, height: 42, borderRadius: 999, cursor: 'pointer',
              background: searchOpen ? T.brand : T.card,
              border: `1px solid ${searchOpen ? T.brand : T.line}`, color: searchOpen ? 'white' : T.sub, fontSize: 16,
            }}>
              🔍
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        {searchOpen && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search by store name…', '매장 이름으로 검색…')}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '14px 18px',
              borderRadius: 999, border: `1.5px solid ${T.line}`, outline: 'none',
              background: T.card, color: T.ink, fontSize: 15, fontFamily: FONT,
              animation: 'wk-rise 200ms ease-out',
            }}
          />
        )}

        {/* ── Not logged in: cards live only on this phone ── */}
        {!loading && !me && cards.length > 0 && !sel && (
          <a href="/login" className="wk-press" style={{
            display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none',
            background: T.card, border: `1.5px solid ${T.brand}`, borderRadius: 20,
            padding: '13px 15px', marginBottom: 14, animation: 'wk-rise 320ms ease-out',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 999, background: T.mint, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🔐</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontFamily: DISPLAY }}>
                {t('Save your cards to an account', '내 계정에 카드 저장하기')}
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>
                {t('Right now they live only on this phone', '지금은 이 폰에만 저장돼 있어요')}
              </div>
            </div>
            <span style={{ color: T.brand, fontSize: 15, fontWeight: 800 }}>→</span>
          </a>
        )}

        {/* ── At-a-glance summary (simple status) ── */}
        {!loading && cards.length > 0 && !sel && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, animation: 'wk-rise 320ms ease-out' }}>
            {[
              { icon: '💳', num: cards.length, label: t('cards', '카드') },
              { icon: '✅', num: cards.reduce((sum, c) => sum + c.total_stamps, 0), label: t('stamps', '스탬프') },
              { icon: '🎟️', num: cards.reduce((sum, c) => sum + c.coupons.length, 0), label: t('coupons', '쿠폰') },
            ].map((k, i) => (
              <div key={i} className="wk-press" style={{
                flex: 1, background: T.card, border: `1px solid ${T.line}`, borderRadius: 22,
                padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(38,51,44,0.04)',
                animation: `wk-rise 360ms cubic-bezier(0.25,1.1,0.4,1) ${i * 70}ms both`,
              }}>
                <div style={{ fontSize: 17 }}>{k.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: DISPLAY, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{k.num}</div>
                <div style={{ fontSize: 10.5, color: T.sub, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 90 }}>
            <div style={{
              width: 66, height: 66, borderRadius: 999, background: T.mint, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              animation: 'wk-pulse 1.1s ease-in-out infinite',
            }}>💳</div>
            <div style={{ color: T.sub, fontSize: 13.5, marginTop: 14 }}>{t('Loading your cards…', '카드 불러오는 중…')}</div>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && cards.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 50, animation: 'wk-rise 350ms ease-out' }}>
            <div style={{
              width: 84, height: 84, borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%', background: T.mint,
              margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
              animation: 'wk-float 4.5s ease-in-out infinite',
            }}>👋</div>
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 16, fontFamily: DISPLAY }}>{t('No cards yet', '아직 카드가 없어요')}</div>
            <div style={{ color: T.sub, fontSize: 13.5, marginTop: 8, lineHeight: 1.7 }}>
              {lang === 'en'
                ? <><b style={{ color: T.brand }}>Tap your phone on the store&apos;s NFC stamp</b><br />and a card appears automatically.<br />Already have one? Add it below.</>
                : <>매장의 <b style={{ color: T.brand }}>NFC 스탬프에 휴대폰을 탭</b>하면<br />카드가 자동으로 생겨요.<br />이미 카드가 있다면 아래에서 추가하세요.</>}
            </div>
          </div>
        )}

        {/* ══ SELECTED VIEW ══ */}
        {!loading && sel && !searchOpen && (
          <div>
            <div onClick={() => setSelected(null)} style={{ animation: 'wk-select 520ms cubic-bezier(0.3,1.15,0.4,1)', cursor: 'pointer' }}>
              <CardFace c={sel.c} distKm={sel.distKm} nearby={sel.distKm != null && sel.distKm <= 0.25} lang={lang} />
            </div>

            <div style={{
              background: T.card, border: `1px solid ${T.line}`,
              borderRadius: 24, padding: 18, marginTop: 10,
              boxShadow: '0 2px 10px rgba(38,51,44,0.05)',
              animation: 'wk-detail 420ms cubic-bezier(0.25,1.1,0.4,1) 120ms both',
            }}>
              {!isMembershipSel && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sel.c.goal_stamps ?? 10, 5)}, 1fr)`, gap: 9, marginBottom: 14 }}>
                  {Array.from({ length: sel.c.goal_stamps ?? 10 }).map((_, i) => {
                    const filled = i < (sel.c.current_stamps ?? 0);
                    return (
                      <div key={i} style={{
                        aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800, fontFamily: DISPLAY,
                        background: filled ? sel.c.color : T.paper,
                        color: filled ? 'white' : '#C9C2B2',
                        border: filled ? 'none' : `1.5px dashed ${T.line}`,
                      }}>
                        {filled ? '✓' : i + 1}
                      </div>
                    );
                  })}
                </div>
              )}

              {isMembershipSel && (sel.c.reward_tiers?.length ?? 0) > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: T.sub, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 8 }}>
                    {t('POINT REWARDS', '포인트 리워드')}
                  </div>
                  {sel.c.reward_tiers!.map((tier, i) => {
                    const enough = (sel.c.total_points ?? 0) >= (tier.points ?? 0);
                    return (
                      <button key={i} className={enough ? 'wk-press' : undefined}
                        onClick={() => { if (enough) { setRedeemTier({ label: tier.label, points: tier.points ?? 0 }); setRedeemFor(sel.c); } }}
                        disabled={!enough}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                          padding: '13px 15px', borderRadius: 16, marginBottom: 6, textAlign: 'left',
                          background: enough ? T.goldT : T.paper,
                          border: enough ? `1.5px solid ${T.gold}` : `1px solid ${T.line}`,
                          cursor: enough ? 'pointer' : 'default', fontFamily: FONT,
                        }}>
                        <span style={{ color: T.ink, fontSize: 13.5, fontWeight: 700 }}>{tier.label}</span>
                        <span style={{ color: enough ? '#A97B17' : T.sub, fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
                          {(tier.points ?? 0).toLocaleString()}p {enough ? t('· Use →', '· 사용하기 →') : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {sel.c.reward_ready && (
                <button className="wk-press" onClick={() => setRedeemFor(sel.c)} style={{
                  width: '100%', marginBottom: 12, padding: '17px', borderRadius: 999, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${T.gold}, #C98F1F)`, border: 'none',
                  fontFamily: DISPLAY, textAlign: 'center', boxShadow: '0 6px 18px rgba(227,169,60,0.35)',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#3A2A05' }}>
                    🏆 {lang === 'en' ? `Use reward — ${sel.c.reward_desc ?? 'free item'}` : `리워드 사용하기 — ${sel.c.reward_desc ?? '무료 상품'}`}
                  </span>
                </button>
              )}

              {sel.c.coupons.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: T.sub, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 8 }}>
                    {t('MY COUPONS', '내 쿠폰')} ({sel.c.coupons.length})
                  </div>
                  {sel.c.coupons.map((cp) => (
                    <a key={cp.id} href={`/pass/${cp.barcode}`} className="wk-press" style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: T.paper, borderRadius: 18, padding: '12px 15px', marginBottom: 7,
                      textDecoration: 'none', border: `1.5px dashed ${T.line}`,
                    }}>
                      <div>
                        <div style={{ color: T.ink, fontSize: 13.5, fontWeight: 700 }}>🎟️ {couponLabel(cp, lang)}</div>
                        <div style={{ color: T.sub, fontSize: 11, marginTop: 2 }}>
                          {cp.expires_at ? `~${new Date(cp.expires_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric' })}` : ''}
                        </div>
                      </div>
                      <span style={{ color: T.brand, fontSize: 12, fontWeight: 800 }}>{t('Use →', '사용하기 →')}</span>
                    </a>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: T.sub, fontSize: 11.5 }}>
                <span>{t('Card no.', '카드 번호')} <b style={{ fontVariantNumeric: 'tabular-nums', color: T.ink }}>{sel.c.unique_key}</b></span>
                <span>{lang === 'en' ? `${sel.c.total_stamps} visits total` : `누적 ${sel.c.total_stamps}회 적립`}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="wk-press" onClick={() => setSelected(null)} style={{
                flex: 1, padding: '14px', borderRadius: 999, cursor: 'pointer', fontFamily: DISPLAY,
                background: T.card, border: `1px solid ${T.line}`, color: T.sub, fontSize: 13.5, fontWeight: 800,
              }}>
                ✕ {t('All cards', '모든 카드 보기')}
              </button>
              <button className="wk-press" onClick={() => setConfirmRemove(sel.c)} aria-label="Remove card" style={{
                padding: '14px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT,
                background: T.card, border: `1px solid ${T.line}`, color: '#B4483C', fontSize: 13.5, fontWeight: 700,
              }}>
                🗑
              </button>
            </div>

            {rest.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ color: T.sub, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4 }}>
                  {t('OTHER CARDS', '다른 카드')}
                </div>
                {rest.map(({ c, distKm }, idx) => (
                  <div key={c.unique_key} className="wk-card"
                    onClick={() => { setSelected(c.unique_key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      height: PEEK, overflow: 'hidden', borderRadius: 26, marginBottom: 8,
                      animation: `wk-rise 360ms cubic-bezier(0.25,1.1,0.4,1) ${220 + idx * 70}ms both`,
                    }}>
                    <CardFace c={c} distKm={distKm} nearby={distKm != null && distKm <= 0.25} lang={lang} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ STACK VIEW ══ */}
        {!loading && (!sel || searchOpen) && filtered.length > 0 && (
          <div style={{ paddingTop: 6 }}>
            {filtered.map(({ c, distKm }, idx) => {
              const isLast = idx === filtered.length - 1;
              const stackMode = !query;
              return (
                <div
                  key={c.unique_key}
                  className="wk-card"
                  onClick={() => { setSelected(c.unique_key); setSearchOpen(false); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    animation: `wk-rise 320ms ease-out ${idx * 60}ms both`,
                    position: 'relative', zIndex: idx + 1,
                    height: stackMode && !isLast ? PEEK : CARD_H,
                    overflow: stackMode && !isLast ? 'hidden' : 'visible',
                    borderRadius: 26,
                    marginBottom: stackMode ? 0 : 12,
                  }}
                >
                  <CardFace c={c} distKm={distKm} nearby={distKm != null && distKm <= 0.25} lang={lang} />
                </div>
              );
            })}
          </div>
        )}

        {!loading && !sel && query && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T.sub, fontSize: 13.5 }}>
            {lang === 'en' ? `No results for "${query}"` : `"${query}" 검색 결과가 없어요`}
          </div>
        )}

        {/* ── Add card ── */}
        {!loading && !sel && (
          <div style={{ marginTop: 18, animation: 'wk-rise 350ms ease-out 200ms both' }}>
            {!showAdd ? (
              <button className="wk-press" onClick={() => setShowAdd(true)} style={{
                width: '100%', padding: '16px', borderRadius: 999, cursor: 'pointer', fontFamily: DISPLAY,
                background: T.card, border: `1.5px dashed #D8CFBC`,
                color: T.sub, fontSize: 14.5, fontWeight: 800,
              }}>
                + {t('Add a card', '카드 추가하기')}
              </button>
            ) : (
              <div style={{ background: T.card, borderRadius: 24, padding: 18, border: `1px solid ${T.line}`, boxShadow: '0 2px 10px rgba(38,51,44,0.05)' }}>
                <div style={{ color: T.ink, fontSize: 14, fontWeight: 800, fontFamily: DISPLAY }}>{t('Add by card number', '카드 번호로 추가')}</div>
                <div style={{ color: T.sub, fontSize: 12, marginTop: 3 }}>
                  {lang === 'en'
                    ? 'The number from sign-up (e.g. NOO12345). New store? Just tap their NFC stamp!'
                    : '가입 시 받은 번호 입력 (예: NOO12345). 새 매장은 NFC 탭이나 가입 QR로!'}
                </div>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  placeholder="NOO12345"
                  autoFocus
                  style={{
                    width: '100%', marginTop: 10, padding: '13px 16px', borderRadius: 18, boxSizing: 'border-box',
                    border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
                    fontSize: 15, fontVariantNumeric: 'tabular-nums', letterSpacing: 1, outline: 'none', fontFamily: FONT,
                  }}
                />
                {addError && <div style={{ color: '#C0392B', fontSize: 12, marginTop: 8 }}>{addError}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="wk-press" onClick={handleAdd} disabled={adding} style={{
                    flex: 1, padding: '14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: DISPLAY,
                    background: adding ? '#9AA5A0' : T.brand,
                    boxShadow: '0 6px 18px rgba(22,163,119,0.28)',
                    color: 'white', fontSize: 14, fontWeight: 800,
                  }}>
                    {adding ? t('Checking…', '확인 중…') : t('Add card', '추가하기')}
                  </button>
                  <button onClick={() => { setShowAdd(false); setAddError(''); }} style={{
                    padding: '14px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT,
                    background: 'none', border: `1px solid ${T.line}`, color: T.sub, fontSize: 13,
                  }}>
                    {t('Cancel', '취소')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && cards.length > 0 && !sel && (
          <>
            <EnableNotifications uniqueKeys={cards.map((c) => c.unique_key)} lang={lang} />
            <AddToHome lang={lang} />
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 28, color: '#B9B29F', fontSize: 11.5, lineHeight: 1.8 }}>
          {t('Tap the NFC stamp at any store — your card opens and collects automatically', '매장 NFC 스탬프에 탭하면 카드가 자동으로 열리고 적립됩니다')}<br />
          Powered by <b>Nook</b>
        </div>
      </div>

      {/* ── Redeem overlay (stamp reward or point tier) ── */}
      {redeemFor && (
        <RedeemOverlay
          rewardDesc={redeemTier?.label ?? redeemFor.reward_desc ?? 'Reward'}
          businessName={redeemFor.business?.name ?? ''}
          uniqueKey={redeemFor.unique_key}
          points={redeemTier?.points}
          lang={lang}
          onClose={() => { setRedeemFor(null); setRedeemTier(null); load(); }}
          onRedeemed={() => { /* refreshed on close */ }}
        />
      )}

      {/* ── Remove card confirm ── */}
      {confirmRemove && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(38,51,44,0.45)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT,
        }}>
          <div style={{
            width: '100%', maxWidth: 420, background: T.card,
            borderRadius: '30px 30px 0 0', padding: '26px 22px calc(30px + env(safe-area-inset-bottom, 0px))',
            boxSizing: 'border-box', animation: 'wk-rise 320ms cubic-bezier(0.22,0.9,0.28,1)',
          }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: T.line, margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 62, height: 62, borderRadius: 999, background: '#FBEDEB', margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              }}>🗑</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: T.ink, marginTop: 14, fontFamily: DISPLAY }}>
                {t('Remove this card?', '이 카드를 지울까요?')}
              </div>
              <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6, lineHeight: 1.6 }}>
                {lang === 'en'
                  ? <><b style={{ color: T.ink }}>{confirmRemove.business?.name}</b> disappears from this phone only.<br />Your stamps are safe — add card <b style={{ color: T.ink }}>{confirmRemove.unique_key}</b> anytime.</>
                  : <><b style={{ color: T.ink }}>{confirmRemove.business?.name}</b> 카드가 이 휴대폰에서만 사라져요.<br />스탬프는 그대로 — 번호 <b style={{ color: T.ink }}>{confirmRemove.unique_key}</b>로 다시 추가할 수 있어요.</>}
              </div>
            </div>
            <button className="wk-press" onClick={() => removeCard(confirmRemove)} style={{
              width: '100%', marginTop: 20, padding: '17px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: '#B4483C', color: 'white', fontSize: 15, fontWeight: 800, fontFamily: DISPLAY,
            }}>
              {t('Remove from this phone', '이 휴대폰에서 지우기')}
            </button>
            <button onClick={() => setConfirmRemove(null)} style={{
              width: '100%', marginTop: 8, padding: 12, border: 'none', background: 'none',
              color: T.sub, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
            }}>
              {t('Cancel', '취소')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
