'use client';

// ─── "Turn on notifications" ──────────────────────────────────
// Without a Web Push subscription a customer can never be reached,
// so we ask again wherever they show up — not just at sign-up.
// Renders nothing once they've subscribed, denied, or dismissed.

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
const T = { ink: '#26332C', brand: '#16A377', mint: '#DFF2E9', card: '#FFFFFF', line: '#EDE6D8', sub: '#7A8279', paper: '#FAF6EE' };

type Lang = 'en' | 'ko';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function EnableNotifications({
  uniqueKeys, lang = 'en', onDone,
}: {
  uniqueKeys: string[];
  lang?: Lang;
  onDone?: () => void;
}) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState('');

  const t = (en: string, ko: string) => (lang === 'en' ? en : ko);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!uniqueKeys.length) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;          // can't re-ask
    try { if (localStorage.getItem('nook_push_off') === '1') return; } catch { /* ignore */ }

    // Already subscribed on this device? Then stay quiet.
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) return;
      } catch { /* fall through and offer */ }
      setShow(true);
    })();
  }, [uniqueKeys]);

  async function enable() {
    setBusy(true); setFailed('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setFailed(t('Notifications are blocked in your browser settings.', '브라우저 설정에서 알림이 차단되어 있어요.'));
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await fetch(`${BASE}/api/push/vapid`).then((r) => r.json());
      if (!publicKey) throw new Error('Push is not configured');

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const res = await fetch(`${BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unique_keys: uniqueKeys, subscription: sub }),
      });
      if (!res.ok) throw new Error('Could not save your subscription');

      setShow(false);
      onDone?.();
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Something went wrong');
    }
    setBusy(false);
  }

  function dismiss() {
    setShow(false);
    try { localStorage.setItem('nook_push_off', '1'); } catch { /* ignore */ }
  }

  if (!show) return null;

  return (
    <div style={{
      background: T.card, border: `1.5px solid ${T.brand}`, borderRadius: 22,
      padding: '15px 16px', fontFamily: FONT, marginTop: 14,
      boxShadow: '0 2px 8px rgba(38,51,44,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999, background: T.mint, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={20} color={T.brand} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, fontFamily: DISPLAY }}>
            {t('Get notified about rewards', '리워드 알림 받기')}
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 2, lineHeight: 1.45 }}>
            {t('Know the moment a reward or coupon is ready', '리워드·쿠폰이 준비되면 바로 알려드려요')}
          </div>
        </div>
        <button onClick={enable} disabled={busy} style={{
          padding: '10px 16px', borderRadius: 999, border: 'none', cursor: busy ? 'default' : 'pointer',
          background: busy ? '#9AA5A0' : T.brand, color: 'white', fontSize: 13, fontWeight: 800,
          fontFamily: DISPLAY, flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,119,0.3)',
        }}>
          {busy ? '…' : t('Turn on', '켜기')}
        </button>
      </div>

      {failed && (
        <div style={{ marginTop: 10, background: T.paper, borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#B04141', lineHeight: 1.5 }}>
          {failed}
        </div>
      )}

      <button onClick={dismiss} style={{
        width: '100%', marginTop: 8, padding: 8, border: 'none', background: 'none',
        color: T.sub, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
      }}>
        {t('Not now', '나중에')}
      </button>
    </div>
  );
}
