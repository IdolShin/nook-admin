'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import '../../marketing.css';

type Lang = 'ko' | 'en';
function T(ko: string, en: string, lang: Lang) { return lang === 'ko' ? ko : en; }

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface BizCard {
  id: string;
  name: string;
  card_type: string;
  goal_stamps: number;
  reward_desc: string;
  color: string;
}
interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
}

type Step = 'loading' | 'notfound' | 'form' | 'success' | 'error';

const CARD_TYPE_LABEL: Record<string, { ko: string; en: string }> = {
  stamp:      { ko: '스탬프 카드', en: 'Stamp Card' },
  cashback:   { ko: '캐시백 카드', en: 'Cashback Card' },
  coupon:     { ko: '쿠폰 카드',   en: 'Coupon Card' },
  membership: { ko: '멤버십 카드', en: 'Membership Card' },
};

function StampIcon({ n, color }: { n: number; color: string }) {
  const stamps = Array.from({ length: n });
  const cols = Math.min(n, 5);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5, padding: '10px 0' }}>
      {stamps.map((_, i) => (
        <div key={i} style={{
          width: '100%', aspectRatio: '1', borderRadius: '50%',
          border: `2px solid ${color}`,
          background: i < 1 ? color : 'transparent',
          opacity: i < 1 ? 1 : 0.3,
        }} />
      ))}
    </div>
  );
}

