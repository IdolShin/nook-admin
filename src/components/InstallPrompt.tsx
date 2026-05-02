'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 60,
      background: 'white', borderRadius: 14,
      border: '1px solid #EBEBEB',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: '#1D9E75', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 20, flexShrink: 0,
      }}>n</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Add Nook to your home screen</div>
        <div style={{ fontSize: 12, color: '#5C5F66' }}>Quick access to your loyalty dashboard</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => setVisible(false)} style={{
          height: 32, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8,
          background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
        }}>Not now</button>
        <button onClick={handleInstall} style={{
          height: 32, padding: '0 12px', border: 0, borderRadius: 8,
          background: '#1D9E75', color: 'white',
          cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        }}>Install</button>
      </div>
    </div>
  );
}
