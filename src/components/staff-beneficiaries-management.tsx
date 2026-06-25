'use client';
import { api } from '../utils/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Users,
  Baby,
  Combine,
  Database,
  ClipboardList,
  UserCheck,
  History,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Check,
  User,
  MapPin,
  Phone,
  Mail,
  FileDown,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';

interface Beneficiary {
  id: string;
  infantFirstName: string;
  infantMiddleName: string;
  infantLastName: string;
  infantDob: string;
  infantWeight: string;
  feedingRequirement: string;
  parentFirstName: string;
  parentMiddleName: string;
  parentLastName: string;
  address: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
  dateJoined: string;
  prescriptionFileName: string | null;
  clinicalAbstractFileName: string | null;
}

interface ApplicantBeneficiary {
  id: string;
  infantFirstName: string;
  infantMiddleName: string;
  infantLastName: string;
  infantDob: string;
  infantWeight: string;
  feedingRequirement: string;
  parentFirstName: string;
  parentMiddleName: string;
  parentLastName: string;
  address: string;
  phone: string;
  email: string;
  application_status: 'Approved' | 'Pending' | 'Rejected';
  dateApplied: string;
  prescriptionFileName: string | null;
  clinicalAbstractFileName: string | null;
}

interface StaffBeneficiariesManagementProps {
  mode: 'beneficiaries' | 'applicants';
}

