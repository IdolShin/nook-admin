'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, QrCode, Ticket, MoreHorizontal } from 'lucide-react';
import { decodeToken, canView } from '@/lib/permissions';

const LEFT_ITEMS = [
  { href: '/dashboard', label: 'Home',      icon: LayoutDashboard, page: 'dashboard' as const },
  { href: '/customers', label: 'Customers', icon: Users,           page: 'customers' as const },
];

const RIGHT_ITEMS = [
  { href: '/coupons', label: 'Coupons', icon: Ticket, page: 'coupons' as const },
];

export default function BottomNav({ pathname, onMoreClick }: { pathname: string; onMoreClick?: () => void }) {
  const decoded = typeof window !== 'undefined' ? decodeToken() : null;
  const leftItems  = LEFT_ITEMS.filter(it => canView(decoded, it.page));
  const rightItems = RIGHT_ITEMS.filter(it => canView(decoded, it.page));
  const scanActive = pathname === '/scan' || pathname.startsWith('/scan/');

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      height: 'calc(60px + var(--safe-bottom))',
      paddingBottom: 'var(--safe-bottom)',
      paddingLeft:  'var(--safe-left)',
      paddingRight: 'var(--safe-right)',
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: '0.5px solid rgba(235,235,235,0.9)',
      display: 'flex', alignItems: 'flex-end',
      boxSizing: 'border-box', overflow: 'visible',
    }}>

      {leftItems.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            textDecoration: 'none', height: 60,
          }}>
            <div style={{
              width: 48, height: 26, borderRadius: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? '#E8F7F2' : 'transparent', transition: 'background 150ms',
            }}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} color={active ? '#1D9E75' : '#9CA3AF'} />
            </div>
            <span style={{ fontSize: 10, letterSpacing: '-0.01em', fontWeight: active ? 600 : 400, color: active ? '#085041' : '#9CA3AF' }}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Center: Scan CTA */}
      <Link href="/scan" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 8, height: 60, textDecoration: 'none',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: scanActive ? '#085041' : '#1D9E75',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: '-26px',
          border: '3px solid rgba(255,255,255,0.97)',
          boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
          flexShrink: 0, transition: 'background 200ms',
        }}>
          <QrCode size={22} color="white" strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: 10, marginTop: 2, letterSpacing: '-0.01em', fontWeight: scanActive ? 600 : 400, color: scanActive ? '#1D9E75' : '#9CA3AF' }}>
          Scan
        </span>
      </Link>

      {rightItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            textDecoration: 'none', height: 60,
          }}>
            <div style={{
              width: 48, height: 26, borderRadius: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? '#E8F7F2' : 'transparent', transition: 'background 150ms',
            }}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} color={active ? '#1D9E75' : '#9CA3AF'} />
            </div>
            <span style={{ fontSize: 10, letterSpacing: '-0.01em', fontWeight: active ? 600 : 400, color: active ? '#085041' : '#9CA3AF' }}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* More */}
      <button onClick={onMoreClick} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        border: 0, background: 'transparent', cursor: 'pointer', height: 60,
      }}>
        <div style={{ width: 48, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={20} strokeWidth={1.7} color="#9CA3AF" />
        </div>
        <span style={{ fontSize: 10, letterSpacing: '-0.01em', color: '#9CA3AF' }}>More</span>
      </button>
    </nav>
  );
}
