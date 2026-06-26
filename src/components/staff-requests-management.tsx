'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Hospital,
  Info,
  CheckCircle2, 
  XCircle,      
  Edit2,     
  Trash2,    
  Milk,
  AlertTriangle
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

// --- INTERFACES ---
export interface MilkRequest {
  rid: number;
  bid: number;
  hospital: string;
  requested_vol_ml: string | number;
  requested_date: string;
  request_status: string;
  beneficiary?: {
    name: string;
    caregiver: string;
  };
  request_bottles?: {
    pasteurized_milk: {
      btl_id: number;
      volume_ml: string | number;
    }
  }[];
}

export default function StaffRequestsManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [requests, setRequests] = useState<MilkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MilkRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('rid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal Visibility & Form State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<'dispense' | 'cancel' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newRequestForm, setNewRequestForm] = useState({
    beneficiary_id: '',
    hospital: '',
    volume_ml: '',
  });

  const [editRequestForm, setEditRequestForm] = useState({
    rid: 0,
    hospital: '',
    volume_ml: '',
  });

  // Beneficiary Search State
  const [beneficiarySearchQuery, setBeneficiarySearchQuery] = useState('');
  const [beneficiarySearchResults, setBeneficiarySearchResults] = useState<any[]>([]);
  const [isSearchingBeneficiaries, setIsSearchingBeneficiaries] = useState(false);
  const [showBeneficiaryDropdown, setShowBeneficiaryDropdown] = useState(false);

  // Auto-search for Beneficiaries
  useEffect(() => {
    if (!beneficiarySearchQuery || beneficiarySearchQuery.trim() === '') {
      setBeneficiarySearchResults([]);
      return;
    }
    
    if (beneficiarySearchQuery.includes('(BID:')) return; 

    const timer = setTimeout(async () => {
      setIsSearchingBeneficiaries(true);
      try {
        const response = await api.get('/api/beneficiaries', { params: { search: beneficiarySearchQuery, limit: 5 } });
        setBeneficiarySearchResults(response.data?.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingBeneficiaries(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [beneficiarySearchQuery]);

  // Fetch Requests
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { 
        page, 
        limit, 
        sortBy,     
        sortOrder   
      };
      
      if (search.trim()) params.search = search.trim();
      
      if (statusFilter !== 'All') {
        params.request_status = statusFilter.toLowerCase(); 
      }

      const res = await api.get('/api/reservations', { params });
      if (res.data && res.data.data) {
        setRequests(res.data.data.data);
        setTotalItems(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, statusFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      let extractedBid = parseInt(newRequestForm.beneficiary_id);

      if (isNaN(extractedBid) && beneficiarySearchQuery) {
        const match = beneficiarySearchQuery.match(/BID:\s*(\d+)/);
        if (match) {
          extractedBid = parseInt(match[1]);
        } else if (!isNaN(Number(beneficiarySearchQuery))) {
          extractedBid = parseInt(beneficiarySearchQuery);
        }
      }

      if (isNaN(extractedBid) || !extractedBid) {
        throw new Error("Please select a valid beneficiary from the dropdown.");
      }

      const requestedVolume = parseFloat(newRequestForm.volume_ml);

      if (requestedVolume < 10) {
        throw new Error("Requested volume is too low. Minimum request is 10 mL.");
      }
      if (requestedVolume > 999) {
        throw new Error("Requested volume exceeds the maximum limit (999 mL). Please submit separate requests if more is needed.");
      }

      const payload = {
        beneficiary_id: extractedBid, 
        bid: extractedBid,            
        volume_ml: requestedVolume,
        requested_vol_ml: requestedVolume,
        hospital: newRequestForm.hospital || undefined 
      };

      await api.post('/api/reservations', payload);
      
      setIsRegisterOpen(false);
      setNewRequestForm({ beneficiary_id: '', hospital: '', volume_ml: '' });
      setBeneficiarySearchQuery('');
      fetchRequests();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const requestedVolume = parseFloat(editRequestForm.volume_ml);

      if (requestedVolume < 10 || requestedVolume > 999) {
        throw new Error("Requested volume must be between 10 mL and 999 mL.");
      }

      await api.put(`/api/reservations/${editRequestForm.rid}`, {
        requested_vol_ml: requestedVolume,
        hospital: editRequestForm.hospital || undefined
      });
      
      setIsEditOpen(false);
      fetchRequests();
      if (selectedRequest?.rid === editRequestForm.rid) {
        setSelectedRequest(null);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACTION CONFIRMATION EXECUTION ---
  const executeConfirmAction = async () => {
    if (!selectedRequest || !confirmAction) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (confirmAction === 'dispense') {
        await api.patch(`/api/dispensing/${selectedRequest.rid}/dispense`);
      } else if (confirmAction === 'cancel') {
        await api.patch(`/api/reservations/${selectedRequest.rid}/cancel`);
      } else if (confirmAction === 'delete') {
        await api.delete(`/api/reservations/${selectedRequest.rid}`);
      }
      
      fetchRequests();
      setConfirmAction(null);
      setSelectedRequest(null); // Close the detail modal after success
    } catch (error: any) {
      setActionError(error.response?.data?.message || `Failed to process request.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditFormFromModal = () => {
    if (!selectedRequest) return;
    setEditRequestForm({
      rid: selectedRequest.rid,
      hospital: selectedRequest.hospital || '',
      volume_ml: selectedRequest.requested_vol_ml.toString()
    });
    setIsEditOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'dispensed':
      case 'fulfilled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'waiting':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'allocated':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'canceled':
      case 'declined':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="requests" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Milk Requests</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <Link
              href="/work/notification"
              className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200"
            >
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
                  placeholder="Search request ID or hospital..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                />
              </div>

              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[140px]"
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Waiting', label: 'Waiting' },
                  { value: 'Allocated', label: 'Allocated' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Canceled', label: 'Canceled' }
                ]}
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">Show:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 1)}
                  className="w-16 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/15 transition-all text-center"
                />
              </div>
            </div>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shrink-0 shadow-[0_4px_12px_rgba(0,105,111,0.15)] hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus className="size-4 stroke-[3px]" />
              New Request
            </button>
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('rid')}>
                      Req ID {sortBy === 'rid' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('bid')}>
                      Beneficiary {sortBy === 'bid' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('hospital')}>
                      Hospital {sortBy === 'hospital' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('requested_vol_ml')}>
                      Volume {sortBy === 'requested_vol_ml' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('requested_date')}>
                      Date {sortBy === 'requested_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    [...Array(limit || 5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse pointer-events-none">
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : requests.map((item) => (
                    <tr
                      key={item.rid}
                      onClick={() => setSelectedRequest(item)}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{item.rid}</td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{item.beneficiary?.name || `BID: ${item.bid}`}</td>
                      <td className="px-6 py-4.5 text-neutral-600">{item.hospital || 'N/A'}</td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900 text-left">{item.requested_vol_ml} mL</td>
                      <td className="px-6 py-4.5 text-neutral-500">{item.requested_date ? new Date(item.requested_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize uppercase tracking-wider ${getStatusBadge(item.request_status)}`}>
                          {item.request_status || 'Waiting'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-neutral-400">
                        No requests found matching current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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

      {/* NEW REQUEST MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
          >
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">New Milk Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-bold overflow-visible">
              {formError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-2xl border border-red-100 flex items-start gap-3">
                  <Info className="size-5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}
              
              <div className="space-y-1.5 relative z-50">
                <label className="text-neutral-500">Beneficiary Search *</label>
                <input
                  type="text"
                  required
                  value={beneficiarySearchQuery}
                  onChange={(e) => {
                    setBeneficiarySearchQuery(e.target.value);
                    setShowBeneficiaryDropdown(true);
                    if (!e.target.value) setNewRequestForm({ ...newRequestForm, beneficiary_id: '' });
                  }}
                  onFocus={() => setShowBeneficiaryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBeneficiaryDropdown(false), 200)}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                  placeholder="Search beneficiary name..."
                />
                {isSearchingBeneficiaries && (
                  <div className="absolute right-4 top-10 size-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                )}
                {showBeneficiaryDropdown && beneficiarySearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {beneficiarySearchResults.map(ben => (
                      <div
                        key={ben.bid}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-neutral-100 last:border-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewRequestForm({ ...newRequestForm, beneficiary_id: ben.bid.toString() });
                          setBeneficiarySearchQuery(`${ben.name} (BID: ${ben.bid})`);
                          setShowBeneficiaryDropdown(false);
                        }}
                      >
                        <div className="font-bold text-sm text-neutral-800">{ben.name}</div>
                        <div className="text-xs text-neutral-500 font-medium mt-0.5">BID: {ben.bid}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-500">Hospital / Facility Name (Optional)</label>
                <input
                  type="text"
                  value={newRequestForm.hospital}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, hospital: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                  placeholder="e.g. Makati Medical Center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-500">Requested Volume (mL) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={999}
                  value={newRequestForm.volume_ml}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, volume_ml: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm font-bold"
                  placeholder="e.g. 200"
                />
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT REQUEST MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
          >
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Edit Milk Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-bold overflow-visible">
              {formError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-2xl border border-red-100 flex items-start gap-3">
                  <Info className="size-5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-neutral-500">Request ID</label>
                <input
                  type="text"
                  disabled
                  value={`REQ-${editRequestForm.rid}`}
                  className="w-full border border-neutral-200 bg-neutral-100 rounded-xl px-4 py-2.5 text-neutral-500 text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-500">Hospital / Facility Name (Optional)</label>
                <input
                  type="text"
                  value={editRequestForm.hospital}
                  onChange={(e) => setEditRequestForm({ ...editRequestForm, hospital: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                  placeholder="e.g. Makati Medical Center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-500">Requested Volume (mL) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={999}
                  value={editRequestForm.volume_ml}
                  onChange={(e) => setEditRequestForm({ ...editRequestForm, volume_ml: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm font-bold"
                />
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REQUEST DETAILS MODAL (POOL MANAGEMENT STYLE) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <FileText className="size-6 text-brand-teal" />
                Request Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Contextual Status Alert */}
              {selectedRequest.request_status === 'allocated' && (
                <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-2xl flex items-start gap-3">
                  <Info className="size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Bottles Allocated</p>
                    <p className="mt-0.5 opacity-90">Milk bottles have been reserved for this request. It is ready to be dispensed.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Request ID</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedRequest.rid}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Date Requested</label>
                      <div className="text-sm font-bold text-neutral-800">
                        {selectedRequest.requested_date ? new Date(selectedRequest.requested_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Beneficiary</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedRequest.beneficiary?.name || `BID: ${selectedRequest.bid}`}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Hospital / Facility</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedRequest.hospital || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Requested Volume</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedRequest.requested_vol_ml} mL</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Request Status</label>
                      <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getStatusBadge(selectedRequest.request_status)}`}>
                        {selectedRequest.request_status || 'Waiting'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Traceability */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">Allocated Bottles</label>
                    <div className="bg-slate-50 border border-neutral-100 rounded-2xl overflow-hidden shadow-inner max-h-[250px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-100/50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-150 sticky top-0 z-10 select-none">
                            <th className="px-4 py-2.5">Bottle ID</th>
                            <th className="px-4 py-2.5 text-right">Volume</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-700">
                          {selectedRequest.request_bottles && selectedRequest.request_bottles.length > 0 ? (
                            selectedRequest.request_bottles.map((bottle, idx) => (
                              <tr key={idx} className="hover:bg-slate-100/50 transition-colors">
                                <td className="px-4 py-3.5 font-bold text-neutral-900">BTL-{bottle.pasteurized_milk.btl_id}</td>
                                <td className="px-4 py-3.5 text-right text-neutral-800">{bottle.pasteurized_milk.volume_ml} mL</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-neutral-400 font-medium">
                                No bottles allocated yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Mirrored from Pool Management) */}
            <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end bg-slate-50/50 shrink-0">
              <button
                onClick={() => setConfirmAction('delete')}
                className="px-6 py-3 text-red-600 hover:bg-red-50 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="size-4" /> Delete
              </button>
              
              {selectedRequest.request_status === 'waiting' && (
                <button
                  onClick={openEditFormFromModal}
                  className="px-6 py-3 text-brand-teal hover:bg-brand-teal/10 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                >
                  <Edit2 className="size-4" /> Edit
                </button>
              )}

              {['waiting', 'allocated'].includes(selectedRequest.request_status?.toLowerCase()) && (
                <button
                  onClick={() => setConfirmAction('cancel')}
                  className="px-6 py-3 text-amber-600 hover:bg-amber-50 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                >
                  <XCircle className="size-4" /> Cancel
                </button>
              )}

              {['waiting', 'allocated'].includes(selectedRequest.request_status?.toLowerCase()) && (
                <button
                  onClick={() => setConfirmAction('dispense')}
                  className="px-6 py-3 text-white bg-brand-teal hover:bg-brand-teal/90 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-brand-teal/20"
                >
                  <CheckCircle2 className="size-4" /> Dispense
                </button>
              )}

              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl transition-colors ml-2 shadow-lg shadow-neutral-900/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL (Mirrors the Logout UI) */}
      {confirmAction && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {confirmAction === 'delete' ? (
                  <Trash2 className="size-5 text-red-500" />
                ) : confirmAction === 'cancel' ? (
                  <AlertTriangle className="size-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="size-5 text-brand-teal" />
                )}
                <h3 className="text-base font-bold text-neutral-900 capitalize">
                  Confirm {confirmAction}
                </h3>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed">
                {confirmAction === 'delete' 
                  ? `Are you sure you want to permanently delete Request #${selectedRequest.rid}? This action cannot be undone and will erase it from the database.`
                  : confirmAction === 'cancel'
                  ? `Are you sure you want to cancel Request #${selectedRequest.rid}? Any allocated milk will be returned to inventory.`
                  : `Are you sure you want to dispense milk for Request #${selectedRequest.rid}? This marks the request as fulfilled.`}
              </p>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-medium animate-in fade-in duration-200">
                  {actionError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={executeConfirmAction}
                  disabled={actionLoading}
                  className={`flex-1 h-11 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    confirmAction === 'delete' ? 'bg-red-500 hover:bg-red-600' :
                    confirmAction === 'cancel' ? 'bg-amber-500 hover:bg-amber-600' :
                    'bg-brand-teal hover:bg-brand-teal-darker'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <span className="capitalize">{confirmAction}</span>
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