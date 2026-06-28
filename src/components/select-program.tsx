'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from './ui/navbar';
import Footer from './ui/footer';

export interface SelectProgramProps {
  onSelectDonor?: () => void;
  onSelectBeneficiary?: () => void;
}

export default function SelectProgram({
  onSelectDonor,
  onSelectBeneficiary,
}: SelectProgramProps) {
  const router = useRouter();

  const handleSelectDonor = () => {
    if (onSelectDonor) {
      onSelectDonor();
    } else {
      router.push('/apply/donor');
    }
  };

  const handleSelectBeneficiary = () => {
    if (onSelectBeneficiary) {
      onSelectBeneficiary();
    } else {
      router.push('/apply/beneficiary');
    }
  };
  return (
    <div className="relative min-h-screen bg-white text-neutral-900 flex flex-col justify-between overflow-x-hidden">
      {/* Background Teal Curved Shape */}
      <div 
        className="absolute top-[-270px] left-[-333px] w-[921px] h-[850px] pointer-events-none select-none opacity-95 z-0 hidden md:block"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bg_ellipse.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Floating Header Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Column: Program Selection Cards */}
          <div className="lg:col-span-6 flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl sm:text-4xl font-sans font-bold text-neutral-900 tracking-tight">
                Choose Your Pathway
              </h1>
            </div>

            <div className="flex flex-col gap-6">
              {/* Card 1: Donor Program */}
              <section 
                className="bg-white border border-brand-charcoal rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col justify-between min-h-[280px] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 focus-within:ring-2 focus-within:ring-brand-teal"
                data-testid="donor-card"
              >
                <div className="flex flex-col gap-3">
                  <h2 className="text-xl sm:text-2xl font-sans font-bold text-neutral-900">
                    Donor Program
                  </h2>
                  <p className="text-neutral-600 font-sans text-sm sm:text-[15px] leading-relaxed">
                    To become a donor for the Makati Human Milk Bank, lactating mothers must complete a health history screening and pass fully funded blood tests for transmissible infections like HIV and Hepatitis. Once medically cleared, mothers can donate through specific donation programs.{' '}
                    <Link 
                      href="#about"
                      className="text-brand-teal font-semibold hover:text-brand-teal-dark underline transition-colors"
                    >
                      Learn more.
                    </Link>
                  </p>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSelectDonor}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-semibold text-sm sm:text-base px-8 py-2 rounded-full shadow-[0_4px_12px_rgba(0,175,185,0.2)] hover:shadow-[0_4px_18px_rgba(0,175,185,0.35)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    data-testid="apply-donor-btn"
                  >
                    Apply
                  </button>
                </div>
              </section>

              {/* Card 2: Beneficiary Program */}
              <section 
                className="bg-white border border-brand-charcoal rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 focus-within:ring-2 focus-within:ring-brand-teal"
                data-testid="beneficiary-card"
              >
                <div className="flex flex-col gap-3">
                  <h2 className="text-xl sm:text-2xl font-sans font-bold text-neutral-900">
                    Beneficiary Program
                  </h2>
                  <p className="text-neutral-600 font-sans text-sm sm:text-[15px] leading-relaxed">
                    To qualify as a beneficiary, an infant must have an immediate medical need verified by a doctor's prescription or a medical abstract from a pediatrician. Because pasteurized donor human milk is a limited medical resource, the bank strictly prioritizes distribution to high-risk recipients, including premature newborns, low birth weight babies in the Neonatal Intensive Care Unit (NICU), and infants whose mothers face severe medical barriers to lactation.
                  </p>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSelectBeneficiary}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-semibold text-sm sm:text-base px-8 py-2 rounded-full shadow-[0_4px_12px_rgba(0,175,185,0.2)] hover:shadow-[0_4px_18px_rgba(0,175,185,0.35)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    data-testid="apply-beneficiary-btn"
                  >
                    Apply
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Hero Image Display */}
          <div className="lg:col-span-6 relative w-full h-[400px] sm:h-[500px] lg:h-[650px] rounded-[20px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/select_hero.png"
              alt="A smiling mother lifting up her happy baby, symbolizing the gift of human milk"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-neutral-950/5 pointer-events-none group-hover:bg-neutral-950/0 transition-colors duration-500" />
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
