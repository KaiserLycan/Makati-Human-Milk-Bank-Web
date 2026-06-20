import React from 'react';
import { Phone, MapPin, Map, ExternalLink } from 'lucide-react';

export default function Contact() {
  const phoneNumbers = [
    "+63 960 446 3974",
    "+63 943 240 4113",
    "(02) 513 65 64",
    "(02) 8701602"
  ];

  const address = "4th floor of Bangkal Primary Health Care Center, 1126 Rodriguez St., corner Del Pilar St., Brgy. Bangkal, Makati City";

  return (
    <section id="contact" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-brand-teal rounded-[40px] shadow-[0_20px_50px_rgba(0,175,185,0.25)] overflow-hidden text-white grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Contact Info */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
            <div>
              <h2 className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide mb-10 relative inline-block">
                Contact Us
                <span className="absolute bottom-[-10px] left-0 w-16 h-1.5 bg-white rounded-full" />
              </h2>

              <div className="space-y-8 mt-6">
                {/* Contact Numbers */}
                <div className="flex gap-4">
                  <div className="shrink-0 flex items-center justify-center size-10 rounded-xl bg-white/10 border border-white/20">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-lg mb-2 opacity-95">
                      Contact No.
                    </h3>
                    <ul className="space-y-1.5">
                      {phoneNumbers.map((num) => (
                        <li key={num} className="font-sans text-[15px] opacity-90 hover:opacity-100 transition-opacity">
                          {num}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-4">
                  <div className="shrink-0 flex items-center justify-center size-10 rounded-xl bg-white/10 border border-white/20">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-lg mb-2 opacity-95">
                      Address
                    </h3>
                    <p className="font-sans text-[15px] leading-relaxed opacity-90 max-w-sm">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stylized Map Card */}
          <div className="lg:col-span-6 min-h-[350px] lg:min-h-full bg-slate-100 relative group overflow-hidden">
            {/* Mock Map Background Grid */}
            <div className="absolute inset-0 bg-[#e5e9f0] opacity-90 flex flex-col justify-between p-6">
              
              {/* Fake roads and shapes for map aesthetic */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                {/* Roads */}
                <div className="absolute top-1/3 left-0 right-0 h-8 bg-white rotate-12" />
                <div className="absolute top-0 bottom-0 left-1/4 w-8 bg-white -rotate-45" />
                <div className="absolute top-0 bottom-0 left-2/3 w-10 bg-white rotate-6" />
                {/* Green park mockup */}
                <div className="absolute bottom-10 right-10 size-32 bg-emerald-100 rounded-full blur-xl" />
                {/* River mockup */}
                <div className="absolute top-10 left-10 size-48 bg-sky-100 rounded-full blur-xl" />
              </div>

              {/* Map Floating Actions */}
              <div className="relative z-10 flex justify-between items-start">
                <div className="bg-white/95 backdrop-blur-sm shadow-md rounded-xl p-3 max-w-[200px] border border-neutral-100 text-neutral-800">
                  <h4 className="font-sans font-bold text-[13px] leading-tight text-neutral-900">
                    Bangkal Health Center
                  </h4>
                  <p className="font-sans text-[11px] text-neutral-500 mt-1 leading-normal">
                    4th Floor, Rodriguez St.
                  </p>
                </div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Bangkal Primary Health Care Center Makati")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-md transition-colors"
                >
                  <Map className="size-4" />
                  <span>Open in Maps</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Map Marker Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                {/* Pulse animation circles */}
                <div className="absolute size-12 bg-brand-teal/20 rounded-full animate-ping pointer-events-none" />
                <div className="absolute size-20 bg-brand-teal/10 rounded-full animate-ping pointer-events-none delay-300" />
                
                {/* Visual Pin */}
                <div className="relative z-10 bg-brand-teal border-2 border-white p-2.5 rounded-full shadow-lg text-white">
                  <MapPin className="size-6 fill-white/20" />
                </div>
                {/* Label tail shadow */}
                <div className="w-3 h-3 bg-brand-teal rotate-45 -mt-1.5 shadow-md border-r border-b border-white" />
              </div>

              {/* Scale / Legend mockup */}
              <div className="relative z-10 self-start bg-white/80 backdrop-blur-sm text-neutral-600 text-[10px] px-2 py-1 rounded shadow-sm border border-neutral-100 select-none">
                50 m
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
