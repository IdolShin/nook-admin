'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import NookMark from '@/components/NookMark';
import './marketing.css';

type Lang = 'ko' | 'en';

function t(ko: string, en: string, lang: Lang): string {
  return lang === 'ko' ? ko : en;
}

interface JourneyNotif {
  kind: 'stamp' | 'push' | 'reward' | 'empty';
  filled?: number;
  total?: number;
  justFilled?: number;
  ttl: { ko: string; en: string };
  body: { ko: string; en: string };
}

interface JourneyFrame {
  time: string;
  date: { ko: string; en: string };
  bg: 'morning' | 'day' | 'evening' | 'night';
  tag: { ko: string; en: string };
  h: { ko: string; en: string };
  p: { ko: string; en: string };
  notif: JourneyNotif;
}

const journeyFrames: JourneyFrame[] = [
  {
    time: '08:14',
    date: { ko: '월요일, 5월 6일', en: 'Monday, May 6' },
    bg: 'morning',
    tag: { ko: '첫 방문', en: 'FIRST VISIT' },
    h: { ko: '첫 방문, 첫 스탬프', en: 'First visit, first stamp' },
    p: {
      ko: '손님이 처음 매장 방문. 직원이 QR을 스캔하는 순간, 스탬프가 적립되고 잠금화면에 알림이 뜹니다.',
      en: 'First-time customer. Staff scans the QR — stamp lands, lock-screen notification fires instantly.',
    },
    notif: {
      kind: 'stamp',
      filled: 1,
      total: 10,
      ttl: { ko: '☕ 스탬프 1/10 적립 완료', en: '☕ Stamp 1/10 added' },
      body: { ko: 'Nook Café · 방문해주셔서 감사합니다', en: 'Nook Café · Thanks for visiting' },
    },
  },
  {
    time: '11:46',
    date: { ko: '수요일, 5월 22일', en: 'Wednesday, May 22' },
    bg: 'day',
    tag: { ko: '단골 형성 중', en: 'BUILDING HABIT' },
    h: { ko: '5번째 방문, 단골이 되기 시작', en: 'Fifth visit. The habit forms.' },
    p: {
      ko: '스탬프가 절반 넘게 쌓였습니다. 손님은 이제 의식적으로 매장을 선택하고, 매장은 손님 이름을 기억합니다.',
      en: 'Past the halfway mark. The customer is now choosing you intentionally — and you know them by name.',
    },
    notif: {
      kind: 'stamp',
      filled: 6,
      total: 10,
      ttl: { ko: '☕ 스탬프 6/10', en: '☕ Stamp 6/10' },
      body: { ko: '4번만 더 오시면 무료 음료 🎉', en: '4 more visits for a free drink 🎉' },
    },
  },
  {
    time: '—',
    date: { ko: '한 달 후 · 6월 24일', en: 'A month later · June 24' },
    bg: 'evening',
    tag: { ko: '이탈 위험', en: 'AT RISK' },
    h: { ko: '4주째 발길이 끊어짐', en: 'Four quiet weeks' },
    p: {
      ko: '예전엔 그냥 잊혀졌을 단골입니다. Nook이 자동으로 \'이탈 위험\'으로 표시하고, 다음 단계를 준비합니다.',
      en: "Previously you'd just lose them. Nook auto-flags them as 'at risk' and prepares the next move.",
    },
    notif: {
      kind: 'empty',
      ttl: { ko: '(잠잠한 잠금화면)', en: '(quiet lock screen)' },
      body: { ko: '마지막 방문: 28일 전', en: 'Last visit: 28 days ago' },
    },
  },
  {
    time: '09:02',
    date: { ko: '화요일, 6월 25일', en: 'Tuesday, June 25' },
    bg: 'morning',
    tag: { ko: '자동 윈백', en: 'AUTO WIN-BACK' },
    h: { ko: '사장님 대신 푸시가 일합니다', en: 'The push works for you' },
    p: {
      ko: '사장님은 손가락 하나 까딱 안 했습니다. AI 에이전트가 적절한 타이밍에, 적절한 손님에게, 자동으로 발송합니다.',
      en: "You didn't lift a finger. The AI agent sends the right offer to the right customer at the right moment.",
    },
    notif: {
      kind: 'push',
      ttl: { ko: '🎁 보고싶어요, 민재님!', en: '🎁 We miss you, Min-jae!' },
      body: { ko: '이번 주 오시면 모든 음료 2배 스탬프', en: 'Visit this week, get 2× stamps on any drink' },
    },
  },
  {
    time: '13:28',
    date: { ko: '토요일, 6월 29일', en: 'Saturday, June 29' },
    bg: 'day',
    tag: { ko: '재방문 성공', en: 'RETURN VISIT' },
    h: { ko: '손님이 다시 왔습니다', en: 'The customer returns' },
    p: {
      ko: '푸시 한 번이 실제 매출이 되었습니다. 단골 한 명을 잃을 뻔하다가 다시 살린 거예요.',
      en: 'One push became real revenue. A regular nearly lost — saved.',
    },
    notif: {
      kind: 'stamp',
      filled: 8,
      total: 10,
      justFilled: 8,
      ttl: { ko: '☕ 스탬프 +2 (2배 적립!)', en: '☕ Stamp +2 (2× bonus!)' },
      body: { ko: '8/10 · 다시 와주셔서 감사합니다 ❤️', en: '8/10 · Thanks for coming back ❤️' },
    },
  },
  {
    time: '13:45',
    date: { ko: '월요일, 7월 8일', en: 'Monday, July 8' },
    bg: 'night',
    tag: { ko: '보상 획득', en: 'REWARD EARNED' },
    h: { ko: '보상 획득, 다음 카드 시작', en: 'Reward earned. Next card opens.' },
    p: {
      ko: '단골 사이클 완성. 빈 카드가 자동으로 발급되고, 손님의 다음 여정이 시작됩니다. 이게 Nook이 만드는 단골입니다.',
      en: 'The loyalty loop closes. A fresh card opens automatically. The next journey begins. This is Nook.',
    },
    notif: {
      kind: 'reward',
      ttl: { ko: '🎉 무료 음료 획득!', en: '🎉 Free drink earned!' },
      body: { ko: '지금 카운터에서 바코드 보여주세요', en: 'Show your barcode at the counter' },
    },
  },
];

