'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NookMark from '@/components/NookMark';
import '../marketing.css';

type Lang = 'ko' | 'en';
function t(ko: string, en: string, lang: Lang) { return lang === 'ko' ? ko : en; }

const PLANS = [
  { value: 'basic',     price: '$79',  ko: 'Basic',    en: 'Basic',    desc_ko: '고객 100명, 카드 1종',        desc_en: '100 customers, 1 card' },
  { value: 'pro',       price: '$99',  ko: 'Pro',      en: 'Pro',      desc_ko: '고객 500명, 리뷰쿠폰 (제한)', desc_en: '500 customers, review coupon' },
  { value: 'premium',   price: '$129', ko: 'Premium',  en: 'Premium',  desc_ko: '무제한 + 마케팅 자동화',      desc_en: 'Unlimited + automation' },
  { value: 'undecided', price: '',     ko: '아직 미정', en: 'Not decided yet', desc_ko: '상담 후 결정',       desc_en: 'Decide after consultation' },
];

const BUSINESS_TYPES = [
  { value: 'cafe',       ko: '카페 / 커피숍',    en: 'Cafe / Coffee Shop' },
  { value: 'restaurant', ko: '레스토랑',          en: 'Restaurant' },
  { value: 'salon',      ko: '미용실 / 살롱',     en: 'Salon / Beauty' },h
  { value: 'gym',        ko: '헬스장 / 피트니스', en: 'Gym / Fitness' },
  { value: 'retail',     ko: '리테일 / 쇼핑',     en: 'Retail / Shopping' },
  { value: 'other',      ko: '기타',              en: 'Other' },
];

