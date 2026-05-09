'use client';
import React, { useEffect, useState } from 'react';

const SPLASH_CSS = `
  .nk-splash {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
    height: 100dvh;
    min-height: 100%;
    min-height: 100dvh;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    isolation: isolate;
    background:
      radial-gradient(140% 60% at 50% 12%, rgba(29,158,117,0.22) 0%, rgba(29,158,117,0) 55%),
      radial-gradient(120% 80% at 50% 100%, rgba(15,107,77,0.28) 0%, rgba(15,107,77,0) 60%),
      linear-gradient(180deg, #0c1714 0%, #070d0b 100%);
    transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 1;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .nk-splash::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
    background-size: 3px 3px;
    mix-blend-mode: overlay;
    opacity: .5;
    z-index: 1;
  }
  .nk-splash::after {
    content: "";
    position: absolute;
    inset: -10%;
    pointer-events: none;
    background: radial-gradient(60% 45% at 50% 50%, rgba(34,184,137,0.10), transparent 70%);
    animation: nk-halo 6.5s ease-in-out infinite;
    z-index: 1;
  }
  .nk-splash-out {
    opacity: 0;
    pointer-events: none;
  }
  @keyframes nk-halo {
    0%,100%{opacity:.55;transform:scale(1)}
    50%{opacity:.95;transform:scale(1.06)}
  }

  /* Cards */
  .nk-cards {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 300px;
    height: 190px;
    transform: translate(-50%, calc(-50% - 205px));
    z-index: 2;
    pointer-events: none;
  }
  .nk-card {
    position: absolute;
    inset: 0;
    border-radius: 22px;
    box-shadow:
      0 30px 60px -20px rgba(0,0,0,0.55),
      0 10px 30px -8px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.10);
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .nk-face {
    position: absolute;
    inset: 0;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Tier card (back) */
  .nk-c3 {
    background:
      radial-gradient(120% 90% at 110% -10%, rgba(255,255,255,0.06), transparent 60%),
      linear-gradient(150deg, #11221c 0%, #060c0a 100%);
    transform: translate(-30px, 30px) rotate(-9deg) scale(.94);
    opacity: .9;
    animation: nk-floatA 7s ease-in-out infinite;
  }
  .nk-tier-badge {
    align-self: flex-start;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: #e8c87a;
    background: rgba(232,200,122,0.10);
    border: 1px solid rgba(232,200,122,0.35);
  }
  .nk-tier-name {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #e8c87a;
    line-height: 1;
  }
  .nk-tier-meta {
    font-size: 9.5px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
  }

  /* Coupon card (middle) */
  .nk-c2 {
    background:
      radial-gradient(120% 90% at -10% 0%, rgba(255,255,255,0.10), transparent 55%),
      linear-gradient(140deg, #16855F 0%, #0c5a40 100%);
    transform: translate(20px, 14px) rotate(6deg);
    opacity: .96;
    animation: nk-floatB 8s ease-in-out infinite;
  }
  .nk-c2::before, .nk-c2::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #0c1714;
    transform: translateY(-50%);
  }
  .nk-c2::before { left: -7px; }
  .nk-c2::after { right: -7px; }
  .nk-perf {
    position: absolute;
    left: 14px; right: 14px; top: 50%;
    border-top: 1.5px dashed rgba(255,255,255,0.28);
    transform: translateY(-50%);
  }
  .nk-coupon-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .nk-coupon-pct {
    font-size: 38px;
    font-weight: 600;
    letter-spacing: -0.04em;
    color: #fff;
    line-height: 1;
  }
  .nk-sym { font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.75); margin-left: 2px; vertical-align: top; }
  .nk-coupon-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
  .nk-label { font-size: 9px; font-weight: 500; letter-spacing: .06em; color: rgba(255,255,255,0.65); }

  /* Stamp card (front) */
  .nk-c1 {
    background:
      radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.18), transparent 55%),
      linear-gradient(140deg, #22B889 0%, #16855F 55%, #0F6B4D 100%);
    transform: translate(-4px, -10px) rotate(-2deg);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 30px 60px -18px rgba(0,0,0,0.55),
      0 10px 30px -6px rgba(8,40,28,0.5),
      inset 0 1px 0 rgba(255,255,255,0.22);
    animation: nk-floatC 6.5s ease-in-out infinite;
  }
  .nk-c1 .nk-face { padding: 16px 18px; }
  .nk-stamp-head { display: flex; justify-content: space-between; align-items: center; }
  .nk-stamp-brand {
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nk-gdot {
    width: 6px; height: 6px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.18);
  }
  .nk-stamp-label {
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
  }
  .nk-stamps {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px 8px;
  }
  .nk-stamp {
    aspect-ratio: 1;
    border-radius: 999px;
    border: 1.4px dashed rgba(255,255,255,0.32);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.02);
  }
  .nk-stamp.nk-on {
    border: none;
    background: linear-gradient(150deg,#FBF6E8 0%,#EAD9B0 100%);
    color: #0e4a36;
    box-shadow:
      0 2px 5px -1px rgba(0,0,0,0.25),
      inset 0 1px 0 rgba(255,255,255,0.7),
      inset 0 -1px 0 rgba(140,100,40,0.15);
  }
  .nk-stamp svg { width: 55%; height: 55%; display: block; }
  .nk-stamp.nk-reward {
    border: 1.4px dashed rgba(251,246,232,0.85);
    background: rgba(251,246,232,0.06);
    color: #FBF6E8;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: .10em;
    text-transform: uppercase;
  }
  .nk-stamp-foot { display: flex; justify-content: flex-start; align-items: center; }
  .nk-stamp-count {
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #fff;
  }
  .nk-stamp-count em { font-style: normal; color: rgba(255,255,255,0.55); font-weight: 500; }
  .nk-c1::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg,
      transparent 30%,
      rgba(255,255,255,0.0) 42%,
      rgba(255,255,255,0.55) 50%,
      rgba(255,255,255,0.0) 58%,
      transparent 70%);
    transform: translateX(-100%);
    animation: nk-shimmer 4.2s ease-in-out infinite;
    animation-delay: 1.2s;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  @keyframes nk-floatA {
    0%,100%{transform:translate(-30px,30px) rotate(-9deg) scale(.94)}
    50%{transform:translate(-34px,24px) rotate(-10deg) scale(.94)}
  }
  @keyframes nk-floatB {
    0%,100%{transform:translate(20px,14px) rotate(6deg)}
    50%{transform:translate(24px,20px) rotate(7deg)}
  }
  @keyframes nk-floatC {
    0%,100%{transform:translate(-4px,-10px) rotate(-2deg)}
    50%{transform:translate(-2px,-16px) rotate(-1.6deg)}
  }
  @keyframes nk-shimmer {
    0%{transform:translateX(-100%)}
    55%{transform:translateX(100%)}
    100%{transform:translateX(100%)}
  }

  /* Stage */
  .nk-stage {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    transform: translateY(-105px);
  }
  .nk-markwrap {
    position: relative;
    width: 84px; height: 84px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: nk-breathe 3.2s ease-in-out infinite;
  }
  @keyframes nk-breathe {
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.045)}
  }
  .nk-mark {
    width: 84px; height: 84px;
    border-radius: 25px;
    background: linear-gradient(140deg, #1D9E75 0%, #16855F 100%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.22),
      0 14px 40px -10px rgba(29,158,117,0.55),
      0 4px 14px -2px rgba(8,80,65,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .nk-ripple {
    position: absolute;
    left: 71.875%; top: 29.6875%;
    width: 14px; height: 14px;
    border-radius: 999px;
    transform: translate(-50%,-50%);
    border: 1.5px solid rgba(255,255,255,0.7);
    opacity: 0;
    pointer-events: none;
  }
  .nk-r1 { animation: nk-ripple 2.4s cubic-bezier(.2,.7,.2,1) infinite; }
  .nk-r2 { animation: nk-ripple 2.4s cubic-bezier(.2,.7,.2,1) infinite; animation-delay: 0.8s; }
  @keyframes nk-ripple {
    0%{transform:translate(-50%,-50%) scale(0.6);opacity:.9}
    70%{opacity:0}
    100%{transform:translate(-50%,-50%) scale(3.6);opacity:0}
  }
  .nk-word {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    opacity: 0;
    animation: nk-rise .9s cubic-bezier(.2,.7,.2,1) .15s forwards;
  }
  @keyframes nk-rise {
    from{opacity:0;transform:translateY(8px)}
    to{opacity:1;transform:translateY(0)}
  }
  .nk-lockup {
    font-size: 30px;
    font-weight: 600;
    letter-spacing: -0.045em;
    color: #fff;
    display: flex;
    align-items: baseline;
    gap: 9px;
    font-feature-settings: "ss02" on;
  }
  .nk-wallet {
    color: rgba(255,255,255,0.55);
    font-weight: 400;
    letter-spacing: -0.035em;
  }
  .nk-sub {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: .28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.46);
  }

  /* Loader bar */
  .nk-loader {
    position: absolute;
    left: 50%; bottom: 78px;
    transform: translateX(-50%);
    z-index: 3;
  }
  .nk-bar {
    width: 96px; height: 2px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
    position: relative;
  }
  .nk-bar::before {
    content: "";
    position: absolute;
    top: 0; bottom: 0;
    width: 40%;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent 0%, #22B889 50%, transparent 100%);
    animation: nk-slide 1.6s ease-in-out infinite;
  }
  @keyframes nk-slide {
    0%{left:-40%}
    100%{left:100%}
  }

  /* Powered */
  .nk-powered {
    position: absolute;
    left: 50%; bottom: 34px;
    transform: translateX(-50%);
    z-index: 3;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.32);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .nk-powered b {
    color: rgba(255,255,255,0.7);
    font-weight: 600;
    letter-spacing: .04em;
    text-transform: none;
    font-size: 11px;
  }
`;

