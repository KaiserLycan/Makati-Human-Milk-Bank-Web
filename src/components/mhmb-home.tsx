import React from 'react';
import Hero from './ui/hero';
import About from './ui/about';
import DonorProgram from './ui/donor-program';
import Beneficiary from './ui/beneficiary';
import Contact from './ui/contact';
import Footer from './ui/footer';

export default function MHMBHome() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 selection:bg-brand-teal/20 selection:text-brand-teal-dark overflow-x-hidden">
      {/* Hero section containing the Navbar */}
      <Hero />

      {/* Main content blocks */}
      <main className="flex-1">
        {/* About section */}
        <About />

        {/* Donor Program section */}
        <DonorProgram />

        {/* Beneficiary section */}
        <Beneficiary />

        {/* Contact section with Map mockup */}
        <Contact />
      </main>

      {/* Footer copyright */}
      <Footer />
    </div>
  );
}
