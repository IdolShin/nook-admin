'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Users, Bell, BarChart2, Settings,
  QrCode, Smartphone, LogIn, HelpCircle, ChevronLeft, ChevronRight, Ticket, X, Globe, Shield,
} from 'lucide-react';
import NookMark from '@/components/NookMark';
import { decodeToken, canView, PageKey } from '@/lib/permissions';

const NAV_ITEMS: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
  { href: '/dashboard',  label: 'Dashboard',          icon: LayoutDashboard, page: 'dashboard' },
  { href: '/cards',      label: 'Loyalty cards',      icon: CreditCard,      page: 'cards' },
  { href: '/coupons',    label: 'Coupons',             icon: Ticket,          page: 'coupons' },
  { href: '/customers',  label: 'Customers',           icon: Users,           page: 'customers' },
  { href: '/push',       label: 'Push notifications', icon: Bell,            page: 'push' },
  { href: '/analytics',  label: 'Analytics',           icon: BarChart2,       page: 'analytics' },
  { href: '/settings',   label: 'Settings',            icon: Settings,        page: 'settings' },
];

const SEC2_ITEMS: { href: string; label: string; icon: React.ElementType; page: PageKey | null }[] = [
  { href: '/scanner',     label: 'Staff scanner',  icon: QrCode,     page: 'scanner' },
  { href: '/permissions', label: 'Permissions',    icon: Shield,     page: null },
  { href: '/register',    label: 'Customer flow',  icon: Smartphone, page: null },
  { href: '/auth',        label: 'Login screen',   icon: LogIn,      page: null },
  { href: '#',            label: 'Help & docs',    icon: HelpCircle, page: null },
];

export default function Sidebar({
  mobileMode,
  onClose,
  drawerWidth = 260,
}: {
  mobileMode?: boolean;
  onClose?: () => void;
  drawerWidth?: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const w = mobileMode ? drawerWidth : (collapsed ? 72 : 240);
  const decoded = typeof window !== 'undefined' ? decodeToken() : null;
  const isSuperadmin = decoded?.is_superadmin ?? false;
  const displayName = decoded?.name ?? 'Admin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const visibleNav = NAV_ITEMS.filter((it) => canView(decoded, it.page));
  const visibleSec2 = SEC2_ITEMS.filter((it) => {
    if (it.page === null) {
      // Permissions page: only show if superadmin or if they have any page_permissions set
      if (it.href === '/permissions') return isSuperadmin || !decoded?.is_staff;
      return true;
    }
    return canView(decoded, it.page);
  });

  return (
    <aside style={{
      width: w, minWidth: w,
      transition: mobileMode ? 'none' : 'width 200ms ease, min-width 200ms ease',
      background: '#FFFFFF',
      borderRight: '1px solid #EBEBEB',
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 14px',
      height: '100vh',
      position: mobileMode ? 'relative' : 'sticky',
      top: 0,
      overflow: 'hidden',
      /* Respect safe area on left edge (landscape iPhone) */
      paddingLeft: mobileMode ? 14 : 'max(14px, calc(14px + env(safe-area-inset-left)))',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 6px 18px',
        borderBottom: '1px solid #F0F0F2',
        justifyContent: collapsed && !mobileMode ? 'center' : 'flex-start',
      }}>
        <NookMark size={30} />
        {(!collapsed || mobileMode) && (
          <div style={{ lineHeight: 1.1, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Nook</div>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>Loyalty platform</div>
          </div>
        )}
        {mobileMode && (
          <button onClick={onClose} style={{
            width: 36, height: 36, border: 0, background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
          }}>
            <X size={16} color="#5C5F66" />
          </button>
        )}
      </div>

      {/* Manage section */}
      {(!collapsed || mobileMode) && (
        <div style={{ padding: '16px 8px 6px', fontSize: 11, fontWeight: 500, color: '#8A8D94', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Manage
        </div>
      )}
      <nav style={{ display: 'grid', gap: 2, marginTop: (collapsed && !mobileMode) ? 16 : 0 }}>
        {visibleNav.map((it) => (
          <NavItem
            key={it.href} {...it}
            active={pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href))}
            collapsed={collapsed && !mobileMode}
          />
        ))}
      </nav>

      {/* More section */}
      {(!collapsed || mobileMode) && (
        <div style={{ padding: '16px 8px 6px', fontSize: 11, fontWeight: 500, color: '#8A8D94', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 18 }}>
          More
        </div>
      )}
      <nav style={{ display: 'grid', gap: 2, marginTop: (collapsed && !mobileMode) ? 12 : 0 }}>
        {visibleSec2.map((it) => (
          <NavItem key={it.href} {...it} active={pathname === it.href} collapsed={collapsed && !mobileMode} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Upgrade card */}
      {(!collapsed || mobileMode) && (
        <div style={{
          margin: '12px 4px 8px', padding: 14,
          background: 'linear-gradient(135deg, #E8F7F2 0%, #D8F0E5 100%)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>Trial · 14 days left</div>
          <div style={{ fontSize: 11, color: '#085041', opacity: 0.75, marginTop: 4, lineHeight: 1.4 }}>
            Unlock unlimited cards & Apple Wallet on Pro.
          </div>
          <button style={{
            marginTop: 10, height: 32, fontSize: 12,
            background: 'white', border: '1px solid #C7E5D7', color: '#085041',
            borderRadius: 8, padding: '0 10px', cursor: 'pointer', fontFamily: 'inherit',
          }}>Upgrade</button>
        </div>
      )}

      {/* Homepage link */}
      <div style={{ borderTop: '1px solid #F0F0F2', margin: '8px 0', paddingTop: 8 }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8,
          color: '#8A8D94', fontSize: 13, textDecoration: 'none',
          transition: 'all 120ms',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <Globe size={16} color="#8A8D94" />
          {(!collapsed || mobileMode) && <span>홈페이지</span>}
        </Link>
      </div>

      {/* User row */}
      <div style={{
        padding: 8, borderRadius: 10,
        border: '1px solid #F0F0F2',
        display: 'flex', alignItems: 'center',
        gap: (collapsed && !mobileMode) ? 0 : 8,
        justifyContent: (collapsed && !mobileMode) ? 'center' : 'flex-start',
        marginTop: 4,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999,
          background: isSuperadmin ? '#1D9E75' : '#1A1A1F', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>{initials}</div>
        {(!collapsed || mobileMode) && (
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>
              {isSuperadmin ? 'Superadmin' : decoded?.is_staff ? (decoded.staff_role ?? 'Staff') : 'Owner'}
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle — desktop only */}
      {!mobileMode && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            marginTop: 8, height: 32,
            border: '1px solid #EBEBEB', borderRadius: 8,
            background: 'transparent', color: '#8A8D94',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 12, transition: 'background 120ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F6FA')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
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
        padding: collapsed ? '9px' : '9px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        background: active ? '#E8F7F2' : 'transparent',
        color: active ? '#085041' : '#5C5F66',
        fontSize: 13, fontWeight: active ? 500 : 400,
        textDecoration: 'none', transition: 'background 120ms',
        /* Ensure 44px touch target height on mobile */
        minHeight: 44,
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
