import React from 'react';
import { Droplet } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-neutral-100 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Copyright text */}
        <p className="font-sans text-[14px] text-neutral-500 text-center sm:text-left">
          Copyright &copy; {currentYear}; By Why We Clash
        </p>

        {/* Small Logo / Branding */}
        <div className="flex items-center gap-2">
          <div className="bg-brand-teal p-1.5 rounded-full text-white">
            <Droplet className="size-4 fill-white" />
          </div>
          <span className="font-sans font-bold text-sm text-neutral-800 tracking-tight">
            MHMB
          </span>
        </div>
      </div>
    </footer>
  );
}
