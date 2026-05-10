'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, Menu, Bell, AlertTriangle, X } from 'lucide-react';
import { businesses } from '@/lib/data';

const PAGE_META: Record<string, { t: string; s: string; cta?: string }> = {
  '/dashboard':  { t: 'Dashboard',          s: "Welcome back, Woosang — here's what's happening across your businesses.", cta: 'New card' },
  '/cards':      { t: 'Loyalty cards',      s: 'Design, manage, and track every card across your businesses.', cta: 'New card' },
  '/coupons':    { t: 'Coupons',            s: 'Create, issue, and track coupon passes for your customers.', cta: 'New coupon' },
  '/customers':  { t: 'Customers',          s: "Everyone who's added one of your cards to their wallet.", cta: 'Add customer' },
  '/push':       { t: 'Push notifications', s: 'Reach customers right inside Apple & Google Wallet.', cta: 'New campaign' },
  '/analytics':  { t: 'Analytics',          s: 'Performance across cards, businesses, and time.', cta: 'Export report' },
  '/settings':   { t: 'Settings',           s: 'Account, billing, and platform configuration.' },
  '/scanner':    { t: 'Staff scanner',      s: "Scan a customer's QR or barcode to add stamps." },
  '/register':   { t: 'How to use',         s: 'Customer onboarding flow and QR setup.' },
};

// Hard-coded alerts (will match integrations in settings)
const ALERTS = [
  { title: 'Apple Wallet not connected', desc: 'Apple Developer account required ($99/yr)', type: 'warning' as const },
  { title: 'Resend not configured', desc: 'Add RESEND_API_KEY to Railway environment', type: 'warning' as const },
  { title: 'Stripe not integrated', desc: 'Subscription billing not yet set up', type: 'info' as const },
  { title: 'Twilio not integrated', desc: 'SMS notifications not yet set up', type: 'info' as const },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const alertCount = ALERTS.length - dismissed.size;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #EBEBEB', borderRadius: 8,
          background: open ? '#F5F6FA' : 'white', cursor: 'pointer',
        }}
      >
        <Bell size={16} color={alertCount > 0 ? '#8C5A11' : '#8A8D94'} />
        {alertCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 17, height: 17, borderRadius: 999,
            background: '#E05050', color: 'white',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{alertCount}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 42, right: 0, zIndex: 10,
            width: 320, background: 'white', borderRadius: 13,
            border: '1px solid #EBEBEB', boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Alerts</span>
              {alertCount === 0 && <span style={{ fontSize: 12, color: '#8A8D94' }}>All clear</span>}
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {ALERTS.map((a, i) => dismissed.has(i) ? null : (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: i > 0 ? '1px solid #F5F5F5' : 'none', alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} color={a.type === 'warning' ? '#8C5A11' : '#8A8D94'} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 1 }}>{a.desc}</div>
                  </div>
                  <button onClick={() => setDismissed((prev) => new Set([...prev, i]))} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, color: '#8A8D94', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              {alertCount === 0 && (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>No active alerts</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Topbar({
  pathname,
  isMobile,
  onMenuClick,
}: {
  pathname: string;
  isMobile?: boolean;
  onMenuClick?: () => void;
}) {
  const [bizOpen, setBizOpen] = useState(false);
  const [bizId, setBizId] = useState('all');
  const [range, setRange] = useState('30d');
  const head = PAGE_META[pathname] ?? PAGE_META['/dashboard'];
  const current = businesses.find((b) => b.id === bizId) ?? businesses[0];

  if (isMobile) {
    return (
      <header style={{
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(52px + env(safe-area-inset-top, 0px))',
        gap: 10,
        borderBottom: '1px solid rgba(235,235,235,0.8)',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onMenuClick} style={{
          border: 0, background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        }}>
          <Menu size={20} color="#1A1A1F" />
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{head.t}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <NotificationBell />
          {head.cta ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('nook:cta'))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34,
                background: '#1D9E75', color: 'white',
                border: 0, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
              }}>
              <Plus size={17} />
            </button>
          ) : (
            <div style={{ width: 34 }} />
          )}
        </div>
      </header>
    );
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center',
      padding: '14px 28px', gap: 14,
      borderBottom: '1px solid #EBEBEB',
      background: '#FFFFFF',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.2 }}>{head.t}</div>
        <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 1 }}>{head.s}</div>
      </div>
      <div style={{ flex: 1 }} />

      <div style={{
        height: 34, padding: '0 12px',
        background: '#F0F1F4', borderRadius: 8,
        color: '#8A8D94', minWidth: 220,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Search size={15} />
        <span style={{ fontSize: 13, flex: 1 }}>Search customers, cards…</span>
        <span style={{ fontSize: 11, padding: '1px 5px', border: '1px solid #EBEBEB', borderRadius: 4, color: '#8A8D94', background: 'white' }}>⌘K</span>
      </div>

      <div style={{ position: 'relative' }}>
        <button onClick={() => setBizOpen((o) => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 12px',
          border: '1px solid #EBEBEB', borderRadius: 8,
          background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: current.color, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{current.short}</span>
          <span>{current.name}</span>
          <ChevronDown size={13} color="#8A8D94" />
        </button>
        {bizOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setBizOpen(false)} />
            <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 10, width: 240, padding: 6, background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
              {businesses.map((b) => (
                <button key={b.id} onClick={() => { setBizId(b.id); setBizOpen(false); }} style={{
                  width: '100%', padding: '8px 10px', border: 0, borderRadius: 8,
                  background: bizId === b.id ? '#E8F7F2' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8,
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { if (bizId !== b.id) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
                onMouseLeave={(e) => { if (bizId !== b.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: b.color, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{b.short}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{b.name}</span>
                  {b.id !== 'all' && <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{b.customers}</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
        {(['7d', '30d', '90d', '12m'] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} style={{
            height: 26, padding: '0 10px', border: 0, borderRadius: 7,
            background: range === r ? 'white' : 'transparent',
            color: range === r ? '#1A1A1F' : '#5C5F66',
            fontSize: 12, fontWeight: range === r ? 500 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: range === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 120ms',
          }}>{r}</button>
        ))}
      </div>

      <NotificationBell />

      {head.cta && (
        <button onClick={() => window.dispatchEvent(new CustomEvent('nook:cta'))} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 14px',
          background: '#1D9E75', color: 'white',
          border: 0, borderRadius: 8,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={15} /> {head.cta}
        </button>
      )}
    </header>
  );
}
