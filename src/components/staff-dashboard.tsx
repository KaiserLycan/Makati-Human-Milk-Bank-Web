'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';

export default function StaffDashboard() {
  // Collapsible Sub-menus state
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);

  // Auto-dismiss notification banner state
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);

  // Dynamic Date State
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSidebarNotification(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Format Date: e.g., "Tuesday, May 12, 2026 9:53:00 PM"
    const updateTime = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(date.toLocaleDateString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Prototype Data
  const metrics = {
    totalPhmb: {
      value: '1203mL',
      change: '+16% from last month',
      isPositive: true,
    },
    totalDispensed: {
      value: '103mL',
      change: '+16% from last month',
      isPositive: true,
    },
    buffer: {
      value: '800 ml',
      change: '+30% from yesterday',
      isPositive: true,
    },
    activeDonors: {
      value: '100',
      change: '-1% from last month',
      isPositive: false,
    },
    activeBeneficiaries: {
      value: '67',
      change: '-1% from last month',
      isPositive: false,
    },
  };

  const programsData = [
    { name: 'WI', label: 'Walk-In', value: 380, color: 'bg-red-400' },
    { name: 'MA', label: "MOM's Act (Milk on Move)", value: 480, color: 'bg-cyan-400' },
    { name: 'MW', label: 'Milkyway', value: 760, color: 'bg-yellow-300' },
    { name: 'ST', label: 'SUPSUP Todo', value: 420, color: 'bg-orange-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      
      {/* Sidebar Navigation */}
      <StaffSidebar activeItem="dashboard" />

      {/* Main Workspace Dashboard Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* Top Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0">
          <div>
            <h2 className="text-xl font-sans font-bold text-neutral-900">
              Staff Portal
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 font-sans text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <Link
              href="/work/notification"
              className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200 shrink-0"
              data-testid="header-notification-btn"
              aria-label="View notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full animate-ping" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full" />
            </Link>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Row 1: Large Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total PHMB */}
            <div 
              className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-0.5 duration-200"
              data-testid="metric-total-phmb"
            >
              <div className="space-y-2">
                <p className="text-neutral-500 font-sans font-bold text-sm uppercase tracking-wider">
                  Total PHMB
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-sans font-bold text-neutral-900">
                    {metrics.totalPhmb.value}
                  </span>
                  <span className="text-xs font-sans text-emerald-600 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="size-3" />
                    {metrics.totalPhmb.change.split(' ')[0]}
                  </span>
                </div>
                <p className="text-neutral-400 font-sans text-[11px]">
                  {metrics.totalPhmb.change.split(' ').slice(1).join(' ')}
                </p>
              </div>

              {/* Sparkline decoration */}
              <div className="w-32 h-12 text-brand-teal shrink-0">
                <svg viewBox="0 0 100 30" fill="none" className="w-full h-full stroke-2 stroke-brand-teal">
                  <path d="M0,25 C10,25 15,10 25,12 C35,14 40,28 50,20 C60,12 70,5 80,15 C90,25 95,2 100,5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Total Dispensed */}
            <div 
              className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-0.5 duration-200"
              data-testid="metric-total-dispensed"
            >
              <div className="space-y-2">
                <p className="text-neutral-500 font-sans font-bold text-sm uppercase tracking-wider">
                  Total Dispensed
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-sans font-bold text-neutral-900">
                    {metrics.totalDispensed.value}
                  </span>
                  <span className="text-xs font-sans text-emerald-600 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="size-3" />
                    {metrics.totalDispensed.change.split(' ')[0]}
                  </span>
                </div>
                <p className="text-neutral-400 font-sans text-[11px]">
                  {metrics.totalDispensed.change.split(' ').slice(1).join(' ')}
                </p>
              </div>

              {/* Sparkline decoration */}
              <div className="w-32 h-12 text-cyan-600 shrink-0">
                <svg viewBox="0 0 100 30" fill="none" className="w-full h-full stroke-2 stroke-cyan-500">
                  <path d="M0,20 C10,18 20,28 30,22 C40,16 50,5 60,15 C70,25 80,10 90,8 C95,6 98,2 100,5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Buffer Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4" data-testid="metric-buffer">
              <div>
                <p className="text-neutral-400 font-sans font-semibold text-xs uppercase tracking-wider">
                  Buffer
                </p>
                <p className="text-2xl font-sans font-bold text-neutral-900 mt-1">
                  {metrics.buffer.value}
                </p>
              </div>
              <p className="text-emerald-600 font-sans text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="size-3.5" />
                {metrics.buffer.change}
              </p>
            </div>

            {/* Active Donors Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4" data-testid="metric-donors">
              <div>
                <p className="text-neutral-400 font-sans font-semibold text-xs uppercase tracking-wider">
                  Active Donors
                </p>
                <p className="text-2xl font-sans font-bold text-neutral-900 mt-1">
                  {metrics.activeDonors.value}
                </p>
              </div>
              <p className="text-rose-600 font-sans text-xs font-semibold flex items-center gap-1">
                <TrendingDown className="size-3.5" />
                {metrics.activeDonors.change}
              </p>
            </div>

            {/* Active Beneficiaries Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4" data-testid="metric-beneficiaries">
              <div>
                <p className="text-neutral-400 font-sans font-semibold text-xs uppercase tracking-wider">
                  Active Beneficiaries
                </p>
                <p className="text-2xl font-sans font-bold text-neutral-900 mt-1">
                  {metrics.activeBeneficiaries.value}
                </p>
              </div>
              <p className="text-rose-600 font-sans text-xs font-semibold flex items-center gap-1">
                <TrendingDown className="size-3.5" />
                {metrics.activeBeneficiaries.change}
              </p>
            </div>
          </div>

          {/* Row 3: Collection Charts */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-sans font-bold text-neutral-900" data-testid="collection-title">
                Collection
              </h3>
              <p className="text-neutral-500 font-sans text-sm">
                Breast milk collected per program.
              </p>
            </div>

            {/* Bar Chart Graphics */}
            <div className="relative pt-6">
              
              {/* Chart Grid Lines & Y-axis labels */}
              <div className="space-y-10 relative z-0">
                {[800, 600, 400, 200, 0].map((label) => (
                  <div key={label} className="flex items-center gap-4 text-[#c6c6c7]">
                    <span className="w-8 text-right font-sans text-[10px] font-medium leading-none shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 border-t border-neutral-100 border-dashed" />
                  </div>
                ))}
              </div>

              {/* Dynamic Overlay Bars */}
              <div className="absolute inset-x-0 bottom-3 top-6 left-12 right-0 z-10 flex justify-around items-end px-4">
                {programsData.map((prog) => {
                  // Max range is 800ml. Proportional height is (value / 800) * 100
                  const heightPercent = Math.min((prog.value / 800) * 100, 100);
                  return (
                    <div
                      key={prog.name}
                      className="flex flex-col items-center group relative w-1/5 max-w-[120px]"
                      data-testid={`bar-${prog.name.toLowerCase()}`}
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute top-[-40px] bg-neutral-950 text-white font-sans text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md z-30">
                        {prog.label}: <strong className="font-bold text-brand-teal">{prog.value} ml</strong>
                      </div>

                      {/* Colored bar item */}
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg ${prog.color} transition-all duration-500 hover:opacity-85 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] cursor-pointer`}
                      />

                      {/* X-axis Label */}
                      <span className="mt-2 text-xs font-sans font-bold text-neutral-800 tracking-wider">
                        {prog.name}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
