'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Users, Bell, BarChart2, Settings,
  QrCode, Smartphone, LogIn, HelpCircle, ChevronLeft, ChevronRight, Ticket,
} from 'lucide-react';
import { businesses } from '@/lib/data';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/cards',      label: 'Loyalty cards',      icon: CreditCard,  count: 12 },
  { href: '/coupons',    label: 'Coupons',             icon: Ticket,      count: 4 },
  { href: '/customers',  label: 'Customers',           icon: Users,       count: 284 },
  { href: '/push',       label: 'Push notifications', icon: Bell },
  { href: '/analytics',  label: 'Analytics',           icon: BarChart2 },
  { href: '/settings',   label: 'Settings',            icon: Settings },
];

const SEC2_ITEMS = [
  { href: '/scanner', label: 'Staff scanner',  icon: QrCode },
  { href: '/register', label: 'Customer flow', icon: Smartphone },
  { href: '/auth',    label: 'Login screen',   icon: LogIn },
  { href: '#',        label: 'Help & docs',    icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const w = collapsed ? 72 : 240;

  return (
    <aside style={{
      width: w,
      minWidth: w,
      transition: 'width 200ms ease, min-width 200ms ease',
      background: '#FFFFFF',
      borderRight: '1px solid #EBEBEB',
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 14px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 6px 18px',
        borderBottom: '1px solid #F0F0F2',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: '#1D9E75', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>n</div>
        {!collapsed && (
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Nook</div>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>Loyalty platform</div>
          </div>
        )}
      </div>

      {/* Manage section */}
      {!collapsed && (
        <div style={{ padding: '16px 8px 6px', fontSize: 11, fontWeight: 500, color: '#8A8D94', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Manage
        </div>
      )}
      <nav style={{ display: 'grid', gap: 2, marginTop: collapsed ? 16 : 0 }}>
        {NAV_ITEMS.map((it) => (
          <NavItem key={it.href} {...it} active={pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href))} collapsed={collapsed} />
        ))}
      </nav>

      {/* More section */}
      {!collapsed && (
        <div style={{ padding: '16px 8px 6px', fontSize: 11, fontWeight: 500, color: '#8A8D94', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 18 }}>
          More
        </div>
      )}
      <nav style={{ display: 'grid', gap: 2, marginTop: collapsed ? 12 : 0 }}>
        {SEC2_ITEMS.map((it) => (
          <NavItem key={it.href} {...it} active={pathname === it.href} collapsed={collapsed} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Upgrade card */}
      {!collapsed && (
        <div style={{
          margin: '12px 4px 8px',
          padding: 14,
          background: 'linear-gradient(135deg, #E8F7F2 0%, #D8F0E5 100%)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>Trial · 14 days left</div>
          <div style={{ fontSize: 11, color: '#085041', opacity: 0.75, marginTop: 4, lineHeight: 1.4 }}>
            Unlock unlimited cards & Apple Wallet on Pro.
          </div>
          <button style={{
            marginTop: 10, height: 28, fontSize: 12,
            background: 'white', border: '1px solid #C7E5D7', color: '#085041',
            borderRadius: 8, padding: '0 10px', cursor: 'pointer', fontFamily: 'inherit',
          }}>Upgrade</button>
        </div>
      )}

      {/* User row */}
      <div style={{
        padding: 8, borderRadius: 10,
        border: '1px solid #F0F0F2',
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 8,
        justifyContent: collapsed ? 'center' : 'flex-start',
        marginTop: 4,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999,
          background: '#1A1A1F', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>WS</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Woosang</div>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>Admin</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          marginTop: 8, height: 28,
          border: '1px solid #EBEBEB', borderRadius: 8,
          background: 'transparent', color: '#8A8D94',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 12,
          transition: 'background 120ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F6FA')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}

function NavItem({
  href, label, icon: Icon, count, active, collapsed,
}: {
  href: string; label: string; icon: React.ElementType; count?: number; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '9px' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        background: active ? '#E8F7F2' : 'transparent',
        color: active ? '#085041' : '#5C5F66',
        fontSize: 13, fontWeight: active ? 500 : 400,
        textDecoration: 'none',
        transition: 'background 120ms',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={17} color={active ? '#1D9E75' : '#5C5F66'} />
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && count != null && (
        <span style={{
          fontSize: 11, fontWeight: 500,
          padding: '1px 6px', borderRadius: 999,
          background: active ? 'white' : '#F0F1F4',
          color: active ? '#085041' : '#5C5F66',
        }}>{count}</span>
      )}
    </Link>
  );
}