function SmallLogoMark({ size = 14 }: { size?: number }) {
  return (
    <span
      className="logo-mark"
      style={{ '--logo-s': `${size}px` } as React.CSSProperties}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path
          d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="9.5" r="2" fill="white" />
      </svg>
    </span>
  );
}

function JourneyNotifBlock({ frame, lang }: { frame: JourneyFrame; lang: Lang }) {
  const n = frame.notif;

  if (n.kind === 'empty') {
    return (
      <div className="big-notif empty" key={`${frame.time}-${frame.bg}`}>
        <div className="ttl">{n.ttl[lang]}</div>
        <div className="body" style={{ marginTop: 6 }}>{n.body[lang]}</div>
      </div>
    );
  }

  return (
    <div className="big-notif" key={`${frame.time}-${frame.bg}`}>
      <div className="head">
        <span style={{ fontWeight: 600, color: '#fff' }}>NOOK</span>
        <span className="dot" />
        <span>{lang === 'en' ? 'now' : '지금'}</span>
      </div>
      <div className="ttl">{n.ttl[lang]}</div>
      <div className="body">{n.body[lang]}</div>
      {n.kind === 'stamp' && n.filled !== undefined && n.total !== undefined && (
        <div className="stamp-mini-row">
          {Array.from({ length: n.total }, (_, i) => {
            const isFilled = i < n.filled!;
            const isJustFilled = n.justFilled !== undefined && i >= n.filled! - 2 && i < n.filled!;
            let cls = 'stamp-mini';
            if (isFilled) cls += ' filled';
            if (isJustFilled) cls += ' just-filled';
            return <div key={i} className={cls} />;
          })}
        </div>
      )}
    </div>
  );
}

