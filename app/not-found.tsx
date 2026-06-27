'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ChevronLeft } from 'lucide-react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsLoggedIn(localStorage.getItem('mhmb_logged_in') === 'true');
    }
  }, []);

  if (!mounted) return null;

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

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">

          {/* Left Column: Hero Image (hidden on mobile, shown on desktop) */}
          <div className="lg:col-span-6 relative w-full h-[350px] sm:h-[450px] lg:h-[680px] rounded-[20px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.06)] hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/select_hero.png"
              alt="Makati Human Milk Bank Staff Portal"
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-neutral-950/5 pointer-events-none" />
          </div>

          {/* Right Column: 404 Form */}
          <div className="lg:col-span-6 flex flex-col gap-8 w-full max-w-lg mx-auto">
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold text-neutral-950 tracking-tight leading-[1.1]">
                404 - Not Found
              </h1>
              <p className="text-neutral-600 font-sans text-sm sm:text-base leading-relaxed">
                Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or the URL may be incorrect.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href={isLoggedIn ? '/work/dashboard' : '/'}
                className="bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-bold text-base h-[55px] rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,175,185,0.2)] hover:shadow-[0_4px_18px_rgba(0,175,185,0.35)] cursor-pointer text-center"
              >
                <Home className="size-5" />
                {isLoggedIn ? 'Back to Dashboard' : 'Back to Home'}
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="border border-neutral-400 bg-white text-neutral-800 font-sans font-bold text-base h-[55px] rounded-[10px] transition-all flex items-center justify-center gap-2 hover:bg-neutral-50 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="size-5" />
                Go Back
              </button>
            </div>

            <div className="text-center">
              <p className="text-neutral-500 font-sans text-sm">
                If you believe this is a system error, please contact support.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Page Footer */}
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
