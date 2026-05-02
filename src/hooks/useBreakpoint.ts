'use client';
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [w, setW] = useState(1200);
  useEffect(() => {
    setW(window.innerWidth);
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isPhone   = w < 744;                      // all phones (up to Galaxy S24 Ultra 412px, iPhone Pro Max 430px)
  const isTablet  = w >= 744 && w < 1024;         // iPad mini/Air/Pro portrait
  const isDesktop = w >= 1024;                    // iPad Pro landscape + desktop

  return {
    w,
    isPhone,
    isTablet,
    isDesktop,
    isMobile: isPhone,                            // backward compat: only phones are "mobile"
    isTabletOrSmaller: !isDesktop,                // phones + tablets (use drawer/BottomNav)
  };
}
