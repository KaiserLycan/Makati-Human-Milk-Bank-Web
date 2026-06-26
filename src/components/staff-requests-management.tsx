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
  Edit2,     // Added for Edit action
  Trash2,    // Added for Delete action
  Milk       // Added for Traceability icon
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
  };
  // NEW: Added request_bottles for traceability
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
  const [isEditOpen, setIsEditOpen] = useState(false); // NEW: Edit Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
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

      if (requestedVolume < 20) {
        throw new Error("Requested volume is too low. Minimum request is 20 mL.");
      }
      if (requestedVolume > 800) {
        throw new Error("Requested volume exceeds the maximum limit (800 mL). Please submit separate requests if more is needed.");
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
      // Backend now sends the exact duplicate constraint error, so we display it directly!
      setFormError(err.response?.data?.message || err.message || 'Failed to create request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW Action: Edit
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

  // Action: Cancel
  const handleCancelRequest = async (rid: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    if (!confirm(`Are you sure you want to cancel Request #${rid}?`)) return;
    
    try {
      await api.patch(`/api/reservations/${rid}/cancel`);
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  // NEW Action: Delete (Admin Purge)
  const handleDeleteRequest = async (rid: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete Request #${rid}? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/api/reservations/${rid}`);
      fetchRequests();
      if (selectedRequest?.rid === rid) setSelectedRequest(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete request');
    }
  };

  // Action: Dispense (Complete)
  const handleDispenseRequest = async (rid: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    if (!confirm(`Are you ready to dispense milk and fulfill Request #${rid}?`)) return;

    try {
      await api.patch(`/api/dispensing/${rid}/dispense`);
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to dispense request');
    }
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
                    <th className="px-6 py-4 text-center">Actions</th> 
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
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded w-16 mx-auto"></div></td>
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
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${getStatusBadge(item.request_status)}`}>
                          {item.request_status || 'Waiting'}
                        </span>
                      </td>
                      
                      {/* QUICK ACTIONS CELL */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* Edit Action - Only for Waiting requests */}
                          {item.request_status?.toLowerCase() === 'waiting' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditRequestForm({
                                  rid: item.rid,
                                  hospital: item.hospital || '',
                                  volume_ml: item.requested_vol_ml.toString()
                                });
                                setIsEditOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Edit Request"
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}

                          {['waiting', 'allocated'].includes(item.request_status?.toLowerCase()) ? (
                            <>
                              <button 
                                onClick={(e) => handleDispenseRequest(item.rid, e)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Dispense Milk"
                              >
                                <CheckCircle2 className="size-4" />
                              </button>
                              <button 
                                onClick={(e) => handleCancelRequest(item.rid, e)}
                                className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                title="Cancel Request"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </>
                          ) : null}

                          {/* Delete Action - Available for all to clear ghosts/tests */}
                          <button 
                            onClick={(e) => handleDeleteRequest(item.rid, e)}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Permanently Delete Request"
                          >
                            <Trash2 className="size-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-neutral-400">
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
                  min={20}
                  max={800}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
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
                  min={20}
                  max={800}
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

      {/* REQUEST DETAILS MODAL (WITH TRACEABILITY) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden max-h-[90vh]">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Request Details</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-teal">
                  <FileText className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-950 text-base">
                    {selectedRequest.beneficiary?.name || `BID: ${selectedRequest.bid}`}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Request ID: <span className="text-neutral-900">{selectedRequest.rid}</span>
                  </p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Hospital className="size-4 text-neutral-400" /> Hospital / Facility:
                  </span>
                  <span className="font-bold text-neutral-800">{selectedRequest.hospital || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Requested Volume:</span>
                  <span className="font-bold text-neutral-800">{selectedRequest.requested_vol_ml} mL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Date Requested:</span>
                  <span className="font-bold text-neutral-800">
                    {selectedRequest.requested_date ? new Date(selectedRequest.requested_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Status:</span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full capitalize ${getStatusBadge(selectedRequest.request_status)}`}>
                    {selectedRequest.request_status || 'Waiting'}
                  </span>
                </div>
              </div>

              {/* NEW: Traceability Section */}
              {selectedRequest.request_bottles && selectedRequest.request_bottles.length > 0 && (
                <>
                  <hr className="border-neutral-100" />
                  <div className="space-y-3 text-xs">
                    <h5 className="font-bold text-neutral-900 flex items-center gap-2">
                      <Milk className="size-4 text-brand-teal" /> Allocated Bottles
                    </h5>
                    <div className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] text-neutral-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5 font-bold">Bottle ID</th>
                            <th className="px-4 py-2.5 font-bold text-right">Volume</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-bold text-neutral-700">
                          {selectedRequest.request_bottles.map((bottle, idx) => (
                            <tr key={idx} className="hover:bg-neutral-100/50 transition-colors">
                              <td className="px-4 py-3">BTL-{bottle.pasteurized_milk.btl_id}</td>
                              <td className="px-4 py-3 text-right">{bottle.pasteurized_milk.volume_ml} mL</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5 shrink-0">
              {['waiting', 'allocated'].includes(selectedRequest.request_status?.toLowerCase()) ? (
                <>
                  <button
                    onClick={(e) => handleCancelRequest(selectedRequest.rid, e as any)}
                    className="px-5 py-2.5 text-xs font-bold text-amber-600 hover:text-white hover:bg-amber-500 border border-amber-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel Request
                  </button>
                  <button
                    onClick={(e) => handleDispenseRequest(selectedRequest.rid, e as any)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_2px_8px_rgba(0,105,111,0.15)] cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="size-4" />
                    Dispense & Fulfill
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}