'use client';

import { useState } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { businesses } from '@/lib/data';

const PAGE_META: Record<string, { t: string; s: string; cta?: string }> = {
  '/dashboard':  { t: 'Dashboard',          s: "Welcome back, Woosang — here's what's happening across your businesses.", cta: 'New card' },
  '/cards':      { t: 'Loyalty cards',      s: 'Design, manage, and track every card across your businesses.', cta: 'New card' },
  '/customers':  { t: 'Customers',          s: "Everyone who's added one of your cards to their wallet.", cta: 'Add customer' },
  '/push':       { t: 'Push notifications', s: 'Reach customers right inside Apple & Google Wallet.', cta: 'New campaign' },
  '/analytics':  { t: 'Analytics',          s: 'Performance across cards, businesses, and time.', cta: 'Export report' },
  '/settings':   { t: 'Settings',           s: 'Account, billing, and platform configuration.' },
  '/scanner':    { t: 'Staff scanner',      s: 'Scan a customer\'s QR or barcode to add stamps.' },
  '/register':   { t: 'Customer flow',      s: 'What customers see when they scan your Nook QR code.' },
  '/auth':       { t: 'Business login',     s: 'What new businesses see when they come to Nook.' },
};

export default function Topbar({ pathname }: { pathname: string }) {
  const [bizOpen, setBizOpen] = useState(false);
  const [bizId, setBizId] = useState('all');
  const [range, setRange] = useState('30d');
  const head = PAGE_META[pathname] ?? PAGE_META['/dashboard'];
  const current = businesses.find((b) => b.id === bizId) ?? businesses[0];

  return (
    <header style={{
      display: 'flex', alignItems: 'center',
      padding: '14px 28px',
      gap: 14,
      borderBottom: '1px solid #EBEBEB',
      background: '#FFFFFF',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Title */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.2 }}>{head.t}</div>
        <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 1 }}>{head.s}</div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        height: 34, padding: '0 12px',
        background: '#F0F1F4', borderRadius: 8,
        color: '#8A8D94', minWidth: 220,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Search size={15} />
        <span style={{ fontSize: 13, flex: 1 }}>Search customers, cards…</span>
        <span style={{
          fontSize: 11, padding: '1px 5px',
          border: '1px solid #EBEBEB', borderRadius: 4,
          color: '#8A8D94', background: 'white',
        }}>⌘K</span>
      </div>

      {/* Business filter */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setBizOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 34, padding: '0 12px',
            border: '1px solid #EBEBEB', borderRadius: 8,
            background: 'white', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit',
          }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: 5,
            background: current.color, color: 'white',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600,
          }}>{current.short}</span>
          <span>{current.name}</span>
          <ChevronDown size={13} color="#8A8D94" />
        </button>
        {bizOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setBizOpen(false)} />
            <div style={{
              position: 'absolute', top: 40, right: 0, zIndex: 10,
              width: 240, padding: 6,
              background: 'white', borderRadius: 13,
              border: '1px solid #EBEBEB',
              boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            }}>
              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setBizId(b.id); setBizOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 10px',
                    border: 0, borderRadius: 8,
                    background: bizId === b.id ? '#E8F7F2' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 8,
                    textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (bizId !== b.id) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
                  onMouseLeave={(e) => { if (bizId !== b.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: b.color, color: 'white',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600,
                  }}>{b.short}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{b.name}</span>
                  {b.id !== 'all' && (
                    <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{b.customers}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Range selector */}
      <div style={{
        display: 'flex', gap: 2,
        background: '#F0F1F4', borderRadius: 9,
        padding: 3,
      }}>
        {(['7d', '30d', '90d', '12m'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              height: 26, padding: '0 10px',
              border: 0, borderRadius: 7,
              background: range === r ? 'white' : 'transparent',
              color: range === r ? '#1A1A1F' : '#5C5F66',
              fontSize: 12, fontWeight: range === r ? 500 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: range === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 120ms',
            }}
          >{r}</button>
        ))}
      </div>

      {/* CTA */}
      {head.cta && (
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 14px',
          background: '#1D9E75', color: 'white',
          border: 0, borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={15} /> {head.cta}
        </button>
      )}
    </header>
  );
}