export default function StaffBeneficiariesManagement({ mode }: StaffBeneficiariesManagementProps) {
  // Navigation Collapsibles
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  // Main list states
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [applicants, setApplicants] = useState<ApplicantBeneficiary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Inline feedback toast (replaces alert())
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Helper to split full name into first, middle, and last components
  const splitFullName = (fullName: string) => {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === '') {
      return { first: '', middle: '', last: '' };
    }
    if (parts.length === 1) {
      return { first: parts[0], middle: '', last: '' };
    }
    if (parts.length === 2) {
      return { first: parts[0], middle: '', last: parts[1] };
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    const middle = parts.slice(1, parts.length - 1).join(' ');
    return { first, middle, last };
  };

  const fetchBeneficiariesData = async () => {
    try {
      setIsLoadingData(true);
      const response = await api.get('/api/beneficiaries');

      // Look at the console log you provided:
      // response.data (the whole object) -> .data (the inner object) -> .data (the array)
      const payload = response.data?.data?.data;

      if (!Array.isArray(payload)) {
        console.error("Data received is not an array:", payload);
        return; // Stop if it's not an array
      }

      const mappedData = payload.map((b: any) => {
        const infantNames = splitFullName(b.name);
        const caregiverParts = (b.caregiver || '').split('|');
        const parentFullNameClean = caregiverParts[0] || '';
        const extractedAddress = caregiverParts[1] ? caregiverParts[1].trim() : (b.address || '');

        const parentNames = splitFullName(parentFullNameClean);
        // If the weight is stored as kg (e.g. 2.5), convert to grams (e.g. 2500)
        const weightInGrams = b.weight_kg ? (parseFloat(b.weight_kg) * 1000).toFixed(0) : '0';

        return {
          id: b.bid?.toString() || 'N/A',
          name: b.name || 'N/A',
          infantFirstName: infantNames.first,
          infantMiddleName: infantNames.middle,
          infantLastName: infantNames.last,
          infantDob: b.birth_date ? new Date(b.birth_date).toISOString().split('T')[0] : 'N/A',
          infantWeight: weightInGrams,
          feedingRequirement: b.feeding_requirement_ml?.toString() || '0',
          parentFirstName: parentNames.first,
          parentMiddleName: parentNames.middle,
          parentLastName: parentNames.last,
          address: extractedAddress,
        phone: b.caregiver_phone || '',
        email: b.caregiver_email || '',
        status: (b.account_status === 'active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive' | 'Pending',
        dateJoined: b.joined_date ? new Date(b.joined_date).toISOString().split('T')[0] : 'N/A',
        prescriptionFileName: b.profile?.prescription_details || null,
        clinicalAbstractFileName: b.profile?.clinical_abstract || null,
        application_status: (b.application_status === 'pending' ? 'Pending' : (b.account_status === 'active' ? 'Approved' : 'Rejected')) as 'Approved' | 'Pending' | 'Rejected',
        dateApplied: b.joined_date ? new Date(b.joined_date).toISOString().split('T')[0] : 'N/A'
      };
    });

      setBeneficiaries(mappedData.filter((b: any) => b.application_status !== 'Pending'));
      setApplicants(mappedData.filter((b: any) => b.application_status === 'Pending'));
    } catch (error) {
      console.error("Failed to fetch beneficiaries:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleBeneficiaryAction = async (action: 'approve' | 'reject' | 'toggle' | 'delete', bid: string) => {
    try {
      if (action === 'approve') await api.patch(`/api/beneficiaries/approve/${bid}`);
      else if (action === 'reject') await api.patch(`/api/beneficiaries/reject/${bid}`);
      else if (action === 'toggle') await api.patch(`/api/beneficiaries/toggle-status/${bid}`);
      else if (action === 'delete') await api.delete(`/api/beneficiaries/${bid}`);

      // Refresh the table after the action
      fetchBeneficiariesData();

      // Close the modal
      setSelectedBeneficiary(null);
      setSelectedApplicant(null);

      showFeedback(`Successfully performed ${action} action.`, 'success');
    } catch (error) {
      console.error(`Failed to ${action} beneficiary:`, error);
      showFeedback(`Failed to ${action} beneficiary.`, 'error');
    }
  };

  useEffect(() => {
    fetchBeneficiariesData();
  }, [mode]); // Triggers when component mounts or mode switches

  // Query Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Selected item for Detail Modal
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantBeneficiary | null>(null);

  // Modal Visibility states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState(1); // 1: Infant Details, 2: Parent/Guardian Details, 3: Document Uploads

  // Register New Beneficiary Form State
  const [newBeneficiaryForm, setNewBeneficiaryForm] = useState({
    infantFirstName: '',
    infantMiddleName: '',
    infantLastName: '',
    infantDob: '',
    infantWeight: '',
    feedingRequirement: '',
    parentFirstName: '',
    parentMiddleName: '',
    parentLastName: '',
    address: '',
    phone: '',
    email: '',
    prescriptionFileName: '',
    clinicalAbstractFileName: '',
  });

  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [clinicalAbstractFile, setClinicalAbstractFile] = useState<File | null>(null);

  // Edit Beneficiary Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBeneficiaryForm, setEditBeneficiaryForm] = useState({
    id: '',
    infantFirstName: '',
    infantMiddleName: '',
    infantLastName: '',
    infantDob: '',
    infantWeight: '',
    feedingRequirement: '',
    parentFirstName: '',
    parentMiddleName: '',
    parentLastName: '',
    address: '',
    phone: '',
    email: '',
  });

  const [editPrescriptionFile, setEditPrescriptionFile] = useState<File | null>(null);
  const [editClinicalAbstractFile, setEditClinicalAbstractFile] = useState<File | null>(null);

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSidebarNotification(false);
    }, 2000);
    return () => clearTimeout(timer);
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

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  // Helper helpers
  const getInfantFullName = (first: string, middle: string, last: string) => {
    return `${first} ${middle ? middle + ' ' : ''}${last}`;
  };

  const getParentFullName = (first: string, middle: string, last: string) => {
    return `${first} ${middle ? middle + ' ' : ''}${last}`;
  };

  // Filter & Sort Logic
  const getProcessedBeneficiaries = () => {
    let result = [...beneficiaries];

    // Search filter (id, infant name, or parent name)
    if (search.trim() !== '') {
      result = result.filter((b) => {
        const infantFull = getInfantFullName(b.infantFirstName, b.infantMiddleName, b.infantLastName).toLowerCase();
        const parentFull = getParentFullName(b.parentFirstName, b.parentMiddleName, b.parentLastName).toLowerCase();
        return (
          infantFull.includes(search.toLowerCase()) ||
          parentFull.includes(search.toLowerCase()) ||
          b.id.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortBy === 'infantName') {
        aVal = getInfantFullName(a.infantFirstName, a.infantMiddleName, a.infantLastName).toLowerCase();
        bVal = getInfantFullName(b.infantFirstName, b.infantMiddleName, b.infantLastName).toLowerCase();
      } else if (sortBy === 'parentName') {
        aVal = getParentFullName(a.parentFirstName, a.parentMiddleName, a.parentLastName).toLowerCase();
        bVal = getParentFullName(b.parentFirstName, b.parentMiddleName, b.parentLastName).toLowerCase();
      } else {
        const field = a[sortBy as keyof Beneficiary];
        aVal = typeof field === 'string' ? field.toLowerCase() : '';
        const bField = b[sortBy as keyof Beneficiary];
        bVal = typeof bField === 'string' ? bField.toLowerCase() : '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const getProcessedApplicants = () => {
    let result = [...applicants];

    // Search filter
    if (search.trim() !== '') {
      result = result.filter((a) => {
        const infantFull = getInfantFullName(a.infantFirstName, a.infantMiddleName, a.infantLastName).toLowerCase();
        const parentFull = getParentFullName(a.parentFirstName, a.parentMiddleName, a.parentLastName).toLowerCase();
        return (
          infantFull.includes(search.toLowerCase()) ||
          parentFull.includes(search.toLowerCase()) ||
          a.id.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    // Application Status filter
    if (statusFilter !== 'All') {
      result = result.filter((a) => a.application_status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortBy === 'infantName') {
        aVal = getInfantFullName(a.infantFirstName, a.infantMiddleName, a.infantLastName).toLowerCase();
        bVal = getInfantFullName(b.infantFirstName, b.infantMiddleName, b.infantLastName).toLowerCase();
      } else if (sortBy === 'parentName') {
        aVal = getParentFullName(a.parentFirstName, a.parentMiddleName, a.parentLastName).toLowerCase();
        bVal = getParentFullName(b.parentFirstName, b.parentMiddleName, b.parentLastName).toLowerCase();
      } else {
        const field = a[sortBy as keyof ApplicantBeneficiary];
        aVal = typeof field === 'string' ? field.toLowerCase() : '';
        const bField = b[sortBy as keyof ApplicantBeneficiary];
        bVal = typeof bField === 'string' ? bField.toLowerCase() : '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processedBeneficiaries = getProcessedBeneficiaries();
  const processedApplicants = getProcessedApplicants();

  // Pagination bounds
  const totalItems = mode === 'beneficiaries' ? processedBeneficiaries.length : processedApplicants.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = mode === 'beneficiaries'
    ? processedBeneficiaries.slice((page - 1) * limit, page * limit)
    : processedApplicants.slice((page - 1) * limit, page * limit);

  // Handle Sort Toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Submit registration form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const birthDate = newBeneficiaryForm.infantDob || new Date().toISOString().split('T')[0];

      const payload = {
        name: `${newBeneficiaryForm.infantFirstName} ${newBeneficiaryForm.infantMiddleName ? newBeneficiaryForm.infantMiddleName + ' ' : ''}${newBeneficiaryForm.infantLastName}`.trim(),
        caregiver: `${newBeneficiaryForm.parentFirstName} ${newBeneficiaryForm.parentMiddleName ? newBeneficiaryForm.parentMiddleName + ' ' : ''}${newBeneficiaryForm.parentLastName} | ${newBeneficiaryForm.address}`.trim(),
        caregiver_email: newBeneficiaryForm.email,
        caregiver_phone: newBeneficiaryForm.phone,
        birth_date: birthDate,
        weight_kg: parseFloat(newBeneficiaryForm.infantWeight) / 1000,
        feeding_requirement_ml: parseInt(newBeneficiaryForm.feedingRequirement),
        profile: {
          prescription_details: "",
          clinical_abstract: "",
        },
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      if (prescriptionFile) {
        formData.append("prescription_details", prescriptionFile);
      }
      if (clinicalAbstractFile) {
        formData.append("clinical_abstract", clinicalAbstractFile);
      }

      await api.post('/api/beneficiaries/register', formData);

      showFeedback("Beneficiary registered successfully!", 'success');
      setIsRegisterOpen(false);

      // Reset form
      setNewBeneficiaryForm({
        infantFirstName: '',
        infantMiddleName: '',
        infantLastName: '',
        infantDob: '',
        infantWeight: '',
        feedingRequirement: '',
        parentFirstName: '',
        parentMiddleName: '',
        parentLastName: '',
        address: '',
        phone: '',
        email: '',
        prescriptionFileName: '',
        clinicalAbstractFileName: '',
      });
      setPrescriptionFile(null);
      setClinicalAbstractFile(null);
      setRegisterTab(1);

      fetchBeneficiariesData(); // Refresh the table
    } catch (error: any) {
      console.error("Registration failed:", error);
      const errMsg = error.response?.data?.message || "Failed to register beneficiary.";
      showFeedback(errMsg, 'error');
    }
  };

  const handleOpenEditModal = (b: Beneficiary | ApplicantBeneficiary) => {
    setEditBeneficiaryForm({
      id: b.id,
      infantFirstName: b.infantFirstName || '',
      infantMiddleName: b.infantMiddleName || '',
      infantLastName: b.infantLastName || '',
      infantDob: b.infantDob && b.infantDob !== 'N/A' ? b.infantDob : '',
      infantWeight: b.infantWeight || '',
      feedingRequirement: b.feedingRequirement || '',
      parentFirstName: b.parentFirstName || '',
      parentMiddleName: b.parentMiddleName || '',
      parentLastName: b.parentLastName || '',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
    });
    setEditPrescriptionFile(null);
    setEditClinicalAbstractFile(null);
    setIsEditOpen(true);
  };

  // Submit update form
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const birthDate = editBeneficiaryForm.infantDob || new Date().toISOString().split('T')[0];
      const existingPrescription = (selectedBeneficiary || selectedApplicant)?.prescriptionFileName || "";
      const existingAbstract = (selectedBeneficiary || selectedApplicant)?.clinicalAbstractFileName || "";

      const payload = {
        name: `${editBeneficiaryForm.infantFirstName} ${editBeneficiaryForm.infantMiddleName ? editBeneficiaryForm.infantMiddleName + ' ' : ''}${editBeneficiaryForm.infantLastName}`.trim(),
        caregiver: `${editBeneficiaryForm.parentFirstName} ${editBeneficiaryForm.parentMiddleName ? editBeneficiaryForm.parentMiddleName + ' ' : ''}${editBeneficiaryForm.parentLastName} | ${editBeneficiaryForm.address}`.trim(),
        caregiver_email: editBeneficiaryForm.email,
        caregiver_phone: editBeneficiaryForm.phone,
        birth_date: birthDate,
        weight_kg: parseFloat(editBeneficiaryForm.infantWeight) / 1000,
        feeding_requirement_ml: parseInt(editBeneficiaryForm.feedingRequirement),
        profile: {
          prescription_details: editPrescriptionFile ? "" : existingPrescription,
          clinical_abstract: editClinicalAbstractFile ? "" : existingAbstract,
        },
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      if (editPrescriptionFile) {
        formData.append("prescription_details", editPrescriptionFile);
      }
      if (editClinicalAbstractFile) {
        formData.append("clinical_abstract", editClinicalAbstractFile);
      }

      await api.put(`/api/beneficiaries/${editBeneficiaryForm.id}`, formData);

      showFeedback("Beneficiary details updated successfully!", 'success');
      setIsEditOpen(false);

      // Close detail modals
      setSelectedBeneficiary(null);
      setSelectedApplicant(null);

      fetchBeneficiariesData(); // Refresh the table
    } catch (error: any) {
      console.error("Update failed:", error);
      const errMsg = error.response?.data?.message || "Failed to update beneficiary.";
      showFeedback(errMsg, 'error');
    }
  };

  // Mock status badge color mappings
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Inactive':
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100/50'
            : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100/50'
        }`}>
          <div className={`p-1 rounded-lg ${actionFeedback.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            {actionFeedback.type === 'success' ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <X className="size-4 text-rose-600" />
            )}
          </div>
          <span className="text-sm font-semibold">{actionFeedback.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <StaffSidebar activeItem={mode === 'beneficiaries' ? 'beneficiaries' : 'applicants-beneficiaries'} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">

        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {mode === 'beneficiaries' ? 'Beneficiaries List' : 'Applicants List'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <Link
              href="/work/notification"
              className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200"
              data-testid="header-notification-btn"
              aria-label="View notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full animate-ping" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full" />
            </Link>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">

          {/* Action and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              {/* Search */}
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by ID, name..."
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
                  {mode === 'beneficiaries' ? (
                    <>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </>
                  ) : (
                    <>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}
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

            {/* New Beneficiary button (visible on applicants list) */}
            {mode === 'applicants' && (
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shrink-0 shadow-[0_4px_12px_rgba(0,105,111,0.15)] hover:shadow-lg hover:-translate-y-0.5"
                data-testid="new-beneficiary-btn"
              >
                <Plus className="size-4 stroke-[3px]" />
                New Beneficiary
              </button>
            )}
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="management-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    {mode === 'beneficiaries' ? (
                      <>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                          ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('infantName')} data-testid="th-infant-name">
                          Infant Name {sortBy === 'infantName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('parentName')} data-testid="th-parent-name">
                          Parent Name {sortBy === 'parentName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('status')} data-testid="th-status">
                          Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('dateJoined')} data-testid="th-date">
                          Date Joined {sortBy === 'dateJoined' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                          ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('infantName')} data-testid="th-infant-name">
                          Infant Name {sortBy === 'infantName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('parentName')} data-testid="th-parent-name">
                          Parent Name {sortBy === 'parentName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('application_status')} data-testid="th-status">
                          Application Status {sortBy === 'application_status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('dateApplied')} data-testid="th-date">
                          Date Applied {sortBy === 'dateApplied' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {pagedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => mode === 'beneficiaries' ? setSelectedBeneficiary(item as Beneficiary) : setSelectedApplicant(item as ApplicantBeneficiary)}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                      data-testid={`row-${item.id}`}
                    >
                      <td className="px-8 py-4.5 font-bold text-neutral-900">{item.id}</td>
                      <td className="px-8 py-4.5 font-bold text-neutral-900">
                        {getInfantFullName(item.infantFirstName, item.infantMiddleName, item.infantLastName)}
                      </td>
                      <td className="px-8 py-4.5 font-bold text-neutral-900">
                        {getParentFullName(item.parentFirstName, item.parentMiddleName, item.parentLastName)}
                      </td>
                      <td className="px-8 py-4.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(mode === 'beneficiaries' ? (item as Beneficiary).status : (item as ApplicantBeneficiary).application_status)}`}>
                          {mode === 'beneficiaries' ? (item as Beneficiary).status : (item as ApplicantBeneficiary).application_status}
                        </span>
                      </td>
                      <td className="px-8 py-4.5 text-neutral-500">
                        {mode === 'beneficiaries' ? (item as Beneficiary).dateJoined : (item as ApplicantBeneficiary).dateApplied}
                      </td>
                    </tr>
                  ))}

                  {pagedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-neutral-400 font-medium">
                        No records match the active search and filter settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-neutral-50/50 border-t border-neutral-100 px-8 py-4.5 flex items-center justify-between gap-4 font-sans text-xs">
                <span className="text-neutral-500 font-bold">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} of {totalItems} entries
                </span>

                <div className="flex items-center gap-1.5" data-testid="pagination-nav">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-neutral-200 rounded-xl hover:bg-white text-neutral-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    data-testid="prev-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx + 1)}
                      className={`size-8 font-bold border rounded-xl transition-all cursor-pointer ${page === idx + 1
                        ? 'bg-brand-teal border-brand-teal text-white shadow-sm'
                        : 'border-neutral-200 hover:bg-white text-neutral-600'
                        }`}
                      data-testid={`page-btn-${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-neutral-200 rounded-xl hover:bg-white text-neutral-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    data-testid="next-btn"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* DETAIL MODAL (Olivia Carter style profile view matching node 9880-1796 style layout) */}
      {(selectedBeneficiary || selectedApplicant) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto" data-testid="detail-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">

            {/* Modal Sticky Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 sticky top-0 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Baby className="size-5.5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">
                  {mode === 'beneficiaries' ? 'Beneficiary Profile' : 'Applicant Profile'}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedBeneficiary(null); setSelectedApplicant(null); }}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                aria-label="Close Profile modal"
                data-testid="close-detail-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body Columns */}
            <div className="p-8 flex flex-col md:flex-row gap-8 overflow-y-auto">

              {/* Left Column: Side Profile */}
              <div className="w-full md:w-72 shrink-0 space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col items-center gap-5 text-center shadow-sm">
                  {/* Avatar circle */}
                  <div className="size-36 rounded-full bg-slate-100 flex items-center justify-center font-bold text-neutral-700 text-3xl border border-neutral-200 select-none shadow-inner">
                    {getInfantFullName(
                      (selectedBeneficiary || selectedApplicant)!.infantFirstName,
                      (selectedBeneficiary || selectedApplicant)!.infantMiddleName,
                      (selectedBeneficiary || selectedApplicant)!.infantLastName
                    ).split(' ').map((n) => n[0]).join('')}
                  </div>

                  {/* Minimal metadata info */}
                  <div className="space-y-1.5 w-full">
                    <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-profile-name">
                      {getInfantFullName(
                        (selectedBeneficiary || selectedApplicant)!.infantFirstName,
                        (selectedBeneficiary || selectedApplicant)!.infantMiddleName,
                        (selectedBeneficiary || selectedApplicant)!.infantLastName
                      )}
                    </h4>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold font-sans">
                      DTN ID: <span className="text-neutral-900" data-testid="modal-profile-id">{(selectedBeneficiary || selectedApplicant)?.id}</span>
                    </p>
                    <div className="pt-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(
                        mode === 'beneficiaries'
                          ? (selectedBeneficiary as Beneficiary)?.status
                          : (selectedApplicant as ApplicantBeneficiary)?.application_status
                      )}`} data-testid="modal-profile-status">
                        {mode === 'beneficiaries' ? (selectedBeneficiary as Beneficiary)?.status : (selectedApplicant as ApplicantBeneficiary)?.application_status}
                      </span>
                    </div>
                  </div>

                  <hr className="w-full border-neutral-100" />

                  <div className="w-full text-left space-y-2 text-xs">
                    <p className="text-neutral-500 font-bold font-sans uppercase text-[9px] tracking-widest">Profile Stats</p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400 font-semibold">Applied/Joined:</span>
                      <span className="font-bold text-neutral-700">
                        {mode === 'beneficiaries' ? (selectedBeneficiary as Beneficiary)?.dateJoined : (selectedApplicant as ApplicantBeneficiary)?.dateApplied}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Profile actions */}
                <div className="space-y-3.5">
                  {mode === 'beneficiaries' ? (
                    <button
                      onClick={() => handleBeneficiaryAction('toggle', selectedBeneficiary!.id)}
                      className="w-full py-2.5 text-xs font-bold text-neutral-600 hover:text-brand-teal bg-white border border-neutral-200 hover:border-brand-teal/30 hover:bg-brand-teal/5 rounded-xl transition-all shadow-sm"
                      data-testid="toggle-profile-status-btn"
                    >
                      {selectedBeneficiary?.status === 'Active' ? 'Deactivate Profile' : 'Activate Profile'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleBeneficiaryAction('approve', selectedApplicant!.id)}
                        className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
                        data-testid="approve-profile-btn"
                      >
                        Approve Profile
                      </button>
                      <button
                        onClick={() => handleBeneficiaryAction('reject', selectedApplicant!.id)}
                        className="w-full py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm"
                        data-testid="reject-profile-btn"
                      >
                        Reject Profile
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleOpenEditModal(selectedBeneficiary || selectedApplicant!)}
                    className="w-full py-2.5 text-xs font-bold text-neutral-600 hover:text-brand-teal bg-white border border-neutral-200 hover:border-brand-teal/30 hover:bg-brand-teal/5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    data-testid="edit-profile-btn"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => handleBeneficiaryAction('delete', selectedBeneficiary?.id || selectedApplicant!.id)}
                    className="w-full py-2.5 text-xs font-bold text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-neutral-200 hover:border-rose-600 rounded-xl transition-all shadow-sm"
                    data-testid="delete-profile-btn"
                  >
                    Delete Profile
                  </button>
                </div>
              </div>

              {/* Right Column: Collapsible Info Cards */}
              <div className="flex-1 space-y-6">

                {/* 1. Infant Information */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-infant">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide flex items-center gap-2">
                    <Baby className="size-4 text-brand-teal" />
                    Infant Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Date of Birth:</p>
                      <p className="font-bold text-neutral-800">{(selectedBeneficiary || selectedApplicant)?.infantDob}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Weight (grams):</p>
                      <p className="font-bold text-neutral-800">{(selectedBeneficiary || selectedApplicant)?.infantWeight} g</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-neutral-400 font-semibold mb-0.5">Feeding Requirement:</p>
                      <p className="font-bold text-neutral-800">{(selectedBeneficiary || selectedApplicant)?.feedingRequirement}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Parent/Guardian Information */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-parent">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide flex items-center gap-2">
                    <User className="size-4 text-brand-teal" />
                    Parent / Guardian Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <p className="text-neutral-400 font-semibold mb-0.5">Full Name:</p>
                      <p className="font-bold text-neutral-800">
                        {getParentFullName(
                          (selectedBeneficiary || selectedApplicant)!.parentFirstName,
                          (selectedBeneficiary || selectedApplicant)!.parentMiddleName,
                          (selectedBeneficiary || selectedApplicant)!.parentLastName
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-neutral-400 font-semibold mb-0.5">Home Address:</p>
                      <p className="font-bold text-neutral-800 flex items-center gap-1">
                        <MapPin className="size-3.5 text-neutral-400 shrink-0" />
                        {(selectedBeneficiary || selectedApplicant)?.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Phone Number:</p>
                      <p className="font-bold text-neutral-800 flex items-center gap-1">
                        <Phone className="size-3.5 text-neutral-400 shrink-0" />
                        {(selectedBeneficiary || selectedApplicant)?.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Email Address:</p>
                      <p className="font-bold text-neutral-800 flex items-center gap-1">
                        <Mail className="size-3.5 text-neutral-400 shrink-0" />
                        {(selectedBeneficiary || selectedApplicant)?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Clinical Documents & Verification */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-documents">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="size-4 text-brand-teal" />
                    Clinical Documents & Verification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Prescription Card */}
                    <div className="border border-neutral-200 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs bg-slate-50/50">
                      <div>
                        <p className="text-neutral-400 font-semibold mb-1">Doctor's Prescription</p>
                        <p className="font-bold text-neutral-800 truncate">
                          {(selectedBeneficiary || selectedApplicant)?.prescriptionFileName || 'No prescription uploaded'}
                        </p>
                      </div>
                      {(selectedBeneficiary || selectedApplicant)?.prescriptionFileName ? (
                        <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold mt-2">
                          <span className="bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">Verified</span>
                          <button
                            onClick={() => {
                              const doc = selectedBeneficiary || selectedApplicant;
                              if (doc && doc.prescriptionFileName) {
                                downloadFile(doc.prescriptionFileName, "prescription.pdf");
                              }
                            }}
                            className="flex items-center gap-1 text-brand-teal hover:underline cursor-pointer"
                          >
                            <FileDown className="size-3.5" />
                            Download
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-rose-600 font-bold mt-2">
                          <span className="bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">Missing Document</span>
                        </div>
                      )}
                    </div>

                    {/* Clinical Abstract Card */}
                    <div className="border border-neutral-200 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs bg-slate-50/50">
                      <div>
                        <p className="text-neutral-400 font-semibold mb-1">Clinical Abstract</p>
                        <p className="font-bold text-neutral-800 truncate">
                          {(selectedBeneficiary || selectedApplicant)?.clinicalAbstractFileName || 'No abstract uploaded'}
                        </p>
                      </div>
                      {(selectedBeneficiary || selectedApplicant)?.clinicalAbstractFileName ? (
                        <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold mt-2">
                          <span className="bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">Verified</span>
                          <button
                            onClick={() => {
                              const doc = selectedBeneficiary || selectedApplicant;
                              if (doc && doc.clinicalAbstractFileName) {
                                downloadFile(doc.clinicalAbstractFileName, "clinical_abstract.pdf");
                              }
                            }}
                            className="flex items-center gap-1 text-brand-teal hover:underline cursor-pointer"
                          >
                            <FileDown className="size-3.5" />
                            Download
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-rose-600 font-bold mt-2">
                          <span className="bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">Missing Document</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* REGISTRATION MODAL (New Beneficiary Applicant Tabbed Form) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto" data-testid="register-modal">
          <form
            onSubmit={handleRegisterSubmit}
            data-testid="register-form"
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 flex flex-col"
          >

            {/* Modal Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 sticky top-0 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Plus className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">New Beneficiary Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                aria-label="Close registration modal"
                data-testid="close-register-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Registration Tabs */}
            <div className="bg-slate-50 border-b border-neutral-100 px-6 py-2.5 flex gap-2 overflow-x-auto shrink-0 select-none">
              {[
                { tab: 1, label: "1. Infant's Details" },
                { tab: 2, label: '2. Parent Details' },
                { tab: 3, label: '3. Clinical Documents' },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setRegisterTab(item.tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${registerTab === item.tab
                    ? 'bg-brand-teal text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                    }`}
                  data-testid={`register-tab-${item.tab}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Modal Form Body */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6">

              {/* TAB 1: Infant Details */}
              {registerTab === 1 && (
                <div className="space-y-6" data-testid="register-pane-1">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Infant Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-infant-first" className="text-neutral-500">First Name *</label>
                        <input
                          id="reg-infant-first"
                          type="text"
                          required
                          value={newBeneficiaryForm.infantFirstName}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, infantFirstName: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-infant-first-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-infant-middle" className="text-neutral-500">Middle Name</label>
                        <input
                          id="reg-infant-middle"
                          type="text"
                          value={newBeneficiaryForm.infantMiddleName}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, infantMiddleName: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-infant-middle-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-infant-last" className="text-neutral-500">Last Name *</label>
                        <input
                          id="reg-infant-last"
                          type="text"
                          required
                          value={newBeneficiaryForm.infantLastName}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, infantLastName: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-infant-last-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-infant-dob" className="text-neutral-500">Date of Birth *</label>
                        <input
                          id="reg-infant-dob"
                          type="date"
                          required
                          value={newBeneficiaryForm.infantDob}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, infantDob: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-infant-dob"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-infant-weight" className="text-neutral-500">Weight (grams) *</label>
                        <input
                          id="reg-infant-weight"
                          type="text"
                          required
                          placeholder="e.g. 2500"
                          value={newBeneficiaryForm.infantWeight}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, infantWeight: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-infant-weight"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-feed-req" className="text-neutral-500">Feeding Requirement *</label>
                        <input
                          id="reg-feed-req"
                          type="text"
                          required
                          placeholder="e.g. 150ml/day"
                          value={newBeneficiaryForm.feedingRequirement}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, feedingRequirement: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-feeding-requirement"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Parent/Guardian Details */}
              {registerTab === 2 && (
                <div className="space-y-6" data-testid="register-pane-2">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Parent / Guardian Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-parent-first" className="text-neutral-500">First Name *</label>
                        <input
                          id="reg-parent-first"
                          type="text"
                          required
                          value={newBeneficiaryForm.parentFirstName}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, parentFirstName: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-parent-first-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-parent-middle" className="text-neutral-500">Middle Name</label>
                        <input
                          id="reg-parent-middle"
                          type="text"
                          value={newBeneficiaryForm.parentMiddleName}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, parentMiddleName: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-parent-middle-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-parent-last" className="text-neutral-500">Last Name *</label>
                        <input
                          id="reg-parent-last"
                          type="text"
                          required
                          value={newBeneficiaryForm.parentLastName}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, parentLastName: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-parent-last-name"
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1.5">
                        <label htmlFor="reg-address" className="text-neutral-500">Home Address *</label>
                        <input
                          id="reg-address"
                          type="text"
                          required
                          value={newBeneficiaryForm.address}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, address: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-address"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-phone" className="text-neutral-500">Phone Number *</label>
                        <input
                          id="reg-phone"
                          type="text"
                          required
                          value={newBeneficiaryForm.phone}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, phone: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-phone"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="reg-email" className="text-neutral-500">Email Address *</label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={newBeneficiaryForm.email}
                          onChange={(e) => setNewBeneficiaryForm({ ...newBeneficiaryForm, email: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Clinical Documents */}
              {registerTab === 3 && (
                <div className="space-y-6" data-testid="register-pane-3">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm text-xs font-bold">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Clinical Document Uploads
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-prescription" className="text-neutral-500">Doctor's Prescription</label>
                        <input
                          id="reg-prescription"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setPrescriptionFile(e.target.files[0]);
                            }
                          }}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-xs"
                          data-testid="input-prescription-file"
                        />
                        {prescriptionFile && (
                          <div className="text-emerald-600 font-sans text-xs mt-1">
                            Selected: {prescriptionFile.name}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-abstract" className="text-neutral-500">Clinical Abstract</label>
                        <input
                          id="reg-abstract"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setClinicalAbstractFile(e.target.files[0]);
                            }
                          }}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-xs"
                          data-testid="input-abstract-file"
                        />
                        {clinicalAbstractFile && (
                          <div className="text-emerald-600 font-sans text-xs mt-1">
                            Selected: {clinicalAbstractFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Form Footer Sticky */}
            <div className="bg-slate-50 border-t border-neutral-100 px-6 py-4 flex items-center justify-between sticky bottom-0 z-10 shrink-0">
              <div className="flex gap-2">
                {registerTab > 1 && (
                  <button
                    type="button"
                    onClick={() => setRegisterTab((t) => Math.max(1, t - 1))}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all cursor-pointer"
                    data-testid="register-prev-btn"
                  >
                    Previous
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>

                {registerTab < 3 ? (
                  <button
                    type="button"
                    onClick={() => setRegisterTab((t) => Math.min(3, t + 1))}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all cursor-pointer"
                    data-testid="register-next-btn"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_4px_12px_rgba(0,105,111,0.1)] cursor-pointer"
                    data-testid="register-submit-btn"
                  >
                    Submit Registration
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto" data-testid="edit-modal">
          <form
            onSubmit={handleUpdateSubmit}
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 sticky top-0 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Baby className="size-5.5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Edit Beneficiary Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Content) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* SECTION 1: Infant Details */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                  Infant Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-infant-first" className="text-neutral-500">First Name *</label>
                    <input
                      id="edit-infant-first"
                      type="text"
                      required
                      value={editBeneficiaryForm.infantFirstName}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, infantFirstName: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-infant-first-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-infant-middle" className="text-neutral-500">Middle Name</label>
                    <input
                      id="edit-infant-middle"
                      type="text"
                      value={editBeneficiaryForm.infantMiddleName}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, infantMiddleName: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-infant-middle-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-infant-last" className="text-neutral-500">Last Name *</label>
                    <input
                      id="edit-infant-last"
                      type="text"
                      required
                      value={editBeneficiaryForm.infantLastName}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, infantLastName: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-infant-last-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-infant-dob" className="text-neutral-500">Date of Birth *</label>
                    <input
                      id="edit-infant-dob"
                      type="date"
                      required
                      value={editBeneficiaryForm.infantDob}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, infantDob: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-infant-dob"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-infant-weight" className="text-neutral-500">Weight (grams) *</label>
                    <input
                      id="edit-infant-weight"
                      type="text"
                      required
                      placeholder="e.g. 2500"
                      value={editBeneficiaryForm.infantWeight}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, infantWeight: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-infant-weight"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-feed-req" className="text-neutral-500">Feeding Requirement *</label>
                    <input
                      id="edit-feed-req"
                      type="text"
                      required
                      placeholder="e.g. 150ml/day"
                      value={editBeneficiaryForm.feedingRequirement}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, feedingRequirement: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-feeding-requirement"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Caregiver Details */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                  Parent / Guardian Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-parent-first" className="text-neutral-500">First Name *</label>
                    <input
                      id="edit-parent-first"
                      type="text"
                      required
                      value={editBeneficiaryForm.parentFirstName}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, parentFirstName: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-parent-first-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-parent-middle" className="text-neutral-500">Middle Name</label>
                    <input
                      id="edit-parent-middle"
                      type="text"
                      value={editBeneficiaryForm.parentMiddleName}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, parentMiddleName: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-parent-middle-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-parent-last" className="text-neutral-500">Last Name *</label>
                    <input
                      id="edit-parent-last"
                      type="text"
                      required
                      value={editBeneficiaryForm.parentLastName}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, parentLastName: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-parent-last-name"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <label htmlFor="edit-address" className="text-neutral-500">Home Address *</label>
                    <input
                      id="edit-address"
                      type="text"
                      required
                      value={editBeneficiaryForm.address}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, address: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-address"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1 sm:col-span-1">
                    <label htmlFor="edit-phone" className="text-neutral-500">Phone Number *</label>
                    <input
                      id="edit-phone"
                      type="text"
                      required
                      value={editBeneficiaryForm.phone}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, phone: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-phone"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="edit-email" className="text-neutral-500">Email Address *</label>
                    <input
                      id="edit-email"
                      type="email"
                      required
                      value={editBeneficiaryForm.email}
                      onChange={(e) => setEditBeneficiaryForm({ ...editBeneficiaryForm, email: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-700"
                      data-testid="edit-input-email"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Documents Upload */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                  Clinical Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-prescription" className="text-neutral-500">Prescription Details (optional)</label>
                    <input
                      id="edit-prescription"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setEditPrescriptionFile(e.target.files[0]);
                        }
                      }}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-xs text-neutral-700"
                      data-testid="edit-input-prescription-file"
                    />
                    {editPrescriptionFile ? (
                      <div className="text-emerald-600 font-sans text-xs mt-1">
                        New File: {editPrescriptionFile.name}
                      </div>
                    ) : (selectedBeneficiary || selectedApplicant)?.prescriptionFileName ? (
                      <div className="text-neutral-500 font-sans text-xs mt-1 truncate">
                        Current: {(selectedBeneficiary || selectedApplicant)?.prescriptionFileName}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-abstract" className="text-neutral-500">Clinical Abstract (optional)</label>
                    <input
                      id="edit-abstract"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setEditClinicalAbstractFile(e.target.files[0]);
                        }
                      }}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-xs text-neutral-700"
                      data-testid="edit-input-abstract-file"
                    />
                    {editClinicalAbstractFile ? (
                      <div className="text-emerald-600 font-sans text-xs mt-1">
                        New File: {editClinicalAbstractFile.name}
                      </div>
                    ) : (selectedBeneficiary || selectedApplicant)?.clinicalAbstractFileName ? (
                      <div className="text-neutral-500 font-sans text-xs mt-1 truncate">
                        Current: {(selectedBeneficiary || selectedApplicant)?.clinicalAbstractFileName}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-neutral-100 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_4px_12px_rgba(0,105,111,0.1)] cursor-pointer"
                data-testid="edit-submit-btn"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