export default function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [lang, setLang] = useState<Lang>('ko');
  const [step, setStep] = useState<Step>('loading');
  const [business, setBusiness] = useState<Business | null>(null);
  const [cards, setCards] = useState<BizCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<BizCard | null>(null);
  const [isMobile, setIsMobile] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nook-lang') as Lang | null;
      if (saved === 'ko' || saved === 'en') setLang(saved);
    } catch {}
    const check = () => setIsMobile(window.innerWidth < 720);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BASE}/api/businesses/public/${encodeURIComponent(slug)}`);
        if (!res.ok) { setStep('notfound'); return; }
        const data = await res.json();
        setBusiness(data.business);
        setCards(data.cards ?? []);
        if (data.cards?.length === 1) setSelectedCard(data.cards[0]);
        setStep('form');
      } catch {
        setStep('error');
      }
    }
    load();
  }, [slug]);

  function switchLang(l: Lang) {
    setLang(l);
    try { localStorage.setItem('nook-lang', l); } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) { setErrorMsg(T('카드를 선택해주세요.', 'Please select a card.', lang)); return; }
    if (!name.trim()) { setErrorMsg(T('이름을 입력해주세요.', 'Please enter your name.', lang)); return; }
    if (!phone.trim()) { setErrorMsg(T('전화번호를 입력해주세요.', 'Please enter your phone number.', lang)); return; }
    if (!agreed) { setErrorMsg(T('이용 동의가 필요합니다.', 'Please agree to the terms.', lang)); return; }
    setSending(true);
    setErrorMsg('');
    try {
      const body: Record<string, unknown> = {
        card_id: selectedCard.id,
        name: name.trim(),
        phone: phone.trim(),
        consent_push: true,
        consent_points: true,
      };
      if (birthday.trim()) body.birthday = birthday.trim();

      const res = await fetch(`${BASE}/api/customers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? T('등록에 실패했습니다.', 'Registration failed.', lang));
      }
      const data = await res.json();
      setQrImage(data.qr_image ?? '');
      setCustomerName(data.customer?.name ?? name.trim());
      setStep('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : T('오류가 발생했습니다.', 'An error occurred.', lang));
    } finally {
      setSending(false);
    }
  }

  // ── Layout helpers ──────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #D4E6DB', borderRadius: 10,
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    background: 'white', color: '#1A1A1F', boxSizing: 'border-box',
    transition: 'border-color 150ms',
  };

  const primaryColor = selectedCard?.color ?? '#1D9E75';

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #E8F4EE 0%, #F4FAF6 50%, #EDF3EF 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: isMobile ? '0 0 40px' : '40px 20px 60px',
  };

  // ── Loading ─────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#1D9E75', animation: `nook-pulse 1.2s ${i * 0.18}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────
  if (step === 'notfound' || step === 'error') {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', textAlign: 'center', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1F' }}>
          {T('가게를 찾을 수 없어요', 'Business not found', lang)}
        </div>
        <div style={{ fontSize: 15, color: '#5C5F66' }}>
          {T('링크를 다시 확인해주세요.', 'Please check the link and try again.', lang)}
        </div>
        <Link href="/" style={{ marginTop: 8, color: '#1D9E75', fontSize: 14, fontWeight: 500 }}>← Nook</Link>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={containerStyle}>
        <div style={{
          width: isMobile ? '100%' : 420, maxWidth: 480,
          background: 'white', borderRadius: isMobile ? '0 0 28px 28px' : 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`,
            padding: '32px 24px 28px', textAlign: 'center', color: 'white',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
              {T(`환영해요, ${customerName}님!`, `Welcome, ${customerName}!`, lang)}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
              {T(`${business?.name ?? ''} 멤버가 되셨습니다`, `You joined ${business?.name ?? ''}`, lang)}
            </div>
          </div>

          <div style={{ padding: '28px 24px' }}>
            {qrImage && (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#5C5F66', marginBottom: 12, fontWeight: 500 }}>
                  {T('QR 코드를 저장하거나 스크린샷 해두세요', 'Save or screenshot your QR code', lang)}
                </div>
                <img src={qrImage} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 12, border: '3px solid #E8F7F2', display: 'block', margin: '0 auto' }} />
              </div>
            )}

            <div style={{ background: '#F5F7F6', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1F' }}>
                    {selectedCard?.name}
                  </div>
                  {selectedCard?.reward_desc && (
                    <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 2 }}>
                      {T('리워드: ', 'Reward: ', lang)}{selectedCard.reward_desc}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#5C5F66', fontSize: 13, marginBottom: 20 }}>
              {T(
                '매장 방문 시 이 QR코드를 직원에게 보여주세요. 스탬프를 모아 리워드를 받을 수 있어요!',
                'Show this QR code to staff when you visit. Collect stamps to earn rewards!',
                lang
              )}
            </div>

            <Link href="/" style={{
              display: 'block', textAlign: 'center',
              padding: '12px', borderRadius: 10,
              border: '1.5px solid #1D9E75', color: '#1D9E75',
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}>
              {T('홈페이지로 가기', 'Go to Homepage', lang)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      {/* Lang toggle + top nav */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '16px 20px 0' : '0 0 20px',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#1A1A1F' }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#1D9E75" />
            <path d="M9 22V10l7 8 7-8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>nook</span>
        </Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ko', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => switchLang(l)} style={{
              padding: '4px 10px', borderRadius: 6, border: 0,
              background: lang === l ? '#1D9E75' : 'transparent',
              color: lang === l ? 'white' : '#5C5F66',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {l === 'ko' ? '🇰🇷 KO' : '🇺🇸 EN'}
            </button>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: isMobile ? '100%' : 420, maxWidth: 480, marginTop: isMobile ? 0 : 0,
        background: 'white',
        borderRadius: isMobile ? '28px 28px 0 0' : 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        flex: 1,
      }}>
        {/* Hero header */}
        <div style={{
          background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`,
          padding: '32px 28px 28px', color: 'white',
        }}>
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business.name} style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 14, objectFit: 'cover', background: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: 14, marginBottom: 14,
              background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700,
            }}>
              {business?.name?.[0] ?? 'N'}
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {business?.name}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
            {T('멤버십 등록', 'Join Membership', lang)}
          </div>
        </div>

        <div style={{ padding: '28px 24px 32px' }}>
          <form onSubmit={handleSubmit}>
            {/* Card selector (shown only if multiple cards) */}
            {cards.length > 1 && (
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 10 }}>
                  {T('카드 선택', 'Select a card', lang)} <span style={{ color: '#E05050' }}>*</span>
                </label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {cards.map(card => {
                    const isSelected = selectedCard?.id === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCard(card)}
                        style={{
                          padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                          border: `2px solid ${isSelected ? card.color : '#E8EDEB'}`,
                          background: isSelected ? `${card.color}12` : 'white',
                          fontFamily: 'inherit', transition: 'all 150ms',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: card.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="3" />
                            <path d="M2 10h20" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1F' }}>{card.name}</div>
                          <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 2 }}>
                            {CARD_TYPE_LABEL[card.card_type]?.[lang] ?? card.card_type}
                            {card.card_type === 'stamp' && ` · ${card.goal_stamps} ${T('스탬프', 'stamps', lang)}`}
                            {card.reward_desc && ` · ${card.reward_desc}`}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4 4 6-7" /></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single card info (if only 1 card) */}
            {cards.length === 1 && selectedCard && (
              <div style={{
                marginBottom: 22, padding: '14px 16px',
                background: `${selectedCard.color}10`, borderRadius: 12,
                border: `1.5px solid ${selectedCard.color}40`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: selectedCard.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1F' }}>{selectedCard.name}</div>
                  <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 2 }}>
                    {CARD_TYPE_LABEL[selectedCard.card_type]?.[lang] ?? selectedCard.card_type}
                    {selectedCard.card_type === 'stamp' && ` · ${selectedCard.goal_stamps} ${T('스탬프', 'stamps', lang)}`}
                  </div>
                  {selectedCard.reward_desc && (
                    <div style={{ fontSize: 12, color: selectedCard.color, fontWeight: 500, marginTop: 2 }}>
                      🎁 {selectedCard.reward_desc}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No cards */}
            {cards.length === 0 && (
              <div style={{ marginBottom: 22, padding: '14px 16px', background: '#FFF8E8', borderRadius: 12, fontSize: 13, color: '#8C5A11', textAlign: 'center' }}>
                {T('현재 등록 가능한 카드가 없습니다.', 'No cards available for registration.', lang)}
              </div>
            )}

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 8 }}>
                {T('이름', 'Full name', lang)} <span style={{ color: '#E05050' }}>*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={T('홍길동', 'Your name', lang)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '#D4E6DB')}
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 8 }}>
                {T('전화번호', 'Phone number', lang)} <span style={{ color: '#E05050' }}>*</span>
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                type="tel"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '#D4E6DB')}
              />
            </div>

            {/* Birthday (optional) */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 8 }}>
                {T('생일', 'Birthday', lang)}{' '}
                <span style={{ fontSize: 11, color: '#8A8D94', fontWeight: 400 }}>
                  {T('(선택 — 생일 쿠폰 제공용)', '(optional — for birthday rewards)', lang)}
                </span>
              </label>
              <input
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                type="date"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '#D4E6DB')}
              />
            </div>

            {/* Consent */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 22 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, accentColor: primaryColor, flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: '#5C5F66', lineHeight: 1.6 }}>
                {T(
                  '개인정보 수집·이용 및 마케팅 목적의 정보 수신에 동의합니다. (스탬프 적립 및 리워드 알림 전송 목적)',
                  'I agree to the collection and use of personal information for loyalty program and marketing notifications.',
                  lang
                )}
              </span>
            </label>

            {/* Error */}
            {errorMsg && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848' }}>
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending || cards.length === 0}
              style={{
                width: '100%', height: 52, borderRadius: 12,
                background: cards.length === 0 ? '#D0D0D0' : primaryColor,
                color: 'white', border: 0, fontSize: 16, fontWeight: 700,
                cursor: sending || cards.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'opacity 150ms',
                opacity: sending ? 0.8 : 1,
              }}
            >
              {sending
                ? T('등록 중...', 'Joining...', lang)
                : T('멤버십 가입하기', 'Join Membership', lang)}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#8A8D94' }}>
              {T('Powered by', 'Powered by', lang)}{' '}
              <Link href="/" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Nook Wallet</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
