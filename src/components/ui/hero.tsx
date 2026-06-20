import React from 'react';
import Navbar from './navbar';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between w-full overflow-hidden bg-neutral-900 text-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero_bg.png"
          alt="Mother and baby smiling"
          className="w-full h-full object-cover object-center opacity-70 scale-105 animate-[subtle-zoom_20s_infinite_alternate]"
        />
        {/* Soft radial overlay to vignette the background and enhance text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-neutral-950/50" />
      </div>

      {/* Navbar overlay */}
      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center text-center py-20">
        <h1 className="font-sans font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6 drop-shadow-md max-w-4xl">
          Makati Human Milk Bank
        </h1>
        <p className="font-sans text-base sm:text-lg md:text-xl text-neutral-200 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
          The Makati Human Milk Bank is a specialized medical facility that collects, pasteurizes, and distributes screened donor human milk to ensure vulnerable infants, premature newborns, and babies in the NICU receive life-saving nutrition when maternal milk is unavailable.
        </p>
      </div>

      {/* Empty bottom element to align content in center */}
      <div className="h-16 relative z-0" />
    </section>
  );
}
