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
import { api } from '../utils/api';

export default function StaffReports() {
  // Collapsible Sub-menus state (retained for layout compatibility)
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);

  // Auto-dismiss sidebar banner state
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);

  // Dynamic Date State
  const [currentTime, setCurrentTime] = useState('');

  // Report type and Range states
  const [reportType, setReportType] = useState<'collection' | 'processing' | 'dispensing'>('collection');
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  // PDF Viewer States
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Fallback and Dynamic Data States

  const defaultCollectionRecords = [
    { date: 'Jun 22, 2026', dtn: 1001, program: 'MW', volume_ml: 760, status: 'GOOD', isGood: true },
    { date: 'Jun 21, 2026', dtn: 1002, program: 'MA', volume_ml: 480, status: 'GOOD', isGood: true },
    { date: 'Jun 20, 2026', dtn: 1003, program: 'ST', volume_ml: 420, status: 'GOOD', isGood: true },
    { date: 'Jun 19, 2026', dtn: 1004, program: 'WI', volume_ml: 380, status: 'WASTE', isGood: false },
    { date: 'Jun 18, 2026', dtn: 1005, program: 'MW', volume_ml: 250, status: 'GOOD', isGood: true },
    { date: 'Jun 17, 2026', dtn: 1006, program: 'MA', volume_ml: 310, status: 'GOOD', isGood: true },
    { date: 'Jun 16, 2026', dtn: 1007, program: 'ST', volume_ml: 150, status: 'WASTE', isGood: false },
    { date: 'Jun 15, 2026', dtn: 1008, program: 'WI', volume_ml: 220, status: 'GOOD', isGood: true },
    { date: 'Jun 14, 2026', dtn: 1009, program: 'MW', volume_ml: 410, status: 'GOOD', isGood: true },
    { date: 'Jun 13, 2026', dtn: 1010, program: 'MA', volume_ml: 290, status: 'GOOD', isGood: true },
    { date: 'Jun 12, 2026', dtn: 1011, program: 'ST', volume_ml: 330, status: 'GOOD', isGood: true },
    { date: 'Jun 11, 2026', dtn: 1012, program: 'WI', volume_ml: 180, status: 'GOOD', isGood: true },
  ];

  const defaultProcessingRecords = [
    { date: 'Jun 22, 2026', batch_number: 1001, btl_id: 2001, volume_ml: 120, mbt_status: 'PASS', mbt_class: 'pass' },
    { date: 'Jun 22, 2026', batch_number: 1001, btl_id: 2002, volume_ml: 120, mbt_status: 'PASS', mbt_class: 'pass' },
    { date: 'Jun 21, 2026', batch_number: 1002, btl_id: 2003, volume_ml: 100, mbt_status: 'FAIL', mbt_class: 'fail' },
    { date: 'Jun 20, 2026', batch_number: 1003, btl_id: 2004, volume_ml: 130, mbt_status: 'PENDING', mbt_class: 'pending' },
    { date: 'Jun 19, 2026', batch_number: 1004, btl_id: 2005, volume_ml: 120, mbt_status: 'PASS', mbt_class: 'pass' },
    { date: 'Jun 18, 2026', batch_number: 1004, btl_id: 2006, volume_ml: 125, mbt_status: 'PASS', mbt_class: 'pass' },
    { date: 'Jun 17, 2026', batch_number: 1005, btl_id: 2007, volume_ml: 110, mbt_status: 'FAIL', mbt_class: 'fail' },
    { date: 'Jun 16, 2026', batch_number: 1006, btl_id: 2008, volume_ml: 140, mbt_status: 'PASS', mbt_class: 'pass' },
    { date: 'Jun 15, 2026', batch_number: 1007, btl_id: 2009, volume_ml: 115, mbt_status: 'PASS', mbt_class: 'pass' },
    { date: 'Jun 14, 2026', batch_number: 1008, btl_id: 2010, volume_ml: 135, mbt_status: 'PENDING', mbt_class: 'pending' },
    { date: 'Jun 13, 2026', batch_number: 1009, btl_id: 2011, volume_ml: 125, mbt_status: 'PASS', mbt_class: 'pass' },
  ];

  const defaultDispensingRecords = [
    { date: 'Jun 22, 2026', btl_id: 2001, batch_number: 1001, volume_ml: 120 },
    { date: 'Jun 21, 2026', btl_id: 2002, batch_number: 1001, volume_ml: 120 },
    { date: 'Jun 20, 2026', btl_id: 2003, batch_number: 1002, volume_ml: 100 },
    { date: 'Jun 19, 2026', btl_id: 2004, batch_number: 1003, volume_ml: 130 },
    { date: 'Jun 18, 2026', btl_id: 2005, batch_number: 1004, volume_ml: 120 },
    { date: 'Jun 17, 2026', btl_id: 2006, batch_number: 1004, volume_ml: 125 },
    { date: 'Jun 16, 2026', btl_id: 2007, batch_number: 1005, volume_ml: 110 },
    { date: 'Jun 15, 2026', btl_id: 2008, batch_number: 1006, volume_ml: 140 },
    { date: 'Jun 14, 2026', btl_id: 2009, batch_number: 1007, volume_ml: 115 },
    { date: 'Jun 13, 2026', btl_id: 2010, batch_number: 1008, volume_ml: 135 },
    { date: 'Jun 12, 2026', btl_id: 2011, batch_number: 1009, volume_ml: 125 },
  ];

  const [reportData, setReportData] = useState<any>({
    dateRange: 'Jun 01, 2026 - Jun 23, 2026',
    generatedDate: 'Jun 23, 2026 22:21',
    totalVolume: 2040,
    totalWaste: 420,
    records: defaultCollectionRecords,
  });

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

  // Fetch report JSON data dynamically
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/reports/${reportType}/data?range=${range}`);
        if (!active) return;
        if (res.data && res.data.success) {
          setReportData(res.data.data);
        }
      } catch (err) {
        console.error(`Failed to fetch report data for type ${reportType}`, err);
        // Fallback structures on network failure / offline testing
        if (!active) return;
        if (reportType === 'collection') {
          setReportData({
            dateRange: 'Jun 01, 2026 - Jun 23, 2026',
            generatedDate: 'Jun 23, 2026 22:21',
            totalVolume: 2040,
            totalWaste: 420,
            records: defaultCollectionRecords,
          });
        } else if (reportType === 'processing') {
          setReportData({
            dateRange: 'Jun 01, 2026 - Jun 23, 2026',
            generatedDate: 'Jun 23, 2026 22:21',
            totalBatches: 4,
            totalBottles: 11,
            passRate: '72.7',
            records: defaultProcessingRecords,
          });
        } else if (reportType === 'dispensing') {
          setReportData({
            dateRange: 'Jun 01, 2026 - Jun 23, 2026',
            generatedDate: 'Jun 23, 2026 22:21',
            totalBottles: 11,
            totalVolume: 1340,
            records: defaultDispensingRecords,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [reportType, range]);

  // Adjust defaults on manual reportType change
  useEffect(() => {
    setActivePage(1);
  }, [reportType, range]);

  // Pagination bounds
  const RECORDS_PER_PAGE = 10;
  const totalPages = reportData ? Math.max(1, Math.ceil(reportData.records.length / RECORDS_PER_PAGE)) : 1;

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
    if (downloading) return; // Prevent double clicks
    setDownloading(true);

    const executeDownload = async () => {
      try {
        const response = await api.get(`/api/reports/${reportType}/export?range=${range}`, {
          responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MHMB_${reportType.charAt(0).toUpperCase() + reportType.slice(1)}_Report_${range}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Delay cleanup so the browser has time to trigger the download event
        setTimeout(() => {
          link.remove();
          window.URL.revokeObjectURL(url);
        }, 1000);
      } catch (error) {
        console.error('Failed to download PDF from backend API', error);
      } finally {
        setDownloading(false);
      }
    };

    executeDownload();
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      setPrinting(false);
      window.print();
    }, 1000);
  };

  // Construct printable file name
  const reportFileName = `mhmb-${reportType}-report-${range}.pdf`;

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans print:bg-white print:text-black">
      
      {/* Sidebar Navigation - Hidden during printing */}
      <StaffSidebar activeItem="reports" />

      {/* Main Workspace Reports Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen print:overflow-visible print:max-h-none print:p-0">
        
        {/* Top Header - Hidden during printing */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4 shrink-0 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
            <h2 className="text-xl font-sans font-bold text-neutral-900 shrink-0">
              Staff Portal
            </h2>

            {/* Selector block */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1 border border-neutral-200">
                <label htmlFor="report-type" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Report:</label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="text-xs font-bold text-neutral-700 bg-transparent border-none outline-none cursor-pointer"
                  data-testid="report-type-select"
                >
                  <option value="collection">Collection Report</option>
                  <option value="processing">Processing Report</option>
                  <option value="dispensing">Dispensing Report</option>
                </select>
              </div>

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
          </div>

          <div className="flex items-center gap-6 shrink-0">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                  {reportFileName}
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
                    {activePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
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


                  {/* Render Collection Report */}
                  {reportType === 'collection' && reportData && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200" data-testid={`pdf-page-${activePage}`}>
                      <div className="space-y-4">
                        <h2 className="text-2xl font-sans font-bold text-neutral-800 leading-tight">
                          Makati Human Milk Bank Collection Report
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans">
                          Period: <strong className="font-semibold text-neutral-700">{reportData.dateRange}</strong> | Generated On: <strong className="font-semibold text-neutral-700">{reportData.generatedDate}</strong>
                        </p>
                        
                        <hr className="border-neutral-100" />
                        
                        {activePage === 1 && (
                          <div className="bg-neutral-50 p-4 border-l-4 border-brand-teal rounded-r-xl space-y-2 mb-4">
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>Total Volume Collected (Good):</strong> {reportData.totalVolume} ml
                            </p>
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>Total Volume Wasted:</strong> {reportData.totalWaste} ml
                            </p>
                          </div>
                        )}

                        <div className="space-y-3.5">
                          <h3 className="text-xs font-sans font-bold text-neutral-700 uppercase tracking-wider">
                            Milk Collections Records (Page {activePage} of {totalPages})
                          </h3>
                          <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left font-sans text-[10px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase">
                                  <th className="px-4 py-2">Date</th>
                                  <th className="px-4 py-2">Donor DTN</th>
                                  <th className="px-4 py-2">Program</th>
                                  <th className="px-4 py-2 text-right">Volume</th>
                                  <th className="px-4 py-2 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 text-neutral-600 font-medium">
                                {reportData.records
                                  .slice((activePage - 1) * RECORDS_PER_PAGE, activePage * RECORDS_PER_PAGE)
                                  .map((record: any, index: number) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2">{record.date}</td>
                                      <td className="px-4 py-2">{record.dtn}</td>
                                      <td className="px-4 py-2">{record.program}</td>
                                      <td className="px-4 py-2 text-right">{record.volume_ml} ml</td>
                                      <td className={`px-4 py-2 text-right font-bold ${record.isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {record.status}
                                      </td>
                                    </tr>
                                  ))}
                                {reportData.records.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">No collection records found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Processing Report */}
                  {reportType === 'processing' && reportData && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200" data-testid={`pdf-page-${activePage}`}>
                      <div className="space-y-4">
                        <h2 className="text-2xl font-sans font-bold text-neutral-800 leading-tight">
                          Processing & MBT Report
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans">
                          Period: <strong className="font-semibold text-neutral-700">{reportData.dateRange}</strong> | Generated On: <strong className="font-semibold text-neutral-700">{reportData.generatedDate}</strong>
                        </p>
                        
                        <hr className="border-neutral-100" />
                        
                        {activePage === 1 && (
                          <div className="bg-neutral-50 p-4 border-l-4 border-brand-teal rounded-r-xl space-y-2 mb-4 flex justify-between gap-4">
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>Total Batches:</strong> {reportData.totalBatches}
                            </p>
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>Total Bottles:</strong> {reportData.totalBottles}
                            </p>
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>MBT Pass Rate:</strong> {reportData.passRate}%
                            </p>
                          </div>
                        )}

                        <div className="space-y-3.5">
                          <h3 className="text-xs font-sans font-bold text-neutral-700 uppercase tracking-wider">
                            Processing Records (Page {activePage} of {totalPages})
                          </h3>
                          <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left font-sans text-[10px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase">
                                  <th className="px-4 py-2">Date</th>
                                  <th className="px-4 py-2">Batch #</th>
                                  <th className="px-4 py-2">Bottle ID</th>
                                  <th className="px-4 py-2 text-right">Volume</th>
                                  <th className="px-4 py-2 text-right">MBT Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 text-neutral-600 font-medium">
                                {reportData.records
                                  .slice((activePage - 1) * RECORDS_PER_PAGE, activePage * RECORDS_PER_PAGE)
                                  .map((record: any, index: number) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2">{record.date}</td>
                                      <td className="px-4 py-2">{record.batch_number}</td>
                                      <td className="px-4 py-2">{record.btl_id}</td>
                                      <td className="px-4 py-2 text-right">{record.volume_ml} ml</td>
                                      <td className={`px-4 py-2 text-right font-bold ${
                                        record.mbt_class === 'pass' ? 'text-emerald-600' :
                                        record.mbt_class === 'fail' ? 'text-rose-600' :
                                        'text-yellow-600'
                                      }`}>
                                        {record.mbt_status}
                                      </td>
                                    </tr>
                                  ))}
                                {reportData.records.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">No processing records found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Dispensing Report */}
                  {reportType === 'dispensing' && reportData && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200" data-testid={`pdf-page-${activePage}`}>
                      <div className="space-y-4">
                        <h2 className="text-2xl font-sans font-bold text-neutral-800 leading-tight">
                          Dispensing & Distribution Report
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans">
                          Period: <strong className="font-semibold text-neutral-700">{reportData.dateRange}</strong> | Generated On: <strong className="font-semibold text-neutral-700">{reportData.generatedDate}</strong>
                        </p>
                        
                        <hr className="border-neutral-100" />
                        
                        {activePage === 1 && (
                          <div className="bg-neutral-50 p-4 border-l-4 border-brand-teal rounded-r-xl space-y-2 mb-4 flex justify-between gap-4">
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>Total Bottles:</strong> {reportData.totalBottles}
                            </p>
                            <p className="text-[11px] text-neutral-700 font-sans">
                              <strong>Total Volume Dispensed:</strong> {reportData.totalVolume} ml
                            </p>
                          </div>
                        )}

                        <div className="space-y-3.5">
                          <h3 className="text-xs font-sans font-bold text-neutral-700 uppercase tracking-wider">
                            Dispensing Records (Page {activePage} of {totalPages})
                          </h3>
                          <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left font-sans text-[10px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase">
                                  <th className="px-4 py-2">Dispense Date</th>
                                  <th className="px-4 py-2">Bottle ID</th>
                                  <th className="px-4 py-2">Batch #</th>
                                  <th className="px-4 py-2 text-right">Volume</th>
                                  <th className="px-4 py-2 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 text-neutral-600 font-medium">
                                {reportData.records
                                  .slice((activePage - 1) * RECORDS_PER_PAGE, activePage * RECORDS_PER_PAGE)
                                  .map((record: any, index: number) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2">{record.date}</td>
                                      <td className="px-4 py-2">{record.btl_id}</td>
                                      <td className="px-4 py-2">{record.batch_number}</td>
                                      <td className="px-4 py-2 text-right">{record.volume_ml} ml</td>
                                      <td className="px-4 py-2 text-right font-bold text-emerald-600">DISPENSED</td>
                                    </tr>
                                  ))}
                                {reportData.records.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">No dispensing records found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Page Footer */}
                <div className="border-t border-neutral-100 pt-4 flex justify-between text-[9px] font-sans text-neutral-400 font-semibold select-none">
                  <span>Makati Human Milk Bank Summary Report</span>
                  <span>Page {activePage} of {totalPages}</span>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
