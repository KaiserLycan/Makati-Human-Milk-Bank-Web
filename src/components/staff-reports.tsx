'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileDown,
  FileText,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';

export default function StaffReports() {
  // Collapsible Sub-menus state
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);

  // Auto-dismiss sidebar banner state
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);

  // Dynamic Date State
  const [currentTime, setCurrentTime] = useState('');

  // PDF Viewer States
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSidebarNotification(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
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

  // Action handlers
  const handleZoomOut = () => {
    setZoom((z) => Math.max(80, z - 10));
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(150, z + 10));
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1500);
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      setPrinting(false);
      window.print();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans print:bg-white print:text-black">
      
      {/* Sidebar Navigation - Hidden during printing */}
      {/* Sidebar Navigation - Hidden during printing */}
      <StaffSidebar activeItem="reports" />

      {/* Main Workspace Reports Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen print:overflow-visible print:max-h-none print:p-0">
        
        {/* Top Header - Hidden during printing */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0 print:hidden">
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

        {/* Action feedback overlays */}
        {downloading && (
          <div className="fixed bottom-6 right-6 bg-neutral-900 text-white font-sans text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-xl animate-bounce z-50">
            <FileDown className="size-4 text-brand-teal animate-pulse" />
            <span>Downloading PDF report...</span>
          </div>
        )}

        {/* Workspace Body */}
        <main className="p-8 flex flex-col lg:flex-row gap-6 flex-1 w-full max-w-7xl mx-auto print:p-0">
          
          {/* Document Navigation Sidebar Outline - Hidden during printing */}
          <div className="w-full lg:w-44 flex flex-row lg:flex-col gap-4 shrink-0 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 print:hidden">
            <div className="space-y-1 block shrink-0">
              <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-wider pl-1 hidden lg:block">
                Document Outline
              </h3>
              <p className="text-[11px] text-neutral-500 font-sans pl-1 hidden lg:block">
                Jump to page
              </p>
            </div>

            <div className="flex lg:flex-col gap-3.5 shrink-0">
              {[1, 2, 3].map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setActivePage(pageNum)}
                  className={`flex flex-col items-center p-2.5 bg-white border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-brand-teal/40 hover:shadow transition-all group w-24 lg:w-32 shrink-0 ${
                    activePage === pageNum 
                      ? 'border-brand-teal ring-2 ring-brand-teal/10' 
                      : 'border-neutral-200'
                  }`}
                  data-testid={`outline-page-${pageNum}`}
                >
                  <div className="w-12 h-16 bg-neutral-50 border border-neutral-200 rounded flex items-center justify-center shadow-inner group-hover:bg-neutral-100 transition-colors">
                    <span className="text-xs font-sans font-semibold text-neutral-500">{pageNum}</span>
                  </div>
                  <span className="mt-1.5 text-[10px] font-sans font-bold text-neutral-600">
                    Page {pageNum}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive PDF Viewer Layout */}
          <div className="flex-1 flex flex-col bg-slate-200 rounded-3xl border border-neutral-300 overflow-hidden shadow-inner print:bg-white print:border-none print:shadow-none">
            
            {/* PDF Top Toolbar - Hidden during printing */}
            <div className="bg-neutral-900 text-neutral-300 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 z-10 print:hidden">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-5 text-brand-teal shrink-0" />
                <span className="text-xs sm:text-sm font-sans font-semibold truncate text-neutral-100">
                  mhmb-monthly-report-may-2026.pdf
                </span>
              </div>

              {/* Toolbar Action Groups */}
              <div className="flex items-center gap-6">
                {/* Zoom Controls */}
                <div className="flex items-center bg-neutral-800 rounded-xl px-1 py-0.5 border border-neutral-700/60 shadow-inner">
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700 transition-colors"
                    title="Zoom Out"
                    data-testid="zoom-out-btn"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                  <span className="text-[11px] sm:text-xs font-sans font-bold px-2 w-10 text-center select-none text-neutral-200" data-testid="zoom-val">
                    {zoom}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700 transition-colors"
                    title="Zoom In"
                    data-testid="zoom-in-btn"
                  >
                    <ZoomIn className="size-4" />
                  </button>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center bg-neutral-800 rounded-xl px-1 py-0.5 border border-neutral-700/60 shadow-inner">
                  <button
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-700 transition-colors"
                    title="Previous Page"
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[11px] sm:text-xs font-sans font-bold px-2.5 select-none text-neutral-200" data-testid="page-val">
                    {activePage} / 3
                  </span>
                  <button
                    onClick={() => setActivePage((p) => Math.min(3, p + 1))}
                    disabled={activePage === 3}
                    className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-700 transition-colors"
                    title="Next Page"
                    data-testid="next-page-btn"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* Actions: Rotate, Download, Print */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotate}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700/60 rounded-xl transition-all shadow"
                    title="Rotate 90° Clockwise"
                    data-testid="rotate-btn"
                  >
                    <RotateCw className="size-4" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700/60 rounded-xl transition-all shadow"
                    title="Download Report"
                    data-testid="download-btn"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700/60 rounded-xl transition-all shadow"
                    title="Print Report"
                    data-testid="print-btn"
                  >
                    <Printer className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="flex-1 overflow-auto p-8 sm:p-12 flex justify-center items-start print:p-0 print:overflow-visible">
              
              {/* Document Canvas Sheet */}
              <div 
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
                className="w-full max-w-[620px] aspect-[1/1.414] bg-white rounded-2xl border border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-10 sm:p-12 relative flex flex-col justify-between shrink-0 origin-top transition-all duration-300 print:transform-none print:shadow-none print:border-none print:p-0"
                data-testid="pdf-canvas"
              >
                {/* PDF Content Pages */}
                <div className="flex-1 flex flex-col">
                  {/* Page Header */}
                  <div className="flex justify-between items-start border-b-2 border-neutral-100 pb-4 mb-6">
                    <div>
                      <p className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
                        Makati Human Milk Bank
                      </p>
                      <h4 className="text-[11px] font-sans font-bold text-brand-teal mt-0.5">
                        MHMB Portal Reports System
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-sans font-bold uppercase">
                        CONFIDENTIAL
                      </span>
                    </div>
                  </div>

                  {/* Render Page 1 */}
                  {activePage === 1 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between" data-testid="pdf-page-1">
                      <div className="space-y-4">
                        <h2 className="text-2xl font-sans font-bold text-neutral-800 leading-tight">
                          Makati Human Milk Bank monthly summary report
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans">
                          Report ID: **MHMB-2026-05** | Date: **June 1, 2026** | Prepared by: **Alice May Miller**
                        </p>
                        
                        <hr className="border-neutral-100" />
                        
                        <div className="space-y-2">
                          <h3 className="text-xs font-sans font-bold text-neutral-700 uppercase tracking-wider">
                            1. Executive Summary
                          </h3>
                          <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                            During the month of May 2026, the Makati Human Milk Bank (MHMB) experienced significant donation growth across walk-in donor centers and Milkyway community programs. Total pasteurized donor human milk (PDHM) stock levels reached 1,203 mL, marking a positive +16% month-over-month increase. Clinical distribution audits confirm a total of 103 mL dispensed to neonatal intensive care units (NICUs).
                          </p>
                        </div>

                        <div className="space-y-3.5 pt-2">
                          <h3 className="text-xs font-sans font-bold text-neutral-700 uppercase tracking-wider">
                            2. Core Portal Metrics
                          </h3>
                          <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left font-sans text-[10px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase">
                                  <th className="px-4 py-2">Metric description</th>
                                  <th className="px-4 py-2 text-right">Value</th>
                                  <th className="px-4 py-2 text-right">MoM change</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 text-neutral-600 font-medium">
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">Total PHMB In Stock</td>
                                  <td className="px-4 py-2 text-right">1,203 mL</td>
                                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">+16.0%</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">Total PDHM Dispensed</td>
                                  <td className="px-4 py-2 text-right">103 mL</td>
                                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">+16.0%</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">Active Milk Donors</td>
                                  <td className="px-4 py-2 text-right">100</td>
                                  <td className="px-4 py-2 text-right text-rose-600 font-bold">-1.0%</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">Active Beneficiaries</td>
                                  <td className="px-4 py-2 text-right">67</td>
                                  <td className="px-4 py-2 text-right text-rose-600 font-bold">-1.0%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Page 2 */}
                  {activePage === 2 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between" data-testid="pdf-page-2">
                      <div className="space-y-4">
                        <h2 className="text-xl font-sans font-bold text-neutral-800 leading-tight">
                          3. Collection Program Analytics
                        </h2>
                        <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                          Collection metrics are compiled and audited weekly based on the donor sub-programs. Mobile milk banking clinics (MOM's Act outreach and Milkyway community clinics) represented a combined total of **1,240 ml** of pasteurized breast milk collections.
                        </p>

                        <hr className="border-neutral-100" />

                        <div className="space-y-3.5">
                          <h3 className="text-xs font-sans font-bold text-neutral-700 uppercase tracking-wider">
                            Program breakdown
                          </h3>
                          <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left font-sans text-[10px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase">
                                  <th className="px-4 py-2">Program code</th>
                                  <th className="px-4 py-2">Program name</th>
                                  <th className="px-4 py-2 text-right">Collected</th>
                                  <th className="px-4 py-2 text-right">Percentage</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 text-neutral-600 font-medium">
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">WI</td>
                                  <td className="px-4 py-2">Walk-In Center</td>
                                  <td className="px-4 py-2 text-right">380 ml</td>
                                  <td className="px-4 py-2 text-right">18.6%</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">MA</td>
                                  <td className="px-4 py-2">MOM's Act (Milk on Move)</td>
                                  <td className="px-4 py-2 text-right">480 ml</td>
                                  <td className="px-4 py-2 text-right">23.5%</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">MW</td>
                                  <td className="px-4 py-2">Milkyway Program</td>
                                  <td className="px-4 py-2 text-right">760 ml</td>
                                  <td className="px-4 py-2 text-right">37.3%</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 font-bold text-neutral-800">ST</td>
                                  <td className="px-4 py-2">SUPSUP Todo Outreach</td>
                                  <td className="px-4 py-2 text-right">420 ml</td>
                                  <td className="px-4 py-2 text-right">20.6%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <p className="text-[10px] text-neutral-500 font-sans italic leading-relaxed pt-2">
                            Note: Walk-In center collection remains stable, whereas mobile program outreach levels fluctuates based on community integration and milk run scheduling variables.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Page 3 */}
                  {activePage === 3 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between" data-testid="pdf-page-3">
                      <div className="space-y-4">
                        <h2 className="text-xl font-sans font-bold text-neutral-800 leading-tight">
                          4. Quality Screening & Audit Checks
                        </h2>
                        
                        <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                          All milk batches processed in the Makati Human Milk Bank are subject to strict pasteurization logs and biological screening tests to maintain infant safety standards.
                        </p>

                        <hr className="border-neutral-100" />

                        <div className="space-y-3 font-sans">
                          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                            Weekly log checklists
                          </h3>
                          <ul className="space-y-2 text-[10px] text-neutral-600 font-medium">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              <span>Pasteurization Heat Log: **62.5°C for 30 minutes** verified.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              <span>Pre-pasteurization bio-screening tests: Checked.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              <span>Post-pasteurization bacterial cultures: **No growth detected** checks complete.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              <span>Cold Chain Storage Temperature Logs: **-20°C standard** maintained.</span>
                            </li>
                          </ul>
                        </div>

                        {/* Signatures & Seal */}
                        <div className="pt-10 flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[8px] text-neutral-400 font-sans uppercase">
                              Director Certification
                            </p>
                            <p className="text-xs font-sans font-bold text-neutral-800 italic">
                              Alice May Miller
                            </p>
                            <div className="h-0.5 w-24 bg-neutral-200" />
                            <p className="text-[9px] text-neutral-500 font-sans font-semibold">
                              Dr. Alice May Miller (MD, MHMB)
                            </p>
                          </div>

                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-center font-sans font-bold shrink-0">
                            <p className="text-[8px] uppercase tracking-widest text-emerald-600">Clinical Status</p>
                            <p className="text-[10px] leading-tight mt-0.5">VERIFIED</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* Page Footer */}
                <div className="border-t border-neutral-100 pt-4 flex justify-between text-[9px] font-sans text-neutral-400 font-semibold select-none">
                  <span>Makati Human Milk Bank Summary Report</span>
                  <span>Page {activePage} of 3</span>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
