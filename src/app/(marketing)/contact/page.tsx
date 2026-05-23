'use client';

import { useState } from 'react';
import Link from 'next/link';
import NookMark from '@/components/NookMark';
import '../marketing.css';

type Lang = 'ko' | 'en';
function t(ko: string, en: string, lang: Lang) { return lang === 'ko' ? ko : en; }

const INQUIRY_TYPES = [
  { value: 'pricing',     ko: '요금제 / 플랜 문의',  en: 'Pricing / Plans' },
  { value: 'demo',        ko: '데모 요청',            en: 'Request a Demo' },
  { value: 'technical',   ko: '기술 지원',            en: 'Technical Support' },
  { value: 'partnership', ko: '파트너십',             en: 'Partnership' },
  { value: 'other',       ko: '기타',                 en: 'Other' },
];

const BUSINESS_TYPES = [
  { value: 'cafe',       ko: '카페 / 커피숍', en: 'Cafe / Coffee Shop' },
  { value: 'restaurant', ko: '레스토랑',      en: 'Restaurant' },
  { value: 'salon',      ko: '미용실 / 살롱', en: 'Salon / Beauty' },
  { value: 'gym',        ko: '헬스장 / 피트니스', en: 'Gym / Fitness' },
  { value: 'retail',     ko: '리테일 / 쇼핑', en: 'Retail / Shopping' },
  { value: 'other',      ko: '기타',          en: 'Other' },
];

