'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Hospital,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import StaffNotificationBell from './ui/staff-notification-bell';
import {
  loadRequests,
  saveRequests,
  loadAudits,
  saveAudits,
  loadProfile,
  MilkRequest,
  AuditLog,
} from '../utils/storage';

export default function StaffRequestsManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [requests, setRequests] = useState<MilkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MilkRequest | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Modal Visibility states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    beneficiaryName: '',
    hospital: '',
    requestedVolume: '',
  });

  useEffect(() => {
    setRequests(loadRequests());
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
  const getProcessedRequests = () => {
    let result = [...requests];

    // Search filter
    if (search.trim() !== '') {
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(search.toLowerCase()) ||
          r.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
          r.hospital.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortBy === 'beneficiaryName') {
        aVal = a.beneficiaryName.toLowerCase();
        bVal = b.beneficiaryName.toLowerCase();
      } else if (sortBy === 'hospital') {
        aVal = a.hospital.toLowerCase();
        bVal = b.hospital.toLowerCase();
      } else if (sortBy === 'dateRequested') {
        aVal = a.dateRequested;
        bVal = b.dateRequested;
      } else if (sortBy === 'requestedVolume') {
        const diff = a.requestedVolume - b.requestedVolume;
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

  const processed = getProcessedRequests();
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = processed.slice((page - 1) * limit, page * limit);

  // Submit request form
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const volume = parseFloat(newRequestForm.requestedVolume);
    if (isNaN(volume) || volume <= 0) return;

    const profile = loadProfile();
    const newId = `REQ00${requests.length + 1}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newRequest: MilkRequest = {
      id: newId,
      beneficiaryName: newRequestForm.beneficiaryName,
      hospital: newRequestForm.hospital,
      requestedVolume: volume,
      dateRequested: todayStr,
      status: 'Pending',
    };

    const updatedRequests = [newRequest, ...requests];

    // Audit log
    const audits = loadAudits();
    const newAudit: AuditLog = {
      id: `AUD00${audits.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: profile.name,
      action: 'Created Milk Request',
      details: `Created milk request ${newId} for beneficiary ${newRequestForm.beneficiaryName} with volume ${volume}mL`,
    };

    saveRequests(updatedRequests);
    saveAudits([newAudit, ...audits]);

    setRequests(updatedRequests);
    setIsRegisterOpen(false);
    setNewRequestForm({
      beneficiaryName: '',
      hospital: '',
      requestedVolume: '',
    });
  };

  // Status Action (Approve/Decline)
  const handleStatusAction = (reqId: string, newStatus: 'Fulfilled' | 'Declined') => {
    const profile = loadProfile();
    const updatedRequests = requests.map((r) => {
      if (r.id === reqId) {
        return { ...r, status: newStatus };
      }
      return r;
    });

    // Audit log
    const audits = loadAudits();
    const newAudit: AuditLog = {
      id: `AUD00${audits.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: profile.name,
      action: newStatus === 'Fulfilled' ? 'Approved Request' : 'Declined Request',
      details: `${newStatus === 'Fulfilled' ? 'Approved' : 'Declined'} request ${reqId}`,
    };

    saveRequests(updatedRequests);
    saveAudits([newAudit, ...audits]);

    setRequests(updatedRequests);
    if (selectedRequest && selectedRequest.id === reqId) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fulfilled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Declined':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="requests" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Milk Requests</h2>
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
                  placeholder="Search request..."
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
                  <option value="Pending">Pending</option>
                  <option value="Fulfilled">Fulfilled</option>
                  <option value="Declined">Declined</option>
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

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shrink-0 shadow-[0_4px_12px_rgba(0,105,111,0.15)] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              data-testid="new-request-btn"
            >
              <Plus className="size-4 stroke-[3px]" />
              New Request
            </button>
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="requests-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                      Request ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('beneficiaryName')} data-testid="th-beneficiary">
                      Beneficiary {sortBy === 'beneficiaryName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('hospital')} data-testid="th-hospital">
                      Hospital {sortBy === 'hospital' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-right" onClick={() => handleSort('requestedVolume')} data-testid="th-volume">
                      Requested Vol {sortBy === 'requestedVolume' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('dateRequested')} data-testid="th-date">
                      Date Requested {sortBy === 'dateRequested' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {pagedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRequest(item)}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                      data-testid={`row-${item.id}`}
                    >
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{item.id}</td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900">{item.beneficiaryName}</td>
                      <td className="px-6 py-4.5 text-neutral-600">{item.hospital}</td>
                      <td className="px-6 py-4.5 text-right font-bold text-neutral-900">{item.requestedVolume} mL</td>
                      <td className="px-6 py-4.5 text-neutral-500">{item.dateRequested}</td>
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
                        No milk requests found matching current criteria.
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

      {/* NEW REQUEST REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="new-request-modal">
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
                data-testid="close-register-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label htmlFor="req-beneficiary" className="text-neutral-500">Beneficiary Infant Name *</label>
                <input
                  id="req-beneficiary"
                  type="text"
                  required
                  value={newRequestForm.beneficiaryName}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, beneficiaryName: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                  placeholder="e.g. Leo Carter"
                  data-testid="input-beneficiary-name"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="req-hospital" className="text-neutral-500">Hospital / Facility Name *</label>
                <input
                  id="req-hospital"
                  type="text"
                  required
                  value={newRequestForm.hospital}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, hospital: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                  placeholder="e.g. Makati Medical Center"
                  data-testid="input-hospital"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="req-volume" className="text-neutral-500">Requested Volume (mL) *</label>
                <input
                  id="req-volume"
                  type="number"
                  required
                  value={newRequestForm.requestedVolume}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, requestedVolume: e.target.value })}
                  className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm font-bold"
                  placeholder="e.g. 150"
                  data-testid="input-volume"
                />
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                data-testid="cancel-register-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_2px_8px_rgba(0,105,111,0.15)]"
                data-testid="confirm-register-btn"
              >
                Create Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REQUEST DETAILS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="detail-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Request Details</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-teal">
                  <FileText className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-beneficiary-name">
                    {selectedRequest.beneficiaryName}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Request ID: <span className="text-neutral-900" data-testid="modal-request-id">{selectedRequest.id}</span>
                  </p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Hospital className="size-4 text-neutral-400" /> Hospital / Facility:
                  </span>
                  <span className="font-bold text-neutral-800" data-testid="modal-hospital">{selectedRequest.hospital}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Requested Volume:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-volume">{selectedRequest.requestedVolume} mL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Date Requested:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-date">{selectedRequest.dateRequested}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Status:</span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-150 flex items-center justify-end gap-3.5">
              {selectedRequest.status === 'Pending' ? (
                <>
                  <button
                    onClick={() => handleStatusAction(selectedRequest.id, 'Declined')}
                    className="px-5 py-2.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer"
                    data-testid="decline-btn"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleStatusAction(selectedRequest.id, 'Fulfilled')}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_2px_8px_rgba(0,105,111,0.15)] cursor-pointer"
                    data-testid="fulfill-btn"
                  >
                    Fulfill Request
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                  data-testid="close-modal-btn"
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
