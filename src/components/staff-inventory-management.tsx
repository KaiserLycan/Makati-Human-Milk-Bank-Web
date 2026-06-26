'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  Milk,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import { api } from '../utils/api';

// --- SHARED CUSTOM DROPDOWN ---
const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  triggerClassName, 
  dropdownClassName,
  optionClassName,
  disabled,
  'data-testid': testId
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
        data-testid={testId}
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

export interface PasteurizedBottle {
  btl_id: number;
  pid?: number;
  volume_ml: number | string;
  expiration_date: string;
  milk_status: string;
  mbt_status: string;
  dispense_status: string;
  bottle_sequence_number?: number;
  bottle?: string;
  batch_milk?: {
    batch_id: number;
    processed_date: string;
    user?: {
      name: string;
    };
  };
}

export default function StaffInventoryManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [inventory, setInventory] = useState<PasteurizedBottle[]>([]);
  const [selectedItem, setSelectedItem] = useState<PasteurizedBottle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pagination & Sorting State
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('btl_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Missing Queries added to State
  const [milkStatusFilter, setMilkStatusFilter] = useState('All');
  const [mbtStatusFilter, setMbtStatusFilter] = useState('All');
  const [dispenseStatusFilter, setDispenseStatusFilter] = useState('All');

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (milkStatusFilter !== 'All') params.milk_status = milkStatusFilter.toLowerCase();
      if (mbtStatusFilter !== 'All') params.mbt_status = mbtStatusFilter.toLowerCase();
      if (dispenseStatusFilter !== 'All') params.dispense_status = dispenseStatusFilter.toLowerCase();

      const res = await api.get('/api/pasteurization', { params });
      if (res.data && res.data.data) {
        setInventory(res.data.data.data);
        setTotalItems(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, milkStatusFilter, mbtStatusFilter, dispenseStatusFilter, search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Clock Effect
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset to page 1 if any filter changes
  useEffect(() => {
    setPage(1);
  }, [search, milkStatusFilter, mbtStatusFilter, dispenseStatusFilter, limit]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // --- TRUE OPTIMISTIC UPDATE HANDLERS ---
  // --- TRUE OPTIMISTIC UPDATE HANDLERS ---
  const handleUpdateIncident = async (newStatus: string) => {
    if (!selectedItem || selectedItem.milk_status === newStatus) return;
    
    const previousStatus = selectedItem.milk_status;
    
    setSelectedItem({ ...selectedItem, milk_status: newStatus });
    setInventory(prev => prev.map(item => item.btl_id === selectedItem.btl_id ? { ...item, milk_status: newStatus } : item));
    
    try {
      await api.patch(`/api/pasteurization/${selectedItem.btl_id}/milk-status`, { milk_status: newStatus, remarks: '' });
      // FIX: Removed fetchInventory() to prevent stale Redis cache from overwriting the UI
    } catch (error: any) {
      setSelectedItem({ ...selectedItem, milk_status: previousStatus });
      setInventory(prev => prev.map(item => item.btl_id === selectedItem.btl_id ? { ...item, milk_status: previousStatus } : item));
      alert(error.response?.data?.message || "Failed to update Physical Condition on the server.");
    }
  };

  const handleUpdateMBT = async (newStatus: string) => {
    if (!selectedItem || selectedItem.mbt_status === newStatus) return;
    
    const previousStatus = selectedItem.mbt_status;
    
    setSelectedItem({ ...selectedItem, mbt_status: newStatus });
    setInventory(prev => prev.map(item => item.btl_id === selectedItem.btl_id ? { ...item, mbt_status: newStatus } : item));
    
    try {
      await api.patch(`/api/pasteurization/${selectedItem.btl_id}/mbt-status`, { mbt_status: newStatus });
      // FIX: Removed fetchInventory()
    } catch (error: any) {
      setSelectedItem({ ...selectedItem, mbt_status: previousStatus });
      setInventory(prev => prev.map(item => item.btl_id === selectedItem.btl_id ? { ...item, mbt_status: previousStatus } : item));
      alert(error.response?.data?.message || "Failed to update MBT Status on the server.");
    }
  };

  // Keep this function here so the compiler doesn't complain, but we are disabling the UI for it below.
  const handleUpdateDispenseStatus = async (newStatus: string) => {
      // Intentionally left blank as the backend has no route for manual dispense updates
  };


  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'expired':
      case 'discarded': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'reserved': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'dispensed': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const getMilkConditionBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'contaminated':
      case 'expired': return 'bg-red-50 text-red-700 border-red-100';
      case 'discarded': return 'bg-neutral-50 text-neutral-600 border-neutral-100';
      default: return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const getMBTBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'fail': return 'bg-red-50 text-red-700 border-red-100';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="inventory" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div><h2 className="text-xl font-bold text-neutral-900">Milk Inventory</h2></div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 text-xs sm:text-sm font-medium">{currentTime || 'Loading date...'}</div>
            <Link href="/work/notification" className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200">
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full" />
            </Link>
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Action and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search Item ID or Batch ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
              </div>

              {/* Milk Status Dropdown */}
              <CustomDropdown
                value={milkStatusFilter}
                onChange={setMilkStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[150px]"
                options={[
                  { value: 'All', label: 'All Milk Status' },
                  { value: 'Good', label: 'Good' },
                  { value: 'Contaminated', label: 'Contaminated' },
                  { value: 'Discarded', label: 'Discarded' },
                  { value: 'Expired', label: 'Expired' }
                ]}
              />

              {/* MBT Status Dropdown */}
              <CustomDropdown
                value={mbtStatusFilter}
                onChange={setMbtStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[150px]"
                options={[
                  { value: 'All', label: 'All MBT Status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Pass', label: 'Pass' },
                  { value: 'Fail', label: 'Fail' }
                ]}
              />

              {/* Dispense Status Dropdown */}
              <CustomDropdown
                value={dispenseStatusFilter}
                onChange={setDispenseStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[160px]"
                options={[
                  { value: 'All', label: 'All Dispense Status' },
                  { value: 'Available', label: 'Available' },
                  { value: 'Reserved', label: 'Reserved' },
                  { value: 'Dispensed', label: 'Dispensed' }
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
                  onChange={(e) => setLimit(Number(e.target.value) || 1)}
                  className="w-16 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/15 transition-all text-center"
                  data-testid="limit-input"
                />
              </div>
            </div>
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="inventory-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('btl_id')}>
                      ID {sortBy === 'btl_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('batch_number')}>
                      Batch ID {sortBy === 'batch_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('volume_ml')}>
                      Volume {sortBy === 'volume_ml' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('expiration_date')}>
                      Expiration Date {sortBy === 'expiration_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:text-brand-teal" onClick={() => handleSort('milk_status')}>
                      Physical Condition {sortBy === 'milk_status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Dispense Status</th>
                    <th className="px-6 py-4 text-center">MBT Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    [...Array(limit || 5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse pointer-events-none">
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                        <td className="px-6 py-4.5 text-left"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : inventory.map((item) => (
                    <tr
                      key={item.btl_id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                      data-testid={`row-${item.btl_id}`}
                    >
                      <td className="px-6 py-4.5 font-bold text-neutral-900 text-left">{item.btl_id}</td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900 text-left">{item.batch_milk?.batch_id || 'N/A'}</td>
                      <td className="px-6 py-4.5 text-left font-bold text-neutral-900">{item.volume_ml} mL</td>
                      <td className="px-6 py-4.5 text-neutral-500 text-left">{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${getMilkConditionBadge(item.milk_status)}`}>
                          {item.milk_status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${getStatusBadge(item.dispense_status)}`}>
                          {item.dispense_status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${getMBTBadge(item.mbt_status)}`}>
                          {item.mbt_status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && inventory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-neutral-400">
                        No items found matching current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-neutral-100 px-8 py-4 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="size-4" /></button>
                  <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="size-4" /></button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ITEM DETAILS & QC MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="detail-modal">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50 rounded-t-3xl">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <Milk className="size-6 text-brand-teal" />
                Pastuerized Milk
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Contextual Locked/Dispensed Alert */}
              {selectedItem.dispense_status?.toLowerCase() === 'dispensed' && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-2xl flex items-start gap-3" data-testid="item-dispensed-alert">
                  <Info className="size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Locked</p>
                    <p className="mt-0.5 opacity-90">Item is currently dispensed. Some attributes cannot be changed.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">ID</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-item-id">{selectedItem.btl_id}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Batch ID</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedItem.batch_milk?.batch_id || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Volume</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedItem.volume_ml} mL</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Expiration Date</label>
                      <div className="text-sm font-bold text-neutral-800">
                        {selectedItem.expiration_date ? new Date(selectedItem.expiration_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Bottle Type</label>
                      <div className="text-sm font-bold text-neutral-800 capitalize">{selectedItem.bottle || 'Ameda'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Sequence No.</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedItem.bottle_sequence_number || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Date Pasteurized</label>
                      <div className="text-sm font-bold text-neutral-800">
                        {selectedItem.batch_milk?.processed_date ? new Date(selectedItem.batch_milk.processed_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Processed By</label>
                      <div className="text-sm font-bold text-neutral-800 truncate" title={selectedItem.batch_milk?.user?.name || 'Unknown'}>
                        {selectedItem.batch_milk?.user?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  {selectedItem.pid && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Source Pool ID (PID)</label>
                      <span className="px-2.5 py-1 text-[10px] font-bold border rounded-full bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider">
                        {selectedItem.pid}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">
                      Physical Condition (Incident)
                    </label>
                    <CustomDropdown
                      disabled={selectedItem.dispense_status?.toLowerCase() === 'dispensed'}
                      triggerClassName={`px-3 py-1.5 text-xs font-bold border rounded-xl shadow-sm transition-colors w-full ${
                        selectedItem.dispense_status?.toLowerCase() === 'dispensed' ? 'opacity-50 bg-slate-100 border-slate-200 text-slate-500' : getMilkConditionBadge(selectedItem.milk_status)
                      }`}
                      dropdownClassName="!min-w-[140px] w-full rounded-2xl border-neutral-100 shadow-xl p-1.5"
                      optionClassName="text-xs font-bold py-2 px-2 rounded-xl"
                      value={selectedItem.milk_status}
                      onChange={(val: string) => handleUpdateIncident(val)}
                      options={[
                        { value: 'good', label: 'Good Condition' },
                        { value: 'contaminated', label: 'Contaminated (Incident)' },
                        { value: 'discarded', label: 'Discarded' },
                        { value: 'expired', label: 'Expired' }
                      ]}
                      data-testid="select-milk-status"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">
                      MBT Lab Results
                    </label>
                    <CustomDropdown
                      disabled={selectedItem.dispense_status?.toLowerCase() === 'dispensed'}
                      triggerClassName={`px-3 py-1.5 text-xs font-bold border rounded-xl shadow-sm transition-colors w-full ${
                        selectedItem.dispense_status?.toLowerCase() === 'dispensed' ? 'opacity-50 bg-slate-100 border-slate-200 text-slate-500' : getMBTBadge(selectedItem.mbt_status)
                      }`}
                      dropdownClassName="!min-w-[140px] w-full rounded-2xl border-neutral-100 shadow-xl p-1.5"
                      optionClassName="text-xs font-bold py-2 px-2 rounded-xl"
                      value={selectedItem.mbt_status}
                      onChange={(val: string) => handleUpdateMBT(val)}
                      options={[
                        { value: 'pending', label: 'Pending Review' },
                        { value: 'pass', label: 'Passed' },
                        { value: 'fail', label: 'Failed' }
                      ]}
                      data-testid="select-mbt-status"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">
                      Dispense Status
                    </label>
                    <CustomDropdown
                      disabled={true} // FORCE DISABLED
                      triggerClassName={`px-3 py-1.5 text-xs font-bold border rounded-xl shadow-sm transition-colors w-full opacity-50 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed`}
                      dropdownClassName="hidden" // Hides the dropdown
                      optionClassName="text-xs font-bold py-2 px-2 rounded-xl"
                      value={selectedItem.dispense_status}
                      onChange={() => {}} // Do nothing
                      options={[
                        { value: 'available', label: 'Available' },
                        { value: 'reserved', label: 'Reserved' },
                        { value: 'dispensed', label: 'Dispensed' }
                      ]}
                      data-testid="select-dispense-status"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-neutral-100 rounded-b-3xl">
              <button 
                onClick={() => setSelectedItem(null)}
                className="bg-white border border-neutral-200 text-neutral-700 px-6 py-2 rounded-xl font-bold hover:bg-neutral-50 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}