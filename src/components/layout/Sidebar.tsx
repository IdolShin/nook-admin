'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
LayoutDashboard, CreditCard, Users, Bell, BarChart2, Settings,
QrCode, BookOpen, ChevronLeft, ChevronRight, Ticket, X, Globe, ChevronDown, LogOut,
} from 'lucide-react';
import NookMark from '@/components/NookMark';
import { decodeToken, canView, PageKey } from '@/lib/permissions';

const NAV_ITEMS: { href: string; label: string; icon: React.ElementType; page: PageKey }[] = [
{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
{ href: '/cards', label: 'Loyalty cards', icon: CreditCard, page: 'cards' },
{ href: '/coupons', label: 'Coupons', icon: Ticket, page: 'coupons' },
{ href: '/customers', label: 'Customers', icon: Users, page: 'customers' },
{ href: '/push', label: 'Push notifications', icon: Bell, page: 'push' },
{ href: '/analytics', label: 'Analytics', icon: BarChart2, page: 'analytics' },
{ href: '/settings', label: 'Settings', icon: Settings, page: 'settings' },
];

const SEC2_ITEMS: { href: string; label: string; icon: React.ElementType; page: PageKey | null }[] = [
{ href: '/scan', label: 'Staff scanner', icon: QrCode, page: 'scanner' },
{ href: '/register', label: 'How to use', icon: BookOpen, page: null },
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
const [moreOpen, setMoreOpen] = useState(true);
const w = mobileMode ? drawerWidth : (collapsed ? 72 : 240);
const decoded = typeof window !== 'undefined' ? decodeToken() : null;
const isSuperadmin = decoded?.is_superadmin ?? false;
const displayName = decoded?.name ?? 'Admin';
const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
const visibleNav = NAV_ITEMS.filter((it) => canView(decoded, it.page));
const visibleSec2 = SEC2_ITEMS.filter((it) => {
if (it.page === null) return true;
return canView(decoded, it.page);
});

function handleLogout() {
try { localStorage.removeItem('nook_token'); } catch(e) {}
window.location.replace('/auth');
}

return (
<aside style={{
width: w, minWidth: w,
transition: mobileMode ? 'none' : 'width 200ms ease, min-width 200ms ease',
background: '#FFFFFF',
borderRight: '1px solid #EBEBEB',
display: 'flex', flexDirection: 'column',
boxSizing: 'border-box',
paddingTop: mobileMode ? 'max(18px, calc(env(safe-area-inset-top) + 8px))' : '16px',
paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
paddingLeft: 'max(12px, calc(12px + env(safe-area-inset-left)))',
paddingRight: '12px',
height: mobileMode ? '100%' : '100dvh',
position: mobileMode ? 'relative' : 'sticky',
top: 0,
overflow: 'hidden',
}}>

{/* Logo */}
<div style={{
display: 'flex', alignItems: 'center', gap: 8,
padding: '0 6px 14px',
borderBottom: '1px solid #F0F0F2',
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

{/* Scrollable nav area â overscrollBehavior:contain prevents background from scrolling */}
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column' }}>
{/* Manage section */}
{(!collapsed || mobileMode) && (
<div style={{ padding: '8px 8px 2px', fontSize: 10, fontWeight: 600, color: '#B0B3BB', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
Manage
</div>
)}
<nav style={{ display: 'grid', gap: 0, marginTop: (collapsed && !mobileMode) ? 6 : 0 }}>
{visibleNav.map((it) => (
<NavItem key={it.href} {...it}
active={pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href))}
collapsed={collapsed && !mobileMode}
/>
))}
</nav>

{/* More section */}
{visibleSec2.length > 0 && (
<>
<button
onClick={() => setMoreOpen((o) => !o)}
style={{
display: 'flex', alignItems: 'center', justifyContent: collapsed && !mobileMode ? 'center' : 'space-between',
padding: '8px 8px 2px',
border: 0, background: 'transparent', cursor: 'pointer',
width: '100%', marginTop: 2,
}}
>
{(!collapsed || mobileMode) && (
<>
<span style={{ fontSize: 10, fontWeight: 600, color: '#B0B3BB', letterSpacing: '0.06em', textTransform: 'uppercase' }}>More</span>
<ChevronDown size={12} color="#B0B3BB" style={{ transform: moreOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 180ms' }} />
</>
)}
{collapsed && !mobileMode && (
<div style={{ width: 4, height: 4, borderRadius: 999, background: '#EBEBEB' }} />
)}
</button>

{(moreOpen || (collapsed && !mobileMode)) && (
<nav style={{ display: 'grid', gap: 0 }}>
{visibleSec2.map((it) => (
<NavItem key={it.href} {...it} active={pathname === it.href || pathname.startsWith(it.href)} collapsed={collapsed && !mobileMode} />
))}
</nav>
)}
</>
)}

<div style={{ flex: 1 }} />
</div>

{/* Homepage link */}
<div style={{ borderTop: '1px solid #F0F0F2', marginTop: 8, paddingTop: 6 }}>
<Link href="/" style={{
display: 'flex', alignItems: 'center', gap: 8,
padding: '7px 10px', borderRadius: 7,
color: '#8A8D94', fontSize: 13, textDecoration: 'none',
transition: 'all 120ms',
}}
onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
>
<Globe size={15} color="#8A8D94" />
{(!collapsed || mobileMode) && <span>ííì´ì§</span>}
</Link>
</div>

{/* User row with logout */}
<div style={{
padding: '6px 8px', borderRadius: 9, border: '1px solid #F0F0F2',
display: 'flex', alignItems: 'center',
gap: (collapsed && !mobileMode) ? 0 : 8,
justifyContent: (collapsed && !mobileMode) ? 'center' : 'flex-start',
marginTop: 4,
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
<button
onClick={handleLogout}
title="ë¡ê·¸ìì"
style={{
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

{/* Collapse toggle â desktop only */}
{!mobileMode && (
<button onClick={() => setCollapsed(!collapsed)} style={{
marginTop: 6, height: 28,
border: '1px solid #EBEBEB', borderRadius: 7,
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

function NavItem({ href, label, icon: Icon, active, collapsed }: {
href: string; label: string; icon: React.ElementType; active: boolean; collapsed: boolean;
}) {
return (
<Link href={href} title={collapsed ? label : undefined} style={{
display: 'flex', alignItems: 'center', gap: 8,
padding: collapsed ? '6px' : '6px 10px',
justifyContent: collapsed ? 'center' : 'flex-start',
borderRadius: 7,
background: active ? '#E8F7F2' : 'transparent',
color: active ? '#085041' : '#5C5F66',
fontSize: 13, fontWeight: active ? 500 : 400,
textDecoration: 'none', transition: 'background 120ms',
minHeight: 34,
}}
onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
>
<Icon size={16} color={active ? '#1D9E75' : '#5C5F66'} />
{!collapsed && <span style={{ flex: 1 }}>{label}</span>}
</Link>
);
}
