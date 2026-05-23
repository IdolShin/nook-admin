'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, type ApiCard } from '@/lib/api';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ArrowLeft, UserPlus, ChevronDown, Check } from 'lucide-react';

export default function AddCustomerPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  const [name, setName]     = useState('');
  const [phone, setPhone]   = useState('');
  const [cardId, setCardId] = useState('');
  const [cards, setCards]   = useState<ApiCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);

  useEffect(() => {
    api.cards().then((cs) => {
      const active = cs.filter((c) => c.is_active);
      setCards(active);
      if (active.length > 0) setCardId(active[0].id);
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())  { setError('이름을 입력해주세요.'); return; }
    if (!phone.trim()) { setError('전화번호를 입력해주세요.'); return; }
    if (!cardId)       { setError('카드를 선택해주세요.'); return; }
    setSaving(true); setError('');
    try {
      await api.registerCustomer({
        card_id: cardId,
        name: name.trim(),
        phone: phone.trim(),
        consent_push: true,
        consent_points: true,
      });
      setDone(true);
      setTimeout(() => router.push('/customers'), 1600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register customer');
      setSaving(false);
    }
  }

  const inStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    border: '1px solid #EBEBEB', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    color: '#1A1A1F', background: 'white', boxSizing: 'border-box',
    transition: 'border-color 150ms',
  };

  if (done) {
    return (
      <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: '#E8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={28} color="#1D9E75" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1F' }}>고객 등록 완료!</div>
          <div style={{ fontSize: 14, color: '#8A8D94', marginTop: 6 }}>고객 목록으로 돌아갑니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', maxWidth: 520, margin: '0 auto' }}>
      {/* Back button */}
      <button onClick={() => router.push('/customers')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#5C5F66', fontFamily: 'inherit', marginBottom: 24 }}>
        <ArrowLeft size={15} /> 고객 목록으로
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1D9E75, #085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <UserPlus size={20} color="white" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1F', letterSpacing: '-0.025em', marginBottom: 4 }}>고객 직접 등록</h1>
        <p style={{ fontSize: 14, color: '#8A8D94', margin: 0 }}>고객 정보를 직접 입력하여 로열티 카드에 등록합니다.</p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 24, display: 'grid', gap: 18 }}>
          {error && (
            <div style={{ padding: '12px 16px', background: '#FBE2EC', borderRadius: 10, fontSize: 13, color: '#9C2848', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5C5F66', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              고객 이름 *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김민수"
              style={inStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1D9E75')}
              onBlur={(e) => (e.target.style.borderColor = '#EBEBEB')}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5C5F66', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              전화번호 *
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 010-1234-5678"
              type="tel"
              style={inStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1D9E75')}
              onBlur={(e) => (e.target.style.borderColor = '#EBEBEB')}
            />
          </div>

          {/* Card selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5C5F66', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              로열티 카드 *
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                style={{ ...inStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: 40, cursor: 'pointer' }}
              >
                {cards.length === 0 && <option value="">활성 카드 없음 — 카드를 먼저 만들어주세요</option>}
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={16} color="#8A8D94" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Consent notice */}
          <div style={{ padding: '12px 14px', background: '#F5F6FA', borderRadius: 10, fontSize: 12, color: '#5C5F66', lineHeight: 1.6 }}>
            등록 시 고객의 푸시 알림 및 포인트 적립 동의가 자동으로 처리됩니다.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || cards.length === 0}
            style={{
              height: 48, background: saving ? '#8A8D94' : '#1D9E75', color: 'white', border: 0,
              borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: saving ? 'none' : '0 2px 8px rgba(29,158,117,0.3)',
              transition: 'all 150ms',
            }}
          >
            <UserPlus size={18} />
            {saving ? '등록 중...' : '고객 등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
