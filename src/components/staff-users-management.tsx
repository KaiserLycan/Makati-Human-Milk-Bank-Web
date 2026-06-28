'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  SlidersHorizontal,
  X,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import StaffNotificationBell from './ui/staff-notification-bell';
import StaffAccessDenied from './ui/staff-access-denied';
import { api } from '../utils/api';
import {
  loadProfile,
  saveProfile,
  StaffUser,
  UserProfile,
} from '../utils/storage';

// --- CUSTOM DROPDOWN ---
const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  triggerClassName, 
  dropdownClassName,
  optionClassName,
  disabled,
  'data-testid': dataTestId,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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
        data-testid={dataTestId}
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
              data-testid={`option-${option.value}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StaffUsersManagement() {
  const router = useRouter();

  const formatBackendError = (msg: string): string => {
    if (!msg) return '';
    if (msg.includes('Invalid request data:')) {
      const parts = msg.split(':');
      if (parts.length >= 3) {
        return parts.slice(2).join(':').trim();
      }
    }
    return msg;
  };

  const [currentTime, setCurrentTime] = useState('');
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal & Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // Add User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'manager' | 'staff'>('staff');
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active');
  const [newPhone, setNewPhone] = useState('+639171234567');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'manager' | 'staff'>('staff');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);

  // Reset Password State
  const [resetPassVal, setResetPassVal] = useState('');
  const [confirmResetPassVal, setConfirmResetPassVal] = useState('');
  const [resetPassError, setResetPassError] = useState<string | null>(null);
  const [resetPassSuccess, setResetPassSuccess] = useState<string | null>(null);

  // Global Action Feedback/Toast State
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Custom Role Confirmation Modal State
  const [isRoleConfirmOpen, setIsRoleConfirmOpen] = useState(false);
  const [pendingRoleUpdatePayload, setPendingRoleUpdatePayload] = useState<any>(null);

  // Fetch Users from Database
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let rawUsers: any[] = [];

      if (statusFilter === 'All') {
        const [activeRes, inactiveRes] = await Promise.all([
          api.get('/api/users', {
            params: {
              page: 1,
              limit: 100,
              status: 'active',
              ...(roleFilter !== 'All' && { role: roleFilter }),
              ...(search.trim() !== '' && { search: search.trim() }),
            }
          }),
          api.get('/api/users', {
            params: {
              page: 1,
              limit: 100,
              status: 'inactive',
              ...(roleFilter !== 'All' && { role: roleFilter }),
              ...(search.trim() !== '' && { search: search.trim() }),
            }
          })
        ]);

        const activeList = activeRes.data?.success ? activeRes.data.data.data : [];
        const inactiveList = inactiveRes.data?.success ? inactiveRes.data.data.data : [];
        rawUsers = [...activeList, ...inactiveList];
      } else {
        const res = await api.get('/api/users', {
          params: {
            page: 1,
            limit: 100,
            status: statusFilter.toLowerCase(),
            ...(roleFilter !== 'All' && { role: roleFilter }),
            ...(search.trim() !== '' && { search: search.trim() }),
          }
        });
        rawUsers = res.data?.success ? res.data.data.data : [];
      }

      let list = rawUsers.map((u: any) => ({
        id: u.user_id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        status: u.status === 'active' ? 'Active' : 'Inactive',
      } as StaffUser));

      // Sort alphabetically/numerically on frontend
      list.sort((a: any, b: any) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = list.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / limit) || 1);

      const startIndex = (page - 1) * limit;
      const paginatedList = list.slice(startIndex, startIndex + limit);
      setUsers(paginatedList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, sortBy, sortOrder, page, limit]);

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
  }, [search, roleFilter, statusFilter, limit]);

  // Handle Sort Toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Role Protection
  if (profile && profile.role !== 'manager') {
    return (
      <StaffAccessDenied message="You do not have manager permissions to view this user management console. If you require access, please contact your administrator." />
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Inactive':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAddError('Please fill in all required fields.');
      return;
    }

    if (newPassword.length < 8) {
      setAddError('Initial password must be at least 8 characters.');
      return;
    }

    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      setAddError('Please enter a valid email address.');
      return;
    }

    try {
      const payload = {
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        status: newStatus.toLowerCase(), // 'active' | 'inactive'
        phone: newPhone.trim(),
      };

      const response = await api.post('/api/users', payload);
      if (response.data?.success) {
        setSuccessToast(`User ${newName} created successfully.`);
        setTimeout(() => setSuccessToast(null), 3500);
        setIsAddModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      setAddError(formatBackendError(err.response?.data?.message || err.message || 'Failed to create user.'));
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!selectedUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Please fill in all required fields.');
      return;
    }

    if (!editEmail.includes('@') || !editEmail.includes('.')) {
      setEditError('Please enter a valid email address.');
      return;
    }

    const payload = {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      phone: editPhone.trim() || '+639171234567',
    };

    if (selectedUser.role !== editRole) {
      setPendingRoleUpdatePayload(payload);
      setIsRoleConfirmOpen(true);
      return;
    }

    await executeRoleUpdate(payload);
  };

  const executeRoleUpdate = async (payload: any) => {
    if (!selectedUser) return;
    try {
      const response = await api.put(`/api/users/${selectedUser.id}`, payload);
      if (response.data?.success) {
        const updated: StaffUser = {
          ...selectedUser,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          phone: payload.phone,
        };
        setSelectedUser(updated);

        if (profile && profile.id === selectedUser.id) {
          const updatedProfile = {
            ...profile,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            phone: updated.phone,
          };
          setProfile(updatedProfile);
          saveProfile(updatedProfile);
        }

        setSuccessToast(`User details updated successfully.`);
        setTimeout(() => setSuccessToast(null), 3500);
        setIsEditMode(false);
        fetchUsers();
      }
    } catch (err: any) {
      setEditError(formatBackendError(err.response?.data?.message || err.message || 'Failed to update user.'));
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.patch(`/api/users/status/${selectedUser.id}`);
      if (response.data?.success) {
        const newStatusVal = selectedUser.status === 'Active' ? 'Inactive' : 'Active';
        const updated: StaffUser = {
          ...selectedUser,
          status: newStatusVal,
        };
        setSelectedUser(updated);

        setSuccessToast(`User status set to ${newStatusVal}.`);
        setTimeout(() => setSuccessToast(null), 3500);
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPassError(null);
    setResetPassSuccess(null);

    if (!selectedUser) return;

    if (!resetPassVal.trim() || !confirmResetPassVal.trim()) {
      setResetPassError('Please fill in all fields.');
      return;
    }

    if (resetPassVal !== confirmResetPassVal) {
      setResetPassError('Passwords do not match.');
      return;
    }

    if (resetPassVal.length < 8) {
      setResetPassError('New password must be at least 8 characters.');
      return;
    }

    try {
      const payload = {
        new_password: resetPassVal,
      };
      const response = await api.patch(`/api/users/reset-password/${selectedUser.id}`, payload);
      if (response.data?.success) {
        const isSelf = profile && profile.id === selectedUser.id;
        if (isSelf) {
          setResetPassSuccess('Password reset successfully! Redirecting to the login page...');
          setResetPassVal('');
          setConfirmResetPassVal('');
          setTimeout(async () => {
            setResetPassSuccess(null);
            setIsResetPasswordOpen(false);
            setSelectedUser(null);
            try {
              await api.post('/api/auth/logout');
            } catch (logoutErr) {
              console.error('Logout error during redirect:', logoutErr);
            }
            if (typeof window !== 'undefined') {
              localStorage.removeItem('mhmb_logged_in');
              localStorage.removeItem('mhmb_profile');
            }
            router.push('/work');
          }, 2000);
        } else {
          setResetPassSuccess('Password reset successfully!');
          setResetPassVal('');
          setConfirmResetPassVal('');
          setTimeout(() => {
            setResetPassSuccess(null);
            setIsResetPasswordOpen(false);
            fetchUsers();
          }, 2000);
        }
      }
    } catch (err: any) {
      setResetPassError(formatBackendError(err.response?.data?.message || err.message || 'Failed to reset password.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      <StaffSidebar activeItem="users" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Manage Users</h2>
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
          {successToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 font-sans text-sm font-semibold animate-in fade-in duration-200" data-testid="success-toast">
              {successToast}
            </div>
          )}

          {/* Action and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              {/* Search */}
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search user name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <CustomDropdown
                  value={roleFilter}
                  onChange={setRoleFilter}
                  icon={SlidersHorizontal}
                  triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl pl-9 pr-4 py-2.5 transition-all min-w-[140px]"
                  options={[
                    { value: 'All', label: 'All Roles' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'staff', label: 'Staff' }
                  ]}
                  data-testid="role-select"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  triggerClassName="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl px-4 py-2.5 transition-all min-w-[140px]"
                  options={[
                    { value: 'All', label: 'All Statuses' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                  ]}
                  data-testid="status-select"
                />
              </div>

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

            <button
              onClick={() => {
                setAddError(null);
                setNewName('');
                setNewEmail('');
                setNewRole('staff');
                setNewStatus('Active');
                setNewPhone('+639171234567');
                setNewPassword('');
                setIsAddModalOpen(true);
              }}
              className="px-5 py-2.5 text-sm font-bold text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
              data-testid="add-user-btn"
            >
              <Plus className="size-4" />
              <span>Add User</span>
            </button>
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="users-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('name')} data-testid="th-name">
                      Full Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('email')} data-testid="th-email">
                      Email Address {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('role')} data-testid="th-role">
                      Role Level {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {isLoading ? (
                    [...Array(limit || 5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse pointer-events-none">
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4.5 text-center flex justify-center"><div className="h-4 bg-slate-200 rounded w-16 my-1"></div></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-neutral-400 font-medium font-sans animate-in fade-in duration-200">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    users.map((userItem) => (
                      <tr
                        key={userItem.id}
                        onClick={() => {
                          setSelectedUser(userItem);
                          setIsEditMode(false);
                          setIsResetPasswordOpen(false);
                        }}
                        className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                        data-testid={`row-${userItem.id}`}
                      >
                        <td className="px-6 py-4.5 font-bold text-neutral-900">{userItem.name}</td>
                        <td className="px-6 py-4.5 text-neutral-600">{userItem.email}</td>
                        <td className="px-6 py-4.5 text-neutral-500 capitalize">{userItem.role}</td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(userItem.status)}`}>
                            {userItem.status}
                          </span>
                        </td>
                      </tr>
                    ))
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

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="add-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">Add New User</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all cursor-pointer"
                data-testid="close-add-user-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4 text-xs font-semibold text-neutral-700">
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3" data-testid="add-user-error">
                  {addError}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-neutral-500 font-bold block">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all font-medium"
                  data-testid="add-user-name"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-neutral-500 font-bold block">Email Address *</label>
                <input
                  type="email"
                  placeholder="name@mhmb.gov"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all font-medium"
                  data-testid="add-user-email"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-neutral-500 font-bold block">Phone Number *</label>
                <input
                  type="text"
                  placeholder="+639171234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all font-medium"
                  data-testid="add-user-phone"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-neutral-500 font-bold block">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all font-medium"
                    data-testid="add-user-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                    data-testid="toggle-new-password-visibility"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-neutral-500 font-bold block">Role Level</label>
                  <CustomDropdown
                    value={newRole}
                    onChange={(val: any) => setNewRole(val as 'manager' | 'staff')}
                    triggerClassName="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-xs font-bold text-neutral-600 bg-white"
                    options={[
                      { value: 'staff', label: 'Staff' },
                      { value: 'manager', label: 'Manager' }
                    ]}
                    data-testid="add-user-role"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-neutral-500 font-bold block">Status</label>
                  <CustomDropdown
                    value={newStatus}
                    onChange={(val: any) => setNewStatus(val as 'Active' | 'Inactive')}
                    triggerClassName="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-xs font-bold text-neutral-600 bg-white"
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                    data-testid="add-user-status"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 font-bold transition-all cursor-pointer text-xs"
                  data-testid="cancel-add-user-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-xs"
                  data-testid="submit-add-user-btn"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {isRoleConfirmOpen && pendingRoleUpdatePayload && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150" data-testid="role-confirm-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Shield className="size-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Change Access Role</h3>
            </div>
            
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed animate-in fade-in" data-testid="role-confirm-msg">
              Are you sure to change {selectedUser.name}'s role from {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)} to {pendingRoleUpdatePayload.role.charAt(0).toUpperCase() + pendingRoleUpdatePayload.role.slice(1)}?
            </p>

            <div className="flex justify-end gap-2.5 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRoleConfirmOpen(false);
                  setPendingRoleUpdatePayload(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-all cursor-pointer text-neutral-700 outline-none"
                data-testid="cancel-role-confirm-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  executeRoleUpdate(pendingRoleUpdatePayload);
                  setIsRoleConfirmOpen(false);
                  setPendingRoleUpdatePayload(null);
                }}
                className="px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl shadow-md transition-all cursor-pointer outline-none"
                data-testid="confirm-role-confirm-btn"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" data-testid="detail-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">User Profile Details</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all cursor-pointer"
                data-testid="close-detail-modal-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-lg">
                  {selectedUser.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-955 text-base" data-testid="modal-user-name">
                    {selectedUser.name}
                  </h4>
                </div>
              </div>

              <hr className="border-neutral-100" />

              {/* Normal Read-Only View */}
              {!isEditMode && !isResetPasswordOpen && (
                <div className="space-y-4">
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-semibold">Email Address:</span>
                      <span className="font-bold text-neutral-800" data-testid="modal-user-email">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 font-semibold">Phone Number:</span>
                        <span className="font-bold text-neutral-800" data-testid="modal-user-phone">{selectedUser.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-semibold flex items-center gap-1">
                        <Shield className="size-4 text-neutral-400" /> Access Role:
                      </span>
                      <span className="font-bold text-neutral-800 capitalize" data-testid="modal-user-role">{selectedUser.role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-semibold">Status:</span>
                      <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(selectedUser.status)}`} data-testid="modal-user-status">
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setEditName(selectedUser.name);
                          setEditEmail(selectedUser.email);
                          setEditRole(selectedUser.role);
                          setEditPhone(selectedUser.phone || '');
                          setEditError(null);
                          setIsEditMode(true);
                        }}
                        className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-neutral-700 font-bold rounded-xl border border-neutral-200 transition-all text-center cursor-pointer"
                        data-testid="edit-user-btn"
                      >
                        Edit User Info
                      </button>
                      <button
                        onClick={handleToggleStatus}
                        className={`py-2.5 px-4 font-bold rounded-xl border transition-all text-center cursor-pointer ${selectedUser.status === 'Active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        data-testid="toggle-status-btn"
                      >
                        {selectedUser.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setResetPassVal('');
                        setConfirmResetPassVal('');
                        setResetPassError(null);
                        setResetPassSuccess(null);
                        setIsResetPasswordOpen(true);
                      }}
                      className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 font-bold rounded-xl border border-neutral-200 transition-all text-center cursor-pointer"
                      data-testid="reset-password-btn"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Mode View */}
              {isEditMode && (
                <form onSubmit={handleUpdateUser} className="space-y-4 text-xs font-semibold text-neutral-700">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3" data-testid="edit-user-error">
                      {editError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 font-bold block">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                      data-testid="edit-user-name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 font-bold block">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value.toLowerCase())}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                      data-testid="edit-user-email"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 font-bold block">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                      data-testid="edit-user-phone"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 font-bold block">Access Role</label>
                    <CustomDropdown
                      value={editRole}
                      onChange={(val: any) => setEditRole(val as 'manager' | 'staff')}
                      triggerClassName="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all text-xs font-bold text-neutral-600 bg-white"
                      options={[
                        { value: 'staff', label: 'Staff' },
                        { value: 'manager', label: 'Manager' }
                      ]}
                      data-testid="edit-user-role"
                    />
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 font-bold transition-all cursor-pointer"
                      data-testid="cancel-edit-user-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                      data-testid="submit-edit-user-btn"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Reset Password View */}
              {isResetPasswordOpen && (
                <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-semibold text-neutral-700">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-800 text-sm">Reset Password</h4>
                    <button
                      type="button"
                      onClick={() => setIsResetPasswordOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600 font-bold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>

                  {resetPassError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3" data-testid="reset-password-error">
                      {resetPassError}
                    </div>
                  )}

                  {resetPassSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3" data-testid="reset-password-success">
                      {resetPassSuccess}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-neutral-500 font-bold block">New Password</label>
                    <div className="relative">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={resetPassVal}
                        onChange={(e) => setResetPassVal(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                        data-testid="reset-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                        data-testid="toggle-reset-password-visibility"
                        tabIndex={-1}
                      >
                        {showResetPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-500 font-bold block">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmResetPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmResetPassVal}
                        onChange={(e) => setConfirmResetPassVal(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                        data-testid="confirm-reset-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                        data-testid="toggle-confirm-password-visibility"
                        tabIndex={-1}
                      >
                        {showConfirmResetPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsResetPasswordOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 font-bold transition-all cursor-pointer"
                      data-testid="cancel-reset-password-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                      data-testid="submit-reset-password-btn"
                    >
                      Reset Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
