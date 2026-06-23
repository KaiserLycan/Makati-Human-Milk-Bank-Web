import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <section id="about" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* Left Side: Image container */}
        <div className="lg:col-span-5 relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[40px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/about_mom.png"
            alt="Mother holding infant"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Subtle border overlay inside */}
          <div className="absolute inset-0 border border-neutral-900/5 rounded-[40px] pointer-events-none" />
        </div>

        {/* Right Side: Text details */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-5xl text-neutral-900 uppercase tracking-wide mb-6 relative">
            About
            <span className="absolute bottom-[-10px] left-0 w-16 h-1.5 bg-brand-teal rounded-full" />
          </h2>
          
          <div className="space-y-6 font-sans text-neutral-600 text-[15px] sm:text-[16px] leading-[1.8] mt-4">
            <p>
              The Makati Human Milk Bank (MHMB) is a specialized medical facility dedicated to saving infant lives by providing safe, pasteurized donor human milk to vulnerable newborns. Operating under strict quality control standards, the facility screens lactating mothers, processes donations, and distributes life-saving nutrition to premature infants, low birth weight babies, and newborns in the Neonatal Intensive Care Unit (NICU) who lack access to their own mother&apos;s milk.
            </p>
            <p>
              Through community-driven procurement programs—including MOM&apos;s Act (Milk on Move) home pickups, SUPSUP Todo barangay milk-letting drives, Milkyway hospital collections at the Ospital ng Makati, and standard walk-in donations—MHMB bridges the gap between healthy donor mothers and high-risk infants to ensure no critical baby goes without essential nutrition.
              {' '}
              <Link 
                href="https://www.rappler.com/moveph/59227-makati-human-milk-bank/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-teal hover:text-brand-teal-dark hover:underline underline-offset-4 decoration-solid transition-colors inline-block"
              >
                Learn More.
              </Link>
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}
