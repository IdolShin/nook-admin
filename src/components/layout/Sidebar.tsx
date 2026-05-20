'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Users, Bell, Settings,
  QrCode, BookOpen, ChevronLeft, ChevronRight, Ticket, X, LogOut, ExternalLink,
} from 'lucide-react';
import NookMark from '@/components/NookMark';
import { decodeToken, canView, PageKey } from '@/lib/permissions';

const NAV_MAIN: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, page: 'dashboard' },
  { href: '/customers', label: 'Customers',  icon: Users,           page: 'customers' },
];

const NAV_GROWTH: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
  { href: '/cards',   label: 'Loyalty cards', icon: CreditCard, page: 'cards'   },
  { href: '/coupons', label: 'Coupons',        icon: Ticket,     page: 'coupons' },
  { href: '/push',    label: 'Push',           icon: Bell,       page: 'push'    },
];

const NAV_SETTINGS: { href: string; label: string; icon: React.ElementType; page: PageKey | null }[] = [
  { href: '/settings', label: 'Settings',   icon: Settings, page: 'settings' },
  { href: '/register', label: 'How to use', icon: BookOpen, page: null       },
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
  const mainItems    = NAV_MAIN.filter(it => canView(decoded, it.page));
  const growthItems  = NAV_GROWTH.filter(it => canView(decoded, it.page));
  const scanVisible  = canView(decoded, 'scanner');
  const settingItems = NAV_SETTINGS.filter(it => it.page === null || canView(decoded, it.page));
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  function handleLogout() {
    try { localStorage.removeItem('nook_token'); } catch (e) {}
    window.location.replace('/auth');
  }

  return (
    <aside style={{
      width: w, minWidth: w,
      transition: mobileMode ? 'none' : 'width 200ms ease, min-width 200ms ease',
      background: '#FFFFFF', borderRight: '1px solid #EBEBEB',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      paddingTop: mobileMode ? 'max(18px, calc(env(safe-area-inset-top) + 8px))' : '16px',
      paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
      paddingLeft: 'max(12px, calc(12px + env(safe-area-inset-left)))',
      paddingRight: '12px',
      height: mobileMode ? '100%' : '100dvh',
      position: mobileMode ? 'relative' : 'sticky',
      top: 0, overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 6px 14px', borderBottom: '1px solid #F0F0F2',
        justifyContent: collapsed && !mobileMode ? 'center' : 'flex-start',
      }}>
        <NookMark size={28} />
        {(!collapsed || mobileMode) && (
          <div style={{ lineHeight: 1.1, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Nook</div>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>Loyalty platform</div>
          </div>
        )}
        {mobileMode && (
          <button onClick={onClose} style={{
            width: 32, height: 32, border: 0, background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
          }}>
            <X size={15} color="#5C5F66" />
          </button>
        )}
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
        {mainItems.length > 0 && (
          <>
            <SectionLabel label="Main" collapsed={collapsed && !mobileMode} />
            <nav style={{ display: 'grid', gap: 0 }}>
              {mainItems.map(it => <NavItem key={it.href} {...it} active={isActive(it.href)} collapsed={collapsed && !mobileMode} mobile={mobileMode} />)}
            </nav>
          </>
        )}
        {growthItems.length > 0 && (
          <>
            <SectionLabel label="Growth" collapsed={collapsed && !mobileMode} style={{ marginTop: 10 }} />
            <nav style={{ display: 'grid', gap: 0 }}>
              {growthItems.map(it => <NavItem key={it.href} {...it} active={isActive(it.href)} collapsed={collapsed && !mobileMode} mobile={mobileMode} />)}
            </nav>
          </>
        )}
        {scanVisible && (
          <>
            <div style={{ height: 1, background: '#F0F0F2', margin: '10px 6px' }} />
            <NavItem href="/scan" label="Scanner" icon={QrCode} page={'scanner' as PageKey} active={isActive('/scan')} collapsed={collapsed && !mobileMode} mobile={mobileMode} accent />
          </>
        )}
        <div style={{ flex: 1 }} />
        {settingItems.length > 0 && (
          <>
            <div style={{ height: 1, background: '#F0F0F2', margin: '6px 6px' }} />
            <nav style={{ display: 'grid', gap: 0 }}>
              {settingItems.map(it => <NavItem key={it.href} {...it} active={isActive(it.href)} collapsed={collapsed && !mobileMode} mobile={mobileMode} />)}
            </nav>
          </>
        )}
      </div>

      {/* User row */}
      <div style={{
        padding: '6px 8px', borderRadius: 9, border: '1px solid #F0F0F2',
        display: 'flex', alignItems: 'center',
        gap: (collapsed && !mobileMode) ? 0 : 8,
        justifyContent: (collapsed && !mobileMode) ? 'center' : 'flex-start',
        marginTop: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999,
          background: isSuperadmin ? '#1D9E75' : '#1A1A1F', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, flexShrink: 0,
        }}>{initials}</div>
        {(!collapsed || mobileMode) && (
          <>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>
                {isSuperadmin ? 'Superadmin' : decoded?.is_staff ? (decoded.staff_role ?? 'Staff') : 'Owner'}
              </div>
            </div>
            <button onClick={handleLogout} title="로그아웃" style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6, flexShrink: 0, color: '#8A8D94',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>

      {/* View homepage */}
      {(!collapsed || mobileMode) && (
        <a href="/" target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px', marginTop: 3, borderRadius: 7,
          color: '#8A8D94', fontSize: 11, textDecoration: 'none', transition: 'background 120ms',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <ExternalLink size={12} />
          <span>View homepage</span>
        </a>
      )}

      {/* Collapse toggle */}
      {!mobileMode && (
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginTop: 6, height: 28, border: '1px solid #EBEBEB', borderRadius: 7,
          background: 'transparent', color: '#8A8D94',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 120ms',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F6FA')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      )}
    </aside>
  );
}

function SectionLabel({ label, collapsed, style }: { label: string; collapsed: boolean; style?: React.CSSProperties }) {
  if (collapsed) return null;
  return (
    <div style={{ padding: '4px 8px 2px', fontSize: 10, fontWeight: 600, color: '#B0B3BB', letterSpacing: '0.06em', textTransform: 'uppercase', ...style }}>
      {label}
    </div>
  );
}

function NavItem({ href, label, icon: Icon, active, collapsed, mobile, accent }: {
  href: string; label: string; icon: React.ElementType; page?: PageKey | null;
  active: boolean; collapsed: boolean; mobile?: boolean; accent?: boolean;
}) {
  return (
    <Link href={href} title={collapsed ? label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: mobile ? 10 : 8,
      padding: collapsed ? '6px' : mobile ? '10px 14px' : '6px 10px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 8, background: active ? '#E8F7F2' : 'transparent',
      color: active ? '#085041' : '#5C5F66',
      fontSize: mobile ? 15 : 13, fontWeight: active ? 500 : 400,
      textDecoration: 'none', transition: 'background 120ms', minHeight: mobile ? 46 : 34,
    }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={mobile ? 18 : 16} color={active ? '#1D9E75' : accent ? '#1D9E75' : '#5C5F66'} />
      {!collapsed && <span style={{ flex: 1, color: accent && !active ? '#1D9E75' : undefined }}>{label}</span>}
    </Link>
  );
}
