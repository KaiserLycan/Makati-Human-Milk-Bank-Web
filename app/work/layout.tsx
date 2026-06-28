'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { ServerCrash, RefreshCw } from 'lucide-react';

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, serverDown } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === '/work' || pathname === '/work/';

  useEffect(() => {
    if (!mounted || isLoading || serverDown) return;

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
  }, [user, isLoading, isLoginPage, router, mounted, pathname, serverDown]);

  if (!mounted) {
    return null;
  }

  // If on login page, render children directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If the backend server is down, show maintenance UI
  if (serverDown) {
    return (
      <div className="relative min-h-screen bg-white text-neutral-900 flex flex-col justify-between overflow-x-hidden">
        {/* Background Teal Curved Shape */}
        <div
          className="absolute top-[-218px] left-[-374px] w-[921px] h-[850px] pointer-events-none select-none opacity-95 z-0 hidden md:block"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/bg_ellipse.svg"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>

        <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex items-center justify-center">
          <div className="flex flex-col gap-8 w-full max-w-lg mx-auto text-center items-center justify-center animate-in fade-in duration-300">
            <div className="size-20 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shadow-sm">
              <ServerCrash className="size-10" />
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold text-neutral-950 tracking-tight leading-[1.1]">
                Server <br /> Unavailable
              </h1>
              <p className="text-neutral-600 font-sans text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                We&apos;re having trouble connecting to the server. This could be due to maintenance or a temporary outage. Please try again shortly.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button
                onClick={() => {
                  setIsRetrying(true);
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }}
                disabled={isRetrying}
                className="bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-bold text-base h-[55px] rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,175,185,0.2)] hover:shadow-[0_4px_18px_rgba(0,175,185,0.35)] cursor-pointer text-center w-full disabled:bg-neutral-300 disabled:shadow-none"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="size-5 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-5" />
                    Try Again
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-neutral-500 font-sans text-sm">
                If this issue persists, please contact the system administrator.
              </p>
            </div>
          </div>
        </main>

        <footer className="w-full bg-white border-t border-neutral-100 py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="font-sans text-sm text-neutral-500">
              Copyright &copy;2026; Designed by Why We Clash
            </p>
          </div>
        </footer>
      </div>
    );
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
