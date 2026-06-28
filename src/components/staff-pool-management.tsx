'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  Edit2,
  Trash2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import StaffSidebar from './ui/staff-sidebar';
import StaffNotificationBell from './ui/staff-notification-bell';
import { api } from '../utils/api';

const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  triggerClassName, 
  dropdownClassName,
  optionClassName,
  disabled 
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      {Icon && <Icon className="size-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${triggerClassName} flex items-center justify-between gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown className={`size-3.5 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className={`absolute top-full mt-1.5 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-[60] overflow-hidden min-w-[140px] left-0 ${dropdownClassName || ''}`}>
          {options.map((option: any) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-colors ${value === option.value ? 'bg-brand-teal/10 text-brand-teal' : 'text-neutral-600 hover:bg-slate-50'} ${optionClassName || ''}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface RawMilkItem {
  ctn: number;
  volume_ml: number;
  expiration_date: string;
}

export interface PoolMilkBatch {
  pid: number;
  pooled_date: string;
  pooled_by_user?: {
    user_id: string;
    name: string;
  };
  raw_milk: RawMilkItem[];
  expiration_date: string;
  expected_volume_ml: number;
  actual_volume_ml: number;
  remaining_volume_ml: number;
  milk_status: 'good' | 'contaminated' | 'discarded' | 'expired';
  remarks: string | null;
}

export default function StaffPoolManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [pools, setPools] = useState<PoolMilkBatch[]>([]);
  const { user } = useAuth();

  // Selection & Modal State
  const [selectedPool, setSelectedPool] = useState<PoolMilkBatch | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PoolMilkBatch>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pasteurize Form State
  const [isPasteurizeOpen, setIsPasteurizeOpen] = useState(false);
  const [pasteurizeData, setPasteurizeData] = useState<any>({});
  const [pasteurizeError, setPasteurizeError] = useState('');
  const [isPasteurizing, setIsPasteurizing] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPools = async () => {
    setIsLoading(true);
    try {
      let mappedSortBy = sortBy;
      if (sortBy === 'id') mappedSortBy = 'pid';
      if (sortBy === 'datePooled') mappedSortBy = 'pooled_date';
      if (sortBy === 'actualVolume') mappedSortBy = 'actual_volume_ml';

      const params: any = {
        page,
        limit,
        sortBy: mappedSortBy,
        sortOrder: sortOrder,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== 'All') {
        params.milk_status = statusFilter.toLowerCase();
      }

      const res = await api.get('/api/pooling', { params });
      if (res.data && res.data.data) {
        setPools(res.data.data.data);
        setTotalItems(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to load pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [page, limit, sortBy, sortOrder, statusFilter, search]);

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

  const handleUpdateMilkStatus = async (pid: number, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/api/pooling/${pid}/milk-status`, { milk_status: newStatus });
      fetchPools();
      if (selectedPool && selectedPool.pid === pid) {
        setSelectedPool({ ...selectedPool, milk_status: newStatus as any });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update milk status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeletePool = async () => {
    if (!selectedPool) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/api/pooling/${selectedPool.pid}`);
      setSelectedPool(null);
      setIsDeleteConfirmOpen(false);
      fetchPools();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete milk pool.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditForm = () => {
    if (!selectedPool) return;
    setFormData({
      ...selectedPool,
    });
    setFormError('');
    setIsFormOpen(true);
    setSelectedPool(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('Authentication required to perform this action.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: any = {
        actual_volume_ml: Number(formData.actual_volume_ml),
        remarks: formData.remarks || '',
      };

      await api.put(`/api/pooling/${formData.pid}`, payload);
      setIsFormOpen(false);
      fetchPools();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPasteurizeForm = () => {
    if (!selectedPool) return;
    setPasteurizeData({
      pid: selectedPool.pid,
      bottle_count: '',
      volume_per_bottle: '',
      bottle_type: 'ameda',
      pasteurization_date: new Date().toISOString().substring(0, 10),
    });
    setPasteurizeError('');
    setIsPasteurizeOpen(true);
    setSelectedPool(null);
  };

  const handlePasteurizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasteurizing(true);
    setPasteurizeError('');

    try {
      await api.post('/api/pasteurization', {
        pid: Number(pasteurizeData.pid),
        bottle_count: Number(pasteurizeData.bottle_count),
        volume_per_bottle: Number(pasteurizeData.volume_per_bottle),
        bottle_type: pasteurizeData.bottle_type,
        pasteurization_date: pasteurizeData.pasteurization_date,
      });
      setIsPasteurizeOpen(false);
      fetchPools();
    } catch (err: any) {
      setPasteurizeError(err.response?.data?.message || err.message || 'Failed to create pasteurization batch.');
    } finally {
      setIsPasteurizing(false);
    }
  };

  const getMilkStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'contaminated':
      case 'expired':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'discarded':
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const pagedItems = pools;

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
            <StaffNotificationBell />
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
                  placeholder="Search PID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
              </div>

              {/* Status Filter */}
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[150px]"
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Good', label: 'Good' },
                  { value: 'Contaminated', label: 'Contaminated' },
                  { value: 'Expired', label: 'Expired' },
                  { value: 'Discarded', label: 'Discarded' }
                ]}
              />

              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">Show:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(e) => setLimit(Math.min(Number(e.target.value) || 1, 100))}
                  className="w-16 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/15 transition-all text-center"
                  data-testid="limit-select"
                />
              </div>
            </div>
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="pools-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('id')} data-testid="th-id">
                      ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('datePooled')} data-testid="th-date">
                      Date Pooled {sortBy === 'datePooled' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-left">Expected Vol</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('actualVolume')} data-testid="th-volume">
                      Actual Vol {sortBy === 'actualVolume' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-left">Expiration Date</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    [...Array(limit || 5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse pointer-events-none">
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : pagedItems.map((item) => (
                    <tr
                      key={item.pid}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 transition-colors duration-150 cursor-pointer"
                      onClick={() => setSelectedPool(item)}
                      data-testid={`row-${item.pid}`}
                    >
                      <td className="px-6 py-4.5 font-bold text-neutral-900 text-left">
                        {item.pid}
                      </td>
                      <td className="px-6 py-4.5 text-neutral-500 text-left">
                        {item.pooled_date ? new Date(item.pooled_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4.5 text-left text-neutral-500">{item.expected_volume_ml} mL</td>
                      <td className="px-6 py-4.5 text-left text-neutral-900 font-bold">{item.actual_volume_ml} mL</td>
                      <td className="px-6 py-4.5 text-neutral-500 text-left">
                        {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          {!(item.milk_status === 'good' && Number(item.remaining_volume_ml) === 0) && (
                            <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getMilkStatusBadge(item.milk_status)}`}>
                              {item.milk_status}
                            </span>
                          )}
                          {Number(item.remaining_volume_ml) === 0 && (
                            <span className="px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-100">
                              Processed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && pagedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-neutral-400 font-medium font-sans">
                        No records match the active search and filter settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-neutral-100 px-8 py-4 flex items-center justify-between text-xs font-semibold text-neutral-500 font-sans">
                <span>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <Combine className="size-6 text-brand-teal" />
                Pooled Batch Details
              </h3>
              <button
                onClick={() => setSelectedPool(null)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Contextual Processing Alert */}
              {Number(selectedPool.remaining_volume_ml) === 0 ? (
                <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-2xl flex items-start gap-3" data-testid="pool-processed-alert">
                  <Info className="size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Completely Processed</p>
                    <p className="mt-0.5 opacity-90">This milk pool is completely processed and all actual volume is bottled.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-2xl flex items-start gap-3" data-testid="pool-processed-alert">
                  <Info className="size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Partially Processed</p>
                    <p className="mt-0.5 opacity-90">This milk pool is partially processed with {selectedPool.remaining_volume_ml} mL left to be pasteurized out of {selectedPool.actual_volume_ml} mL.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">ID</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-batch-id">{selectedPool.pid}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Date Pooled</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-date">
                        {selectedPool.pooled_date ? new Date(selectedPool.pooled_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Expected Volume</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-expected">{selectedPool.expected_volume_ml} mL</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Actual Volume</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-actual">{selectedPool.actual_volume_ml} mL</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Remaining Volume</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedPool.remaining_volume_ml} mL</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Expiration Date</label>
                      <div className="text-sm font-bold text-neutral-800">
                        {selectedPool.expiration_date ? new Date(selectedPool.expiration_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Pooled By</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedPool.pooled_by_user?.name || 'Unknown'}</div>
                    </div>
                  </div>

                  {selectedPool.remarks && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Remarks</label>
                      <div className="text-sm font-bold text-neutral-800 break-words">{selectedPool.remarks}</div>
                    </div>
                  )}
                </div>

                {/* Right Column: Source Collections */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">Milk Status</label>
                    <div className="relative inline-block w-[140px]">
                      <CustomDropdown
                        disabled={isUpdatingStatus || Number(selectedPool.remaining_volume_ml) === 0}
                        triggerClassName={`px-3 py-1.5 text-[10px] font-bold border rounded-full uppercase tracking-wider shadow-sm transition-colors w-full ${getMilkStatusBadge(selectedPool.milk_status)}`}
                        dropdownClassName="!min-w-[140px] w-full rounded-2xl border-neutral-100 shadow-xl p-1.5"
                        optionClassName="uppercase text-[10px] tracking-wider py-2 px-2 text-center rounded-xl"
                        value={selectedPool.milk_status}
                        onChange={(val: string) => handleUpdateMilkStatus(selectedPool.pid, val)}
                        options={[
                          { value: 'good', label: 'Good' },
                          { value: 'contaminated', label: 'Contaminated' },
                          { value: 'discarded', label: 'Discarded' },
                          { value: 'expired', label: 'Expired' }
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">Source Collections</label>
                    <div className="bg-slate-50 border border-neutral-100 rounded-2xl overflow-hidden shadow-inner max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-100/50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-150 sticky top-0 z-10 select-none">
                            <th className="px-4 py-2.5">CTN</th>
                            <th className="px-4 py-2.5 text-right">Volume</th>
                            <th className="px-4 py-2.5 text-right">Expiration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-700" data-testid="modal-sources">
                          {selectedPool.raw_milk?.map((rm) => (
                            <tr key={rm.ctn} className="hover:bg-slate-100/50 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-neutral-900">{rm.ctn}</td>
                              <td className="px-4 py-3.5 text-right text-neutral-800">{rm.volume_ml} mL</td>
                              <td className="px-4 py-3.5 text-right text-neutral-500">
                                {rm.expiration_date ? new Date(rm.expiration_date).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end bg-slate-50/50 items-center">
              <button
                onClick={() => { setDeleteError(''); setIsDeleteConfirmOpen(true); }}
                className="px-4 py-2.5 text-red-655 hover:text-red-755 font-bold text-sm rounded-xl hover:bg-red-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-4" /> Delete
              </button>
              <button
                onClick={handleOpenEditForm}
                className="px-4 py-2.5 text-brand-teal hover:text-brand-teal-darker font-bold text-sm rounded-xl hover:bg-brand-teal/5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="size-4" /> Edit
              </button>
              {selectedPool.milk_status === 'good' && Number(selectedPool.remaining_volume_ml) > 0 && (
                <button
                  onClick={handleOpenPasteurizeForm}
                  className="px-6 py-2.5 text-white bg-brand-teal hover:bg-brand-teal/90 font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                  data-testid="modal-pasteurize-btn"
                >
                  <Sparkles className="size-4" /> Pasteurize
                </button>
              )}
              <button
                onClick={() => setSelectedPool(null)}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-sm rounded-xl ml-2 shadow-sm transition-all cursor-pointer"
                data-testid="close-modal-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <Combine className="size-6 text-brand-teal" />
                Edit Pool Batch
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {formError && (
                <div className="mb-5 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-2xl border border-red-100 flex items-start gap-3">
                  <Info className="size-5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}
              <form id="pool-edit-form" onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Actual Volume (mL) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.actual_volume_ml || ''}
                    onChange={(e) => setFormData({ ...formData, actual_volume_ml: Number(e.target.value) })}
                    className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                    placeholder="Enter volume in mL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Remarks</label>
                  <textarea
                    rows={3}
                    maxLength={100}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none resize-none placeholder:text-neutral-400 placeholder:font-medium"
                    placeholder="Optional details (max 100 characters)"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end bg-slate-50/50">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="pool-edit-form"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-brand-teal hover:bg-brand-teal/90 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-brand-teal/20"
              >
                {isSubmitting ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Combine className="size-5" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pasteurize Form Modal */}
      {isPasteurizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300" data-testid="pasteurize-modal">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <Sparkles className="size-6 text-brand-teal" />
                Pasteurize Batch
              </h3>
              <button
                onClick={() => setIsPasteurizeOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {pasteurizeError && (
                <div className="mb-5 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-2xl border border-red-100 flex items-start gap-3">
                  <Info className="size-5 shrink-0" />
                  <p>{pasteurizeError}</p>
                </div>
              )}
              <form id="pasteurize-form" onSubmit={handlePasteurizeSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Bottle Count *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pasteurizeData.bottle_count || ''}
                    onChange={(e) => setPasteurizeData({ ...pasteurizeData, bottle_count: e.target.value })}
                    className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                    placeholder="Enter bottle count"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Volume per Bottle (mL) *</label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={pasteurizeData.volume_per_bottle || ''}
                    onChange={(e) => setPasteurizeData({ ...pasteurizeData, volume_per_bottle: e.target.value })}
                    className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                    placeholder="Enter volume per bottle in mL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Bottle Type *</label>
                  <CustomDropdown
                    value={pasteurizeData.bottle_type || 'ameda'}
                    onChange={(val: string) => setPasteurizeData({ ...pasteurizeData, bottle_type: val })}
                    triggerClassName="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 hover:bg-slate-100 transition-all"
                    dropdownClassName="!min-w-0 w-full rounded-2xl border-neutral-100 shadow-xl p-1 z-[60]"
                    optionClassName="text-sm font-bold py-2.5 px-3 rounded-xl"
                    options={[
                      { value: 'ameda', label: 'Ameda' },
                      { value: 'korea', label: 'Korea' },
                      { value: 'red_cap', label: 'Red Cap' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Pasteurization Date *</label>
                  <input
                    type="date"
                    required
                    value={pasteurizeData.pasteurization_date || ''}
                    onChange={(e) => setPasteurizeData({ ...pasteurizeData, pasteurization_date: e.target.value })}
                    className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsPasteurizeOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="pasteurize-form"
                disabled={isPasteurizing}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-brand-teal hover:bg-brand-teal/90 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-brand-teal/20"
              >
                {isPasteurizing ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="size-5" />
                )}
                Confirm Pasteurization
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && selectedPool && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="size-5 text-red-500" />
                <h3 className="text-base font-bold text-neutral-900">
                  Confirm Delete
                </h3>
              </div>
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed">
                Are you sure you want to delete milk pool Batch #{selectedPool.pid}? This action cannot be undone and will erase it from the database.
              </p>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-medium animate-in fade-in duration-200">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleDeletePool}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
