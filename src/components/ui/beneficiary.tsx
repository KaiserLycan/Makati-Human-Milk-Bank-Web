import React from 'react';
import { Heart, Activity, Shield, Clock, Baby } from 'lucide-react';

export default function Beneficiary() {
  const benefits = [
    {
      title: "Reduces the Risk of Necrotizing Enterocolitis (NEC)",
      text: "For premature and low birth weight infants, donor human milk reduces the incidence of NEC, a severe, potentially fatal intestinal disease, by up to 79% compared to feeding with bovine-based formula.",
      icon: Heart
    },
    {
      title: "Accelerates Gastrointestinal Maturation",
      text: "Human milk contains bioactive factors, hormones, and growth factors that help mature the infant's gut lining, improving nutrient absorption and digestion.",
      icon: Activity
    },
    {
      title: "Enhances Immune Protection",
      text: "It delivers essential antibodies (such as IgA), lactoferrin, and lysozymes that help protect high-risk newborns against systemic infections, sepsis, and diarrhea while their immune systems are still developing.",
      icon: Shield
    },
    {
      title: "Shortens Hospital and NICU Stays",
      text: "Infants fed with human milk achieve full enteral feeding (feeding entirely through the gut) faster, leading to quicker weight stabilization and fewer days spent in the Neonatal Intensive Care Unit.",
      icon: Clock
    },
    {
      title: "Improves Long-Term Developmental Outcomes",
      text: "The specific fatty acids and nutrients in human milk support optimal brain development, visual acuity, and long-term cardiovascular health in premature babies.",
      icon: Baby
    }
  ];

  return (
    <section className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* Left Side: Image container */}
        <div className="lg:col-span-5 relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[40px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/beneficiary_baby.png"
            alt="Healthy sleeping baby"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Inner border */}
          <div className="absolute inset-0 border border-neutral-900/5 rounded-[40px] pointer-events-none" />
        </div>

        {/* Right Side: Title and list of benefits */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-5xl text-neutral-900 uppercase tracking-wide mb-6 relative">
            Beneficiary
            <span className="absolute bottom-[-10px] left-0 w-16 h-1.5 bg-brand-teal rounded-full" />
          </h2>

          <p className="font-sans text-neutral-600 text-[15px] sm:text-[16px] leading-[1.8] mt-4 mb-8">
            Pasteurized donor human milk from the Makati Human Milk Bank provides critical medical and developmental benefits to vulnerable infants, serving as a shield against severe complications during their first days of life.
          </p>

          <div className="space-y-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4 group">
                  <div className="shrink-0 flex items-center justify-center size-10 rounded-xl bg-brand-teal/10 text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all duration-300 shadow-sm">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans font-semibold text-[16px] sm:text-[17px] text-neutral-900 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="font-sans text-[14px] sm:text-[15px] text-neutral-500 leading-relaxed">
                      {benefit.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
