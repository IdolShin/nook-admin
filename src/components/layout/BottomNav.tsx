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
      height: 'calc(60px + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'white',
      borderTop: '1px solid #EBEBEB',
      display: 'flex',
    }}>
      {items.map((item) => {
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
