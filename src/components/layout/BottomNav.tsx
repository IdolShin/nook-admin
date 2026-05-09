'use client';

import Link from 'next/link';
import { LayoutDashboard, CreditCard, Users, Bell, MoreHorizontal } from 'lucide-react';
import { decodeToken, canView, PageKey } from '@/lib/permissions';

const ALL_ITEMS: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { href: '/cards',     label: 'Cards',     icon: CreditCard,      page: 'cards' },
  { href: '/customers', label: 'Customers', icon: Users,           page: 'customers' },
  { href: '/push',      label: 'Push',      icon: Bell,            page: 'push' },
];

export default function BottomNav({ pathname, onMoreClick }: { pathname: string; onMoreClick?: () => void }) {
  const decoded = typeof window !== 'undefined' ? decodeToken() : null;
  const items = ALL_ITEMS.filter((it) => canView(decoded, it.page));

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      /* The visible tap area is always 56px; safe-area pushes the bar down on notched phones */
      height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(235,235,235,0.8)',
      display: 'flex',
      /* Prevent iOS rubber-band scroll from revealing content behind the bar */
      boxSizing: 'border-box',
    }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            textDecoration: 'none', minHeight: 44,
            color: active ? '#1D9E75' : '#8A8D94',
          }}>
            <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '-0.01em' }}>{item.label}</span>
          </Link>
        );
      })}
      <button onClick={onMoreClick} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
        border: 0, background: 'transparent', cursor: 'pointer',
        color: '#8A8D94', minHeight: 44,
      }}>
        <MoreHorizontal size={22} strokeWidth={1.7} />
        <span style={{ fontSize: 10, letterSpacing: '-0.01em' }}>More</span>
      </button>
    </nav>
  );
}
