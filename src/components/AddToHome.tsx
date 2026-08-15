'use client';

// ─── "Add Nook to your home screen" — OS-aware ───────────────
// Android/Chrome: real install prompt (beforeinstallprompt)
// iOS/Safari: Apple gives no API → show the exact 2 steps instead
// Already installed (standalone): renders nothing.

import { useEffect, useState } from 'react';

const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const T = {
  ink: '#26332C', brand: '#16A377', mint: '#DFF2E9',
  card: '#FFFFFF', line: '#EDE6D8', sub: '#7A8279', paper: '#FAF6EE',
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Lang = 'en' | 'ko';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

export default function AddToHome({ lang = 'en', variant = 'card' }: { lang?: Lang; variant?: 'card' | 'banner' }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const t = (en: string, ko: string) => (lang === 'en' ? en : ko);

  useEffect(() => {
    if (isStandalone()) return;                       // already installed
    try { if (localStorage.getItem('nook_a2hs_off') === '1') { setDismissed(true); return; } } catch { /* ignore */ }

    if (isIOS()) { setIos(true); setShow(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferred(null);
  }

  function hide() {
    setShow(false);
    setDismissed(true);
    try { localStorage.setItem('nook_a2hs_off', '1'); } catch { /* ignore */ }
  }

  if (!show || dismissed) return null;

  const wrap: React.CSSProperties = variant === 'banner'
    ? {
        position: 'fixed', left: 14, right: 14,
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        zIndex: 55, maxWidth: 430, margin: '0 auto',
      }
    : { marginTop: 14 };

  return (
    <div style={wrap}>
      <div style={{
        background: T.card, border: `1.5px solid ${T.brand}`, borderRadius: 22,
        padding: '15px 16px', fontFamily: FONT,
        boxShadow: variant === 'banner' ? '0 10px 30px rgba(38,51,44,0.16)' : '0 2px 8px rgba(38,51,44,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999, background: T.mint, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>📲</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, fontFamily: DISPLAY }}>
              {t('Keep Nook on your home screen', '홈 화면에 Nook 추가하기')}
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2, lineHeight: 1.45 }}>
              {t('Opens like an app — no download needed', '앱처럼 열려요 · 다운로드 없이')}
            </div>
          </div>
          {!ios && (
            <button onClick={install} style={{
              padding: '10px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: T.brand, color: 'white', fontSize: 13, fontWeight: 800, fontFamily: DISPLAY,
              flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,119,0.3)',
            }}>
              {t('Add', '추가')}
            </button>
          )}
        </div>

        {ios && (
          <div style={{ marginTop: 12, background: T.paper, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.9 }}>
              <div>
                <b style={{ color: T.ink }}>1.</b>{' '}
                {t('Tap the Share button', '아래쪽 공유 버튼')}{' '}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: 6, background: 'white',
                  border: `1px solid ${T.line}`, fontSize: 12, verticalAlign: 'middle',
                }}>⬆️</span>{' '}
                {t('at the bottom of Safari', '을 누르세요')}
              </div>
              <div>
                <b style={{ color: T.ink }}>2.</b>{' '}
                {t('Choose', '')}
                <b style={{ color: T.ink }}> {t('“Add to Home Screen”', '“홈 화면에 추가”')} </b>
                {t('', '선택')}
              </div>
            </div>
          </div>
        )}

        <button onClick={hide} style={{
          width: '100%', marginTop: 8, padding: 8, border: 'none', background: 'none',
          color: T.sub, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
        }}>
          {t('Not now', '나중에')}
        </button>
      </div>
    </div>
  );
}
