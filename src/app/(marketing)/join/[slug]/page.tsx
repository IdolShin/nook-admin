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

      {/* Trigger */}
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
        {/* Chevron */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown list */}
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
  const [lang, setLang] = useState<Lang>('ko');
  const [step, setStep] = useState<Step>('loading');
  const [business, setBusiness] = useState<Business | null>(null);
  const [cards, setCards] = useState<BizCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<BizCard | null>(null);
  const [isMobile, setIsMobile] = useState(true);

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
        const cardList: BizCard[] = data.cards ?? [];
        setCards(cardList);
        // Default: prefer stamp (Digital Reward Card), otherwise first card
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #D4E6DB', borderRadius: 10,
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    background: 'white', color: '#1A1A1F', boxSizing: 'border-box',
    transition: 'border-color 150ms',
  };

  const primaryColor = selectedCard?.color ?? '#1D9E75';
  // Slightly darker shade for gradient depth
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
          <div style={{
            background: `linear-gradient(135deg, ${darkerColor} 0%, ${primaryColor} 60%, ${primaryColor}EE 100%)`,
            padding: '32px 24px 28px', textAlign: 'center', color: 'white',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
              {T(`환영해요, ${customerName}님!`, `Welcome, ${customerName}!`, lang)}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
              {T(
                `${business?.name ?? ''} 디지털 리워드 카드가 추가되었습니다`,
                `Your ${business?.name ?? ''} Digital Reward Card is ready`,
                lang
              )}
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1F' }}>{selectedCard?.name}</div>
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
      {/* Main card */}
      <div style={{
        width: isMobile ? '100%' : 420, maxWidth: 480,
        background: 'white',
        borderRadius: isMobile ? '28px 28px 0 0' : 20,
        boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
        overflow: 'hidden', flex: 1,
        marginTop: isMobile ? 0 : 0,
      }}>

        {/* ── Modern header ───────────────────────────────── */}
        <div style={{
          background: `linear-gradient(145deg, ${darkerColor} 0%, ${primaryColor} 55%, ${primaryColor}F0 100%)`,
          padding: '22px 22px 26px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Decorative ghost card — top right */}
          <div style={{
            position: 'absolute', top: -22, right: -18,
            width: 148, height: 92, borderRadius: 16,
            border: '1.5px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.06)',
            transform: 'rotate(14deg)',
            pointerEvents: 'none',
          }} />
          {/* Inner ghost card */}
          <div style={{
            position: 'absolute', top: 4, right: 14,
            width: 110, height: 68, borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            transform: 'rotate(14deg)',
            pointerEvents: 'none',
          }} />
          {/* Chip dot cluster */}
          <div style={{ position: 'absolute', top: 44, right: 30, transform: 'rotate(14deg)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0,1].map(row => (
              <div key={row} style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(col => (
                  <div key={col} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            ))}
          </div>
          {/* Bottom-left glow */}
          <div style={{
            position: 'absolute', bottom: -30, left: -30,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }} />

          {/* ── Top row: Nook Wallet + lang toggle ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, position: 'relative', zIndex: 1,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nook Wallet
            </span>

            {/* Lang toggle */}
            <div style={{ display: 'flex', gap: 3 }}>
              {(['ko', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => switchLang(l)} style={{
                  padding: '3px 9px', borderRadius: 6, border: 0,
                  background: lang === l ? 'rgba(255,255,255,0.28)' : 'transparent',
                  color: lang === l ? 'white' : 'rgba(255,255,255,0.55)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  transition: 'background 150ms, color 150ms',
                }}>
                  {l === 'ko' ? '한 KO' : 'us EN'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Business info ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, position: 'relative', zIndex: 1 }}>
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)',
              }}>
                {business?.name?.[0] ?? 'N'}
              </div>
            )}
            <div>
              <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {business?.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 5, fontWeight: 500, letterSpacing: '0.01em' }}>
                {T('Add Digital Reward Card', 'Add Digital Reward Card', lang)}
              </div>
            </div>
          </div>

          {/* ── Wallet badges ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <AppleWalletBadge />
            <GoogleWalletBadge />
          </div>
        </div>

        {/* ── Form body ───────────────────────────────────── */}
        <div style={{ padding: '28px 24px 32px' }}>
          <form onSubmit={handleSubmit}>

            {/* Dropdown card selector — only when multiple cards */}
            {cards.length > 1 && (
              <CardDropdown
                cards={cards}
                selectedCard={selectedCard}
                onSelect={setSelectedCard}
                lang={lang}
                primaryColor={primaryColor}
              />
            )}

            {/* Single card info */}
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

            {/* Birthday */}
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
                background: cards.length === 0 ? '#D0D0D0'
                  : `linear-gradient(135deg, ${darkerColor} 0%, ${primaryColor} 100%)`,
                color: 'white', border: 0, fontSize: 16, fontWeight: 700,
                cursor: sending || cards.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'opacity 150ms', opacity: sending ? 0.8 : 1,
                boxShadow: cards.length === 0 ? 'none' : `0 4px 16px ${primaryColor}55`,
              }}
            >
              {sending
                ? T('등록 중...', 'Adding...', lang)
                : T('디지털 리워드 카드 추가하기', 'Add Digital Reward Card', lang)}
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