export default function ContactPage() {
  const [lang, setLang] = useState<Lang>('ko');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', businessName: '',
    businessType: '', inquiryType: '', message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('server error');
      setStatus('success');
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
    <div style={{ minHeight: '100vh', background: '#F5F7F6', fontFamily: 'var(--font-noto, Inter, system-ui, sans-serif)' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8EEE9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <NookMark size={28} />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#085041', letterSpacing: '-0.02em' }}>nook</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setLang(l => l === 'ko' ? 'en' : 'ko')}
            style={{
              height: 32, padding: '0 12px',
              border: '1.5px solid #D4E6DB', borderRadius: 8,
              background: 'white', color: '#085041',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{ fontSize: 15 }}>{lang === 'ko' ? '🇰🇷' : '🇺🇸'}</span>
            {lang === 'ko' ? 'KOR' : 'ENG'}
          </button>
          <Link href="/#pricing" style={{
            height: 34, padding: '0 14px', display: 'flex', alignItems: 'center',
            background: '#1D9E75', color: 'white', borderRadius: 9,
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            {t('요금제 보기', 'View Pricing', lang)}
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1B2E 0%, #0F4D38 60%, #1D9E75 100%)',
        padding: '64px 24px 72px',
        textAlign: 'center',
        color: 'white',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '5px 14px', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 20, border: '1px solid rgba(255,255,255,0.18)',
        }}>
          📬 {t('비즈니스 문의', 'Business Inquiry', lang)}
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 46px)', fontWeight: 800,
          lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 auto 16px',
          maxWidth: 600,
        }}>
          {t('Nook과 함께 시작하세요', 'Let\'s grow your business together', lang)}
        </h1>
        <p style={{ fontSize: 16, opacity: 0.78, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          {t(
            '요금제, 데모, 기술 지원 — 어떤 문의든 빠르게 답변 드립니다.',
            'Pricing, demos, or support — we\'ll get back to you quickly.',
            lang
          )}
        </p>

        {/* Contact badges */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { icon: '⚡', label: t('평균 응답 시간', 'Avg response', lang), val: t('4시간 이내', 'Under 4 hrs', lang) },
            { icon: '🌎', label: t('지원 언어', 'Languages', lang), val: 'KO / EN' },
            { icon: '📞', label: t('전화 문의', 'Phone inquiry', lang), val: '201-233-6184' },
          ].map(b => (
            <div key={b.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 12, padding: '10px 18px', textAlign: 'left',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{b.icon}</div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{b.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM + SIDEBAR ── */}
      <div style={{
        maxWidth: 900, margin: '0 auto', padding: '0 20px 80px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 280px',
        gap: 24, alignItems: 'start',
        marginTop: -32,
      }}>

        {/* Form card */}
        {status === 'success' ? (
          <div style={{
            background: 'white', borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '56px 32px', textAlign: 'center',
            gridColumn: '1 / -1',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#085041', marginBottom: 10 }}>
              {t('문의가 접수되었습니다!', 'Inquiry received!', lang)}
            </h2>
            <p style={{ fontSize: 15, color: '#5C5F66', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 24px' }}>
              {t(
                '빠른 시간 안에 이메일로 연락드리겠습니다. 감사합니다 🙏',
                'We\'ll get back to you by email soon. Thank you! 🙏',
                lang
              )}
            </p>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1D9E75', color: 'white', borderRadius: 10,
              padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              {t('홈으로 돌아가기', 'Back to Home', lang)}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'white', borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '32px 28px',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1F', marginBottom: 24, marginTop: 0 }}>
              {t('문의 내용 작성', 'Send us a message', lang)}
            </h2>

            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                  {t('이름', 'Full Name', lang)} *
                </label>
                <input
                  style={inp} required
                  placeholder={t('홍길동', 'John Smith', lang)}
                  value={form.name} onChange={e => set('name', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                  {t('이메일', 'Email', lang)} *
                </label>
                <input
                  style={inp} type="email" required
                  placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                />
              </div>
            </div>

            {/* Phone + Business Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                  {t('전화번호', 'Phone', lang)}
                </label>
                <input
                  style={inp}
                  placeholder="201-000-0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                  {t('매장 이름', 'Business Name', lang)}
                </label>
                <input
                  style={inp}
                  placeholder={t('Nook Café', 'My Business', lang)}
                  value={form.businessName} onChange={e => set('businessName', e.target.value)}
                />
              </div>
            </div>

            {/* Business Type + Inquiry Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                  {t('업종', 'Business Type', lang)}
                </label>
                <div style={{ position: 'relative' }}>
                  <select style={sel} value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                    <option value="">{t('선택하세요', 'Select...', lang)}</option>
                    {BUSINESS_TYPES.map(o => (
                      <option key={o.value} value={o.value}>{t(o.ko, o.en, lang)}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 11, color: '#8A8D94' }}>▾</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                  {t('문의 유형', 'Inquiry Type', lang)}
                </label>
                <div style={{ position: 'relative' }}>
                  <select style={sel} value={form.inquiryType} onChange={e => set('inquiryType', e.target.value)}>
                    <option value="">{t('선택하세요', 'Select...', lang)}</option>
                    {INQUIRY_TYPES.map(o => (
                      <option key={o.value} value={o.value}>{t(o.ko, o.en, lang)}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 11, color: '#8A8D94' }}>▾</span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
                {t('문의 내용', 'Message', lang)} *
              </label>
              <textarea
                style={{ ...inp, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }}
                required rows={5}
                placeholder={t(
                  '문의하실 내용을 자유롭게 입력해주세요.',
                  'Tell us about your business and what you\'re looking for...',
                  lang
                )}
                value={form.message} onChange={e => set('message', e.target.value)}
              />
            </div>

            {errorMsg && (
              <div style={{
                background: '#FBE2EC', color: '#9C2848', borderRadius: 8,
                padding: '10px 14px', fontSize: 13, marginBottom: 16,
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                width: '100%', height: 48,
                background: status === 'sending' ? '#8A8D94' : 'linear-gradient(135deg, #1D9E75, #085041)',
                color: 'white', border: 0, borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: status === 'sending' ? 'default' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'opacity 150ms',
              }}
            >
              {status === 'sending'
                ? t('전송 중...', 'Sending...', lang)
                : t('문의 보내기 →', 'Send Inquiry →', lang)}
            </button>

            <p style={{ fontSize: 11, color: '#8A8D94', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
              {t(
                '문의하시면 영업일 기준 4시간 이내 답변 드립니다.',
                'We typically respond within 4 business hours.',
                lang
              )}
            </p>
          </form>
        )}

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Direct contact */}
          <div style={{
            background: 'white', borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '22px 20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              {t('직접 연락하기', 'Direct Contact', lang)}
            </div>
            {[
              { icon: '📧', label: 'Email', val: 'info.tgtm@gmail.com', href: 'mailto:info.tgtm@gmail.com' },
              { icon: '📱', label: t('문자 / 전화', 'Text / Call', lang), val: '201-233-6184', href: 'tel:+12012336184' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                background: '#F5F7F6', marginBottom: 8,
                transition: 'background 120ms',
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: '#8A8D94', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#085041', fontWeight: 600 }}>{item.val}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Why Nook */}
          <div style={{
            background: 'linear-gradient(135deg, #0F4D38, #1D9E75)',
            borderRadius: 16, padding: '22px 20px', color: 'white',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
              {t('왜 Nook인가요?', 'Why Nook?', lang)}
            </div>
            {[
              { icon: '✅', text: t('앱 다운로드 없음 — 월렛에 바로 저장', 'No app — lives in their wallet', lang) },
              { icon: '🤖', text: t('구글 리뷰 → 자동 쿠폰 지급', 'Google review → auto coupon', lang) },
              { icon: '📲', text: t('푸시알림으로 단골 관리', 'Re-engage with push notifications', lang) },
              { icon: '⚡', text: t('10분이면 시작 가능', 'Live in under 10 minutes', lang) },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 12, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ opacity: 0.88 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Plans teaser */}
          <div style={{
            background: 'white', borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '22px 20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              {t('요금제', 'Plans', lang)}
            </div>
            {[
              { name: 'Basic',   price: '$59', desc: t('고객 100명, 카드 1종', '100 customers, 1 card', lang) },
              { name: 'Pro',     price: '$79', desc: t('고객 500명, 카드 3종', '500 customers, 3 cards', lang) },
              { name: 'Premium', price: '$119', desc: t('무제한', 'Unlimited', lang) },
            ].map(p => (
              <div key={p.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid #F0F0F2',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#8A8D94' }}>{p.desc}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75' }}>{p.price}<span style={{ fontSize: 10, color: '#8A8D94', fontWeight: 400 }}>/mo</span></div>
              </div>
            ))}
            <Link href="/#pricing" style={{
              display: 'block', textAlign: 'center', marginTop: 14,
              color: '#1D9E75', fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}>
              {t('자세히 보기 →', 'See full pricing →', lang)}
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop: '1px solid #E2EDE6', padding: '24px',
        textAlign: 'center', fontSize: 12, color: '#8A8D94',
      }}>
        © 2025 Nook Wallet · <a href="mailto:info.tgtm@gmail.com" style={{ color: '#1D9E75', textDecoration: 'none' }}>info.tgtm@gmail.com</a>
      </div>

      {/* Mobile responsive override */}
      <style>{`
        @media (max-width: 700px) {
          form, div[style*="grid-template-columns: minmax"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
