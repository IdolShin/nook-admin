'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import Toast from '@/components/ui/Toast';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Link from 'next/link';
import { BarChart2, Ticket, QrCode, Settings, X } from 'lucide-react';

const MORE_ITEMS = [
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/coupons',   label: 'Coupons',   icon: Ticket },
  { href: '/scanner',   label: 'Scanner',   icon: QrCode },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawerOpen(false); setMoreOpen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close drawer/more on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile drawer backdrop */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 240ms ease',
          boxShadow: drawerOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
        }}>
          <Sidebar mobileMode onClose={() => setDrawerOpen(false)} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          pathname={pathname}
          isMobile={isMobile}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main style={{
          flex: 1, overflow: 'auto', background: '#F5F6FA',
          paddingBottom: isMobile ? 60 : 0,
        }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <BottomNav pathname={pathname} onMoreClick={() => setMoreOpen(true)} />
      )}

      {/* More sheet backdrop */}
      {isMobile && moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }}
        />
      )}

      {/* More bottom sheet */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'white', borderRadius: '16px 16px 0 0',
          padding: '12px 16px 32px',
          transform: moreOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 240ms ease',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>More</div>
            <button onClick={() => setMoreOpen(false)} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', padding: 4 }}>
              <X size={18} color="#5C5F66" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  background: active ? '#E8F7F2' : '#F5F6FA',
                  color: active ? '#085041' : '#1A1A1F',
                  textDecoration: 'none', fontSize: 14, fontWeight: active ? 500 : 400,
                }}>
                  <Icon size={18} color={active ? '#1D9E75' : '#5C5F66'} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
}
