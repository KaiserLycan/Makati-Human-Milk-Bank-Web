'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  Calendar
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import StaffNotificationBell from './ui/staff-notification-bell';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

// --- CUSTOM DROPDOWN COMPONENT ---
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

  // --- Search & Pagination State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sortBy, setSortBy] = useState('performed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // --- Dropdown Filter States ---
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [serverTotalItems, setServerTotalItems] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  // --- Options Generators ---
  const monthOptions = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [{ value: '', label: 'All Years' }];
    for (let i = 0; i <= 5; i++) { // Shows current year down to 5 years ago
      options.push({ value: String(currentYear - i), label: String(currentYear - i) });
    }
    return options;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let start_date = undefined;
        let end_date = undefined;

        // Smarter Date Logic handling separate Month and Year
        if (filterYear || filterMonth) {
          const y = filterYear ? Number(filterYear) : new Date().getFullYear();
          
          if (filterMonth) {
            const m = Number(filterMonth);
            start_date = new Date(y, m - 1, 1).toISOString();
            end_date = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
          } else {
            // Only year is selected, grab the whole year
            start_date = new Date(y, 0, 1).toISOString();
            end_date = new Date(y, 11, 31, 23, 59, 59, 999).toISOString();
          }
        }

        const response = await api.get('/api/audit-logs', {
          params: {
            page: page,
            limit: limit,
            search: debouncedSearch,
            sortBy: sortBy,
            sortOrder: sortOrder,
            action_performed: filterAction || undefined,
            table_name: filterTable || undefined,
            start_date: start_date,
            end_date: end_date
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
        setServerTotalItems(0);
        setServerTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudits();
  }, [page, limit, debouncedSearch, sortBy, sortOrder, filterAction, filterTable, filterMonth, filterYear]);

  // Reset to page 1 if any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit, sortBy, sortOrder, filterAction, filterTable, filterMonth, filterYear]);

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
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by User"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                />
              </div>

              <CustomDropdown
                value={filterAction}
                onChange={setFilterAction}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[130px]"
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'CREATE', label: 'CREATE' },
                  { value: 'UPDATE', label: 'UPDATE' },
                  { value: 'DELETE', label: 'DELETE' },
                  { value: 'LOGIN', label: 'LOGIN' },
                  { value: 'LOGOUT', label: 'LOGOUT' }
                ]}
              />

              <CustomDropdown
                value={filterTable}
                onChange={setFilterTable}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[130px]"
                options={[
                  { value: '', label: 'All Tables' },
                  { value: 'beneficiary', label: 'Beneficiary' },
                  { value: 'donor', label: 'Donor' },
                  { value: 'pasteurized_milk', label: 'Pasteurized Milk' },
                  { value: 'pool_milk', label: 'Pool Milk' },
                  { value: 'raw_milk', label: 'Raw Milk' },
                  { value: 'request', label: 'Request' },
                  { value: 'request_bottles', label: 'Request Bottles' },
                  { value: 'user', label: 'User' }
                ]}
              />

              <CustomDropdown
                value={filterMonth}
                onChange={setFilterMonth}
                icon={Calendar}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[125px]"
                options={monthOptions}
              />

              <CustomDropdown
                value={filterYear}
                onChange={setFilterYear}
                icon={Calendar}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[110px]"
                options={getYearOptions()}
              />

            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                      ID {sortBy === 'log_id' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                    [...Array(limit || 5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse pointer-events-none">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                      </tr>
                    ))
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400">No audit records found matching your filters.</td>
                    </tr>
                  ) : (
                    audits.map((audit) => (
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

            {!isLoading && serverTotalPages > 1 && (
              <div className="bg-white border-t border-neutral-100 px-8 py-4 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, serverTotalItems)} of {serverTotalItems} total entries
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    disabled={page === serverTotalPages}
                    onClick={() => setPage(page + 1)}
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
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">User</label>
                    <div className="text-sm font-bold text-neutral-800 break-words">
                      {selectedAudit.user?.name ?? selectedAudit.modified_by}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Timestamp</label>
                    <div className="text-sm font-bold text-neutral-800">
                      {new Date(selectedAudit.performed_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Table Affected</label>
                    <div className="text-sm font-bold text-neutral-800">
                      {selectedAudit.table_name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Action Performed</label>
                    <div className="text-sm font-bold text-neutral-800">
                      {selectedAudit.action_performed}
                    </div>
                  </div>
                </div>

                {selectedAudit.old_data && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Old Data</label>
                    <pre className="bg-slate-50 border border-neutral-100 rounded-xl p-3.5 font-semibold text-neutral-700 leading-normal text-[10px] overflow-x-auto">
                      {JSON.stringify(selectedAudit.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedAudit.new_data && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">New Data</label>
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