function NookMark({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: 'block' }}>
      <path
        d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="9.5" r="2" fill="#FFFFFF">
        <animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function StampFace() {
  return (
    <div className="nk-face">
      <div className="nk-stamp-head">
        <div className="nk-stamp-brand">
          <span className="nk-gdot" />
          Your Business Name
        </div>
        <div className="nk-stamp-label">Stamp Reward</div>
      </div>
      <div className="nk-stamps">
        {Array.from({ length: 10 }).map((_, i) => {
          const isReward = i === 9;
          const isOn = i < 7;
          const cls =
            'nk-stamp' + (isOn ? ' nk-on' : '') + (isReward ? ' nk-reward' : '');
          return (
            <div key={i} className={cls}>
              {isReward ? (
                <span>Free</span>
              ) : isOn ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="5 12 10 17 19 7" />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="nk-stamp-foot">
        <div className="nk-stamp-count">
          7<em> / 10</em>
        </div>
      </div>
    </div>
  );
}

function CouponFace() {
  return (
    <div className="nk-face" style={{ padding: '18px 22px' }}>
      <div className="nk-perf" aria-hidden="true" />
      <div className="nk-coupon-top">
        <div className="nk-label" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Welcome Coupon
        </div>
        <div className="nk-label" style={{ color: 'rgba(255,255,255,0.55)' }}>
          EXP 12.31
        </div>
      </div>
      <div className="nk-coupon-bottom">
        <div className="nk-coupon-pct">
          20<span className="nk-sym">%</span>
        </div>
        <div
          className="nk-label"
          style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'right', lineHeight: '1.5' }}
        >
          OFF
          <br />
          Any item
        </div>
      </div>
    </div>
  );
}

function TierFace() {
  return (
    <div className="nk-face">
      <div className="nk-tier-badge">Member</div>
      <div>
        <div className="nk-tier-name">Gold</div>
        <div className="nk-tier-meta" style={{ marginTop: 6 }}>
          2,480 pts
        </div>
      </div>
      <div className="nk-tier-meta" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Since 2024
      </div>
    </div>
  );
}

export default function SplashScreen() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');

  useEffect(() => {
    // Match status bar / notch color to splash background on mobile
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const prevColor = metaTheme?.getAttribute('content') ?? null;
    if (metaTheme) metaTheme.setAttribute('content', '#0c1714');

    const t1 = setTimeout(() => setPhase('fade'), 1200);
    const t2 = setTimeout(() => {
      setPhase('gone');
      if (metaTheme && prevColor) metaTheme.setAttribute('content', prevColor);
    }, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (metaTheme && prevColor) metaTheme.setAttribute('content', prevColor);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
      <div
        aria-hidden="true"
        className={'nk-splash' + (phase === 'fade' ? ' nk-splash-out' : '')}
      >
        {/* Floating card stack */}
        <div className="nk-cards">
          <div className="nk-card nk-c3">
            <TierFace />
          </div>
          <div className="nk-card nk-c2">
            <CouponFace />
          </div>
          <div className="nk-card nk-c1">
            <StampFace />
          </div>
        </div>

        {/* Logo + wordmark */}
        <div className="nk-stage">
          <div className="nk-markwrap">
            <div className="nk-mark">
              <NookMark size={84} />
            </div>
            <span className="nk-ripple nk-r1" />
            <span className="nk-ripple nk-r2" />
          </div>
          <div className="nk-word">
            <div className="nk-lockup">
              <span>Nook</span>
              <span className="nk-wallet">Wallet</span>
            </div>
            <div className="nk-sub">Customers, Always Connected</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="nk-loader">
          <div className="nk-bar" />
        </div>

        {/* Footer */}
        <div className="nk-powered">
          Powered by <b>Nook</b>
        </div>
      </div>
    </>
  );
}
