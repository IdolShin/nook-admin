'use client';

import Link from 'next/link';
import { LayoutDashboard, CreditCard, Users, Bell, MoreHorizontal } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cards',     label: 'Cards',     icon: CreditCard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/push',      label: 'Push',      icon: Bell },
];

export default function BottomNav({ pathname, onMoreClick }: { pathname: string; onMoreClick?: () => void }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      height: 60, background: 'white', borderTop: '1px solid #EBEBEB',
      display: 'flex',
    }}>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            textDecoration: 'none',
            color: active ? '#1D9E75' : '#8A8D94',
          }}>
            <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, fontFamily: 'var(--font-sans)' }}>{item.label}</span>
          </Link>
        );
      })}
      <button onClick={onMoreClick} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        border: 0, background: 'transparent', cursor: 'pointer',
        color: '#8A8D94',
      }}>
        <MoreHorizontal size={21} strokeWidth={1.8} />
        <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)' }}>More</span>
      </button>
    </nav>
  );
}
