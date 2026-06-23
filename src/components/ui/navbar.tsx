'use client';

import React, { useState, ChangeEvent, DragEvent } from 'react';
import Link from 'next/link';
import { Droplet, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4 z-50">
      <nav 
        id="main-navigation"
        className="max-w-7xl mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-neutral-100 px-6 py-3 transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logoClear.png"
              alt="MHMB Logo"
              className="h-9 w-9 rounded-full object-cover transition-transform group-hover:scale-105 duration-300"
            />
            <span className="font-sans font-bold text-lg text-neutral-900 tracking-tight">
              MHMB
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans font-medium text-[15px] text-neutral-600 hover:text-brand-teal transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Apply Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <Link
              id="apply-btn"
              href="/select"
              className="hidden sm:inline-flex items-center justify-center bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-semibold text-[15px] px-6 py-2 rounded-full transition-all duration-200 shadow-[0_4px_12px_rgba(0,175,185,0.2)] hover:shadow-[0_4px_18px_rgba(0,175,185,0.35)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Apply Now
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              className="md:hidden p-2 text-neutral-600 hover:text-brand-teal focus:outline-none transition-colors"
            >
              {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-4 animate-in fade-in duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-sans font-medium text-[16px] text-neutral-700 hover:text-brand-teal px-2 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/select"
              onClick={() => setIsOpen(false)}
              className="w-full text-center bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-semibold text-[15px] py-2.5 rounded-xl transition-colors shadow-[0_4px_12px_rgba(0,175,185,0.2)]"
            >
              Apply Now
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
