'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === '/work' || pathname === '/work/';

  useEffect(() => {
    if (!mounted || isLoading) return;

    // Check if cookie exists or localStorage has mhmb_logged_in
    const hasToken = typeof document !== 'undefined' && 
      document.cookie.split(';').some(c => c.trim().startsWith('access_token='));
    const hasSession = typeof window !== 'undefined' && 
      localStorage.getItem('mhmb_logged_in') === 'true';

    if (!isLoginPage && !user && !hasToken && !hasSession) {
      router.replace('/work');
      return;
    }

    if (user && user.role === 'staff') {
      const isManagerRoute = pathname.startsWith('/work/users') || pathname.startsWith('/work/audits');
      if (isManagerRoute) {
        router.replace('/work/dashboard');
      }
    }
  }, [user, isLoading, isLoginPage, router, mounted, pathname]);

  if (!mounted) {
    return null;
  }

  // If on login page, render children directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If still checking authentication, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500 text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // If not logged in, prevent rendering children to avoid 401 calls
  const hasToken = typeof document !== 'undefined' && 
    document.cookie.split(';').some(c => c.trim().startsWith('access_token='));
  const hasSession = typeof window !== 'undefined' && 
    localStorage.getItem('mhmb_logged_in') === 'true';

  if (!user && !hasToken && !hasSession) {
    return null;
  }

  return <>{children}</>;
}
