'use client';

// ─── Customer Wallet — Apple Wallet-style stacked cards ──────
// · Cards overlap in a stack; tap one to bring it forward
// · Search bar to find a wallet
// · Location-aware: nearest store's card auto-surfaces first
//   (falls back to most-recently-visited when no location)
// · NFC tap at the store opens+credits the right card automatically (/t)
// Device identity: localStorage `nook_memberships` (auto "login").

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, WalletCard } from '@/lib/api';

const CARD_H = 172;   // full card height
const PEEK = 66;      // visible strip of stacked cards

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

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function couponLabel(c: WalletCard['coupons'][number]): string {
  if (c.free_item_name) return `무료 ${c.free_item_name}`;
  if (c.discount_type === 'percent' && c.discount_value) return `${c.discount_value}% 할인`;
  if (c.discount_type === 'fixed' && c.discount_value) return `$${c.discount_value} 할인`;
  return c.title;
}

// ── Card face (shared between stack + selected view) ─────────
function CardFace({ c, distKm, nearby }: { c: WalletCard; distKm: number | null; nearby: boolean }) {
  const isMembership = c.card_type === 'membership';
  return (
    <div style={{
      height: CARD_H, boxSizing: 'border-box', borderRadius: 22, padding: '16px 20px',
      background: `linear-gradient(135deg, ${c.color} 0%, #06382E 135%)`,
      boxShadow: '0 -6px 24px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.25)',
      border: '1px solid rgba(255,255,255,0.12)',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', right: -34, top: -34, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', left: -50, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />

      {/* top row — visible in stacked strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative' }}>
        {c.business?.logo_url ? (
          <img src={c.business.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.35)' }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>
            {c.business?.name?.[0] ?? 'N'}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: 'white', fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.business?.name ?? '매장'}
            </span>
            {nearby && (
              <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.92)', color: '#085041', borderRadius: 99, padding: '2.5px 8px', flexShrink: 0 }}>
                📍 근처
              </span>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11.5 }}>
            {c.card_name}{distKm != null ? ` · ${distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {isMembership ? (
            <>
              <div style={{ color: 'white', fontSize: 21, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                {(c.total_points ?? 0).toLocaleString()}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10.5, marginTop: 2 }}>POINTS</div>
            </>
          ) : (
            <>
              <div style={{ color: 'white', fontSize: 21, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                {c.current_stamps}<span style={{ fontSize: 13, opacity: 0.7 }}>/{c.goal_stamps}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10.5, marginTop: 2 }}>STAMPS</div>
            </>
          )}
        </div>
      </div>

      {/* lower area — hidden while stacked */}
      <div style={{ marginTop: 'auto', position: 'relative' }}>
        {!isMembership && (
          <div style={{ height: 7, background: 'rgba(0,0,0,0.28)', borderRadius: 99, overflow: 'hidden', marginBottom: 9 }}>
            <div style={{
              width: `${Math.min(100, ((c.current_stamps ?? 0) / (c.goal_stamps ?? 10)) * 100)}%`,
              height: '100%', background: 'rgba(255,255,255,0.92)', borderRadius: 99, transition: 'width 400ms ease',
            }} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5 }}>
            {c.reward_ready ? '🎉 리워드 사용 가능!' : c.reward_desc ? `리워드 · ${c.reward_desc}` : ''}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5 }}>
            {c.coupons.length > 0 ? `🎟️ ${c.coupons.length} · ` : ''}방문 {timeAgo(c.last_visit)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);

  // search
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  // add-card
  const [showAdd, setShowAdd] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    const members = getMemberships();
    const keys = Object.values(members).map((m) => m.unique_key).filter(Boolean);
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

  // Location (silent — sorts nearest first, auto-opens if very close)
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* denied/unavailable — fall back to recent-visit order */ },
      { timeout: 5000, maximumAge: 120000 }
    );
  }, []);

  // distance per card
  const withDist = useMemo(() => cards.map((c) => {
    const b = c.business;
    const distKm = (geo && b?.lat != null && b?.lng != null)
      ? haversineKm(geo, { lat: b.lat, lng: b.lng })
      : null;
    return { c, distKm };
  }), [cards, geo]);

  // sort: nearest first (when known) → then most recent visit
  const sorted = useMemo(() => [...withDist].sort((a, b) => {
    if (a.distKm != null && b.distKm != null && a.distKm !== b.distKm) return a.distKm - b.distKm;
    if (a.distKm != null && b.distKm == null) return -1;
    if (a.distKm == null && b.distKm != null) return 1;
    const av = a.c.last_visit ? new Date(a.c.last_visit).getTime() : 0;
    const bv = b.c.last_visit ? new Date(b.c.last_visit).getTime() : 0;
    return bv - av;
  }), [withDist]);

  // auto-surface: within 250m → bring that card forward once
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
  const ownerName = cards[0]?.user_id ?? '';

  async function handleAdd() {
    const k = keyInput.trim().toUpperCase();
    if (!k) { setAddError('카드 번호를 입력해주세요.'); return; }
    setAdding(true); setAddError('');
    try {
      const r = await api.walletCards([k]);
      const card = r.cards[0];
      if (!card) { setAddError('카드를 찾을 수 없어요. 번호를 확인해주세요 (예: NOO12345)'); setAdding(false); return; }
      try {
        const map = getMemberships();
        map[card.business?.id ?? k] = { unique_key: card.unique_key, user_id: card.user_id ?? undefined, business_name: card.business?.name };
        localStorage.setItem('nook_memberships', JSON.stringify(map));
      } catch { /* non-fatal */ }
      setKeyInput(''); setShowAdd(false);
      await load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : '오류가 발생했어요.');
    }
    setAdding(false);
  }

  const isMembershipSel = sel?.c.card_type === 'membership';

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #0B1712 0%, #0F1E17 40%, #101C16 100%)',
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <style>{`
        @keyframes wk-rise { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes wk-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .wk-card { transition: transform 220ms cubic-bezier(0.3,1.2,0.4,1); cursor: pointer; }
        .wk-card:hover { transform: translateY(-6px); }
      `}</style>

      <div style={{ width: '100%', maxWidth: 460, padding: '0 18px 90px', boxSizing: 'border-box' }}>

        {/* ── Header ── */}
        <div style={{ padding: '26px 4px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, letterSpacing: 2, fontWeight: 700, color: '#4ECBA0' }}>NOOK WALLET</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ownerName ? `${ownerName}님의 월렛` : '내 월렛'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => { setSearchOpen(!searchOpen); setQuery(''); setSelected(null); }} aria-label="Search" style={{
              width: 40, height: 40, borderRadius: 13, cursor: 'pointer',
              background: searchOpen ? '#1D9E75' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)', color: searchOpen ? 'white' : '#4ECBA0', fontSize: 16,
            }}>
              🔍
            </button>
            <div style={{
              width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4ECBA0', fontWeight: 800, fontSize: 16, border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {(ownerName?.[0] ?? 'N').toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Search bar ── */}
        {searchOpen && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="매장 이름으로 검색…"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '13px 16px',
              borderRadius: 13, border: '1.5px solid rgba(255,255,255,0.18)', outline: 'none',
              background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 15,
              animation: 'wk-rise 200ms ease-out',
            }}
          />
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 90 }}>
            <div style={{ fontSize: 38, animation: 'wk-pulse 1.1s ease-in-out infinite' }}>💳</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, marginTop: 12 }}>카드 불러오는 중…</div>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && cards.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 50, animation: 'wk-rise 350ms ease-out' }}>
            <div style={{ fontSize: 46 }}>👋</div>
            <div style={{ color: 'white', fontSize: 18, fontWeight: 800, marginTop: 14 }}>아직 카드가 없어요</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, marginTop: 8, lineHeight: 1.7 }}>
              매장의 <b style={{ color: '#4ECBA0' }}>NFC 스탬프에 휴대폰을 탭</b>하면<br />카드가 자동으로 생겨요.<br />
              이미 카드가 있다면 아래에서 추가하세요.
            </div>
          </div>
        )}

        {/* ══ SELECTED VIEW — one card forward, detail below ══ */}
        {!loading && sel && !searchOpen && (
          <div style={{ animation: 'wk-rise 260ms ease-out' }}>
            <div onClick={() => setSelected(null)}>
              <CardFace c={sel.c} distKm={sel.distKm} nearby={sel.distKm != null && sel.distKm <= 0.25} />
            </div>

            {/* detail */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, padding: 18, marginTop: 10,
            }}>
              {!isMembershipSel && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sel.c.goal_stamps ?? 10, 5)}, 1fr)`, gap: 9, marginBottom: 14 }}>
                  {Array.from({ length: sel.c.goal_stamps ?? 10 }).map((_, i) => {
                    const filled = i < (sel.c.current_stamps ?? 0);
                    return (
                      <div key={i} style={{
                        aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700,
                        background: filled ? sel.c.color : 'rgba(255,255,255,0.06)',
                        color: filled ? 'white' : 'rgba(255,255,255,0.35)',
                        border: filled ? 'none' : '1.5px dashed rgba(255,255,255,0.2)',
                      }}>
                        {filled ? '✓' : i + 1}
                      </div>
                    );
                  })}
                </div>
              )}

              {isMembershipSel && (sel.c.reward_tiers?.length ?? 0) > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>포인트 리워드</div>
                  {sel.c.reward_tiers!.map((t, i) => {
                    const enough = (sel.c.total_points ?? 0) >= (t.points ?? 0);
                    return (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '10px 13px', borderRadius: 10, marginBottom: 6,
                        background: enough ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                        border: enough ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <span style={{ color: 'white', fontSize: 13.5, fontWeight: 700 }}>{t.label}</span>
                        <span style={{ color: enough ? '#C4B5FD' : 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                          {(t.points ?? 0).toLocaleString()}p {enough ? '· 사용 가능' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {sel.c.reward_ready && (
                <div style={{ background: 'rgba(78,203,160,0.15)', border: '1.5px solid #4ECBA0', borderRadius: 12, padding: '12px 14px', marginBottom: 12, textAlign: 'center' }}>
                  <div style={{ color: '#4ECBA0', fontSize: 14, fontWeight: 800 }}>🎉 {sel.c.reward_desc ?? '리워드'} 사용 가능</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>매장 직원에게 이 화면을 보여주세요</div>
                </div>
              )}

              {sel.c.coupons.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>내 쿠폰 ({sel.c.coupons.length})</div>
                  {sel.c.coupons.map((cp) => (
                    <a key={cp.id} href={`/pass/${cp.barcode}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '11px 13px', marginBottom: 7,
                      textDecoration: 'none', border: '1px dashed rgba(255,255,255,0.2)',
                    }}>
                      <div>
                        <div style={{ color: 'white', fontSize: 13.5, fontWeight: 700 }}>🎟️ {couponLabel(cp)}</div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
                          {cp.expires_at ? `~${new Date(cp.expires_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}` : ''}
                        </div>
                      </div>
                      <span style={{ color: '#4ECBA0', fontSize: 12, fontWeight: 700 }}>사용하기 →</span>
                    </a>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.45)', fontSize: 11.5 }}>
                <span>카드 번호 <b style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.7)' }}>{sel.c.unique_key}</b></span>
                <span>누적 {sel.c.total_stamps}회 적립</span>
              </div>
            </div>

            <button onClick={() => setSelected(null)} style={{
              width: '100%', marginTop: 12, padding: '13px', borderRadius: 13, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontSize: 13.5, fontWeight: 700,
            }}>
              ✕ 모든 카드 보기
            </button>

            {/* other cards — compressed strips */}
            {rest.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, fontWeight: 700, letterSpacing: 1, marginBottom: 10, paddingLeft: 4 }}>다른 카드</div>
                {rest.map(({ c, distKm }) => (
                  <div key={c.unique_key} className="wk-card" onClick={() => setSelected(c.unique_key)}
                    style={{ height: PEEK, overflow: 'hidden', borderRadius: 22, marginBottom: 8 }}>
                    <CardFace c={c} distKm={distKm} nearby={distKm != null && distKm <= 0.25} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ STACK VIEW — Apple Wallet-style ══ */}
        {!loading && (!sel || searchOpen) && filtered.length > 0 && (
          <div style={{ paddingTop: 6 }}>
            {filtered.map(({ c, distKm }, idx) => {
              const isLast = idx === filtered.length - 1;
              const stackMode = !query; // search results show as separated rows
              return (
                <div
                  key={c.unique_key}
                  className="wk-card"
                  onClick={() => { setSelected(c.unique_key); setSearchOpen(false); setQuery(''); }}
                  style={{
                    animation: `wk-rise 320ms ease-out ${idx * 60}ms both`,
                    position: 'relative', zIndex: idx + 1,
                    height: stackMode && !isLast ? PEEK : CARD_H,
                    overflow: stackMode && !isLast ? 'hidden' : 'visible',
                    borderRadius: 22,
                    marginBottom: stackMode ? 0 : 12,
                  }}
                >
                  <CardFace c={c} distKm={distKm} nearby={distKm != null && distKm <= 0.25} />
                </div>
              );
            })}
          </div>
        )}

        {!loading && !sel && query && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>
            &quot;{query}&quot; 검색 결과가 없어요
          </div>
        )}

        {/* ── Add card ── */}
        {!loading && !sel && (
          <div style={{ marginTop: 18, animation: 'wk-rise 350ms ease-out 200ms both' }}>
            {!showAdd ? (
              <button onClick={() => setShowAdd(true)} style={{
                width: '100%', padding: '15px', borderRadius: 15, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.75)', fontSize: 14.5, fontWeight: 700,
              }}>
                + 카드 추가하기
              </button>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 15, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ color: 'white', fontSize: 13.5, fontWeight: 700 }}>카드 번호로 추가</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>
                  가입 시 받은 번호 입력 (예: NOO12345). 새 매장은 NFC 탭이나 가입 QR로!
                </div>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  placeholder="NOO12345"
                  autoFocus
                  style={{
                    width: '100%', marginTop: 10, padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                    border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.25)', color: 'white',
                    fontSize: 15, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, outline: 'none',
                  }}
                />
                {addError && <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 8 }}>{addError}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={handleAdd} disabled={adding} style={{
                    flex: 1, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: adding ? '#6B7280' : 'linear-gradient(135deg, #1D9E75, #0E6B4F)',
                    color: 'white', fontSize: 14, fontWeight: 800,
                  }}>
                    {adding ? '확인 중…' : '추가하기'}
                  </button>
                  <button onClick={() => { setShowAdd(false); setAddError(''); }} style={{
                    padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: 13,
                  }}>
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 28, color: 'rgba(255,255,255,0.3)', fontSize: 11.5, lineHeight: 1.8 }}>
          매장 NFC 스탬프에 탭하면 카드가 자동으로 열리고 적립됩니다<br />Powered by <b>Nook</b>
        </div>
      </div>
    </div>
  );
}
