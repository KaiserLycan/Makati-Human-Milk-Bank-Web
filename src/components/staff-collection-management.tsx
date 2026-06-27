'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Trash2,
  Edit2,
  ChevronDown
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

export interface RawMilkCollection {
  ctn: number;
  donor?: {
    dtn: number;
    name?: string;
  };
  program: string;
  hospital: string | null;
  health_center: string | null;
  volume_ml: number;
  collected_by_user: {
    user_id: string;
    name: string;
  };
  collection_date: string | null;
  expiration_date: string;
  pickup_date: string | null;
  qat_status: 'pending' | 'pass' | 'fail';
  milk_status: 'good' | 'contaminated' | 'discarded' | 'expired';
  remarks: string | null;
  pid?: number | null;
}

export default function StaffCollectionManagement() {
  const [currentTime, setCurrentTime] = useState('');
  const [collections, setCollections] = useState<RawMilkCollection[]>([]);
  const { user } = useAuth();
  
  // Selection & Modal State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<RawMilkCollection | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<any>>({});
  const [formError, setFormError] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Donor Search State
  const [donorSearchQuery, setDonorSearchQuery] = useState('');
  const [donorSearchResults, setDonorSearchResults] = useState<any[]>([]);
  const [isSearchingDonors, setIsSearchingDonors] = useState(false);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);

  useEffect(() => {
    if (!donorSearchQuery || donorSearchQuery.trim() === '') {
      setDonorSearchResults([]);
      return;
    }
    
    // Don't search if the query is already the selected donor text
    if (donorSearchQuery.includes('(DTN:')) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDonors(true);
      try {
        const response = await api.get('/api/donors', { params: { search: donorSearchQuery, limit: 5 } });
        setDonorSearchResults(response.data.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingDonors(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [donorSearchQuery]);

  // Filters state
  const [searchDtn, setSearchDtn] = useState('');
  const [programFilter, setProgramFilter] = useState('All');
  const [milkStatusFilter, setMilkStatusFilter] = useState('All');
  const [qatStatusFilter, setQatStatusFilter] = useState('All');
  const [poolStatusFilter, setPoolStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Pooling modal state
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [actualVolumeInput, setActualVolumeInput] = useState('');
  const [poolError, setPoolError] = useState('');

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      let mappedSortBy = sortBy;
      if (sortBy === 'id') mappedSortBy = 'ctn';
      if (sortBy === 'donorName') mappedSortBy = 'dtn';
      if (sortBy === 'dateCollected') mappedSortBy = 'collection_date';
      if (sortBy === 'expirationDate') mappedSortBy = 'expiration_date';
      if (sortBy === 'expectedVolume') mappedSortBy = 'volume_ml';
      if (sortBy === 'program') mappedSortBy = 'program';

      const params: any = {
        page,
        limit,
        sortBy: mappedSortBy,
        sortOrder: sortOrder,
      };

      if (searchDtn.trim()) {
        const dtnParsed = parseInt(searchDtn);
        if (!isNaN(dtnParsed)) params.dtn = dtnParsed;
      }

      if (programFilter !== 'All') {
        params.program = programFilter;
      }

      if (milkStatusFilter !== 'All') {
        params.milk_status = milkStatusFilter.toLowerCase();
      }

      if (qatStatusFilter !== 'All') {
        params.qat_status = qatStatusFilter.toLowerCase();
      }

      if (poolStatusFilter !== 'All') {
        params.pool_status = poolStatusFilter.toLowerCase();
      }

      const res = await api.get('/api/collections', { params });
      if (res.data && res.data.data) {
        setCollections(res.data.data.data);
        setTotalItems(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [page, limit, sortBy, sortOrder, milkStatusFilter, qatStatusFilter, searchDtn, programFilter, poolStatusFilter]);

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
  }, [milkStatusFilter, qatStatusFilter, poolStatusFilter, limit, searchDtn, programFilter]);

  // Handle Sort Toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Using Server-side pagination, so pagedItems is just collections
  const pagedItems = collections;

  // Checkbox interactions
  const isCollectable = (item: RawMilkCollection) => item.milk_status?.toLowerCase() === 'good' && item.qat_status?.toLowerCase() === 'pass' && !item.pid;

  const handleSelectRow = (id: number, item: RawMilkCollection) => {
    if (!isCollectable(item)) return; 
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const collectableIds = pagedItems
        .filter(isCollectable)
        .map((item) => item.ctn);
      setSelectedIds(collectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Expected Total
  const expectedTotal = collections
    .filter((c) => selectedIds.includes(c.ctn))
    .reduce((sum, c) => sum + Number(c.volume_ml), 0);

  const openPoolModal = () => {
    if (selectedIds.length === 0) return;
    setActualVolumeInput(expectedTotal.toString());
    setPoolError('');
    setIsPoolModalOpen(true);
  };

  const handlePoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPoolError('');
    const actualVolume = parseFloat(actualVolumeInput);
    if (isNaN(actualVolume) || actualVolume <= 0) {
      setPoolError('Please enter a valid actual volume.');
      return;
    }

    try {
      await api.post('/api/pooling', {
        collections: selectedIds,
        actual_volume_ml: actualVolume,
        remarks: 'Pooled from UI',
      });
      
      setSelectedIds([]);
      setIsPoolModalOpen(false);
      fetchCollections();
    } catch (error: any) {
      console.error(error);
      setPoolError(error.response?.data?.message || 'Failed to pool collections.');
    }
  };

  const handleUpdateMilkStatus = async (ctn: number, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/api/collections/${ctn}/milk-status`, { milk_status: newStatus });
      fetchCollections();
      if (selectedCollection && selectedCollection.ctn === ctn) {
        setSelectedCollection({ ...selectedCollection, milk_status: newStatus as any });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update milk status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateQATStatus = async (ctn: number, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/api/collections/${ctn}/qat-status`, { qat_status: newStatus });
      fetchCollections();
      if (selectedCollection && selectedCollection.ctn === ctn) {
        setSelectedCollection({ ...selectedCollection, qat_status: newStatus as any });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update QAT status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getMilkStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'good': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'contaminated':
      case 'expired':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'discarded':
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const getQATStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'fail':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setFormData({
      program: 'WI',
      volume_ml: '',
      dtn: '',
      expiration_date: '',
      collection_date: '',
      pickup_date: '',
      health_center: '',
      hospital: '',
      remarks: '',
    });
    setFormError('');
    setDonorSearchQuery('');
    setDonorSearchResults([]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = () => {
    if (!selectedCollection) return;
    setFormMode('edit');
    setFormData({
      ...selectedCollection,
      volume_ml: selectedCollection.volume_ml,
      dtn: selectedCollection.donor?.dtn,
      expiration_date: selectedCollection.expiration_date ? new Date(selectedCollection.expiration_date).toISOString().substring(0, 10) : '',
      collection_date: selectedCollection.collection_date ? new Date(selectedCollection.collection_date).toISOString().substring(0, 10) : '',
      pickup_date: selectedCollection.pickup_date ? new Date(selectedCollection.pickup_date).toISOString().substring(0, 10) : '',
    });
    
    if (selectedCollection.donor) {
      setDonorSearchQuery(`${selectedCollection.donor.name} (DTN: ${selectedCollection.donor.dtn})`);
    } else {
      setDonorSearchQuery('');
    }
    
    setFormError('');
    setIsFormOpen(true);
    setSelectedCollection(null);
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
      const payload: any = { ...formData, collected_by: user.user_id };

      if (payload.volume_ml) payload.volume_ml = Number(payload.volume_ml);
      
      // Try to parse dtn from the search query if not explicitly set via dropdown
      if (!payload.dtn && donorSearchQuery) {
        const match = donorSearchQuery.match(/DTN:\s*(\d+)/);
        if (match) {
           payload.dtn = Number(match[1]);
        } else if (!isNaN(Number(donorSearchQuery))) {
           payload.dtn = Number(donorSearchQuery);
        }
      }
      if (payload.dtn) payload.dtn = Number(payload.dtn);
      
      if (!payload.dtn) {
        setFormError('Please select a valid donor.');
        setIsSubmitting(false);
        return;
      }

      // Clean payload based on program
      if (payload.program === 'WI') {
        delete payload.pickup_date;
        delete payload.health_center;
        delete payload.hospital;
      } else if (payload.program === 'ST') {
        delete payload.pickup_date;
        delete payload.hospital;
      } else if (payload.program === 'MA') {
        delete payload.health_center;
        delete payload.hospital;
      } else if (payload.program === 'MW') {
        delete payload.health_center;
      }

      if (!payload.collection_date) delete payload.collection_date;
      if (!payload.pickup_date) delete payload.pickup_date;
      if (!payload.expiration_date) delete payload.expiration_date;

      if (formMode === 'add') {
        await api.post('/api/collections', payload);
      } else {
        await api.put(`/api/collections/${formData.ctn}`, payload);
      }
      setIsFormOpen(false);
      fetchCollections();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/api/collections/${selectedCollection.ctn}`);
      setSelectedCollection(null);
      setIsDeleteConfirmOpen(false);
      fetchCollections();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete collection.');
    } finally {
      setIsDeleting(false);
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
            <StaffNotificationBell />
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Action and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              {/* Program Filter */}
              <CustomDropdown
                value={programFilter}
                onChange={setProgramFilter}
                icon={Layers}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[160px]"
                options={[
                  { value: 'All', label: 'All Programs' },
                  { value: 'WI', label: 'Walk-In (WI)' },
                  { value: 'MA', label: 'MOMS ACT (MA)' },
                  { value: 'MW', label: 'Milky Way (MW)' },
                  { value: 'ST', label: 'SUPSUP TODO (ST)' }
                ]}
              />

              {/* Milk Status Filter */}
              <CustomDropdown
                value={milkStatusFilter}
                onChange={setMilkStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[140px]"
                options={[
                  { value: 'All', label: 'All Milk Status' },
                  { value: 'Good', label: 'Good Milk' },
                  { value: 'Contaminated', label: 'Contaminated' },
                  { value: 'Expired', label: 'Expired' },
                  { value: 'Discarded', label: 'Discarded' }
                ]}
              />

              {/* QAT Status Filter */}
              <CustomDropdown
                value={qatStatusFilter}
                onChange={setQatStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[140px]"
                options={[
                  { value: 'All', label: 'All QAT Status' },
                  { value: 'Pending', label: 'Pending QAT' },
                  { value: 'Pass', label: 'Pass QAT' },
                  { value: 'Fail', label: 'Fail QAT' }
                ]}
              />

              {/* Pool Status Filter */}
              <CustomDropdown
                value={poolStatusFilter}
                onChange={setPoolStatusFilter}
                icon={SlidersHorizontal}
                triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[140px]"
                options={[
                  { value: 'All', label: 'All Pool Status' },
                  { value: 'Pooled', label: 'Pooled' },
                  { value: 'Unpooled', label: 'Unpooled' }
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

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddForm}
                className="px-5 py-2.5 text-sm font-bold text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="size-4" />
                Log
              </button>

              {/* Pool Selected Action Button */}
              {selectedIds.length > 0 && (
                <button
                  onClick={openPoolModal}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shrink-0 shadow-[0_4px_12px_rgba(0,105,111,0.15)] hover:shadow-lg hover:-translate-y-0.5"
                  data-testid="pool-selected-btn"
                >
                  <Layers className="size-4" />
                  Pool ({selectedIds.length})
                </button>
              )}
            </div>
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
                          pagedItems.filter(isCollectable).length > 0 &&
                          pagedItems
                            .filter(isCollectable)
                            .every((i) => selectedIds.includes(i.ctn))
                        }
                        className="size-4 accent-brand-teal rounded cursor-pointer"
                        data-testid="select-all-checkbox"
                      />
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('id')} data-testid="th-id">
                      ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('donorName')} data-testid="th-donor">
                      Donor {sortBy === 'donorName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('program')} data-testid="th-program">
                      Program {sortBy === 'program' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('dateCollected')} data-testid="th-date">
                      Collection {sortBy === 'dateCollected' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-left" onClick={() => handleSort('expirationDate')} data-testid="th-expiration">
                      Expiration {sortBy === 'expirationDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal text-right" onClick={() => handleSort('expectedVolume')} data-testid="th-volume">
                      Volume {sortBy === 'expectedVolume' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Pool</th>
                    <th className="px-6 py-4 text-center">Milk</th>
                    <th className="px-6 py-4 text-center">QAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    [...Array(limit || 5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse pointer-events-none">
                        <td className="px-6 py-4 w-12"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-10"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4.5 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                        <td className="px-6 py-4.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : pagedItems.map((item) => (
                    <tr
                      key={item.ctn}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 transition-colors duration-150 cursor-pointer"
                      onClick={() => setSelectedCollection(item)}
                      data-testid={`row-${item.ctn}`}
                    >
                      <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.ctn)}
                          disabled={!isCollectable(item)}
                          onChange={() => handleSelectRow(item.ctn, item)}
                          className="size-4 accent-brand-teal rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`checkbox-${item.ctn}`}
                        />
                      </td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900 text-left">
                        {item.ctn}
                      </td>
                      <td className="px-6 py-4.5 font-bold text-neutral-900 text-left">
                        {item.donor?.name || `DTN: ${item.donor?.dtn}`}
                      </td>
                      <td className="px-6 py-4.5 font-semibold text-neutral-500 text-left">
                        {item.program}
                      </td>
                      <td className="px-6 py-4.5 text-neutral-500 text-left">{item.collection_date ? new Date(item.collection_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4.5 text-neutral-500 text-left">{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4.5 text-right text-neutral-900">{item.volume_ml} mL</td>
                      <td className="px-6 py-4.5 text-center">
                        {item.pid ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-100">
                            Pooled
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider bg-neutral-50 text-neutral-500 border-neutral-100">
                            Unpooled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getMilkStatusBadge(item.milk_status)}`}>
                          {item.milk_status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getQATStatusBadge(item.qat_status)}`}>
                          {item.qat_status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && pagedItems.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-neutral-400 font-medium font-sans">
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
              {poolError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-2xl border border-red-100 flex items-start gap-3">
                  <Info className="size-5 shrink-0" />
                  <p>{poolError}</p>
                </div>
              )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300" data-testid="detail-modal">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col relative">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50 rounded-t-3xl">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <ClipboardList className="size-6 text-brand-teal" />
                Collection Details
              </h3>
              <button
                onClick={() => setSelectedCollection(null)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Contextual Pooled To Alert - matching completely processed design */}
              {selectedCollection.pid && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-2xl flex items-start gap-3" data-testid="collection-pooled-alert">
                  <Info className="size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Pooled</p>
                    <p className="mt-0.5 opacity-90">This collection is pooled and assigned to PID {selectedCollection.pid}.</p>
                  </div>
                </div>
              )}

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">ID</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-collection-id">{selectedCollection.ctn}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Donor Name</label>
                      <div className="text-sm font-bold text-neutral-800 break-words" data-testid="modal-donor-name">
                        {selectedCollection.donor?.name || `DTN: ${selectedCollection.donor?.dtn}`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Program</label>
                      <div className="text-sm font-bold text-neutral-800">{selectedCollection.program}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Volume</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-expected">{selectedCollection.volume_ml} mL</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Date Collected</label>
                      <div className="text-sm font-bold text-neutral-800" data-testid="modal-date">
                        {selectedCollection.collection_date ? new Date(selectedCollection.collection_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Collected By</label>
                      <div className="text-sm font-bold text-neutral-800 truncate" title={selectedCollection.collected_by_user?.name}>
                        {selectedCollection.collected_by_user?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Expiration Date</label>
                      <div className="text-sm font-bold text-neutral-800">
                        {selectedCollection.expiration_date ? new Date(selectedCollection.expiration_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Pickup Date</label>
                      <div className="text-sm font-bold text-neutral-800">
                        {selectedCollection.pickup_date ? new Date(selectedCollection.pickup_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {(selectedCollection.program === 'MW' || selectedCollection.program === 'MA' || selectedCollection.program === 'ST') && (
                    <div className="grid grid-cols-2 gap-5">
                      {selectedCollection.program === 'MW' && (
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Hospital</label>
                          <div className="text-sm font-bold text-neutral-800 truncate">{selectedCollection.hospital || 'N/A'}</div>
                        </div>
                      )}
                      {(selectedCollection.program === 'MA' || selectedCollection.program === 'ST') && (
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Health Center</label>
                          <div className="text-sm font-bold text-neutral-800 truncate">{selectedCollection.health_center || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedCollection.remarks && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">Remarks</label>
                      <div className="text-sm font-bold text-neutral-800 break-words">
                        {selectedCollection.remarks}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Status / QC Dropdowns */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">Milk Status</label>
                    <div className="relative w-full">
                      {selectedCollection.pid ? (
                        <span className={`flex w-full justify-center px-3 py-1.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getMilkStatusBadge(selectedCollection.milk_status)}`}>
                          {selectedCollection.milk_status}
                        </span>
                      ) : (
                        <CustomDropdown
                          disabled={isUpdatingStatus}
                          triggerClassName={`px-3 py-1.5 text-[10px] font-bold border rounded-full uppercase tracking-wider shadow-sm transition-colors w-full ${getMilkStatusBadge(selectedCollection.milk_status)}`}
                          dropdownClassName="!min-w-[140px] w-full rounded-2xl border-neutral-100 shadow-xl p-1.5"
                          optionClassName="uppercase text-[10px] tracking-wider py-2 px-2 text-center rounded-xl"
                          value={selectedCollection.milk_status}
                          onChange={(val: string) => handleUpdateMilkStatus(selectedCollection.ctn, val)}
                          options={[
                            { value: 'good', label: 'Good' },
                            { value: 'contaminated', label: 'Contaminated' },
                            { value: 'discarded', label: 'Discarded' },
                            { value: 'expired', label: 'Expired' }
                          ]}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2">QAT Status</label>
                    <div className="relative w-full">
                      {selectedCollection.pid ? (
                        <span className={`flex w-full justify-center px-3 py-1.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getQATStatusBadge(selectedCollection.qat_status)}`}>
                          {selectedCollection.qat_status}
                        </span>
                      ) : (
                        <CustomDropdown
                          disabled={isUpdatingStatus}
                          triggerClassName={`px-3 py-1.5 text-[10px] font-bold border rounded-full uppercase tracking-wider shadow-sm transition-colors w-full ${getQATStatusBadge(selectedCollection.qat_status)}`}
                          dropdownClassName="!min-w-[140px] w-full rounded-2xl border-neutral-100 shadow-xl p-1.5"
                          optionClassName="uppercase text-[10px] tracking-wider py-2 px-2 text-center rounded-xl"
                          value={selectedCollection.qat_status}
                          onChange={(val: string) => handleUpdateQATStatus(selectedCollection.ctn, val)}
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'pass', label: 'Pass' },
                            { value: 'fail', label: 'Fail' }
                          ]}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end bg-slate-50/50 rounded-b-3xl items-center">
              <button
                onClick={() => { setDeleteError(''); setIsDeleteConfirmOpen(true); }}
                className="px-4 py-2.5 text-red-650 hover:text-red-750 font-bold text-sm rounded-xl hover:bg-red-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-4" /> Delete
              </button>
              <button
                onClick={handleOpenEditForm}
                className="px-4 py-2.5 text-brand-teal hover:text-brand-teal-darker font-bold text-sm rounded-xl hover:bg-brand-teal/5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="size-4" /> Edit
              </button>
              <button
                onClick={() => setSelectedCollection(null)}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-sm rounded-xl ml-2 shadow-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <ClipboardList className="size-6 text-brand-teal" />
                {formMode === 'add' ? 'Log New Collection' : 'Edit Collection'}
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
              <form id="collection-form" onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Program *</label>
                    <CustomDropdown
                      value={formData.program || 'WI'}
                      onChange={(val: string) => setFormData({ ...formData, program: val })}
                      triggerClassName="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 hover:bg-slate-100 transition-all"
                      dropdownClassName="!min-w-0 w-full rounded-2xl border-neutral-100 shadow-xl p-1 z-[60]"
                      optionClassName="text-sm font-bold py-2.5 px-3 rounded-xl"
                      options={[
                        { value: 'WI', label: 'Walk-In (WI)' },
                        { value: 'ST', label: 'SUPSUP TODO (ST)' },
                        { value: 'MA', label: 'MOMS ACT (MA)' },
                        { value: 'MW', label: 'Milky Way (MW)' }
                      ]}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Donor *</label>
                    <input
                      type="text"
                      required
                      value={donorSearchQuery}
                      onChange={(e) => {
                        setDonorSearchQuery(e.target.value);
                        setShowDonorDropdown(true);
                        if (!e.target.value) setFormData({ ...formData, dtn: '' });
                      }}
                      onFocus={() => setShowDonorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDonorDropdown(false), 200)}
                      className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none placeholder:text-neutral-400 placeholder:font-medium"
                      placeholder="Search donor name or DTN..."
                    />
                    {isSearchingDonors && (
                      <div className="absolute right-4 top-10 size-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                    )}
                    {showDonorDropdown && donorSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                        {donorSearchResults.map(donor => (
                          <div
                            key={donor.dtn}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-neutral-100 last:border-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevents input from losing focus immediately
                              setFormData({ ...formData, dtn: donor.dtn });
                              setDonorSearchQuery(`${donor.name} (DTN: ${donor.dtn})`);
                              setShowDonorDropdown(false);
                            }}
                          >
                            <div className="font-bold text-sm text-neutral-800">{donor.name}</div>
                            <div className="text-xs text-neutral-500 font-medium mt-0.5">DTN: {donor.dtn} | {donor.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Volume (mL) *</label>
                    <input
                      type="number"
                      required
                      min={formData.program === 'WI' ? 30 : 0}
                      max={formData.program === 'WI' ? 240 : undefined}
                      value={formData.volume_ml || ''}
                      onChange={(e) => setFormData({ ...formData, volume_ml: e.target.value })}
                      className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none placeholder:text-neutral-400 placeholder:font-medium"
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Expiration Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiration_date || ''}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                      className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
                      Collection Date {formData.program === 'MA' || formData.program === 'MW' ? '*' : ''}
                    </label>
                    <input
                      type="date"
                      required={formData.program === 'MA' || formData.program === 'MW'}
                      value={formData.collection_date || ''}
                      onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                      className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                    />
                  </div>
                  {(formData.program === 'MA' || formData.program === 'MW') && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Pickup Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.pickup_date || ''}
                        onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                        className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none"
                      />
                    </div>
                  )}
                </div>

                {formData.program === 'ST' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Health Center *</label>
                    <input
                      type="text"
                      required
                      value={formData.health_center || ''}
                      onChange={(e) => setFormData({ ...formData, health_center: e.target.value })}
                      className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none placeholder:text-neutral-400 placeholder:font-medium"
                      placeholder="e.g. Makati Health Center"
                    />
                  </div>
                )}

                {formData.program === 'MW' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Hospital *</label>
                    <input
                      type="text"
                      required
                      value={formData.hospital || ''}
                      onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                      className="w-full text-sm font-bold text-neutral-800 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all outline-none placeholder:text-neutral-400 placeholder:font-medium"
                      placeholder="e.g. Makati Medical Center"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">Remarks</label>
                  <textarea
                    rows={2}
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
                form="collection-form"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-brand-teal hover:bg-brand-teal/90 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-brand-teal/20"
              >
                {isSubmitting ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ClipboardList className="size-5" />
                )}
                {formMode === 'add' ? 'Submit Collection' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && selectedCollection && (
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
                Are you sure you want to delete collection CTN #{selectedCollection.ctn}? This action cannot be undone and will erase it from the database.
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
                  onClick={handleDeleteCollection}
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
