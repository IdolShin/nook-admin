'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Users, Bell, Settings,
  QrCode, ChevronLeft, ChevronRight, Ticket, X, LogOut, ExternalLink, Zap, UserPlus, Nfc,
} from 'lucide-react';
import NookMark from '@/components/NookMark';
import { decodeToken, canView, PageKey } from '@/lib/permissions';

const NAV_MAIN: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, page: 'dashboard' },
  { href: '/customers', label: 'Customers',  icon: Users,           page: 'customers' },
];

const NAV_GROWTH: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
  { href: '/tags',    label: 'NFC Stamps',    icon: Nfc,        page: 'cards'   },
  { href: '/cards',   label: 'Loyalty cards', icon: CreditCard, page: 'cards'   },
  { href: '/coupons', label: 'Coupons',       icon: Ticket,     page: 'coupons' },
  { href: '/push',    label: 'Push',          icon: Bell,       page: 'push'    },
];

const NAV_SETTINGS: { href: string; label: string; icon: React.ElementType; page: PageKey | null }[] = [
  { href: '/settings', label: 'Settings',   icon: Settings, page: 'settings' },
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const w = mobileMode ? drawerWidth : (collapsed ? 68 : 240);
  const decoded = typeof window !== 'undefined' ? decodeToken() : null;
  const isSuperadmin = decoded?.is_superadmin ?? false;
  const displayName = decoded?.name ?? 'Admin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const mainItems    = NAV_MAIN.filter(it => canView(decoded, it.page));
  const growthItems  = NAV_GROWTH.filter(it => canView(decoded, it.page));
  const scanVisible  = canView(decoded, 'scanner');
  // Settings page: superadmin only. How to use: everyone.
  const settingItems = NAV_SETTINGS.filter(it => {
    if (it.page === 'settings') return isSuperadmin;
    return it.page === null || canView(decoded, it.page);
  });
  // Compute slug for Customer Sign-up link (same logic as backend nameToSlug)
  const bizSlug = (decoded?.name ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '');
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  function handleLogout() {
    try { localStorage.removeItem('nook_token'); } catch (e) {}
    window.location.replace('/auth');
  }

  const sidebarBg = 'linear-gradient(175deg, #10382B 0%, #0C2C21 100%)';

  return (
    <aside style={{
      width: w, minWidth: w,
      transition: mobileMode ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)',
      background: sidebarBg,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      paddingTop: mobileMode ? 'max(18px, calc(var(--safe-top) + 8px))' : '18px',
      paddingBottom: 'max(16px, var(--safe-bottom))',
      paddingLeft: 'max(14px, calc(14px + var(--safe-left)))',
      paddingRight: '14px',
      height: mobileMode ? '100%' : '100dvh',
      position: mobileMode ? 'relative' : 'sticky',
      top: 0, overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingBottom: 18, marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        justifyContent: collapsed && !mobileMode ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #1D9E75, #085041)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(29,158,117,0.4)',
        }}>
          <NookMark size={18} color="white" />
        </div>
        {(!collapsed || mobileMode) && (
          <div style={{ lineHeight: 1.15, flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#FFFFFF' }}>NOOK</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Loyalty platform</div>
          </div>
        )}
        {mobileMode && (
          <button onClick={onClose} style={{
            width: 30, height: 30, border: 0, background: 'rgba(255,255,255,0.08)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, color: 'rgba(255,255,255,0.6)',
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', paddingTop: 10 }}>

        {mainItems.length > 0 && (
          <>
            <SectionLabel label="Main" collapsed={collapsed && !mobileMode} />
            <nav style={{ display: 'grid', gap: 2 }}>
              {mainItems.map(it => <NavItem key={it.href} {...it} active={isActive(it.href)} collapsed={collapsed && !mobileMode} mobile={mobileMode} />)}
            </nav>
          </>
        )}

        {growthItems.length > 0 && (
          <>
            <SectionLabel label="Growth" collapsed={collapsed && !mobileMode} style={{ marginTop: 14 }} />
            <nav style={{ display: 'grid', gap: 2 }}>
              {growthItems.map(it => <NavItem key={it.href} {...it} active={isActive(it.href)} collapsed={collapsed && !mobileMode} mobile={mobileMode} />)}
            </nav>
          </>
        )}

        {scanVisible && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 4px' }} />
            <NavItem href="/scan" label="Collect" icon={QrCode} page={'scanner' as PageKey} active={isActive('/scan')} collapsed={collapsed && !mobileMode} mobile={mobileMode} accent />
            {bizSlug && (
              <a
                href={`/join/${bizSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                title={collapsed && !mobileMode ? 'Customer Sign-up' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: mobileMode ? 12 : 10,
                  padding: (collapsed && !mobileMode) ? '8px' : mobileMode ? '11px 14px' : '7px 10px',
                  justifyContent: (collapsed && !mobileMode) ? 'center' : 'flex-start',
                  borderRadius: 9,
                  background: 'transparent',
                  borderLeft: !(collapsed && !mobileMode) ? '3px solid transparent' : 'none',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: mobileMode ? 14 : 13, fontWeight: 400,
                  textDecoration: 'none', transition: 'background 120ms, color 120ms',
                  minHeight: mobileMode ? 46 : 34,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.07)',
                }}>
                  <UserPlus size={mobileMode ? 16 : 15} color="rgba(255,255,255,0.5)" />
                </div>
                {!(collapsed && !mobileMode) && (
                  <span style={{ flex: 1 }}>Customer Sign-up</span>
                )}
                {!(collapsed && !mobileMode) && (
                  <ExternalLink size={10} color="rgba(255,255,255,0.3)" />
                )}
              </a>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {settingItems.length > 0 && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 4px' }} />
            <nav style={{ display: 'grid', gap: 2 }}>
              {settingItems.map(it => <NavItem key={it.href} {...it} active={isActive(it.href)} collapsed={collapsed && !mobileMode} mobile={mobileMode} />)}
            </nav>
          </>
        )}
      </div>

      {/* Promo card */}
      {(!collapsed || mobileMode) && (
        <div style={{
          margin: '12px 0 10px',
          padding: '14px 16px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)',
          boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Zap size={14} color="white" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Boost retention</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 10 }}>
            Send a push notification to bring customers back.
          </div>
          <button onClick={() => router.push('/push')} style={{
            width: '100%', height: 28, border: 0,
            background: 'rgba(255,255,255,0.2)',
            color: 'white', borderRadius: 7,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            Send Push
          </button>
        </div>
      )}

      {/* User row */}
      <div style={{
        padding: '8px 10px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center',
        gap: (collapsed && !mobileMode) ? 0 : 8,
        justifyContent: (collapsed && !mobileMode) ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999,
          background: isSuperadmin ? 'linear-gradient(135deg, #1D9E75, #085041)' : 'rgba(255,255,255,0.15)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          boxShadow: isSuperadmin ? '0 2px 8px rgba(29,158,117,0.4)' : 'none',
        }}>{initials}</div>
        {(!collapsed || mobileMode) && (
          <>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {isSuperadmin ? 'Superadmin' : decoded?.is_staff ? (decoded.staff_role ?? 'Staff') : 'Owner'}
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              color: 'rgba(255,255,255,0.4)',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <LogOut size={13} />
            </button>
          </>
        )}
      </div>

      {/* Homepage link */}
      {(!collapsed || mobileMode) && (
        <a href="/" target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', marginTop: 4, borderRadius: 8,
          color: 'rgba(255,255,255,0.35)', fontSize: 11, textDecoration: 'none', transition: 'color 120ms',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
        >
          <ExternalLink size={11} />
          <span>View homepage</span>
        </a>
      )}

      {/* Collapse toggle */}
      {!mobileMode && (
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginTop: 6, height: 28,
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          background: 'transparent', color: 'rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 120ms, color 120ms',
        }}
          onMouseEnter={(e) => { (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); (e.currentTarget.style.color = 'white'); }}
          onMouseLeave={(e) => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = 'rgba(255,255,255,0.35)'); }}
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
    <div style={{
      padding: '4px 10px 2px',
      fontSize: 10, fontWeight: 700,
      color: 'rgba(255,255,255,0.28)',
      letterSpacing: '0.08em', textTransform: 'uppercase', ...style,
    }}>
      {label}
    </div>
  );
}

function NavItem({ href, label, icon: Icon, active, collapsed, mobile, accent }: {
  href: string; label: string; icon: React.ElementType; page?: PageKey | null;
  active: boolean; collapsed: boolean; mobile?: boolean; accent?: boolean;
}) {
  const activeColor = '#1D9E75';
  return (
    <Link href={href} title={collapsed ? label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: mobile ? 12 : 10,
      padding: collapsed ? '8px' : mobile ? '11px 14px' : '7px 10px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 9,
      background: active ? 'rgba(29,158,117,0.18)' : 'transparent',
      borderLeft: !collapsed ? (active ? `3px solid ${activeColor}` : '3px solid transparent') : 'none',
      color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
      fontSize: mobile ? 14 : 13, fontWeight: active ? 600 : 400,
      textDecoration: 'none', transition: 'background 120ms, color 120ms',
      minHeight: mobile ? 46 : 34,
    }}
      onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; } }}
      onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; } }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(29,158,117,0.25)' : 'rgba(255,255,255,0.07)',
      }}>
        <Icon size={mobile ? 16 : 15} color={active ? activeColor : (accent ? activeColor : 'rgba(255,255,255,0.5)')} />
      </div>
      {!collapsed && (
        <span style={{ flex: 1, color: active ? '#FFFFFF' : (accent && !active ? activeColor : undefined) }}>
          {label}
        </span>
      )}
      {active && !collapsed && (
        <div style={{ width: 6, height: 6, borderRadius: 999, background: activeColor, flexShrink: 0 }} />
      )}
    </Link>
  );
}
