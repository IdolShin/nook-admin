'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.replace('/auth?redirect=/scan');
    }
  }, [router]);

  return <>{children}</>;
}
