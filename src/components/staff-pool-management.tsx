'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  Combine,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import {
  loadPools,
  savePools,
  loadInventory,
  saveInventory,
  loadAudits,
  saveAudits,
  loadProfile,
  PooledMilkBatch,
  MilkInventoryItem,
  AuditLog,
} from '../utils/storage';

export default function StaffPoolManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [pools, setPools] = useState<PooledMilkBatch[]>([]);
  const [selectedPool, setSelectedPool] = useState<PooledMilkBatch | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    setPools(loadPools());
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

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  // Handle Sort Toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Filter & Sort Logic
  const getProcessedPools = () => {
    let result = [...pools];

    // Search filter
    if (search.trim() !== '') {
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          p.sourceIds.some((id) => id.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortBy === 'datePooled') {
        aVal = a.datePooled;
        bVal = b.datePooled;
      } else if (sortBy === 'actualVolume') {
        const diff = a.actualVolume - b.actualVolume;
        return sortOrder === 'asc' ? diff : -diff;
      } else {
        aVal = a.id;
        bVal = b.id;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processed = getProcessedPools();
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = processed.slice((page - 1) * limit, page * limit);

  // Pasteurize Batch
  const handlePasteurize = (poolId: string) => {
    const inventory = loadInventory();
    const profile = loadProfile();

    // Find the batch
    const batch = pools.find((p) => p.id === poolId);
    if (!batch || batch.status !== 'Pooled') return;

    // Update status
    const updatedPools = pools.map((p) => {
      if (p.id === poolId) {
        return { ...p, status: 'Pasteurized' as const };
      }
      return p;
    });

    // Create new inventory item
    const newInvId = `INV00${inventory.length + 1}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Expiration date (180 days from now)
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 180);
    const expDateStr = expDate.toISOString().split('T')[0];

    const newInventoryItem: MilkInventoryItem = {
      id: newInvId,
      sourceBatchId: poolId,
      volume: batch.actualVolume,
      datePasteurized: todayStr,
      expirationDate: expDateStr,
      status: 'Available',
    };

    // Audit log
    const audits = loadAudits();
    const newAudit: AuditLog = {
      id: `AUD00${audits.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: profile.name,
      action: 'Pasteurized Pool Batch',
      details: `Pasteurized batch ${poolId} and added item ${newInvId} to milk inventory`,
    };

    savePools(updatedPools);
    saveInventory([newInventoryItem, ...inventory]);
    saveAudits([newAudit, ...audits]);

    setPools(updatedPools);
    if (selectedPool && selectedPool.id === poolId) {
      setSelectedPool({ ...selectedPool, status: 'Pasteurized' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pooled':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Pasteurized':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="pool" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Pooled Milk Batches</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <Link
              href="/work/notification"
              className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200"
              data-testid="header-notification-btn"
              aria-label="View notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full" />
            </Link>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Action and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              {/* Search */}
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search batch ID or source collection..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all"
                  data-testid="status-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pooled">Pooled</option>
                  <option value="Pasteurized">Pasteurized</option>
                </select>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-2.5 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all"
                  data-testid="limit-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="pools-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                      Batch ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('datePooled')} data-testid="th-date">
                      Date Pooled {sortBy === 'datePooled' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4">Source Collections</th>
                    <th className="px-6 py-4 text-right">Expected Vol</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-right" onClick={() => handleSort('actualVolume')} data-testid="th-volume">
                      Actual Vol {sortBy === 'actualVolume' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {pagedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 transition-colors duration-150"
                      data-testid={`row-${item.id}`}
                    >
                      <td
                        className="px-6 py-4.5 font-bold text-neutral-900 cursor-pointer hover:text-brand-teal"
                        onClick={() => setSelectedPool(item)}
                      >
                        {item.id}
                      </td>
                      <td className="px-6 py-4.5 text-neutral-500">{item.datePooled}</td>
                      <td className="px-6 py-4.5 font-medium text-neutral-600">
                        {item.sourceIds.join(', ')}
                      </td>
                      <td className="px-6 py-4.5 text-right text-neutral-500">{item.expectedVolume} mL</td>
                      <td className="px-6 py-4.5 text-right text-neutral-900 font-bold">{item.actualVolume} mL</td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {item.status === 'Pooled' ? (
                          <button
                            onClick={() => handlePasteurize(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-lg transition-all shadow-[0_2px_6px_rgba(0,105,111,0.1)] active:scale-95 cursor-pointer"
                            data-testid={`pasteurize-btn-${item.id}`}
                          >
                            <Sparkles className="size-3" />
                            Pasteurize
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-neutral-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {pagedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-neutral-400">
                        No pooled batches found matching current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-neutral-100 px-8 py-4 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    data-testid="next-page-btn"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BATCH DETAILS MODAL */}
      {selectedPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="detail-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Combine className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Pooled Batch Details</h3>
              </div>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-teal">
                  <Combine className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-batch-id">
                    Batch: {selectedPool.id}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Date Pooled: <span className="text-neutral-900" data-testid="modal-date">{selectedPool.datePooled}</span>
                  </p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-neutral-400 font-semibold">Source Collections:</span>
                  <span className="font-bold text-neutral-800 text-right max-w-[200px]" data-testid="modal-sources">
                    {selectedPool.sourceIds.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Expected Volume:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-expected">{selectedPool.expectedVolume} mL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Actual Volume:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-actual">{selectedPool.actualVolume} mL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Status:</span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(selectedPool.status)}`}>
                    {selectedPool.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5">
              <button
                onClick={() => setSelectedPool(null)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                data-testid="close-modal-btn"
              >
                Close
              </button>
              {selectedPool.status === 'Pooled' && (
                <button
                  onClick={() => handlePasteurize(selectedPool.id)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_2px_8px_rgba(0,105,111,0.15)]"
                  data-testid="modal-pasteurize-btn"
                >
                  Pasteurize Batch
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