export default function Homepage() {
  const [lang, setLang] = useState<Lang>('ko');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [journeyIdx, setJourneyIdx] = useState(0);
  const [journeyPaused, setJourneyPaused] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [contactTab, setContactTab] = useState<'message' | 'email'>('message');
  const [formContactType, setFormContactType] = useState<'tel' | 'email'>('tel');
  const journeyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init lang from localStorage / hash
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nook-lang') as Lang | null;
      if (saved === 'en' || saved === 'ko') {
        setLang(saved);
      }
    } catch (e) {}
    if (window.location.hash === '#en') setLang('en');
    if (window.location.hash === '#ko') setLang('ko');
  }, []);

  // Check login state
  useEffect(() => {
    try {
      const token = localStorage.getItem('nook_token');
      setIsLoggedIn(!!token);
    } catch (e) {}
  }, []);

  // Scroll reveal
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  // Journey auto-advance
  useEffect(() => {
    if (journeyPaused) return;
    journeyTimerRef.current = setInterval(() => {
      setJourneyIdx((i) => (i + 1) % journeyFrames.length);
    }, 5500);
    return () => {
      if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    };
  }, [journeyPaused]);

  // Body scroll lock when mobile menu or contact modal open
  useEffect(() => {
    const locked = menuOpen || contactOpen;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, contactOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setContactOpen(false); setMenuOpen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem('nook-lang', l);
    } catch (e) {}
    history.replaceState(null, '', '#' + l);
  }

  function resetJourneyTimer() {
    if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    if (!journeyPaused) {
      journeyTimerRef.current = setInterval(() => {
        setJourneyIdx((i) => (i + 1) % journeyFrames.length);
      }, 5500);
    }
  }

  function handlePrev() {
    setJourneyIdx((i) => (i - 1 + journeyFrames.length) % journeyFrames.length);
    resetJourneyTimer();
  }

  function handleNext() {
    setJourneyIdx((i) => (i + 1) % journeyFrames.length);
    resetJourneyTimer();
  }

  function handlePause() {
    setJourneyPaused((p) => {
      if (!p) {
        // Pausing
        if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
      }
      return !p;
    });
  }

  function handleDotClick(i: number) {
    setJourneyIdx(i);
    setJourneyPaused(false);
    if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    journeyTimerRef.current = setInterval(() => {
      setJourneyIdx((idx) => (idx + 1) % journeyFrames.length);
    }, 5500);
  }

  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormSuccess(true);
    setTimeout(() => {
      setContactOpen(false);
      setFormSuccess(false);
      (e.target as HTMLFormElement).reset();
    }, 2400);
  }

  function handleTabSwitch(tab: 'message' | 'email') {
    setContactTab(tab);
    setFormContactType(tab === 'email' ? 'email' : 'tel');
  }

  const frame = journeyFrames[journeyIdx];

  return (
    <div className={`marketing-page${lang === 'en' ? ' lang-en' : ''}`}>
      {/* NAV */}
      <div className="nav">
        <div className="wrap nav-inner">
          <a href="#" className="row gap-2">
            <NookMark size={32} />
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Nook</span>
          </a>
          <div className="nav-links">
            <a href="#features">{t('기능', 'Features', lang)}</a>
            <a href="#how">{t('작동 방식', 'How it works', lang)}</a>
            <a href="#pricing">{t('요금', 'Pricing', lang)}</a>
            <a href="#faq">{t('자주 묻는 질문', 'FAQ', lang)}</a>
          </div>
          <div className="row gap-3">
            <div className="lang-toggle">
              <button className={lang === 'ko' ? 'on' : ''} onClick={() => switchLang('ko')}>
                한국어
              </button>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>
                EN
              </button>
            </div>
            <div className="nav-cta">
              {isLoggedIn ? (
                <Link href="/dashboard" className="btn btn-primary" style={{ height: 38 }}>
                  {t('대시보드 →', 'Dashboard →', lang)}
                </Link>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ height: 38 }}
                  onClick={() => setContactOpen(true)}
                >
                  {t('문의하기', 'Contact us', lang)}
                </button>
              )}
            </div>
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} role="dialog" aria-label="Navigation">
        <div className="mobile-menu-header">
          <a href="#" className="row gap-2" onClick={() => setMenuOpen(false)}>
            <NookMark size={32} />
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Nook</span>
          </a>
          <button className="nav-hamburger" style={{ display: 'inline-flex' }} onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mobile-menu-links">
          <a href="#features" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>{t('기능', 'Features', lang)}</a>
          <a href="#how" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>{t('작동 방식', 'How it works', lang)}</a>
          <a href="#pricing" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>{t('요금', 'Pricing', lang)}</a>
          <a href="#faq" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>{t('자주 묻는 질문', 'FAQ', lang)}</a>
        </div>
        <div className="mobile-menu-footer">
          <div className="lang-toggle" style={{ marginBottom: 14, width: '100%', justifyContent: 'center' }}>
            <button className={lang === 'ko' ? 'on' : ''} onClick={() => switchLang('ko')} style={{ flex: 1, justifyContent: 'center' }}>한국어</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')} style={{ flex: 1, justifyContent: 'center' }}>EN</button>
          </div>
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              {t('대시보드 →', 'Dashboard →', lang)}
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMenuOpen(false); setContactOpen(true); }}>
              {t('문의하기 →', 'Contact us →', lang)}
            </button>
          )}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              {t('Apple Wallet · Google Wallet 지원', 'Apple Wallet · Google Wallet supported', lang)}
            </div>
            <h1 className="h1">
              {lang === 'ko' ? (
                <>
                  손님이 다시 오는
                  <br />
                  이유, 지금 <span className="accent">만들어드립니다.</span>
                </>
              ) : (
                <>
                  Turn every visit into
                  <br />a <span className="accent">loyal customer</span>.
                </>
              )}
            </h1>
            <p className="h1-sub">
              {t(
                '앱 다운로드 없이 — 고객 휴대폰 월렛에 바로 저장되는 디지털 적립카드 + 푸시 알림 + 할인 쿠폰.',
                'No app download. Digital loyalty cards, push notifications, and exclusive coupons — all in their phone wallet.',
                lang
              )}
            </p>
            <div className="hero-ctas">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setContactOpen(true)}
              >
                {t('문의하기 →', 'Contact us →', lang)}
              </button>
              <button
                className="btn btn-lg"
                onClick={() =>
                  document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {t('작동 방식 보기', 'See how it works', lang)}
              </button>
            </div>
            <div className="hero-checks">
              <span>{t('✓ 앱 설치 없음', '✓ No app install', lang)}</span>
              <span>{t('✓ 10분 셋업', '✓ 10-min setup', lang)}</span>
              <span>✓ Apple · Google Wallet</span>
            </div>
          </div>

          <div className="phones">
            {/* Left: iPhone light, stamp notification */}
            <div className="phone phone-l">
              <div className="screen">
                <div className="notch" />
                <div className="lock">
                  <div className="time">2:14</div>
                  <div className="date">{t('목요일, 5월 2일', 'Thursday, May 2', lang)}</div>
                  <div className="notif">
                    <div className="notif-head">
                      <SmallLogoMark size={14} />
                      <span>{t('NOOK · 지금', 'NOOK · now', lang)}</span>
                    </div>
                    <div className="notif-title">{t('☕ 스탬프 8/10 완료!', '☕ 8/10 stamps!', lang)}</div>
                    <div className="notif-body">
                      {t('한 번만 더 오시면 무료 음료예요', 'One more visit for a free drink', lang)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Wallet card */}
            <div className="phone phone-c">
              <div className="screen">
                <div className="notch" />
                <div className="wallet-screen">
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: 10,
                      color: 'var(--text-3)',
                      marginBottom: 10,
                      fontWeight: 500,
                    }}
                  >
                    WALLET
                  </div>
                  <div className="wallet-card">
                    <div className="biz">NOOK CAFÉ · FORT LEE</div>
                    <div className="ttl">{t('커피 단골카드', 'Coffee Lovers Card', lang)}</div>
                    <div className="sub">{t('10잔 모으면 한 잔 무료', 'Free drink after 10 stamps', lang)}</div>
                    <div className="stamp-row">
                      {[true, true, true, true, true, true, true, true, false, false].map((on, i) => (
                        <div key={i} className={`stamp${on ? ' on' : ''}`} />
                      ))}
                    </div>
                    <div className="row between" style={{ marginTop: 12, fontSize: 11 }}>
                      <span style={{ opacity: 0.85 }}>{t('민재 김', 'Min-jae Kim', lang)}</span>
                      <span className="mono" style={{ fontWeight: 600 }}>8 / 10</span>
                    </div>
                    <div className="barcode">
                      <div className="bar" />
                    </div>
                    <div className="glyph-bg">
                      <svg width="100" height="100" viewBox="0 0 32 32" fill="none">
                        <path
                          d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
                          stroke="white"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="23" cy="9.5" r="2" fill="white" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Android dark, coupon notification */}
            <div className="phone phone-r">
              <div className="screen">
                <div className="notch" />
                <div className="lock dark">
                  <div className="time">14:32</div>
                  <div className="date">{t('금요일, 5월 3일', 'Friday, May 3', lang)}</div>
                  <div className="notif">
                    <div className="notif-head">
                      <SmallLogoMark size={14} />
                      <span>{t('NOOK · 쿠폰 도착', 'NOOK · Coupon', lang)}</span>
                    </div>
                    <div className="notif-title">{t('🎁 음료 50% 할인', '🎁 50% off drinks', lang)}</div>
                    <div className="notif-body">
                      {t('오늘만! 월렛에서 확인해주세요', 'Today only — check your wallet', lang)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Stats grid */}
        <div className="wrap reveal" style={{ marginTop: 80 }}>
          <div className="stats-grid">
            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, #DFF4EB 0%, #C7EBDB 100%)' }}
            >
              <div className="num">
                94<small style={{ fontSize: 22 }}>%</small>
              </div>
              <div className="lbl">{t('푸시 알림 수신율', 'Push notification delivery', lang)}</div>
              <div className="delta">{t('SMS·이메일보다 압도적', 'Far above SMS / email', lang)}</div>
            </div>
            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, #E2ECFB 0%, #CADCF7 100%)' }}
            >
              <div className="num">
                +38<small style={{ fontSize: 22 }}>%</small>
              </div>
              <div className="lbl">{t('평균 재방문율 향상', 'Avg. lift in repeat visits', lang)}</div>
              <div className="delta">{t('Fort Lee 매장 평균', 'Fort Lee merchant avg', lang)}</div>
            </div>
            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, #FBEFD9 0%, #F6E0B5 100%)' }}
            >
              <div className="num">
                10<small style={{ fontSize: 22 }}>{t('분', ' min', lang)}</small>
              </div>
              <div className="lbl">
                {t('셋업 완료까지 걸리는 시간', 'Time to launch your card', lang)}
              </div>
              <div className="delta">{t('QR 출력해서 붙이면 끝', 'Print QR, you\'re live', lang)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 REASONS */}
      <section
        style={{
          background: 'white',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="wrap">
          <div className="reveal">
            <div className="section-eyebrow">
              {t('고객 경험', 'Customer Experience', lang)}
            </div>
            <h2 className="section-title">
              {t('왜 손님들은 다시 올까요?', 'Why do customers keep coming back?', lang)}
            </h2>
            <p className="section-sub">
              {t(
                'Nook은 단순한 적립카드가 아닙니다. 손님이 매장을 기억하게 만드는 3가지 이유.',
                'Nook is more than a stamp card. 3 reasons customers never forget your business.',
                lang
              )}
            </p>
          </div>

          <div className="reasons">
            {/* Reason 1: Wallet */}
            <div className="reason reveal">
              <div
                className="visual"
                style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6B4D 100%)', padding: 22 }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 12,
                    padding: 14,
                    color: 'white',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.9 }}>
                    NOOK CAFÉ
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                    {t('단골카드', 'Loyalty Card', lang)}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' as const }}>
                    {[true, true, true, true, true, false, false, false].map((filled, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: filled ? 'white' : 'transparent',
                          border: filled ? 'none' : '1.5px solid rgba(255,255,255,0.5)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="row gap-2" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>📱</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Wallet
                </span>
              </div>
              <h3>{t('항상 휴대폰에 있는 적립카드', 'Always in their phone wallet', lang)}</h3>
              <p>
                {t(
                  '종이 쿠폰은 잃어버리고, 플라스틱 카드는 집에 두고 옵니다. Nook 카드는 Apple·Google Wallet에 저장되어 언제나 함께합니다.',
                  'Paper coupons get lost. Plastic cards get forgotten. Nook cards live in Apple & Google Wallet — always with your customer.',
                  lang
                )}
              </p>
            </div>

            {/* Reason 2: Push */}
            <div className="reason reveal" style={{ transitionDelay: '100ms' }}>
              <div
                className="visual"
                style={{
                  background: 'linear-gradient(160deg, #1F2228 0%, #0A0C10 100%)',
                  padding: 22,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    background: 'rgba(40,42,48,0.7)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 12,
                    padding: 12,
                    color: 'white',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      fontSize: 10,
                      opacity: 0.85,
                      marginBottom: 4,
                    }}
                  >
                    <SmallLogoMark size={14} />
                    <span>{t('NOOK · 지금', 'NOOK · now', lang)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {t('비 오는 화요일 ☕', 'Rainy Tuesday ☕', lang)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                    {t('오늘 오시면 +2 스탬프', 'Visit today, get +2 stamps', lang)}
                  </div>
                </div>
              </div>
              <div className="row gap-2" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>🔔</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Push
                </span>
              </div>
              <h3>{t('잠금화면에 직접 전달되는 알림', 'Delivered straight to their lock screen', lang)}</h3>
              <p>
                {t(
                  '스탬프 적립, 보상, 프로모션 — 모두 잠금화면에 바로 뜹니다. SMS 비용 없이, 이메일보다 10배 높은 확인율로.',
                  'Stamps, rewards, promos — all on the lock screen. No SMS cost. 10× the open rate of email.',
                  lang
                )}
              </p>
            </div>

            {/* Reason 3: Coupons */}
            <div className="reason reveal" style={{ transitionDelay: '200ms' }}>
              <div
                className="visual"
                style={{
                  background: 'linear-gradient(135deg, #FFE4D2 0%, #F9CFB4 100%)',
                  padding: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: '0 8px 22px rgba(0,0,0,0.10)',
                    width: 200,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#C26B1F',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {t('오늘 한정', 'TODAY ONLY', lang)}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>
                    50% OFF
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                    {t('모든 음료 메뉴', 'All drinks', lang)}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      height: 26,
                      background:
                        'repeating-linear-gradient(90deg, #000 0, #000 1.5px, transparent 1.5px, transparent 3px)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
              <div className="row gap-2" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>🎟️</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Coupons
                </span>
              </div>
              <h3>{t('사장님이 직접 보내는 특별 할인', 'Exclusive deals sent by you', lang)}</h3>
              <p>
                {t(
                  '주말 할인, BOGO, 무료 메뉴 쿠폰을 단골에게 직접 발송. 월렛에 바로 저장되고, 매장에서 바코드로 사용합니다.',
                  'Weekend deals, BOGO, free items — sent directly. Saved to wallet, redeemed by barcode scan.',
                  lang
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="wrap">
          <div className="reveal">
            <div className="section-eyebrow">{t('작동 방식', 'How it works', lang)}</div>
            <h2 className="section-title">
              {t('시작은 10분이면 충분합니다', 'Up and running in 10 minutes', lang)}
            </h2>
          </div>

          <div className="steps">
            <div className="step reveal">
              <div className="nbr">1</div>
              <h3>{t('적립카드 만들기', 'Create your card', lang)}</h3>
              <p>
                {t(
                  '대시보드에서 카드 디자인, 적립 목표, 리워드를 설정하세요.',
                  'Set up card design, stamp goal, and reward in our dashboard.',
                  lang
                )}
              </p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '80ms' }}>
              <div className="nbr">2</div>
              <h3>{t('QR로 손님 등록', 'Customer scans QR', lang)}</h3>
              <p>
                {t(
                  '매장에 QR을 붙여두세요. 손님이 한 번 스캔하면 월렛에 카드가 추가됩니다.',
                  'Place QR in your shop. One scan and the card is in their wallet.',
                  lang
                )}
              </p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '160ms' }}>
              <div className="nbr">3</div>
              <h3>{t('방문마다 스탬프', 'Stamp every visit', lang)}</h3>
              <p>
                {t(
                  '직원이 폰·태블릿으로 손님 QR을 스캔하면 자동 적립 + 손님 폰에 알림.',
                  'Staff scans the customer\'s QR — stamp added, notification sent.',
                  lang
                )}
              </p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '240ms' }}>
              <div className="nbr">4</div>
              <h3>{t('쿠폰으로 다시 부르기', 'Bring them back with coupons', lang)}</h3>
              <p>
                {t(
                  '30일 이상 안 오신 단골에게 자동으로 쿠폰을 발송. 자동 윈백.',
                  'Auto-send coupons to customers gone 30+ days. Win-back on autopilot.',
                  lang
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        style={{
          background: 'white',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="wrap">
          <div className="reveal">
            <div className="section-eyebrow">{t('기능', 'Features', lang)}</div>
            <h2 className="section-title">
              {t('단골 손님을 만드는 모든 기능', 'Everything you need to build loyalty', lang)}
            </h2>
          </div>

          <div className="features-grid">
            <div className="feat reveal">
              <div className="ico">🏷️</div>
              <h3>{t('스탬프·쿠폰·캐시백 카드', 'Stamp · Coupon · Cashback', lang)}</h3>
              <p>
                {t(
                  '업종에 맞는 카드 타입을 선택. 스탬프, 금액·% 할인, 무료 메뉴까지.',
                  'Pick the right card for your business: stamps, $ off, % off, or free items.',
                  lang
                )}
              </p>
            </div>
            <div className="feat reveal" style={{ transitionDelay: '60ms' }}>
              <div className="ico">🔔</div>
              <h3>{t('무료 푸시 알림', 'Free push notifications', lang)}</h3>
              <p>
                {t(
                  'SMS 비용 없이 전체·세그먼트 고객에게 발송. 잠금화면에 바로 표시됩니다.',
                  'Send to all or segments — free. Right on their lock screen.',
                  lang
                )}
              </p>
            </div>
            <div className="feat reveal" style={{ transitionDelay: '120ms' }}>
              <div className="ico">🎟️</div>
              <h3>{t('스마트 할인 쿠폰', 'Smart coupons', lang)}</h3>
              <p>
                {t(
                  '유효기간 있는 디지털 쿠폰. 바코드 스캔으로 사용하고 자동 소진.',
                  'Time-limited coupons. Redeemed by barcode, auto-expires.',
                  lang
                )}
              </p>
            </div>
            <div className="feat reveal" style={{ transitionDelay: '60ms' }}>
              <div className="ico">🤖</div>
              <h3>{t('자동 마케팅 캠페인', 'Automated campaigns', lang)}</h3>
              <p>
                {t(
                  '생일 쿠폰, 30일 미방문 윈백, 스탬프 완료 보너스 — 모두 자동 실행.',
                  'Birthday coupons, 30-day win-back, stamp-complete bonuses — on autopilot.',
                  lang
                )}
              </p>
            </div>
            <div className="feat reveal" style={{ transitionDelay: '120ms' }}>
              <div className="ico">⭐</div>
              <h3>{t('구글 리뷰 이벤트', 'Google review rewards', lang)}</h3>
              <p>
                {t(
                  '구글 리뷰 남긴 손님에게 자동 쿠폰 지급. 5스타가 자연스럽게 늘어납니다.',
                  'Auto-reward customers who leave a Google review. 5-stars grow naturally.',
                  lang
                )}
              </p>
            </div>
            <div className="feat reveal" style={{ transitionDelay: '180ms' }}>
              <div className="ico">📊</div>
              <h3>{t('실시간 고객 현황', 'Real-time analytics', lang)}</h3>
              <p>
                {t(
                  '누가 단골이고, 누가 보상에 가깝고, 누가 한 달째 안 오는지 한눈에.',
                  "See who's loyal, who's close to a reward, who hasn't been back.",
                  lang
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER JOURNEY */}
      <section>
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="section-eyebrow">{t('고객 여정', 'Customer Journey', lang)}</div>
            <h2
              className="section-title"
              style={{ margin: '0 auto', fontSize: 52 }}
              dangerouslySetInnerHTML={{
                __html: t(
                  '손님 입장에서<br>경험해보세요',
                  "See it from your<br>customer's perspective",
                  lang
                ),
              }}
            />
            <p className="section-sub" style={{ margin: '18px auto 0' }}>
              {t(
                '단골이 만들어지는 6단계 여정. 손님의 잠금화면이 어떻게 변하는지 직접 확인하세요.',
                "The 6-step journey of building a regular. See how it appears on your customer's lock screen.",
                lang
              )}
            </p>
          </div>

          <div className="journey-stage reveal">
            <div className="journey-controls">
              <button aria-label="prev" onClick={handlePrev}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button aria-label={journeyPaused ? 'play' : 'pause'} onClick={handlePause}>
                {journeyPaused ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M3 2l8 4-8 4z" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="2" y="2" width="3" height="8" rx="1" />
                    <rect x="7" y="2" width="3" height="8" rx="1" />
                  </svg>
                )}
              </button>
              <button aria-label="next" onClick={handleNext}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="journey-grid">
              {/* Big phone */}
              <div className="big-phone">
                <div className={`screen ${frame.bg}`}>
                  <div className="notch" />
                  <div className="lock-content">
                    <div className="lock-time">{frame.time}</div>
                    <div className="lock-date">{frame.date[lang]}</div>
                    <JourneyNotifBlock frame={frame} lang={lang} key={journeyIdx} />
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="journey-caption">
                <div className="stage-tag">{frame.tag[lang]}</div>
                <div className="frame-meta">
                  <span className="accent-pill">{String(journeyIdx + 1).padStart(2, '0')}</span>
                  <span>{t('6단계 중', 'of 6', lang)}</span>
                  <span>06</span>
                </div>
                <h3>{frame.h[lang]}</h3>
                <p>{frame.p[lang]}</p>
                <div className="journey-progress">
                  {journeyFrames.map((_, i) => (
                    <button
                      key={i}
                      className={i === journeyIdx ? 'on' : ''}
                      onClick={() => handleDotClick(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        style={{ background: 'white', borderTop: '1px solid var(--border)' }}
      >
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="section-eyebrow">{t('요금제', 'Pricing', lang)}</div>
            <h2 className="section-title" style={{ margin: '0 auto' }}>
              {t('합리적인 가격, 확실한 효과', 'Simple pricing. Real results.', lang)}
            </h2>
            <p className="section-sub" style={{ margin: '16px auto 0' }}>
              {t(
                '신용카드 불필요 · 언제든지 취소 가능 · 10분 안에 시작',
                'No credit card · Cancel anytime · Setup in 10 minutes',
                lang
              )}
            </p>
          </div>

          <div className="pricing-grid">
            {/* Basic */}
            <div className="price-card reveal">
              <div className="name">{t('베이직', 'Basic', lang)}</div>
              <div className="price">$59<small> /mo</small></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                {t('처음 시작하는 매장', 'Just getting started', lang)}
              </div>
              <ul>
                <li>{t('적립카드 1종 (스탬프 전용)', '1 loyalty card (stamp only)', lang)}</li>
                <li>{t('고객 100명까지', 'Up to 100 customers', lang)}</li>
                <li>{t('Apple + Google Wallet 지원', 'Apple + Google Wallet', lang)}</li>
                <li>{t('푸시 알림 월 1회', '1 push notification / month', lang)}</li>
                <li>{t('기본 분석', 'Basic analytics', lang)}</li>
                <li>{t('이메일 지원', 'Email support', lang)}</li>
              </ul>
              <button
                className="btn"
                style={{ width: '100%' }}
                onClick={() => setContactOpen(true)}
              >
                {t('문의하기', 'Contact us', lang)}
              </button>
            </div>

            {/* Pro */}
            <div className="price-card featured reveal" style={{ transitionDelay: '80ms' }}>
              <div className="badge-featured">{t('인기', 'Popular', lang)}</div>
              <div className="name">{t('프로', 'Pro', lang)}</div>
              <div className="price">$79<small> /mo</small></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                {t('안정적으로 운영하는 매장', 'Growing businesses', lang)}
              </div>
              <ul>
                <li>{t('적립카드 3종 (스탬프 · 할인쿠폰 · 이벤트쿠폰)', '3 cards (Stamp · Discount · Event)', lang)}</li>
                <li>{t('고객 500명까지', 'Up to 500 customers', lang)}</li>
                <li>Apple + Google Wallet</li>
                <li>{t('푸시 알림 주 1회', '1 push notification / week', lang)}</li>
                <li>{t('자동 마케팅 캠페인', 'Automated campaigns', lang)}</li>
                <li>{t('전체 분석 대시보드', 'Full analytics dashboard', lang)}</li>
                <li>{t('우선 지원', 'Priority support', lang)}</li>
              </ul>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setContactOpen(true)}
              >
                {t('문의하기', 'Contact us', lang)}
              </button>
            </div>

            {/* Premium */}
            <div className="price-card reveal" style={{ transitionDelay: '160ms' }}>
              <div className="name">{t('프리미엄', 'Premium', lang)}</div>
              <div className="price">$119<small> /mo</small></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                {t('여러 지점·프랜차이즈', 'Multi-location · franchise', lang)}
              </div>
              <ul>
                <li>{t('적립카드 무제한 (커스터마이징)', 'Unlimited cards (custom design)', lang)}</li>
                <li>{t('고객 무제한', 'Unlimited customers', lang)}</li>
                <li>{t('여러 지점 지원', 'Multi-location support', lang)}</li>
                <li>{t('푸시 광고 알림 무제한', 'Unlimited push notifications', lang)}</li>
                <li>{t('AI 마케팅 에이전트 (데이터 기반)', 'AI Marketing Agent (data-driven)', lang)}</li>
                <li>{t('모든 자동화 기능', 'All automation features', lang)}</li>
                <li>{t('전담 매니저', 'Dedicated manager', lang)}</li>
              </ul>
              <button
                className="btn"
                style={{ width: '100%' }}
                onClick={() => setContactOpen(true)}
              >
                {t('문의하기', 'Contact us', lang)}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <div className="wrap">
          <div className="reveal">
            <div className="section-eyebrow">{t('고객 후기', 'Testimonials', lang)}</div>
            <h2 className="section-title">
              {t('사장님들의 실제 후기', 'What business owners say', lang)}
            </h2>
          </div>
          <div className="testimonials">
            <div className="testimonial reveal">
              <div className="quote">
                {t(
                  '"3개월 만에 단골이 20명에서 128명으로 늘었어요. 푸시 한 번 보내면 다음 날 매출이 확 올라요."',
                  '"Regulars went from 20 to 128 in 3 months. Sales jump every time I send a push."',
                  lang
                )}
              </div>
              <div className="who">
                <div className="ava" style={{ background: '#1D9E75' }}>SK</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Sarah K.</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {t('카페 사장 · Fort Lee', 'Café owner · Fort Lee', lang)}
                  </div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{ transitionDelay: '80ms' }}>
              <div className="quote">
                {t(
                  '"손님들이 종이 쿠폰보다 훨씬 좋아해요. 잃어버릴 일도 없고, 폰에서 바로 보이니까요."',
                  '"Customers love it more than paper coupons. Never lost, always visible on their phone."',
                  lang
                )}
              </div>
              <div className="who">
                <div className="ava" style={{ background: '#C53A6B' }}>JP</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Ji-yeon P.</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {t('네일샵 사장 · Palisades Park', 'Nail salon owner · Palisades Park', lang)}
                  </div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{ transitionDelay: '160ms' }}>
              <div className="quote">
                {t(
                  '"토요일에 \'2배 스탬프\' 푸시 하나 보냈더니 그날 매출이 40% 올랐어요."',
                  "\"Sent one '2× stamps Saturday' push and sales went up 40% that day.\"",
                  lang
                )}
              </div>
              <div className="who">
                <div className="ava" style={{ background: '#C26B1F' }}>DC</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>David C.</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {t('레스토랑 사장 · Fort Lee', 'Restaurant owner · Fort Lee', lang)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: 'white', borderTop: '1px solid var(--border)' }}>
        <div className="wrap">
          <div className="reveal">
            <div className="section-eyebrow">{t('자주 묻는 질문', 'FAQ', lang)}</div>
            <h2 className="section-title">
              {t('사장님들이 가장 많이 묻는 것들', 'Frequently asked questions', lang)}
            </h2>
          </div>
          <div className="faq">
            <details className="faq-item reveal">
              <summary>{t('손님이 앱을 다운받아야 하나요?', 'Do customers need to download an app?', lang)}</summary>
              <p>
                {t(
                  '아니요. Apple Wallet · Google Wallet은 모든 폰에 기본 내장되어 있어요. 앱 설치, 회원가입 모두 필요 없습니다.',
                  'No. Apple Wallet and Google Wallet come built into every phone. No app, no account signup needed.',
                  lang
                )}
              </p>
            </details>
            <details className="faq-item reveal">
              <summary>
                {t('아이폰과 안드로이드 둘 다 되나요?', 'Does it work on iPhone and Android?', lang)}
              </summary>
              <p>
                {t(
                  '네. 아이폰은 Apple Wallet, 안드로이드는 Google Wallet 사용. 둘 다 완벽 지원합니다.',
                  'Yes. iPhone uses Apple Wallet, Android uses Google Wallet. Both fully supported.',
                  lang
                )}
              </p>
            </details>
            <details className="faq-item reveal">
              <summary>
                {t('직원이 어떻게 스탬프를 찍나요?', 'How do staff stamp customer cards?', lang)}
              </summary>
              <p>
                {t(
                  'Nook 스캐너 웹앱을 직원 폰·태블릿에 띄워두세요. 손님 카드의 QR을 비추면 자동 적립.',
                  'Open the Nook Scanner web app on a staff phone or tablet. Aim at the customer\'s QR — stamp added automatically.',
                  lang
                )}
              </p>
            </details>
            <details className="faq-item reveal">
              <summary>{t('쿠폰은 어떻게 사용하나요?', 'How are coupons redeemed?', lang)}</summary>
              <p>
                {t(
                  '손님이 월렛에서 쿠폰을 열면 바코드가 표시됩니다. 직원이 스캐너 앱으로 스캔 → 자동 소진 + 만료 처리.',
                  'Customer opens the coupon — barcode appears. Staff scans it with Nook Scanner → auto-marked as used.',
                  lang
                )}
              </p>
            </details>
            <details className="faq-item reveal">
              <summary>
                {t(
                  '전체 고객에게 한 번에 메시지를 보낼 수 있나요?',
                  'Can I message all customers at once?',
                  lang
                )}
              </summary>
              <p>
                {t(
                  '네. 대시보드에서 전체·매장별·세그먼트별로 한 번에 푸시를 발송할 수 있습니다. 무료입니다.',
                  'Yes. From the dashboard send to all, by store, or by segment — free of charge.',
                  lang
                )}
              </p>
            </details>
            <details className="faq-item reveal">
              <summary>{t('계약 기간이 있나요?', 'Is there a contract?', lang)}</summary>
              <p>
                {t(
                  '첫 가입 시 1년 약정으로 시작하며, 1년 이후부터는 월 단위 구독으로 자동 전환됩니다. 1년 이후에는 언제든지 취소 가능.',
                  'Initial term is 1 year. After the first year it converts to month-to-month — cancel anytime.',
                  lang
                )}
              </p>
            </details>
            <details className="faq-item reveal">
              <summary>{t('설정이 어렵지 않나요?', 'Is setup difficult?', lang)}</summary>
              <p>
                {t(
                  '10분이면 충분합니다. 가입 → 카드 만들기 → QR 출력해서 매장에 붙이기 — 끝. 기술 지식 필요 없어요.',
                  'About 10 minutes. Sign up, create card, print the QR, stick it in your shop. No tech knowledge needed.',
                  lang
                )}
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section>
        <div className="wrap">
          <div className="cta-banner reveal">
            <div className="glyph-bg-cta">
              <svg width="360" height="360" viewBox="0 0 32 32" fill="none">
                <path
                  d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
                  stroke="white"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="23" cy="9.5" r="2" fill="white" />
              </svg>
            </div>
            <span
              className="logo-mark"
              style={
                {
                  '--logo-s': '56px',
                  background: 'rgba(255,255,255,0.12)',
                  margin: '0 auto 24px',
                  boxShadow: 'none',
                } as React.CSSProperties
              }
            >
              <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
                <path
                  d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
                  stroke="white"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="23" cy="9.5" r="2" fill="white" />
              </svg>
            </span>
            <h2>{t('지금 바로 시작하세요', 'Start building loyalty today', lang)}</h2>
            <p>
              {t(
                '데모 카드를 직접 받아보세요. 손님 입장에서 어떻게 보이는지 확인한 후, 매장에 도입하시면 됩니다.',
                'Receive a demo reward card yourself. See exactly what your customers will experience before launching.',
                lang
              )}
            </p>
            <div style={{ marginTop: 32 }}>
              <button
                className="btn btn-lg"
                style={{ background: 'white', border: 0, color: 'var(--accent-dark)' }}
                onClick={() => setContactOpen(true)}
              >
                {t('데모 리워드카드 받아보기 →', 'Get a demo reward card →', lang)}
              </button>
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 16 }}>
              {t(
                '10분 셋업 · 첫 1년 약정 후 월 단위 전환',
                '10-min setup · 1-year initial term, then month-to-month',
                lang
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div className="row gap-2">
              <SmallLogoMark size={28} />
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Nook
              </span>
            </div>
            <div className="links">
              <a href="#features">{t('기능', 'Features', lang)}</a>
              <a href="#pricing">{t('요금제', 'Pricing', lang)}</a>
              <Link href="/auth">{t('로그인', 'Login', lang)}</Link>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-2)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
                onClick={() => setContactOpen(true)}
              >
                {t('문의', 'Contact', lang)}
              </button>
            </div>
          </div>
          <div
            className="row between"
            style={{
              paddingTop: 24,
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              {t(
                'Fort Lee, NJ 지역 매장을 위해 만들었습니다.',
                'Built for local businesses in Fort Lee, NJ.',
                lang
              )}
            </div>
            <div>© 2026 Nook Wallet. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* CONTACT MODAL */}
      {contactOpen && (
        <div
          className="modal-backdrop open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setContactOpen(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <h3>{t('문의하기', 'Contact us', lang)}</h3>
                <p>
                  {t(
                    '이메일이나 메시지로 편하게 문의해주세요. 24시간 안에 답변드립니다.',
                    'Reach out by email or message — we reply within 24 hours.',
                    lang
                  )}
                </p>
              </div>
              <button className="modal-close" onClick={() => setContactOpen(false)} aria-label="close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Quick channels */}
              <div className="channel-row">
                <a className="channel-card" href="mailto:hello@nook.app">
                  <div className="ico">📧</div>
                  <div className="lbl">{t('바로 이메일', 'Email directly', lang)}</div>
                  <div className="val">hello@nook.app</div>
                </a>
                <a className="channel-card" href="sms:+12015551234">
                  <div className="ico">💬</div>
                  <div className="lbl">{t('문자 메시지', 'Text message', lang)}</div>
                  <div className="val">+1 (201) 555-1234</div>
                </a>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--text-3)',
                  marginBottom: 16,
                }}
              >
                {t('— 또는 양식 작성 —', '— or send a message —', lang)}
              </div>

              <div className="modal-tabs">
                <button
                  className={contactTab === 'message' ? 'on' : ''}
                  onClick={() => handleTabSwitch('message')}
                >
                  {t('메시지 보내기', 'Send message', lang)}
                </button>
                <button
                  className={contactTab === 'email' ? 'on' : ''}
                  onClick={() => handleTabSwitch('email')}
                >
                  {t('이메일 양식', 'Email form', lang)}
                </button>
              </div>

              {!formSuccess ? (
                <form onSubmit={handleContactSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('이름', 'Name', lang)}</label>
                      <input type="text" required name="name" />
                    </div>
                    <div className="form-group">
                      <label>{t('매장 이름', 'Business name', lang)}</label>
                      <input type="text" name="business" placeholder="Nook Café" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      {contactTab === 'email'
                        ? t('이메일', 'Email', lang)
                        : t('휴대폰 번호', 'Phone number', lang)}
                    </label>
                    <input
                      type={formContactType}
                      required
                      placeholder={
                        formContactType === 'email' ? 'you@example.com' : '+1 (201) 555-1234'
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('문의 종류', 'Topic', lang)}</label>
                    <select name="topic">
                      <option>{t('요금제 상담', 'Pricing inquiry', lang)}</option>
                      <option>{t('데모 카드 받기', 'Demo reward card', lang)}</option>
                      <option>{t('여러 지점 도입', 'Multi-location setup', lang)}</option>
                      <option>{t('기능 문의', 'Feature question', lang)}</option>
                      <option>{t('기타', 'Other', lang)}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('메시지', 'Message', lang)}</label>
                    <textarea
                      name="message"
                      placeholder={t(
                        '간단하게 어떤 매장이고 어떤 도움이 필요한지 알려주세요.',
                        'Tell us briefly about your business and how we can help.',
                        lang
                      )}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    {t('문의 보내기', 'Send inquiry', lang)}
                  </button>
                  <div
                    style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}
                  >
                    {t('24시간 안에 회신드립니다 · 스팸 없음', 'We reply within 24 hours · No spam', lang)}
                  </div>
                </form>
              ) : (
                <div className="form-success shown">
                  <div className="check">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M8 16l5 5L24 11"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4>{t('문의가 전송되었습니다!', 'Message sent!', lang)}</h4>
                  <p>
                    {t('24시간 안에 답변드릴게요. 감사합니다 ☕', "We'll get back to you within 24 hours. Thank you ☕", lang)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
