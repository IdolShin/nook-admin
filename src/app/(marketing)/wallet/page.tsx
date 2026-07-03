'use client';

// ─── Customer Wallet (sample app view) ───────────────────────
// The screen a customer sees when opening the Nook Wallet app/PWA.
// Shows one card per business, lets them add more cards later.
// Device-based identity: localStorage `nook_memberships`.

import { useCallback, useEffect, useState } from 'react';
import { api, WalletCard } from '@/lib/api';

type Membership = { customer_id?: string; unique_key: string; user_id?: string; business_name?: string };

function getMemberships(): Record<string, Membership> {
  try {
    const raw = localStorage.getItem('nook_memberships');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
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

export default function WalletPage() {
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
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
      // refresh stored business names / customer ids
      try {
        const map = getMemberships();
        for (const c of r.cards) {
          if (c.business?.id) {
            map[c.business.id] = {
              ...(map[c.business.id] ?? {}),
              unique_key: c.unique_key,
              user_id: c.user_id ?? undefined,
              business_name: c.business.name,
            };
          }
        }
        localStorage.setItem('nook_memberships', JSON.stringify(map));
      } catch { /* non-fatal */ }
    } catch { /* keep old */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
        map[card.business?.id ?? k] = {
          unique_key: card.unique_key,
          user_id: card.user_id ?? undefined,
          business_name: card.business?.name,
        };
        localStorage.setItem('nook_memberships', JSON.stringify(map));
      } catch { /* non-fatal */ }
      setKeyInput(''); setShowAdd(false);
      await load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : '오류가 발생했어요.');
    }
    setAdding(false);
  }

  const ownerName = cards[0]?.user_id ?? '';

  return (
    <div style={{
      minHeight: '100dvh', background: '#0F1E17',
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <style>{`
        @keyframes wk-rise { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes wk-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 460, padding: '0 18px 90px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ padding: '26px 4px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11.5, letterSpacing: 2, fontWeight: 700, color: '#4ECBA0' }}>NOOK WALLET</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginTop: 3 }}>
              {ownerName ? `${ownerName}님의 월렛` : '내 월렛'}
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4ECBA0', fontWeight: 800, fontSize: 16, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {(ownerName?.[0] ?? 'N').toUpperCase()}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 90 }}>
            <div style={{ fontSize: 38, animation: 'wk-pulse 1.1s ease-in-out infinite' }}>💳</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, marginTop: 12 }}>카드 불러오는 중…</div>
          </div>
        )}

        {/* Empty state */}
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

        {/* Card list */}
        {!loading && cards.map((c, idx) => {
          const isOpen = expanded === c.unique_key;
          const isMembership = c.card_type === 'membership';
          return (
            <div key={c.unique_key} style={{ animation: `wk-rise 350ms ease-out ${idx * 70}ms both`, marginBottom: 14 }}>
              {/* Card face */}
              <div
                onClick={() => setExpanded(isOpen ? null : c.unique_key)}
                style={{
                  background: `linear-gradient(135deg, ${c.color} 0%, #06382E 130%)`,
                  borderRadius: 20, padding: '18px 20px', cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {c.business?.logo_url ? (
                    <img src={c.business.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 11, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.3)' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 17 }}>
                      {c.business?.name?.[0] ?? 'N'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: 16.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.business?.name ?? '매장'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{c.card_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isMembership ? (
                      <>
                        <div style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                          {(c.total_points ?? 0).toLocaleString()}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>points</div>
                      </>
                    ) : (
                      <>
                        <div style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                          {c.current_stamps}<span style={{ fontSize: 13, opacity: 0.7 }}>/{c.goal_stamps}</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>stamps</div>
                      </>
                    )}
                  </div>
                </div>

                {/* progress bar (stamp cards) */}
                {!isMembership && (
                  <div style={{ marginTop: 14, height: 7, background: 'rgba(0,0,0,0.25)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, ((c.current_stamps ?? 0) / (c.goal_stamps ?? 10)) * 100)}%`,
                      height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 99, transition: 'width 400ms ease',
                    }} />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11.5 }}>
                    {c.reward_ready ? '🎉 리워드 사용 가능!' : c.reward_desc ? `리워드: ${c.reward_desc}` : ''}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11.5 }}>
                    마지막 방문 {timeAgo(c.last_visit)}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: 18, marginTop: 8, animation: 'wk-rise 250ms ease-out',
                }}>
                  {/* Stamp grid */}
                  {!isMembership && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(c.goal_stamps ?? 10, 5)}, 1fr)`, gap: 9, marginBottom: 14 }}>
                      {Array.from({ length: c.goal_stamps ?? 10 }).map((_, i) => {
                        const filled = i < (c.current_stamps ?? 0);
                        return (
                          <div key={i} style={{
                            aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 700,
                            background: filled ? c.color : 'rgba(255,255,255,0.06)',
                            color: filled ? 'white' : 'rgba(255,255,255,0.35)',
                            border: filled ? 'none' : '1.5px dashed rgba(255,255,255,0.2)',
                          }}>
                            {filled ? '✓' : i + 1}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {c.reward_ready && (
                    <div style={{ background: 'rgba(78,203,160,0.15)', border: '1.5px solid #4ECBA0', borderRadius: 12, padding: '12px 14px', marginBottom: 12, textAlign: 'center' }}>
                      <div style={{ color: '#4ECBA0', fontSize: 14, fontWeight: 800 }}>🎉 {c.reward_desc ?? '리워드'} 사용 가능</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>매장 직원에게 이 화면을 보여주세요</div>
                    </div>
                  )}

                  {/* Coupons */}
                  {c.coupons.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>내 쿠폰 ({c.coupons.length})</div>
                      {c.coupons.map((cp) => (
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
                    <span>카드 번호 <b style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.7)' }}>{c.unique_key}</b></span>
                    <span>누적 {c.total_stamps}회 적립</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add card */}
        {!loading && (
          <div style={{ marginTop: 8, animation: 'wk-rise 350ms ease-out 200ms both' }}>
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

        <div style={{ textAlign: 'center', marginTop: 30, color: 'rgba(255,255,255,0.3)', fontSize: 11.5 }}>
          Powered by <b>Nook</b> · 매장 NFC 스탬프에 탭하면 자동 적립
        </div>
      </div>
    </div>
  );
}
