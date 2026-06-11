'use client';

import { useState, useEffect, use, useRef } from 'react';
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
  stamp:      { ko: '디지털 리워드 카드', en: 'Digital Reward Card' },
  cashback:   { ko: '캐시백 카드',        en: 'Cashback Card' },
  coupon:     { ko: '쿠폰 카드',          en: 'Coupon Card' },
  membership: { ko: '멤버십 카드',        en: 'Membership Card' },
};

const MONTHS = [
  { ko: '1월', en: 'Jan', val: '01' }, { ko: '2월', en: 'Feb', val: '02' },
  { ko: '3월', en: 'Mar', val: '03' }, { ko: '4월', en: 'Apr', val: '04' },
  { ko: '5월', en: 'May', val: '05' }, { ko: '6월', en: 'Jun', val: '06' },
  { ko: '7월', en: 'Jul', val: '07' }, { ko: '8월', en: 'Aug', val: '08' },
  { ko: '9월', en: 'Sep', val: '09' }, { ko: '10월', en: 'Oct', val: '10' },
  { ko: '11월', en: 'Nov', val: '11' }, { ko: '12월', en: 'Dec', val: '12' },
];

function AppleWalletBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>Apple Wallet</span>
    </div>
  );
}

function GoogleWalletBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>Google Wallet</span>
    </div>
  );
}

