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
          <div className="lg:col-span-6 min-h-[350px] lg:min-h-full relative group overflow-hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6771.747847353008!2d121.01230045539683!3d14.542769492594635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c93e47013a1d%3A0xfdf679b2727ee9a4!2sBangkal%20Health%20Center%20-%20Makati%20City%20Health%20Department!5e0!3m2!1sen!2sph!4v1782203237969!5m2!1sen!2sph" 
              width="100%" 
              height="100%" 
              style={{ border:0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>

        </div>
      </div>
    </section>
  );
}
