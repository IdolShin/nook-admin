'use client';

import { useEffect, useState } from 'react';
import type { ToastType } from '@/lib/toast';

interface ToastItem { id: number; msg: string; type: ToastType; }

const BG: Record<ToastType, string> = {
  success: '#1D9E75',
  error:   '#C53A6B',
  info:    '#3B6BCC',
};

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type } = (e as CustomEvent<{ msg: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };
    window.addEventListener('nook:toast', handler);
    return () => window.removeEventListener('nook:toast', handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'grid', gap: 8, minWidth: 260, maxWidth: 380 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: '12px 16px', borderRadius: 10,
          background: BG[t.type], color: 'white',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        }} className="fadeup">
          {t.msg}
        </div>
      ))}
    </div>
  );
}