// Card Dropdown component
function CardDropdown({ cards, selectedCard, onSelect, lang, primaryColor }: {
  cards: BizCard[];
  selectedCard: BizCard | null;
  onSelect: (card: BizCard) => void;
  lang: Lang;
  primaryColor: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!selectedCard) return null;

  return (
    <div ref={ref} style={{ marginBottom: 22, position: 'relative' }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 8 }}>
        {T('카드 선택', 'Select card', lang)} <span style={{ color: '#E05050' }}>*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
          border: `2px solid ${open ? primaryColor : '#D4E6DB'}`,
          background: open ? `${primaryColor}08` : 'white',
          fontFamily: 'inherit', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
          transition: 'all 150ms',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: selectedCard.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1F' }}>{selectedCard.name}</span>
            {selectedCard.card_type === 'stamp' && (
              <span style={{ fontSize: 9, fontWeight: 700, background: selectedCard.color, color: 'white', padding: '2px 7px', borderRadius: 10, letterSpacing: '0.05em' }}>
                DEFAULT
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 1 }}>
            {CARD_TYPE_LABEL[selectedCard.card_type]?.[lang] ?? selectedCard.card_type}
            {selectedCard.card_type === 'stamp' && ` · ${selectedCard.goal_stamps} ${T('스탬프', 'stamps', lang)}`}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', borderRadius: 12, border: '1.5px solid #E8EDEB',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {cards.map((card, i) => {
            const isSelected = selectedCard.id === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => { onSelect(card); setOpen(false); }}
                style={{
                  width: '100%', padding: '13px 16px', textAlign: 'left', cursor: 'pointer',
                  border: 0, borderBottom: i < cards.length - 1 ? '1px solid #F0F2F1' : 'none',
                  background: isSelected ? `${card.color}0D` : 'white',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F5F7F6'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'white'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: card.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1F' }}>{card.name}</span>
                    {card.card_type === 'stamp' && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: card.color, color: 'white', padding: '1px 6px', borderRadius: 8, letterSpacing: '0.05em' }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#5C5F66', marginTop: 1 }}>
                    {CARD_TYPE_LABEL[card.card_type]?.[lang] ?? card.card_type}
                    {card.card_type === 'stamp' && ` · ${card.goal_stamps} ${T('스탬프', 'stamps', lang)}`}
                    {card.reward_desc && ` · ${card.reward_desc}`}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4 4 6-7" /></svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<Step>('loading');
  const [business, setBusiness] = useState<Business | null>(null);
  const [cards, setCards] = useState<BizCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<BizCard | null>(null);
  const [isMobile, setIsMobile] = useState(true);

  // Form fields
  const [userId, setUserId] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Success data
  const [walletLink, setWalletLink] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nook-join-lang') as Lang | null;
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
        const cardList: BizCard[] = data.cards ?? [];
        setCards(cardList);
        if (cardList.length > 0) {
          const stampCard = cardList.find(c => c.card_type === 'stamp');
          setSelectedCard(stampCard ?? cardList[0]);
        }
        setStep('form');
      } catch {
        setStep('error');
      }
    }
    load();
  }, [slug]);

  function switchLang(l: Lang) {
    setLang(l);
    try { localStorage.setItem('nook-join-lang', l); } catch {}
  }

  // Build day options based on selected month
  const daysInMonth = birthMonth ? new Date(2000, parseInt(birthMonth), 0).getDate() : 31;
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return { val: String(d).padStart(2, '0'), label: String(d) };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) { setErrorMsg(T('카드를 선택해주세요.', 'Please select a card.', lang)); return; }
    if (!userId.trim()) { setErrorMsg(T('User ID를 입력해주세요.', 'Please enter your User ID.', lang)); return; }
    if (!agreed) { setErrorMsg(T('이용 동의가 필요합니다.', 'Please agree to the terms.', lang)); return; }

    setSending(true);
    setErrorMsg('');
    try {
      const body: Record<string, unknown> = {
        card_id:      selectedCard.id,
        user_id:      userId.trim(),
        consent_push: true,
        consent_points: true,
      };

      // Birthday: only send if both month and day are selected
      if (birthMonth && birthDay) {
        body.birthday_mmdd = `${birthMonth}-${birthDay}`;
      }

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
      setWalletLink(data.wallet_link ?? '');
      setUniqueKey(data.customer?.unique_key ?? '');
      setStep('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : T('오류가 발생했습니다.', 'An error occurred.', lang));
    } finally {
      setSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #D4E6DB', borderRadius: 10,
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    background: 'white', color: '#1A1A1F', boxSizing: 'border-box',
    transition: 'border-color 150ms',
  };

  const selectStyle: React.CSSProperties = {
    flex: 1, padding: '13px 12px',
    border: '1.5px solid #D4E6DB', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: 'white', color: '#1A1A1F',
    cursor: 'pointer', appearance: 'none',
  };

  const primaryColor = selectedCard?.color ?? '#1D9E75';
  const darkerColor = primaryColor === '#1D9E75' ? '#0D7A5A' : primaryColor + 'CC';

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #E0F0EA 0%, #F0F8F4 50%, #E8F3EE 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: isMobile ? '0 0 40px' : '40px 20px 60px',
  };

  // ── Loading ──────────────────────────────────────────────────
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

  // ── Not found ────────────────────────────────────────────────
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
        <Link href="/" style={{ marginTop: 8, color: '#1D9E75', fontSize: 14, fontWeight: 500 }}>← Nook Wallet</Link>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={containerStyle}>
        <div style={{
          width: isMobile ? '100%' : 420, maxWidth: 480,
          background: 'white', borderRadius: isMobile ? '0 0 28px 28px' : 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden',
        }}>
          {/* Success header */}
          <div style={{
            background: `linear-gradient(135deg, ${darkerColor} 0%, ${primaryColor} 60%, ${primaryColor}EE 100%)`,
            padding: '40px 24px 36px', textAlign: 'center', color: 'white',
          }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.3 }}>
              {T('가입이 완료되었습니다!', 'You’re all set!', lang)}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 8 }}>
              {T(
                `${business?.name ?? ''} 디지털 리워드 카드가 발급되었어요`,
                `Your ${business?.name ?? ''} Digital Reward Card is ready`,
                lang
              )}
            </div>
          </div>

          <div style={{ padding: '28px 24px 32px' }}>
            {walletLink ? (
              <>
                {/* Add to Google Wallet button */}
                <a
                  href={walletLink}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', height: 56, borderRadius: 28, boxSizing: 'border-box',
                    background: '#1F1F1F', color: 'white', textDecoration: 'none',
                    fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {T('구글 월렛에 추가하기', 'Add to Google Wallet', lang)}
                </a>

                <div style={{ textAlign: 'center', color: '#5C5F66', fontSize: 13, marginTop: 16, marginBottom: 24, lineHeight: 1.6 }}>
                  {T(
                    '버튼을 눌러 카드를 구글 월렛에 저장하세요. 매장 방문 시 월렛의 카드를 보여주시면 스탬프가 적립됩니다!',
                    'Tap the button to save your card to Google Wallet. Show it to staff when you visit to collect stamps!',
                    lang
                  )}
                </div>
              </>
            ) : (
              <div style={{
                background: '#F5F7F6', borderRadius: 12, padding: '16px', marginBottom: 24,
                textAlign: 'center', color: '#5C5F66', fontSize: 13, lineHeight: 1.6,
              }}>
                {T(
                  '카드가 발급되었습니다. 매장 방문 시 직원에게 아래 멤버 번호를 알려주세요.',
                  'Your card has been created. Tell staff your member ID below when you visit.',
                  lang
                )}
                {uniqueKey && (
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1F', fontFamily: 'monospace', letterSpacing: '0.08em', marginTop: 8 }}>
                    {uniqueKey}
                  </div>
                )}
              </div>
            )}

            <Link href="/" style={{
              display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10,
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

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <div style={{
        width: isMobile ? '100%' : 420, maxWidth: 480,
        background: 'white',
        borderRadius: isMobile ? '28px 28px 0 0' : 20,
        boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
        overflow: 'hidden', flex: 1,
      }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{
          background: `linear-gradient(145deg, ${darkerColor} 0%, ${primaryColor} 55%, ${primaryColor}F0 100%)`,
          padding: '22px 22px 26px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative ghost cards */}
          <div style={{ position: 'absolute', top: -22, right: -18, width: 148, height: 92, borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', transform: 'rotate(14deg)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 4, right: 14, width: 110, height: 68, borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', transform: 'rotate(14deg)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nook Wallet
            </span>
            <div style={{
              display: 'flex', gap: 2, background: 'rgba(0,0,0,0.22)',
              borderRadius: 22, padding: 3, border: '1px solid rgba(255,255,255,0.25)',
            }}>
              {(['en', 'ko'] as Lang[]).map(l => (
                <button key={l} onClick={() => switchLang(l)} style={{
                  padding: '6px 14px', borderRadius: 18, border: 0,
                  background: lang === l ? 'white' : 'transparent',
                  color: lang === l ? primaryColor : 'rgba(255,255,255,0.85)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.02em', transition: 'background 150ms, color 150ms',
                  boxShadow: lang === l ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ fontSize: 13 }}>{l === 'ko' ? '🇰🇷' : '🇺🇸'}</span>
                  {l === 'ko' ? '한국어' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          {/* Business info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, position: 'relative', zIndex: 1 }}>
            {business?.logo_url ? (
              <img src={business.logo_url} alt={business.name} style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}>
                {business?.name?.[0] ?? 'N'}
              </div>
            )}
            <div>
              <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {business?.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 5, fontWeight: 500 }}>
                {T('디지털 리워드 카드 등록', 'Add Digital Reward Card', lang)}
              </div>
            </div>
          </div>

          {/* Wallet badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <AppleWalletBadge />
            <GoogleWalletBadge />
          </div>
        </div>

        {/* ── Form body ────────────────────────────────────── */}
        <div style={{ padding: '28px 24px 32px' }}>
          <form onSubmit={handleSubmit}>

            {/* Card selector */}
            {cards.length > 1 && (
              <CardDropdown cards={cards} selectedCard={selectedCard} onSelect={setSelectedCard} lang={lang} primaryColor={primaryColor} />
            )}

            {cards.length === 1 && selectedCard && (
              <div style={{ marginBottom: 22, padding: '14px 16px', background: `${selectedCard.color}10`, borderRadius: 12, border: `1.5px solid ${selectedCard.color}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
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

            {cards.length === 0 && (
              <div style={{ marginBottom: 22, padding: '14px 16px', background: '#FFF8E8', borderRadius: 12, fontSize: 13, color: '#8C5A11', textAlign: 'center' }}>
                {T('현재 등록 가능한 카드가 없습니다.', 'No cards available for registration.', lang)}
              </div>
            )}

            {/* User ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 8 }}>
                User ID <span style={{ color: '#E05050' }}>*</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: '#8A8D94', marginLeft: 6 }}>
                  {T('(이름 또는 닉네임)', '(name or nickname)', lang)}
                </span>
              </label>
              <input
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder={T('예: 김철수, Mike, 단골손님', 'e.g. Mike, Jane, Loyal123', lang)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '#D4E6DB')}
                maxLength={30}
              />
            </div>

            {/* Birthday — month + day only */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 8 }}>
                {T('생일', 'Birthday', lang)}{' '}
                <span style={{ fontSize: 11, color: '#8A8D94', fontWeight: 400 }}>
                  {T('(선택 · 월/일만)', '(optional · month & day only)', lang)}
                </span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Month */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <select
                    value={birthMonth}
                    onChange={e => { setBirthMonth(e.target.value); setBirthDay(''); }}
                    style={selectStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#D4E6DB')}
                  >
                    <option value="">{T('월', 'Month', lang)}</option>
                    {MONTHS.map(m => (
                      <option key={m.val} value={m.val}>{lang === 'ko' ? m.ko : m.en}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A8D94" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>

                {/* Day */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <select
                    value={birthDay}
                    onChange={e => setBirthDay(e.target.value)}
                    style={{ ...selectStyle, color: !birthMonth ? '#8A8D94' : '#1A1A1F' }}
                    disabled={!birthMonth}
                    onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#D4E6DB')}
                  >
                    <option value="">{T('일', 'Day', lang)}</option>
                    {dayOptions.map(d => (
                      <option key={d.val} value={d.val}>{d.label}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A8D94" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
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
                  '스탬프 적립 및 리워드 알림 발송을 위한 마케팅 정보 수신에 동의합니다.',
                  'I agree to receive loyalty program and marketing notifications for stamp collection and rewards.',
                  lang
                )}{' '}
                <span style={{ color: '#E05050', fontWeight: 700 }}>
                  {T('(필수)', '(required)', lang)}
                </span>
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
              disabled={sending || cards.length === 0 || !agreed}
              style={{
                width: '100%', height: 52, borderRadius: 12,
                background: (cards.length === 0 || !agreed) ? '#D0D0D0'
                  : `linear-gradient(135deg, ${darkerColor} 0%, ${primaryColor} 100%)`,
                color: 'white', border: 0, fontSize: 16, fontWeight: 700,
                cursor: (sending || cards.length === 0 || !agreed) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'opacity 150ms, background 150ms', opacity: sending ? 0.8 : 1,
                boxShadow: (cards.length === 0 || !agreed) ? 'none' : `0 4px 16px ${primaryColor}55`,
              }}
            >
              {sending
                ? T('등록 중...', 'Adding...', lang)
                : T('디지털 리워드 카드 등록하기', 'Register Digital Reward Card', lang)}
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
