'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  ClipboardList,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import {
  loadCollections,
  saveCollections,
  loadPools,
  savePools,
  loadAudits,
  saveAudits,
  loadProfile,
  RawMilkCollection,
  PooledMilkBatch,
  AuditLog,
} from '../utils/storage';

export default function StaffCollectionManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [collections, setCollections] = useState<RawMilkCollection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<RawMilkCollection | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Pooling modal state
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [actualVolumeInput, setActualVolumeInput] = useState('');

  useEffect(() => {
    setCollections(loadCollections());
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
  const getProcessedCollections = () => {
    let result = [...collections];

    // Search filter
    if (search.trim() !== '') {
      result = result.filter(
        (c) =>
          c.donorName.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortBy === 'donorName') {
        aVal = a.donorName.toLowerCase();
        bVal = b.donorName.toLowerCase();
      } else if (sortBy === 'expectedVolume') {
        const diff = a.expectedVolume - b.expectedVolume;
        return sortOrder === 'asc' ? diff : -diff;
      } else if (sortBy === 'dateCollected') {
        aVal = a.dateCollected;
        bVal = b.dateCollected;
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

  const processed = getProcessedCollections();
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = processed.slice((page - 1) * limit, page * limit);

  // Checkbox interactions
  const handleSelectRow = (id: string, status: string) => {
    if (status !== 'Collected') return; // Only allow pooling for 'Collected' items
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all 'Collected' items on current page
      const collectableIds = pagedItems
        .filter((item) => item.status === 'Collected')
        .map((item) => item.id);
      setSelectedIds(collectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Expected Total
  const expectedTotal = collections
    .filter((c) => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.expectedVolume, 0);

  const openPoolModal = () => {
    if (selectedIds.length === 0) return;
    setActualVolumeInput(expectedTotal.toString());
    setIsPoolModalOpen(true);
  };

  const handlePoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualVolume = parseFloat(actualVolumeInput);
    if (isNaN(actualVolume) || actualVolume <= 0) return;

    const pools = loadPools();
    const profile = loadProfile();

    const newPoolId = `PM00${pools.length + 1}`;
    const newPoolBatch: PooledMilkBatch = {
      id: newPoolId,
      sourceIds: selectedIds,
      expectedVolume: expectedTotal,
      actualVolume: actualVolume,
      status: 'Pooled',
      datePooled: new Date().toISOString().split('T')[0],
    };

    // Update collections status
    const updatedCollections = collections.map((c) => {
      if (selectedIds.includes(c.id)) {
        return { ...c, status: 'Pooled' as const, actualVolume: actualVolume / selectedIds.length };
      }
      return c;
    });

    // Create Audit Log
    const audits = loadAudits();
    const newAudit: AuditLog = {
      id: `AUD00${audits.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: profile.name,
      action: 'Created Pool Batch',
      details: `Pooled collections [${selectedIds.join(', ')}] into batch ${newPoolId} with actual volume ${actualVolume}mL`,
    };

    saveCollections(updatedCollections);
    savePools([newPoolBatch, ...pools]);
    saveAudits([newAudit, ...audits]);

    // Update state
    setCollections(updatedCollections);
    setSelectedIds([]);
    setIsPoolModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Collected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pooled':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="collection" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Raw Milk Collections</h2>
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
                  placeholder="Search donor..."
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
                  <option value="Collected">Collected</option>
                  <option value="Pooled">Pooled</option>
                  <option value="Pending">Pending</option>
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

            {/* Pool Selected Action Button */}
            {selectedIds.length > 0 && (
              <button
                onClick={openPoolModal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shrink-0 shadow-[0_4px_12px_rgba(0,105,111,0.15)] hover:shadow-lg hover:-translate-y-0.5"
                data-testid="pool-selected-btn"
              >
                <Layers className="size-4" />
                Pool Selected ({selectedIds.length})
              </button>
            )}
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="collections-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          pagedItems.filter((i) => i.status === 'Collected').length > 0 &&
                          pagedItems
                            .filter((i) => i.status === 'Collected')
                            .every((i) => selectedIds.includes(i.id))
                        }
                        className="size-4 accent-brand-teal rounded cursor-pointer"
                        data-testid="select-all-checkbox"
                      />
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                      ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('donorName')} data-testid="th-donor">
                      Donor Name {sortBy === 'donorName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('dateCollected')} data-testid="th-date">
                      Date Collected {sortBy === 'dateCollected' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-right" onClick={() => handleSort('expectedVolume')} data-testid="th-volume">
                      Expected Volume {sortBy === 'expectedVolume' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {pagedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 transition-colors duration-150"
                      data-testid={`row-${item.id}`}
                    >
                      <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          disabled={item.status !== 'Collected'}
                          onChange={() => handleSelectRow(item.id, item.status)}
                          className="size-4 accent-brand-teal rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`checkbox-${item.id}`}
                        />
                      </td>
                      <td
                        className="px-6 py-4.5 font-bold text-neutral-900 cursor-pointer hover:text-brand-teal"
                        onClick={() => setSelectedCollection(item)}
                      >
                        {item.id}
                      </td>
                      <td
                        className="px-6 py-4.5 font-bold text-neutral-900 cursor-pointer hover:text-brand-teal"
                        onClick={() => setSelectedCollection(item)}
                      >
                        {item.donorName}
                      </td>
                      <td className="px-6 py-4.5 text-neutral-500">{item.dateCollected}</td>
                      <td className="px-6 py-4.5 text-right text-neutral-900">{item.expectedVolume} mL</td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {pagedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-neutral-400">
                        No collections found matching current criteria.
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

      {/* POOLING EXPECTED VS ACTUAL MODAL */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="pool-modal">
          <form
            onSubmit={handlePoolSubmit}
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
          >
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Pool Selected Milk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPoolModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                data-testid="close-pool-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-neutral-150 rounded-2xl p-4.5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-semibold">Expected Total:</span>
                  <span className="font-bold text-neutral-900 text-lg">{expectedTotal} mL</span>
                </div>
                <div className="text-[11px] text-neutral-400 font-medium flex items-start gap-1.5 leading-normal">
                  <Info className="size-3.5 text-brand-teal shrink-0 mt-0.5" />
                  <span>
                    Expected total volume is computed automatically as the sum of all selected collections. Please input the actual pooled volume measured.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="actual-volume-input" className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  Actual Pooled Volume (mL) *
                </label>
                <input
                  id="actual-volume-input"
                  type="number"
                  required
                  value={actualVolumeInput}
                  onChange={(e) => setActualVolumeInput(e.target.value)}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-bold text-neutral-900 text-lg"
                  placeholder="Enter volume in mL"
                  data-testid="actual-volume-input"
                />
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setIsPoolModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                data-testid="cancel-pool-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_2px_8px_rgba(0,105,111,0.15)]"
                data-testid="confirm-pool-btn"
              >
                Confirm Pooling
              </button>
            </div>
          </form>
        </div>
      )}

      {/* COLLECTION DETAILS MODAL */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="detail-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Collection Details</h3>
              </div>
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-teal">
                  <ClipboardList className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-donor-name">
                    {selectedCollection.donorName}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Collection ID: <span className="text-neutral-900" data-testid="modal-collection-id">{selectedCollection.id}</span>
                  </p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Date Collected:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-date">{selectedCollection.dateCollected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Expected Volume:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-expected">{selectedCollection.expectedVolume} mL</span>
                </div>
                {selectedCollection.actualVolume !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-semibold">Proportional Volume:</span>
                    <span className="font-bold text-neutral-800" data-testid="modal-actual">{Math.round(selectedCollection.actualVolume * 100) / 100} mL</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Status:</span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(selectedCollection.status)}`}>
                    {selectedCollection.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
