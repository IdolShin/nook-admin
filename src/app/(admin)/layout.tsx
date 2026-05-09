'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { decodeToken, canView, ALL_PAGES, type PageKey } from '@/lib/permissions';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import Toast from '@/components/ui/Toast';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Link from 'next/link';
import {
BarChart2, Ticket, QrCode, Settings, X,
ChevronDown, ChevronRight,
} from 'lucide-react';

// âââ More sheet groups ââââââââââââââââââââââââââââââââââââââââ
type MoreItem = { href: string; label: string; icon: React.ElementType; page: PageKey | null };
const MORE_GROUPS_ALL: { label: string; items: MoreItem[] }[] = [
{
label: 'Reports & tools',
items: [
{ href: '/analytics', label: 'Analytics', icon: BarChart2, page: 'analytics' },
{ href: '/coupons', label: 'Coupons', icon: Ticket, page: 'coupons' },
{ href: '/scan', label: 'Staff scanner', icon: QrCode, page: 'scanner' },
],
},
{
label: 'Admin',
items: [
{ href: '/settings', label: 'Settings', icon: Settings, page: null },
],
},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
const pathname = usePathname();
const { isDesktop } = useBreakpoint();
const showDrawer = !isDesktop;
const drawerWidth = 280;

const [drawerOpen, setDrawerOpen] = useState(false);
const [moreOpen, setMoreOpen] = useState(false);
const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Reports & tools': true, 'Admin': true });

const router = useRouter();

// Filter More groups by permissions (same logic as Sidebar)
const decoded = typeof window !== 'undefined' ? decodeToken() : null;
const MORE_GROUPS = MORE_GROUPS_ALL.map((group) => ({
...group,
items: group.items.filter((item) => {
if (item.page === null) return true;
return canView(decoded, item.page);
}),
})).filter((group) => group.items.length > 0);

useEffect(() => {
try {
const token = localStorage.getItem('nook_token');
if (!token) { window.location.replace('/auth'); return; }

const decoded = decodeToken();
if (!decoded) return;
const matched = ALL_PAGES.find((p) => pathname.startsWith(p.href));
if (matched && !canView(decoded, matched.key)) {
const first = ALL_PAGES.find((p) => canView(decoded, p.key));
router.replace(first ? first.href : '/auth');
}
} catch(e) {}
}, [pathname, router]);

useEffect(() => {
const handleKey = (e: KeyboardEvent) => {
if (e.key === 'Escape') { setDrawerOpen(false); setMoreOpen(false); }
};
window.addEventListener('keydown', handleKey);
return () => window.removeEventListener('keydown', handleKey);
}, []);

useEffect(() => {
setDrawerOpen(false);
setMoreOpen(false);
}, [pathname]);

// Lock body scroll when mobile drawer is open.
// We set overflow:hidden on body but do NOT set touchAction:none (that blocks sidebar scroll too).
// The sidebar itself has overscrollBehavior:contain which prevents chain scrolling.
useEffect(() => {
if (showDrawer && drawerOpen) {
document.body.style.overflow = 'hidden';
// Also freeze the main scroll container via a class
document.getElementById('admin-main')?.setAttribute('style', 'overflow:hidden;flex:1;background:#F5F6FA;padding-bottom:' + bottomNavH);
} else {
document.body.style.overflow = '';
document.getElementById('admin-main')?.setAttribute('style', 'overflow:auto;flex:1;background:#F5F6FA;padding-bottom:' + bottomNavH);
}
return () => {
document.body.style.overflow = '';
};
}, [showDrawer, drawerOpen, bottomNavH]);

const bottomNavH = showDrawer ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : '0px';

function toggleGroup(label: string) {
setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
}

return (
<div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
{isDesktop && <Sidebar />}

{showDrawer && drawerOpen && (
<div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)' }} />
)}

{showDrawer && (
<div style={{
position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
transition: 'transform 240ms cubic-bezier(0.4,0,0.2,1)',
boxShadow: drawerOpen ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
}}>
<Sidebar mobileMode onClose={() => setDrawerOpen(false)} drawerWidth={drawerWidth} />
</div>
)}

<div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
<Topbar pathname={pathname} isMobile={showDrawer} onMenuClick={() => setDrawerOpen(true)} />
<main id="admin-main" style={{ flex: 1, overflow: 'auto', background: '#F5F6FA', paddingBottom: bottomNavH }}>
{children}
</main>
</div>

{showDrawer && (
<BottomNav pathname={pathname} onMoreClick={() => setMoreOpen(true)} />
)}

{/* More sheet backdrop */}
{showDrawer && moreOpen && (
<div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)' }} />
)}

{/* More bottom sheet â grouped accordion */}
{showDrawer && (
<div style={{
position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
background: 'white', borderRadius: '16px 16px 0 0',
paddingBottom: 'max(24px, calc(16px + env(safe-area-inset-bottom)))',
transform: moreOpen ? 'translateY(0)' : 'translateY(100%)',
transition: 'transform 240ms cubic-bezier(0.4,0,0.2,1)',
boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
}}>
{/* Handle */}
<div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
<div style={{ width: 36, height: 4, borderRadius: 99, background: '#E0E1E6' }} />
</div>

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px 12px' }}>
<div style={{ fontSize: 16, fontWeight: 600 }}>More</div>
<button onClick={() => setMoreOpen(false)} style={{
border: 0, background: 'transparent', cursor: 'pointer',
display: 'flex', padding: 4, borderRadius: 6,
minHeight: 36, minWidth: 36, alignItems: 'center', justifyContent: 'center',
}}>
<X size={18} color="#5C5F66" />
</button>
</div>

{/* Groups */}
{MORE_GROUPS.map((group) => (
<div key={group.label}>
{/* Group header */}
<button
onClick={() => toggleGroup(group.label)}
style={{
width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
padding: '6px 20px', border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
}}
>
<span style={{ fontSize: 11, fontWeight: 600, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
{group.label}
</span>
{expandedGroups[group.label]
? <ChevronDown size={13} color="#8A8D94" />
: <ChevronRight size={13} color="#8A8D94" />
}
</button>

{/* Group items */}
{expandedGroups[group.label] && (
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '4px 16px 12px' }}>
{group.items.map((item) => {
const Icon = item.icon;
const active = pathname === item.href || pathname.startsWith(item.href);
return (
<Link key={item.href} href={item.href} style={{
display: 'flex', alignItems: 'center', gap: 10,
padding: '14px', borderRadius: 10,
background: active ? '#E8F7F2' : '#F5F6FA',
color: active ? '#085041' : '#1A1A1F',
textDecoration: 'none', fontSize: 14, fontWeight: active ? 500 : 400,
minHeight: 52,
}}>
<Icon size={18} color={active ? '#1D9E75' : '#5C5F66'} />
{item.label}
</Link>
);
})}
</div>
)}
</div>
))}
</div>
)}

<Toast />
</div>
);
}
