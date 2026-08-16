'use client';

// ─── Manual Collect (staff) ──────────────────────────────────
// NFC tap is the primary way customers collect stamps.
// This screen is the manual backup: type the customer's card
// number to add a stamp, or a coupon barcode to redeem it.
// (Camera scanning removed — no longer needed with NFC.)

import { useState } from 'react';
import { Check, X, Hash, Ticket, Gift, Nfc, Undo2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlan } from '@/hooks/usePlan';

type Mode = 'stamp' | 'coupon';

interface StampResult {
  ok: boolean;
  msg: string;
  customer?: string;
  customerId?: string;
  stampId?: string | null;      // set right after a stamp — enables one-tap undo
  redeemed?: boolean;           // a reward was just given out — can be taken back
  limitHit?: boolean;           // already collected today — expected, not an error
  stamps?: number;
  goal?: number;
  rewardReady?: boolean;
  rewardDesc?: string | null;
  points?: number | null;
}

export default function CollectPage() {
  const { businessName } = usePlan();
  const prefix = (businessName || 'NOO')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');

  const [mode, setMode] = useState<Mode>('stamp');
  const [digits, setDigits] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StampResult | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [undoing, setUndoing] = useState(false);

  async function submitStamp() {
    const d = digits.trim();
    if (!d || loading) return;
    setLoading(true); setResult(null);
    try {
      const data = await api.scanStamp(prefix + d, 'manual');
      setResult({
        ok: true,
        msg: data.message,
        customer: data.customer_name,
        customerId: data.customer_id,
        stampId: data.stamp_id,
        stamps: data.new_stamps ?? undefined,
        goal: data.goal_stamps ?? undefined,
        rewardReady: data.reward_ready,
        rewardDesc: data.reward_desc,
        points: data.total_points,
      });
      setDigits('');
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Failed';
      let name: string | undefined;
      try {
        const j = JSON.parse(msg);
        msg = j.error ?? msg;
        name = j.customer_name;
      } catch { /* keep */ }
      const code = (e as { code?: string }).code;
      setResult({ ok: false, msg, customer: name, limitHit: code === 'DAILY_LIMIT_REACHED' });
      if (code === 'DAILY_LIMIT_REACHED') setDigits('');
    }
    setLoading(false);
  }

  async function confirmReward() {
    if (!result?.customerId || redeeming) return;
    setRedeeming(true);
    try {
      const r = await api.redeemStamp(result.customerId);
      setResult({ ok: true, msg: r.message, customer: result.customer, customerId: result.customerId, redeemed: true });
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Redeem failed';
      try { msg = JSON.parse(msg).error ?? msg; } catch { /* keep */ }
      setResult({ ...result, msg });
    }
    setRedeeming(false);
  }

  // ─── Undo — the "oops, I tapped twice" button ──────────────
  async function undoStamp() {
    if (!result || undoing) return;
    setUndoing(true);
    try {
      const r = await api.undoStamp(
        result.stampId ? { stamp_id: result.stampId } : { customer_id: result.customerId }
      );
      setResult({
        ok: true,
        msg: r.message,
        customer: result.customer,
        customerId: r.customer_id,
        stamps: r.current ?? undefined,
        goal: r.goal_stamps ?? undefined,
        points: r.total_points,
      });
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Undo failed';
      try { msg = JSON.parse(msg).error ?? msg; } catch { /* keep */ }
      setResult({ ...result, msg, ok: false });
    }
    setUndoing(false);
  }

  async function undoRedeem() {
    if (!result?.customerId || undoing) return;
    setUndoing(true);
    try {
      const r = await api.undoRedeem({ customer_id: result.customerId });
      setResult({ ok: true, msg: r.message, customer: result.customer, customerId: result.customerId });
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Undo failed';
      try { msg = JSON.parse(msg).error ?? msg; } catch { /* keep */ }
      setResult({ ...result, msg, ok: false });
    }
    setUndoing(false);
  }

  async function submitCoupon() {
    const b = barcode.trim();
    if (!b || loading) return;
    setLoading(true); setResult(null);
    try {
      const data = await api.redeemCoupon(b);
      setResult({ ok: true, msg: `Coupon "${data.coupon?.title ?? ''}" redeemed for ${data.customer?.name ?? 'customer'}.` });
      setBarcode('');
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Redeem failed';
      try { msg = JSON.parse(msg).error ?? msg; } catch { /* keep */ }
      setResult({ ok: false, msg });
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '16px 14px', fontSize: 24, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2,
    border: '2px solid #D4E6DB', borderRadius: 12, outline: 'none',
    boxSizing: 'border-box', width: '100%', color: '#1A1A1F', background: 'white',
  };

  return (
    <div style={{
      minHeight: '100dvh', background: '#F5F7F6', display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", padding: '0 16px 40px', boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '26px 0 6px' }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: '#1A1A1F', margin: 0 }}>Manual Collect</h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
            background: '#E8F7F2', borderRadius: 999, padding: '6px 13px',
            fontSize: 12, color: '#085041', fontWeight: 600,
          }}>
            <Nfc size={13} /> 손님이 NFC 스탬프에 탭하면 자동 적립 — 이 화면은 백업용
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, margin: '18px 0' }}>
          {(['stamp', 'coupon'] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }} style={{
              flex: 1, padding: '13px', borderRadius: 12, cursor: 'pointer', fontSize: 14.5, fontWeight: 800,
              border: mode === m ? 'none' : '1.5px solid #D4E6DB',
              background: mode === m ? 'linear-gradient(135deg, #1D9E75, #085041)' : 'white',
              color: mode === m ? 'white' : '#5A5F68',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              {m === 'stamp' ? <><Hash size={15} /> Stamp 적립</> : <><Ticket size={15} /> Coupon 사용</>}
            </button>
          ))}
        </div>

        {/* Stamp mode */}
        {mode === 'stamp' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #EBEBEB' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5A5F68', marginBottom: 10 }}>
              고객 카드 번호 (뒤 숫자만 입력)
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
              <span style={{
                display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: 12,
                background: '#085041', color: 'white', fontSize: 22, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2,
              }}>{prefix}</span>
              <input
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submitStamp()}
                placeholder="12345"
                inputMode="numeric"
                autoFocus
                style={inputStyle}
              />
            </div>
            <button onClick={submitStamp} disabled={loading || !digits} style={{
              width: '100%', marginTop: 14, padding: '16px', borderRadius: 12, border: 'none',
              cursor: loading || !digits ? 'default' : 'pointer',
              background: loading || !digits ? '#C7CCC9' : 'linear-gradient(135deg, #1D9E75, #085041)',
              color: 'white', fontSize: 16, fontWeight: 800,
            }}>
              {loading ? 'Adding…' : '+1 Stamp 적립'}
            </button>
            <div style={{ fontSize: 12, color: '#8A8F98', marginTop: 10, textAlign: 'center' }}>
              숫자만 입력하면 {prefix}가 자동으로 붙어요.
            </div>
          </div>
        )}

        {/* Coupon mode */}
        {mode === 'coupon' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #EBEBEB' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5A5F68', marginBottom: 10 }}>
              쿠폰 바코드 번호 (손님 쿠폰 화면의 숫자)
            </div>
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submitCoupon()}
              placeholder="123456789012"
              inputMode="numeric"
              autoFocus
              style={inputStyle}
            />
            <button onClick={submitCoupon} disabled={loading || !barcode} style={{
              width: '100%', marginTop: 14, padding: '16px', borderRadius: 12, border: 'none',
              cursor: loading || !barcode ? 'default' : 'pointer',
              background: loading || !barcode ? '#C7CCC9' : 'linear-gradient(135deg, #7C3AED, #4C1D95)',
              color: 'white', fontSize: 16, fontWeight: 800,
            }}>
              {loading ? 'Redeeming…' : 'Redeem Coupon 사용 처리'}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            marginTop: 16, borderRadius: 16, padding: 20, border: '1px solid',
            borderColor: result.ok ? '#B7E4D3' : result.limitHit ? '#F0D48A' : '#FCA5A5',
            background: result.ok ? '#E8F7F2' : result.limitHit ? '#FFF9E8' : '#FEF2F2',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: result.ok ? '#1D9E75' : result.limitHit ? '#D9A31E' : '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {result.ok ? <Check size={20} color="white" />
                  : result.limitHit ? <Clock size={20} color="white" />
                  : <X size={20} color="white" />}
              </div>
              <div style={{ flex: 1 }}>
                {result.customer && <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1F' }}>{result.customer}</div>}
                <div style={{ fontSize: 13, color: result.ok ? '#085041' : result.limitHit ? '#8C5A11' : '#DC2626', marginTop: 2 }}>{result.msg}</div>
                {result.limitHit && (
                  <div style={{ fontSize: 11.5, color: '#A07A28', marginTop: 5 }}>
                    오늘 이미 적립했어요 · 한도는 설정 &gt; 하루 적립 한도에서 바꿀 수 있어요
                  </div>
                )}
              </div>
              {result.ok && result.stamps !== undefined && (
                <div style={{ fontSize: 22, fontWeight: 800, color: '#085041', fontFamily: "'JetBrains Mono', monospace" }}>
                  {result.stamps}/{result.goal}
                </div>
              )}
              {result.ok && result.points != null && (
                <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED', fontFamily: "'JetBrains Mono', monospace" }}>
                  {result.points.toLocaleString()}p
                </div>
              )}
            </div>

            {result.rewardReady && (
              <div style={{ marginTop: 14, background: 'white', borderRadius: 12, padding: 14, border: '1.5px solid #1D9E75', textAlign: 'center' }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#085041' }}>
                  🎉 리워드 달성 — {result.rewardDesc ?? 'Free reward'}
                </div>
                <button onClick={confirmReward} disabled={redeeming} style={{
                  width: '100%', marginTop: 10, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: redeeming ? '#9CA3AF' : '#085041', color: 'white', fontSize: 14, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                  <Gift size={15} /> {redeeming ? 'Confirming…' : '리워드 지급 확인 (카드 리셋)'}
                </button>
              </div>
            )}

            {/* Undo — 실수로 두 번 찍었을 때 바로 되돌리기 */}
            {result.ok && (result.stampId || result.redeemed) && (
              <button onClick={result.redeemed ? undoRedeem : undoStamp} disabled={undoing} style={{
                width: '100%', marginTop: 12, padding: '12px', borderRadius: 10, cursor: undoing ? 'default' : 'pointer',
                background: 'white', border: '1.5px solid #D9B7B7', color: '#B04141',
                fontSize: 13.5, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <Undo2 size={15} />
                {undoing ? '되돌리는 중…' : result.redeemed ? '리워드 지급 취소' : '방금 적립 취소'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
