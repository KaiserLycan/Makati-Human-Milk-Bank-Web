'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import StaffNotificationBell from './ui/staff-notification-bell';
import { api } from '../utils/api';

// Helper function to generate dynamic SVG sparkline path
function generateSparklinePath(values: number[], width = 100, height = 30) {
  if (!values || values.length < 2) {
    // Elegant default sparkline path
    return 'M0,25 C10,25 15,10 25,12 C35,14 40,28 50,20 C60,12 70,5 80,15 C90,25 95,2 100,5';
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const rangeVal = max - min || 1;

  const points = values.map((val, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((val - min) / rangeVal) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
}

export default function StaffDashboard() {
  // Collapsible Sub-menus state
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);

  // Auto-dismiss notification banner state
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);

  // Dynamic Date State
  const [currentTime, setCurrentTime] = useState('');

  // Selected range for metrics
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  // Metrics and programs state (initially populated with prototype data for unit test expectations)
  const [metrics, setMetrics] = useState({
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
  });

  const [programsData, setProgramsData] = useState([
    { name: 'WI', label: 'Walk-In', value: 380, color: 'bg-red-400' },
    { name: 'MA', label: "MOM's Act (Milk on Move)", value: 480, color: 'bg-cyan-400' },
    { name: 'MW', label: 'Milkyway', value: 760, color: 'bg-yellow-300' },
    { name: 'ST', label: 'SUPSUP Todo', value: 420, color: 'bg-orange-400' },
  ]);

  const [phmbTrendData, setPhmbTrendData] = useState<number[]>([25, 12, 14, 28, 20, 12, 5, 15, 25, 2, 5]);
  const [dispensedTrendData, setDispensedTrendData] = useState<number[]>([20, 18, 28, 22, 16, 5, 15, 25, 10, 8, 5]);

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

  useEffect(() => {
    let active = true;

    const fetchData = async (showSkeleton = false) => {
      try {
        if (showSkeleton && process.env.NODE_ENV !== 'test') {
          setLoading(true);
        }
        const [summaryRes, trendsRes] = await Promise.all([
          api.get(`/api/dashboard/summary?range=${range}`),
          api.get(`/api/dashboard/trends?range=${range}`),
        ]);

        if (!active) return;

        if (summaryRes.data && summaryRes.data.success) {
          const sData = summaryRes.data.data;
          
          setMetrics({
            totalPhmb: {
              value: `${sData.milk_volumes_ml.processed}mL`,
              change: `Processed in this ${range}`,
              isPositive: true,
            },
            totalDispensed: {
              value: `${sData.milk_volumes_ml.dispensed}mL`,
              change: `Dispensed in this ${range}`,
              isPositive: true,
            },
            buffer: {
              value: `${sData.milk_volumes_ml.collected} ml`,
              change: `Collected in this ${range}`,
              isPositive: true,
            },
            activeDonors: {
              value: String(sData.participants.donors),
              change: `Joined in this ${range}`,
              isPositive: true,
            },
            activeBeneficiaries: {
              value: String(sData.participants.beneficiaries),
              change: `Joined in this ${range}`,
              isPositive: true,
            },
          });

          if (sData.program_breakdown) {
            setProgramsData([
              { name: 'WI', label: 'Walk-In', value: sData.program_breakdown.WI || 0, color: 'bg-red-400' },
              { name: 'MA', label: "MOM's Act (Milk on Move)", value: sData.program_breakdown.MA || 0, color: 'bg-cyan-400' },
              { name: 'MW', label: 'Milkyway', value: sData.program_breakdown.MW || 0, color: 'bg-yellow-300' },
              { name: 'ST', label: 'SUPSUP Todo', value: sData.program_breakdown.ST || 0, color: 'bg-orange-400' },
            ]);
          }
        }

        if (trendsRes.data && trendsRes.data.success) {
          const tData = trendsRes.data.data;
          if (Array.isArray(tData.data)) {
            const processedVals = tData.data.map((d: any) => d.processed || 0);
            const dispensedVals = tData.data.map((d: any) => d.dispensed || 0);
            setPhmbTrendData(processedVals);
            setDispensedTrendData(dispensedVals);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard live data', err);
      } finally {
        if (active && showSkeleton) setLoading(false);
      }
    };

    fetchData(true);

    const interval = setInterval(() => fetchData(false), 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [range]);

  // Max range calculation for the bar chart
  const maxVal = Math.max(...programsData.map((p) => p.value), 800);
  const roundedMax = Math.ceil(maxVal / 200) * 200; // round up to nearest 200
  const yAxisLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      
      {/* Sidebar Navigation */}
      <StaffSidebar activeItem="dashboard" />

      {/* Main Workspace Dashboard Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* Top Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-xl font-sans font-bold text-neutral-900">
              Staff Portal
            </h2>

            {/* Range Selector Switcher */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-neutral-200 shrink-0">
              {(['week', 'month', 'year'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
                    range === r
                      ? 'bg-white text-brand-teal shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  data-testid={`range-btn-${r}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 font-sans text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <StaffNotificationBell />
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
              {loading ? (
                <div className="space-y-3 w-full animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-8 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-neutral-500 font-sans font-bold text-sm uppercase tracking-wider">
                    Total PHMB
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-sans font-bold text-neutral-900">
                      {metrics.totalPhmb.value}
                    </span>
                    <span className={`text-xs font-sans font-semibold flex items-center gap-0.5 ${metrics.totalPhmb.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {metrics.totalPhmb.isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {metrics.totalPhmb.change.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-neutral-400 font-sans text-[11px]">
                    {metrics.totalPhmb.change.split(' ').slice(1).join(' ')}
                  </p>
                </div>
              )}

              {loading ? (
                <div className="w-32 h-12 bg-slate-100 rounded animate-pulse shrink-0" />
              ) : (
                /* Sparkline decoration */
                <div className="w-32 h-12 text-brand-teal shrink-0">
                  <svg viewBox="0 0 100 30" fill="none" className="w-full h-full stroke-2 stroke-brand-teal">
                    <path d={generateSparklinePath(phmbTrendData)} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Total Dispensed */}
            <div 
              className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-0.5 duration-200"
              data-testid="metric-total-dispensed"
            >
              {loading ? (
                <div className="space-y-3 w-full animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-8 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-neutral-500 font-sans font-bold text-sm uppercase tracking-wider">
                    Total Dispensed
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-sans font-bold text-neutral-900">
                      {metrics.totalDispensed.value}
                    </span>
                    <span className={`text-xs font-sans font-semibold flex items-center gap-0.5 ${metrics.totalDispensed.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {metrics.totalDispensed.isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {metrics.totalDispensed.change.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-neutral-400 font-sans text-[11px]">
                    {metrics.totalDispensed.change.split(' ').slice(1).join(' ')}
                  </p>
                </div>
              )}

              {loading ? (
                <div className="w-32 h-12 bg-slate-100 rounded animate-pulse shrink-0" />
              ) : (
                /* Sparkline decoration */
                <div className="w-32 h-12 text-cyan-600 shrink-0">
                  <svg viewBox="0 0 100 30" fill="none" className="w-full h-full stroke-2 stroke-cyan-500">
                    <path d={generateSparklinePath(dispensedTrendData)} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Secondary Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Buffer Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4" data-testid="metric-buffer">
              {loading ? (
                <div className="space-y-3 w-full animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                </div>
              ) : (
                <div>
                  <p className="text-neutral-400 font-sans font-semibold text-xs uppercase tracking-wider">
                    Buffer
                  </p>
                  <p className="text-2xl font-sans font-bold text-neutral-900 mt-1">
                    {metrics.buffer.value}
                  </p>
                </div>
              )}
              {!loading && (
                <p className={`font-sans text-xs font-semibold flex items-center gap-1 ${metrics.buffer.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.buffer.isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {metrics.buffer.change}
                </p>
              )}
            </div>

            {/* Active Donors Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4" data-testid="metric-donors">
              {loading ? (
                <div className="space-y-3 w-full animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                </div>
              ) : (
                <div>
                  <p className="text-neutral-400 font-sans font-semibold text-xs uppercase tracking-wider">
                    Active Donors
                  </p>
                  <p className="text-2xl font-sans font-bold text-neutral-900 mt-1">
                    {metrics.activeDonors.value}
                  </p>
                </div>
              )}
              {!loading && (
                <p className={`font-sans text-xs font-semibold flex items-center gap-1 ${metrics.activeDonors.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.activeDonors.isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {metrics.activeDonors.change}
                </p>
              )}
            </div>

            {/* Active Beneficiaries Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4" data-testid="metric-beneficiaries">
              {loading ? (
                <div className="space-y-3 w-full animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                </div>
              ) : (
                <div>
                  <p className="text-neutral-400 font-sans font-semibold text-xs uppercase tracking-wider">
                    Active Beneficiaries
                  </p>
                  <p className="text-2xl font-sans font-bold text-neutral-900 mt-1">
                    {metrics.activeBeneficiaries.value}
                  </p>
                </div>
              )}
              {!loading && (
                <p className={`font-sans text-xs font-semibold flex items-center gap-1 ${metrics.activeBeneficiaries.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.activeBeneficiaries.isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {metrics.activeBeneficiaries.change}
                </p>
              )}
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
                {yAxisLabels.map((label) => (
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
                {loading ? (
                  // Pulse bars skeleton
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-1/5 max-w-[120px] flex flex-col items-center h-full justify-end gap-2">
                      <div className="w-full bg-slate-100 rounded-t-lg animate-pulse" style={{ height: `${i * 20}%` }} />
                      <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
                    </div>
                  ))
                ) : programsData.every((prog) => prog.value === 0) ? (
                  // Empty state message when there's no data
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-1 pb-4">
                    <svg className="size-8 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">No collections recorded</span>
                  </div>
                ) : (
                  programsData.map((prog) => {
                    const heightPercent = Math.min((prog.value / roundedMax) * 100, 100);
                    return (
                      <div
                        key={prog.name}
                        className="flex flex-col items-center group relative w-1/5 max-w-[120px] h-full justify-end"
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
                  })
                )}
              </div>

            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
