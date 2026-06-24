'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import { api } from '../utils/api';// Mapped to your backend Pasteurized Milk schema
export interface PasteurizedBottle {
  btl_id: number;
  volume_ml: number | string; // The console shows "500" as a string
  expiration_date: string;
  milk_status: string;
  mbt_status: string;
  dispense_status: string;
  // This is the key change! The backend sends a nested object for the batch.
  batch_milk: {
    batch_id: number;
    processed_date: string;
  };
}

export default function StaffInventoryManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [inventory, setInventory] = useState<PasteurizedBottle[]>([]);
  const [selectedItem, setSelectedItem] = useState<PasteurizedBottle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('btl_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Fetch from backend
const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/pasteurization?limit=100');
      
      // Look at exactly what the backend sent us in the console
      console.log("Raw Backend Response:", response.data);

      // Defensively drill down to find the actual array
      let actualArray = response.data;
      if (actualArray && !Array.isArray(actualArray) && actualArray.data) {
        actualArray = actualArray.data;
      }
      if (actualArray && !Array.isArray(actualArray) && actualArray.data) {
        actualArray = actualArray.data; // Handles the double-nested pagination pattern
      }

      // Final safety check: if it's STILL not an array, default to an empty array so it doesn't crash
      setInventory(Array.isArray(actualArray) ? actualArray : []);
      
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setInventory([]); // Prevent crash on error
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // --- Update Handlers (Your Goal!) ---
const handleUpdateIncident = async (newStatus: string) => {
    if (!selectedItem) return;
    try {
      // FIX 1: Use the base update endpoint for general properties
      await api.patch(`/api/pasteurization/${selectedItem.btl_id}`, { milk_status: newStatus });
      
      setInventory(prev => prev.map(item => item.btl_id === selectedItem.btl_id ? { ...item, milk_status: newStatus } : item));
      setSelectedItem({ ...selectedItem, milk_status: newStatus });
    } catch (error) {
      console.error("Failed to update milk status", error);
    }
  };

  const handleUpdateMBT = async (newStatus: string) => {
    if (!selectedItem) return;
    try {
      // FIX 2: Append '-status' to match the Swagger documentation exactly
      await api.patch(`/api/pasteurization/${selectedItem.btl_id}/mbt-status`, { mbt_status: newStatus });
      
      setInventory(prev => prev.map(item => item.btl_id === selectedItem.btl_id ? { ...item, mbt_status: newStatus } : item));
      setSelectedItem({ ...selectedItem, mbt_status: newStatus });
    } catch (error) {
      console.error("Failed to update MBT status", error);
    }
  };

  // Filter & Sort Logic
  const getProcessedInventory = () => {
    let result = [...inventory];

    if (search.trim() !== '') {
      result = result.filter((i) =>
        i.btl_id.toString().includes(search) || (i.batch_milk?.batch_id && i.batch_milk.batch_id.toString().includes(search))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((i) => i.dispense_status === statusFilter.toLowerCase());
    }

    result.sort((a, b) => {
      let aVal: any = a.btl_id;
      let bVal: any = b.btl_id;

      if (sortBy === 'expiration_date') { aVal = a.expiration_date; bVal = b.expiration_date; }
      if (sortBy === 'expiration_date') { aVal = a.expiration_date; bVal = b.expiration_date; }
      if (sortBy === 'volume_ml') { aVal = a.volume_ml; bVal = b.volume_ml; }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processed = getProcessedInventory();
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = processed.slice((page - 1) * limit, page * limit);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'expired':
      case 'discarded': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'dispensed': return 'bg-blue-50 text-blue-700 border-blue-100';
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
                  placeholder="Search item ID or batch ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all"
                  data-testid="status-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Expired">Expired</option>
                  <option value="Dispensed">Dispensed</option>
                </select>
              </div>

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
              <table className="w-full text-left border-collapse" data-testid="inventory-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('btl_id')}>
                      Item ID {sortBy === 'btl_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('batch_number')}>
                      Batch ID {sortBy === 'batch_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-right" onClick={() => handleSort('volume_ml')}>
                      Volume {sortBy === 'volume_ml' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('pasteurization_date')}>
                      Date Pasteurized {sortBy === 'pasteurization_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Dispense Status</th>
                    <th className="px-6 py-4 text-center">MBT Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-neutral-400">Loading records...</td></tr>
                  ) : pagedItems.map((item) => (
                    <tr
                      key={item.btl_id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                      data-testid={`row-${item.btl_id}`}
                    >
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{item.btl_id}</td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{item.batch_milk?.batch_id || 'N/A'}</td>                      
                      <td className="px-6 py-4.5 text-right font-bold text-neutral-900">{item.volume_ml} mL</td>
                      <td className="px-6 py-4.5 text-neutral-500">{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${getStatusBadge(item.dispense_status)}`}>
                          {item.dispense_status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${
                          item.mbt_status === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          item.mbt_status === 'fail' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {item.mbt_status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Inventory QC Actions</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all" data-testid="close-detail-modal-btn">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-teal">
                  <Database className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-item-id">Bottle ID: {selectedItem.btl_id}</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Batch: <span className="text-neutral-900">{selectedItem.batch_milk?.batch_id || 'N/A'}</span></p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-4">
                {/* Editable Statuses */}
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Physical Condition (Incident Report)</label>
                  <select 
                    value={selectedItem.milk_status}
                    onChange={(e) => handleUpdateIncident(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal cursor-pointer bg-slate-50"
                    data-testid="select-milk-status"
                  >
                    <option value="good">Good Condition</option>
                    <option value="contaminated">Contaminated (Incident)</option>
                    <option value="discarded">Discarded</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">MBT Lab Results</label>
                  <select 
                    value={selectedItem.mbt_status}
                    onChange={(e) => handleUpdateMBT(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal cursor-pointer bg-slate-50"
                    data-testid="select-mbt-status"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="pass">Passed</option>
                    <option value="fail">Failed</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-neutral-100">
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