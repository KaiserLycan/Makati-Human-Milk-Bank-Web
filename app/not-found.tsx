'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileQuestion, ChevronLeft, Home } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Decorative Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 size-96 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="size-20 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-brand-teal border border-brand-teal/10 shadow-sm animate-bounce">
            <FileQuestion className="size-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700">
              404
            </h1>
            <h2 className="text-xl font-bold text-neutral-900">
              Page Not Found
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Sorry, we couldn’t find the page you’re looking for. It might have been moved or deleted.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <p className="text-xs text-neutral-400 font-medium font-sans">
            Need help finding your way?
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href={isLoggedIn ? '/work/dashboard' : '/'}
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-neutral-900 text-center"
            >
              <Home className="size-3.5" />
              {isLoggedIn ? 'Back to Dashboard' : 'Back to Home'}
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="size-3.5" />
              Go Back
            </button>
          </div>
        </div>

        <div className="text-[10px] text-neutral-400 font-bold font-sans tracking-widest uppercase">
          Makati Human Milk Bank
        </div>
      </div>
    </div>
  );
}
