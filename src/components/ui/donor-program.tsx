import React from 'react';
import { Truck, Users, Award, ShieldCheck } from 'lucide-react';

export default function DonorProgram() {
  const programs = [
    {
      title: "MOM's Act (Milk on Move)",
      description: "A mobile service where the milk bank schedules direct pick-ups of expressed breastmilk from the donor's home or workplace, alongside facilitating in-house collection.",
      icon: Truck
    },
    {
      title: "SUPSUP Todo",
      description: "A community-focused milk-letting initiative conducted in partnership with local barangay health centers to gather donations from neighborhood mothers.",
      icon: Users
    },
    {
      title: "Milkyway",
      description: "A structured collection rotation held at the Ospital ng Makati (OsMak) on designated days to gather milk from admitted postpartum mothers and visiting donors.",
      icon: Award
    },
    {
      title: "Normal Walk-in",
      description: "Donors who have been screened and cleared can directly visit the milk bank facility to drop off their frozen breastmilk or express milk on-site.",
      icon: ShieldCheck
    }
  ];

  return (
    <section id="services" className="py-20 bg-brand-teal text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal-dark/30 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-teal-dark/30 rounded-full blur-3xl translate-y-12 -translate-x-12 pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10">
        
        {/* Left Column: Programs list */}
        <div className="lg:col-span-7 flex flex-col justify-center order-2 lg:order-1">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide mb-10 relative">
            Donor Program
            <span className="absolute bottom-[-10px] left-0 w-16 h-1.5 bg-white rounded-full" />
          </h2>

          <div className="space-y-8 mt-4">
            {programs.map((prog) => {
              const Icon = prog.icon;
              return (
                <div key={prog.title} className="flex gap-4 sm:gap-6 group">
                  <div className="shrink-0 flex items-center justify-center size-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-white transition-all duration-300 group-hover:bg-white group-hover:text-brand-teal group-hover:scale-105 shadow-md">
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans font-bold text-lg sm:text-xl text-white mb-2">
                      {prog.title}
                    </h3>
                    <p className="font-sans text-neutral-100 text-[14px] sm:text-[15px] leading-relaxed opacity-90">
                      {prog.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Image */}
        <div className="lg:col-span-5 relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,175,185,0.3)] order-1 lg:order-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/donor_program.png"
            alt="Breastmilk storage"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Subtle frame border */}
          <div className="absolute inset-0 border border-white/10 rounded-[40px] pointer-events-none" />
        </div>

      </div>
    </section>
  );
}