export default function ContactPage() {
  const [lang, setLang]       = useState<Lang>('ko');
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [form, setForm] = useState({
    businessName: '', location: '', phone: '',
    email: '', businessType: '', plan: '', message: '',
  });
  const [status, setStatus]   = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nook-lang') as Lang | null;
      if (saved === 'ko' || saved === 'en') setLang(saved);
    } catch (e) {}
    const check = () => setIsMobile(window.innerWidth < 720);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Lock body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = showPopup ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showPopup]);

  function switchLang(l: Lang) {
    setLang(l);
    try { localStorage.setItem('nook-lang', l); } catch (e) {}
  }

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  const isValid = form.businessName.trim() && form.location.trim() && form.phone.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.businessName,
          email: form.email || '',
          phone: form.phone,
          businessName: form.businessName,
          businessType: form.businessType,
          inquiryType: form.plan,
          message: `[Location] ${form.location}\n[Plan] ${form.plan || 'Not selected'}\n[Phone] ${form.phone}\n\n${form.message}`,
        }),
      });
      if (!res.ok) throw new Error('server error');
      setStatus('idle');
      setShowPopup(true);
      setForm({ businessName: '', location: '', phone: '', email: '', businessType: '', plan: '', message: '' });
    } catch {
      setStatus('error');
      setErrorMsg(t(
        '전송 중 오류가 발생했습니다. 다시 시도해주세요.',
        'Something went wrong. Please try again.',
        lang
      ));
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    border: '1.5px solid #D4E6DB', borderRadius: 10, fontSize: 14,
    fontFamily: 'inherit', background: 'white', color: '#1A1A1F',
    outline: 'none', transition: 'border-color 150ms',
  };
  const sel: React.CSSProperties = { ...inp, appearance: 'none', cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100svh', background: '#F5F7F6', fontFamily: 'var(--font-noto, Inter, system-ui, sans-serif)', overflowX: 'hidden' }}>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24,
              padding: isMobile ? '36px 24px' : '48px 40px',
              maxWidth: 400, width: '100%', textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              animation: 'popIn 200ms ease-out',
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>{'✅'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#085041', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              {t('문의가 접수됐어요!', 'Inquiry received!', lang)}
            </h2>
            <p style={{ fontSize: 14, color: '#5C5F66', lineHeight: 1.6, margin: '0 0 28px' }}>
              {t(
                '빠른 시간 안에 연락드리겠습니다 🙏',
                "We'll reach out shortly. Thank you! 🙏",
                lang
              )}
            </p>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: '100%', height: 46,
                background: 'linear-gradient(135deg, #1D9E75, #085041)',
                color: 'white', border: 0, borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t('확인', 'Got it', lang)}
            </button>
            <a
              href="/"
              style={{
                display: 'block', width: '100%', height: 46, marginTop: 10,
                background: 'transparent', color: '#1D9E75',
                border: '1.5px solid #1D9E75', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                textDecoration: 'none', lineHeight: '46px', textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              {t('홈페이지로 가기', 'Go to Homepage', lang)}
            </a>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8EEE9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px', height: 56,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <NookMark size={26} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#085041', letterSpacing: '-0.02em' }}>nook</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="lang-toggle">
            <button className={lang === 'ko' ? 'on' : ''} onClick={() => switchLang('ko')}>{'한국어'}</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>EN</button>
          </div>
          {!isMobile && (
            <Link href="/#pricing" style={{
              height: 34, padding: '0 14px', display: 'flex', alignItems: 'center',
              background: '#1D9E75', color: 'white', borderRadius: 9,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              {t('요금제 보기', 'View Pricing', lang)}
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1B2E 0%, #0F4D38 60%, #1D9E75 100%)',
        padding: isMobile ? '52px 20px 64px' : '64px 24px 80px',
        textAlign: 'center', color: 'white',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '5px 14px', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 18, border: '1px solid rgba(255,255,255,0.18)',
        }}>
          {'📬 '}{t('비즈니스 문의', 'Business Inquiry', lang)}
        </div>
        <h1 style={{
          fontSize: isMobile ? 'clamp(24px, 7vw, 32px)' : 'clamp(30px, 5vw, 46px)',
          fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em',
          margin: '0 auto 14px', maxWidth: 560, wordBreak: 'keep-all',
        }}>
          {t('Nook과 함께 시작하세요', "Let's grow your business together", lang)}
        </h1>
        <p style={{ fontSize: isMobile ? 14 : 16, opacity: 0.78, maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
          {t(
            '아래 양식을 작성하시면 빠르게 연락드립니다.',
            "Fill out the form below and we'll reach out shortly.",
            lang
          )}
        </p>
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24,
          flexWrap: 'wrap', padding: '0 8px',
        }}>
          {[
            { icon: '⚡', label: t('평균 응답 시간', 'Avg response', lang), val: t('4시간 이내', 'Under 4 hrs', lang) },
            { icon: '🌎', label: t('지원 언어', 'Languages', lang),         val: 'KO / EN' },
            { icon: '🔒', label: t('개인정보 보호', 'Privacy', lang),       val: t('안전하게 보관', 'Kept private', lang) },
          ].map(b => (
            <div key={b.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 12, padding: isMobile ? '8px 14px' : '10px 18px', textAlign: 'left',
              flex: isMobile ? '1 1 auto' : 'none', minWidth: 100,
            }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{b.icon}</div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{b.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FORM + SIDEBAR */}
      <div style={{
        maxWidth: 900, margin: isMobile ? '-28px auto 0' : '-36px auto 0',
        padding: isMobile ? '0 14px 60px' : '0 20px 80px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 270px',
        gap: isMobile ? 16 : 24,
        alignItems: 'start',
      }}>

        {/* Form card */}
        <form onSubmit={handleSubmit} style={{
          background: 'white', borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: isMobile ? '24px 18px' : '32px 28px',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1F', marginBottom: 4, marginTop: 0 }}>
            {t('문의 양식', 'Contact Form', lang)}
          </h2>
          <p style={{ fontSize: 12, color: '#8A8D94', marginBottom: 20, marginTop: 0 }}>
            <span style={{ color: '#E05050' }}>{'*'}</span> {t('표시된 항목은 필수입니다', 'Required fields', lang)}
          </p>

          {/* Business Name + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                Business Name <span style={{ color: '#E05050' }}>{'*'}</span>
              </label>
              <input
                style={inp} required
                placeholder={t('예: Nook Café', 'e.g. Nook Café', lang)}
                value={form.businessName} onChange={e => set('businessName', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                {t('휴대전화', 'Phone', lang)} <span style={{ color: '#E05050' }}>{'*'}</span>
              </label>
              <input
                style={inp} type="tel" required
                placeholder="201-000-0000"
                value={form.phone} onChange={e => set('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Location + Business Type */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                {t('비즈니스 위치 (City, State)', 'Location (City, State)', lang)} <span style={{ color: '#E05050' }}>{'*'}</span>
              </label>
              <input
                style={inp} required
                placeholder={t('예: Fort Lee, NJ', 'e.g. Fort Lee, NJ', lang)}
                value={form.location} onChange={e => set('location', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                {t('업종', 'Business Type', lang)}
              </label>
              <div style={{ position: 'relative' }}>
                <select style={sel} value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                  <option value="">{t('선택 (선택사항)', 'Select (optional)', lang)}</option>
                  {BUSINESS_TYPES.map(o => (
                    <option key={o.value} value={o.value}>{t(o.ko, o.en, lang)}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 11, color: '#8A8D94' }}>{'▾'}</span>
              </div>
            </div>
          </div>

          {/* Plan selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 10 }}>
              {t('관심 플랜', 'Interested Plan', lang)}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLANS.map(plan => {
                const selected = form.plan === plan.value;
                return (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => set('plan', plan.value)}
                    style={{
                      padding: isMobile ? '10px 12px' : '12px 14px',
                      borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 120ms',
                      border: selected ? '2px solid #1D9E75' : '1.5px solid #D4E6DB',
                      background: selected ? '#E8F7F2' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: selected ? '#085041' : '#1A1A1F' }}>
                        {t(plan.ko, plan.en, lang)}
                      </span>
                      {plan.price && (
                        <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: '#1D9E75' }}>
                          {plan.price}<span style={{ fontSize: 9, fontWeight: 400, color: '#8A8D94' }}>/mo</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: selected ? '#1D9E75' : '#8A8D94', lineHeight: 1.3 }}>
                      {t(plan.desc_ko, plan.desc_en, lang)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email (optional) */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
              {t('이메일 (선택사항)', 'Email (optional)', lang)}
            </label>
            <input
              style={inp} type="email"
              placeholder="you@example.com"
              value={form.email} onChange={e => set('email', e.target.value)}
            />
          </div>

          {/* Message (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
              {t('메시지 (선택사항)', 'Message (optional)', lang)}
            </label>
            <textarea
              style={{ ...inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
              rows={3}
              placeholder={t(
                '추가로 전달할 내용이 있으시면 입력해주세요.',
                "Anything else you'd like us to know?",
                lang
              )}
              value={form.message} onChange={e => set('message', e.target.value)}
            />
          </div>

          {errorMsg && (
            <div style={{ background: '#FBE2EC', color: '#9C2848', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'sending' || !isValid}
            style={{
              width: '100%', height: 50,
              background: !isValid ? '#C4D8D0' : status === 'sending' ? '#8A8D94' : 'linear-gradient(135deg, #1D9E75, #085041)',
              color: 'white', border: 0, borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: (!isValid || status === 'sending') ? 'default' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'all 150ms',
            }}
          >
            {status === 'sending'
              ? t('전송 중...', 'Sending...', lang)
              : t('문의 보내기 →', 'Send Inquiry →', lang)}
          </button>

          <p style={{ fontSize: 11, color: '#8A8D94', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
            {t('영업일 기준 4시간 이내 답변 드립니다.', 'We typically respond within 4 business hours.', lang)}
          </p>
        </form>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Why Nook */}
          <div style={{ background: 'linear-gradient(135deg, #0F4D38, #1D9E75)', borderRadius: 16, padding: '20px 18px', color: 'white' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              {t('왜 Nook인가요?', 'Why Nook?', lang)}
            </div>
            {[
              { icon: '✅', text: t('앱 다운로드 없음 — 월렛에 바로 저장', 'No app — lives in their wallet', lang) },
              { icon: '⭐', text: t('구글 리뷰 → 자동 쿠폰 지급', 'Google review → auto coupon', lang) },
              { icon: '📲', text: t('푸시알림으로 단골 재방문 유도', 'Re-engage with push notifications', lang) },
              { icon: '⚡', text: t('10분이면 시작 가능', 'Live in under 10 minutes', lang) },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 12, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ opacity: 0.88 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Plans summary */}
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '20px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              {t('요금제 한눈에 보기', 'Plans at a Glance', lang)}
            </div>
            {PLANS.filter(p => p.price).map(p => (
              <div key={p.value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F0F2' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t(p.ko, p.en, lang)}</div>
                  <div style={{ fontSize: 11, color: '#8A8D94' }}>{t(p.desc_ko, p.desc_en, lang)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75', flexShrink: 0, marginLeft: 8 }}>
                  {p.price}<span style={{ fontSize: 10, color: '#8A8D94', fontWeight: 400 }}>/mo</span>
                </div>
              </div>
            ))}
            <Link href="/#pricing" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#1D9E75', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              {t('상세 비교 보기 →', 'See full comparison →', lang)}
            </Link>
          </div>

          {/* Response promise */}
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '18px' }}>
            {[
              { icon: '⚡', title: t('빠른 응답', 'Fast Response', lang),       desc: t('영업일 4시간 이내', 'Within 4 business hrs', lang) },
              { icon: '🌎', title: t('한국어 / 영어', 'Korean / English', lang), desc: t('양 언어로 지원', 'Support in both', lang) },
              { icon: '🔒', title: t('정보 보호', 'Privacy', lang),              desc: t('입력 정보는 안전하게 보관', 'Your info stays private', lang) },
            ].map((item, i) => (
              <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid #F0F0F2' : 'none' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1F' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 1 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid #E2EDE6', padding: '20px 24px', textAlign: 'center', fontSize: 12, color: '#8A8D94' }}>
        {'© 2025 Nook Wallet · '}
        <Link href="/" style={{ color: '#1D9E75', textDecoration: 'none' }}>nook-wallet.com</Link>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
