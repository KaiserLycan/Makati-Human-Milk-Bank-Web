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
  Database,
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

  const [dbPage, setDbPage] = useState(1); 
  const [uiPage, setUiPage] = useState(1); 
  const [limit, setLimit] = useState(5);   
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('performed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  

  const [serverTotalItems, setServerTotalItems] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/api/audit-logs', {
          params: {
            page: dbPage,
            limit: 100 
          }
        });

        const fetchedData = response.data?.data?.data || [];
        const meta = response.data?.data?.meta;

        setAudits(Array.isArray(fetchedData) ? fetchedData : []);
        
        if (meta) {
          setServerTotalItems(meta.total || 0);
          setServerTotalPages(meta.totalPages || 1);
        }

      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load audit logs.');
        setAudits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudits();
  }, [dbPage]); 


  useEffect(() => {
    setUiPage(1);
  }, [search, limit, dbPage]);

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      };
      setCurrentTime(date.toLocaleDateString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      const term = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.user?.name?.toLowerCase().includes(term) ||
          a.action_performed.toLowerCase().includes(term) ||
          a.table_name.toLowerCase().includes(term) ||
          String(a.log_id).includes(term)
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
  const totalUiItems = processed.length;
  const totalUiPages = Math.ceil(totalUiItems / limit) || 1;
  const pagedItems = processed.slice((uiPage - 1) * limit, uiPage * limit);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-neutral-400 text-sm font-medium">Loading...</p>
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
          
          {/* TIER 1 PAGINATION: Database Fetch Controls */}
          <div className="bg-brand-teal/5 border border-brand-teal/20 px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-brand-teal/10">
                <Database className="size-5 text-brand-teal" />
              </div>
              <div>
                <span className="text-sm font-bold text-neutral-800 block">
                  Database Batch: {dbPage} of {serverTotalPages}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Loading records {(dbPage - 1) * 100 + 1} to {Math.min(dbPage * 100, serverTotalItems)} out of {serverTotalItems} total
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDbPage(p => p - 1)}
                disabled={dbPage === 1 || isLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-4" /> Load Previous 100
              </button>
              <button
                onClick={() => setDbPage(p => p + 1)}
                disabled={dbPage === serverTotalPages || isLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Load Next 100 <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search current batch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-2.5 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('log_id')}>
                      Log ID {sortBy === 'log_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('performed_at')}>
                      Timestamp {sortBy === 'performed_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('user')}>
                      User {sortBy === 'user' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('action_performed')}>
                      Action {sortBy === 'action_performed' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4">Table</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400">Loading batch...</td>
                    </tr>
                  ) : pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400">No audit records found in this batch.</td>
                    </tr>
                  ) : (
                    pagedItems.map((audit) => (
                      <tr
                        key={audit.log_id}
                        onClick={() => setSelectedAudit(audit)}
                        className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
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

            {/* TIER 2 PAGINATION: Table UI Controls */}
            {!isLoading && totalUiPages > 1 && (
              <div className="bg-white border-t border-neutral-100 px-8 py-4 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>
                  Showing Page {uiPage} of {totalUiPages} (Items {(uiPage - 1) * limit + 1} to {Math.min(uiPage * limit, totalUiItems)})
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={uiPage === 1}
                    onClick={() => setUiPage(uiPage - 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    disabled={uiPage === totalUiPages}
                    onClick={() => setUiPage(uiPage + 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Audit Log Details</h3>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
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
                  <h4 className="font-bold text-neutral-950 text-base">{selectedAudit.action_performed}</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Log ID: <span className="text-neutral-900">{selectedAudit.log_id}</span>
                  </p>
                </div>
              </div>
              <hr className="border-neutral-100" />
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">User:</span>
                  <span className="font-bold text-neutral-800">{selectedAudit.user?.name ?? selectedAudit.modified_by}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Timestamp:</span>
                  <span className="font-bold text-neutral-800">{new Date(selectedAudit.performed_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Table:</span>
                  <span className="font-bold text-neutral-800">{selectedAudit.table_name}</span>
                </div>
                {selectedAudit.old_data && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-neutral-400 font-semibold block">Old Data:</span>
                    <pre className="bg-slate-50 border border-neutral-100 rounded-xl p-3.5 font-semibold text-neutral-700 leading-normal text-[10px] overflow-x-auto">
                      {JSON.stringify(selectedAudit.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedAudit.new_data && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-neutral-400 font-semibold block">New Data:</span>
                    <pre className="bg-slate-50 border border-neutral-100 rounded-xl p-3.5 font-semibold text-neutral-700 leading-normal text-[10px] overflow-x-auto">
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