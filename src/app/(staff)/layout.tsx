'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // localStorage is only available client-side
    const token = api.getToken();
    if (!token) {
      // Staff pages redirect to scan-login, not the business owner /auth page
      router.replace(`/scan-login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setChecked(true);
    }
  }, [router, pathname]);

  if (!checked) return null; // prevent flash before redirect

  return <>{children}</>;
}
