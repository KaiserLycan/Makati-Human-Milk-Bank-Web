'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import StaffNotificationBell from './ui/staff-notification-bell';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

interface AuditLogEntry {
  log_id: number;
  modified_by: string;
  action_performed: string;
  table_name: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_at: string;
  user: {
    user_id: string;
    name: string;
    role: string;
    email: string;
  };
}

export default function StaffAuditsManagement() {
  const { user, isLoading: authLoading } = useAuth();

  const [currentTime, setCurrentTime] = useState('');
  const [audits, setAudits] = useState<AuditLogEntry[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('performed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/api/audit-logs');
        setAudits(response.data.data ?? response.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load audit logs.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudits();
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

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getProcessedAudits = () => {
    let result = Array.isArray(audits) ? [...audits] : [];

    if (search.trim() !== '') {
      result = result.filter(
        (a) =>
          a.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.action_performed.toLowerCase().includes(search.toLowerCase()) ||
          a.table_name.toLowerCase().includes(search.toLowerCase()) ||
          String(a.log_id).includes(search)
      );
    }

    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortBy === 'performed_at') {
        aVal = a.performed_at;
        bVal = b.performed_at;
      } else if (sortBy === 'user') {
        aVal = a.user?.name?.toLowerCase() ?? '';
        bVal = b.user?.name?.toLowerCase() ?? '';
      } else if (sortBy === 'action_performed') {
        aVal = a.action_performed.toLowerCase();
        bVal = b.action_performed.toLowerCase();
      } else {
        aVal = String(a.log_id);
        bVal = String(b.log_id);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processed = getProcessedAudits();
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = processed.slice((page - 1) * limit, page * limit);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-neutral-400 text-sm font-medium" data-testid="auth-loading">
          Loading...
        </p>
      </div>
    );
  }

  if (user && user.role !== 'manager') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 text-center font-sans">
        <div className="bg-slate-800 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden space-y-6">
          <div className="size-20 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="size-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Access Denied</h3>
            <p className="text-sm text-slate-400 leading-normal">
              You do not have manager permissions to view system logs and audit records.
            </p>
          </div>
          <Link
            href="/work/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shadow-md"
            data-testid="access-denied-home-btn"
          >
            Return to Dashboard
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="audits" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">System Audits</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <StaffNotificationBell />
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
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

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm font-medium"
              data-testid="error-message"
            >
              {error}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="audits-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('log_id')} data-testid="th-id">
                      Log ID {sortBy === 'log_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('performed_at')} data-testid="th-timestamp">
                      Timestamp {sortBy === 'performed_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('user')} data-testid="th-user">
                      User {sortBy === 'user' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('action_performed')} data-testid="th-action">
                      Action {sortBy === 'action_performed' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4">Table</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400" data-testid="loading-state">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400" data-testid="empty-state">
                        No audit records found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    pagedItems.map((audit) => (
                      <tr
                        key={audit.log_id}
                        onClick={() => setSelectedAudit(audit)}
                        className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                        data-testid={`row-${audit.log_id}`}
                      >
                        <td className="px-6 py-4 font-bold text-neutral-900">{audit.log_id}</td>
                        <td className="px-6 py-4 text-neutral-500">{new Date(audit.performed_at).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-neutral-900">{audit.user?.name ?? audit.modified_by}</td>
                        <td className="px-6 py-4 text-neutral-800 font-bold">{audit.action_performed}</td>
                        <td className="px-6 py-4 text-neutral-500 font-normal truncate max-w-[200px]">{audit.table_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="bg-white border-t border-neutral-100 px-8 py-4 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

      {selectedAudit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4"
          data-testid="detail-modal"
        >
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Audit Log Details</h3>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-teal">
                  <History className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-audit-action">
                    {selectedAudit.action_performed}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Log ID: <span className="text-neutral-900" data-testid="modal-audit-id">{selectedAudit.log_id}</span>
                  </p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">User:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-audit-user">
                    {selectedAudit.user?.name ?? selectedAudit.modified_by}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Timestamp:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-audit-timestamp">
                    {new Date(selectedAudit.performed_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Table:</span>
                  <span className="font-bold text-neutral-800" data-testid="modal-audit-table">
                    {selectedAudit.table_name}
                  </span>
                </div>
                {selectedAudit.old_data && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-neutral-400 font-semibold block">Old Data:</span>
                    <pre className="bg-slate-50 border border-neutral-100 rounded-xl p-3.5 font-semibold text-neutral-700 leading-normal text-[10px] overflow-x-auto" data-testid="modal-audit-old-data">
                      {JSON.stringify(selectedAudit.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedAudit.new_data && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-neutral-400 font-semibold block">New Data:</span>
                    <pre className="bg-slate-50 border border-neutral-100 rounded-xl p-3.5 font-semibold text-neutral-700 leading-normal text-[10px] overflow-x-auto" data-testid="modal-audit-new-data">
                      {JSON.stringify(selectedAudit.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}