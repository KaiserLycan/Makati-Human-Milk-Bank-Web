'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  User,
  X,
  Shield,
  Mail,
  Calendar,
  Milk,
  Beaker,
  Refrigerator,
  HandPlatter,
  Droplet,
  Phone
} from 'lucide-react';
import { loadProfile, saveProfile, UserProfile } from '../../utils/storage';
import { reloadWindow } from '../../utils/navigation';
import { api } from '../../utils/api';

interface StaffSidebarProps {
  activeItem:
    | 'dashboard'
    | 'reports'
    | 'collection'
    | 'donors'
    | 'applicants-donors'
    | 'beneficiaries'
    | 'applicants-beneficiaries'
    | 'pool'
    | 'inventory'
    | 'requests'
    | 'users'
    | 'audits';
}

export default function StaffSidebar({ activeItem }: StaffSidebarProps) {
  const router = useRouter();

  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alice May Miller',
    id: '2024102114',
    email: 'staff@mhmb.gov',
    role: 'manager',
  });

  const [profileMode, setProfileMode] = useState<'view' | 'edit' | 'password'>('view');
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isProfileOpen && profile) {
      setEditForm({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
      });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setProfileMode('view');
      setModalError(null);
      setModalSuccess(null);
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
    }
  }, [isProfileOpen, profile]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const getJoinedDate = () => {
    if (profile?.created_at) {
      try {
        const d = new Date(profile.created_at);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (e) {
        // Fallback below
      }
    }
    return 'October 21, 2024';
  };

  // Redirect to login if session is inactive
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mhmb_logged_in') !== 'true') {
      router.push('/work');
    }
  }, [router]);

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);

    const fetchProfileData = async () => {
      if (process.env.NODE_ENV === 'test') {
        return;
      }
      try {
        const response = await api.get('/api/users/profile');
        const user = response.data.data;
        if (user) {
          const updated: UserProfile = {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profile_image_url: user.profile_image_url,
            created_at: user.created_at,
            status: user.status,
          };
          setProfile(updated);
          saveProfile(updated);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchProfileData();

    const timer = setTimeout(() => {
      setShowSidebarNotification(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    if (!editForm.name.trim()) {
      setModalError('Name is required.');
      setIsSubmitting(false);
      return;
    }
    if (!editForm.phone.trim()) {
      setModalError('Phone number is required.');
      setIsSubmitting(false);
      return;
    }
    if (!/^\+[1-9]\d{1,14}$/.test(editForm.phone.trim())) {
      setModalError('Phone number must use E164 format (e.g. +639629518812).');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('email', editForm.email);
      formData.append('phone', editForm.phone);
      if (selectedImageFile) {
        formData.append('profile_image_url', selectedImageFile);
      } else if (profile.profile_image_url) {
        formData.append('profile_image_url', profile.profile_image_url);
      }

      const response = await api.put(`/api/users/${profile.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const user = response.data.data;
      if (user) {
        const updated: UserProfile = {
          ...profile,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profile_image_url: user.profile_image_url,
        };
        setProfile(updated);
        saveProfile(updated);
        setModalSuccess('Profile updated successfully!');
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
        setProfileMode('view');
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setModalError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    if (!passwordForm.old_password) {
      setModalError('Current password is required.');
      setIsSubmitting(false);
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setModalError('New password must be at least 8 characters.');
      setIsSubmitting(false);
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setModalError('New passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.patch('/api/users/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setModalSuccess('Password changed successfully!');
      setProfileMode('view');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setModalError(err.response?.data?.message || err.response?.data?.error || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: 'manager' | 'staff') => {
    const updated = { ...profile, role };
    setProfile(updated);
    saveProfile(updated);
    reloadWindow();
  };

  const handleLogout = () => {
    setLogoutError(null);
    setIsLogoutOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try{
      localStorage.removeItem('mhmb_logged_in');
      localStorage.removeItem('mhmb_profile');
      await api.post('/api/auth/logout');
      router.push('/work');
    } catch (err: any){
      if (err?.response?.status === 401) {
        router.push('/work');
      } else {
        setLogoutError(
          err?.response?.data?.error || 'Logout failed. Please Try Again.'
        );
        setIsLoggingOut(false);
      }
    }
  };

  const handleLogoutCancel = () => {
    setIsLogoutOpen(false);
    setLogoutError(null);
  };

  const getLinkClass = (item: typeof activeItem) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
      activeItem === item
        ? 'bg-brand-teal/10 text-brand-teal font-bold shadow-[0_2px_8px_rgba(0,175,185,0.05)]'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-brand-teal'
    }`;

  const getSubLinkClass = (item: typeof activeItem) =>
    `block px-3 py-2 text-sm rounded-lg transition-colors ${
      activeItem === item
        ? 'bg-brand-teal/10 text-brand-teal font-bold'
        : 'text-neutral-500 hover:text-brand-teal hover:bg-neutral-50'
    }`;

  return (
    <>
      <aside className="w-80 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-3xl font-sans font-bold text-neutral-900 tracking-tight">
              MHMB
            </span>
          </div>

          <hr className="border-neutral-100" />

          {/* Nav links */}
          <nav className="space-y-1.5">
            <Link href="/work/dashboard" className={getLinkClass('dashboard')} data-testid="nav-dashboard">
              <LayoutDashboard className="size-5 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link href="/work/reports" className={getLinkClass('reports')} data-testid="nav-reports">
              <FileText className="size-5 shrink-0" />
              <span>Reports</span>
            </Link>

            <hr className="border-neutral-100 my-2" />

            {/* Donors */}
            <div>
              <button
                onClick={() => setDonorsOpen(!donorsOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium text-sm transition-all cursor-pointer"
                data-testid="nav-donors-toggle"
              >
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-neutral-400" />
                  <span>Manage Donors</span>
                </div>
                {donorsOpen ? (
                  <ChevronDown className="size-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="size-4 text-neutral-400" />
                )}
              </button>
              {donorsOpen && (
                <div className="pl-9 pr-2 mt-1 space-y-1">
                  <Link href="/work/donor" className={getSubLinkClass('donors')} data-testid="nav-sub-donors">
                    Donors
                  </Link>
                  <Link href="/work/applicant-donor" className={getSubLinkClass('applicants-donors')} data-testid="nav-sub-applicants">
                    Applicants
                  </Link>
                </div>
              )}
            </div>

            {/* Beneficiaries */}
            <div>
              <button
                onClick={() => setBeneficiariesOpen(!beneficiariesOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium text-sm transition-all cursor-pointer"
                data-testid="nav-beneficiaries-toggle"
              >
                <div className="flex items-center gap-3">
                  <Baby className="size-5 text-neutral-400" />
                  <span>Manage Beneficiaries</span>
                </div>
                {beneficiariesOpen ? (
                  <ChevronDown className="size-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="size-4 text-neutral-400" />
                )}
              </button>
              {beneficiariesOpen && (
                <div className="pl-9 pr-2 mt-1 space-y-1">
                  <Link href="/work/beneficiary" className={getSubLinkClass('beneficiaries')} data-testid="nav-sub-beneficiaries">
                    Beneficiaries
                  </Link>
                  <Link href="/work/applicant-beneficiary" className={getSubLinkClass('applicants-beneficiaries')} data-testid="nav-sub-beneficiary-applicants">
                    Applicants
                  </Link>
                </div>
              )}
            </div>

            <hr className="border-neutral-100 my-2" />

            <Link href="/work/collection" className={getLinkClass('collection')} data-testid="nav-collection">
              <Droplet className="size-5 shrink-0" />
              <span>Collection</span>
            </Link>

            <Link href="/work/pool" className={getLinkClass('pool')} data-testid="nav-pool">
              <Beaker className="size-5 shrink-0" />
              <span>Pool Milk</span>
            </Link>

            <Link href="/work/inventory" className={getLinkClass('inventory')} data-testid="nav-inventory">
              <Refrigerator className="size-5 shrink-0" />
              <span>Milk Inventory</span>
            </Link>

            <Link href="/work/requests" className={getLinkClass('requests')} data-testid="nav-requests">
              <HandPlatter className="size-5 shrink-0" />
              <span>Milk Requests</span>
            </Link>

            {profile?.role === 'manager' && (
              <>
                <hr className="border-neutral-100 my-2" />
                <Link href="/work/users" className={getLinkClass('users')} data-testid="nav-users">
                  <UserCheck className="size-5 shrink-0" />
                  <span>Manage Users</span>
                </Link>
                <Link href="/work/audits" className={getLinkClass('audits')} data-testid="nav-audits">
                  <History className="size-5 shrink-0" />
                  <span>Audits</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 space-y-4 bg-white border-t border-neutral-100 shrink-0">
          {showSidebarNotification && (
            <div
              className="bg-cyan-50 border border-cyan-100 rounded-xl p-3.5 flex gap-3 text-neutral-900 transition-all duration-300 animate-out fade-out"
              data-testid="sidebar-notification"
            >
              <Bell className="size-4 text-cyan-700 animate-bounce" />
              <div>
                <p className="text-xs font-sans font-bold leading-tight">System Status Online</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Database Synced</p>
              </div>
            </div>
          )}

          <hr className="border-neutral-200" />

          <div className="flex items-center justify-between p-2">
            <div
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 min-w-0 cursor-pointer group hover:bg-neutral-100/50 p-1 rounded-xl transition-all"
              data-testid="profile-trigger"
              role="button"
              aria-label="View user profile"
            >
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name || 'User Profile'}
                  className="size-9 rounded-lg object-cover"
                  data-testid="profile-avatar"
                />
              ) : (
                <div className="size-9 bg-neutral-200 rounded-lg overflow-hidden flex items-center justify-center font-bold text-neutral-700 text-sm group-hover:bg-brand-teal group-hover:text-white transition-colors duration-250 select-none">
                  {getInitials(profile?.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate group-hover:text-brand-teal transition-colors" data-testid="profile-name">
                  {profile?.name}
                </p>
                <p className="text-[10px] text-neutral-500 truncate" data-testid="profile-id">
                  {profile?.id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsLogoutOpen(true)}
              className="text-neutral-400 hover:text-red-500 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              data-testid="logout-btn"
              aria-label="Logout"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* PROFILE MODAL */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          data-testid="profile-modal"
        >
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profileMode === 'view' ? (
                  <User className="size-5 text-brand-teal" />
                ) : profileMode === 'edit' ? (
                  <User className="size-5 text-brand-teal" />
                ) : (
                  <Shield className="size-5 text-brand-teal" />
                )}
                <h3 className="text-lg font-bold text-neutral-900">
                  {profileMode === 'view' ? 'Profile' : profileMode === 'edit' ? 'Update Profile' : 'Change Password'}
                </h3>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                aria-label="Close profile modal"
                data-testid="close-profile-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            {profileMode === 'view' ? (
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name || 'User Profile'}
                    className="size-28 rounded-full object-cover border border-neutral-200 shadow-inner"
                    data-testid="profile-modal-avatar"
                  />
                ) : (
                  <div className="size-28 rounded-full bg-slate-100 flex items-center justify-center font-bold text-neutral-700 text-3xl border border-neutral-200 select-none shadow-inner">
                    {getInitials(profile?.name)}
                  </div>
                )}

                <div className="space-y-1.5 w-full">
                  <h4 className="font-bold text-neutral-950 text-lg" data-testid="profile-modal-name">
                    {profile?.name}
                  </h4>
                  <p className="text-xs text-neutral-400 font-medium">Employee ID: {profile?.id}</p>
                </div>

                <hr className="w-full border-neutral-100" />

                {modalSuccess && (
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-semibold">
                    {modalSuccess}
                  </div>
                )}

                <div className="w-full text-left space-y-3.5 text-xs">
                  <div className="flex items-center gap-3.5">
                    <Mail className="size-4 text-neutral-400" />
                    <div>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Email Address</p>
                      <p className="font-bold text-neutral-800">{profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Phone className="size-4 text-neutral-400" />
                    <div>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Phone Number</p>
                      <p className="font-bold text-neutral-800">{profile?.phone || 'Not Provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Calendar className="size-4 text-neutral-400" />
                    <div>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Joined Date</p>
                      <p className="font-bold text-neutral-800">{getJoinedDate()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Shield className="size-4 text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Role Access Level</p>
                      <p className="font-bold text-neutral-800 capitalize mt-0.5">{profile?.role}</p>
                    </div>
                  </div>
                </div>

                <hr className="w-full border-neutral-100" />

                <div className="w-full flex flex-col gap-2.5">
                  <button
                    onClick={() => { setProfileMode('edit'); setModalError(null); setModalSuccess(null); }}
                    className="w-full py-2.5 text-xs font-bold text-neutral-700 hover:text-brand-teal bg-white border border-neutral-200 hover:border-brand-teal/30 hover:bg-brand-teal/5 rounded-xl transition-all shadow-sm text-center cursor-pointer"
                  >
                    Update Profile Info
                  </button>
                  <button
                    onClick={() => { setProfileMode('password'); setModalError(null); setModalSuccess(null); }}
                    className="w-full py-2.5 text-xs font-bold text-neutral-700 hover:text-brand-teal bg-white border border-neutral-200 hover:border-brand-teal/30 hover:bg-brand-teal/5 rounded-xl transition-all shadow-sm text-center cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            ) : profileMode === 'edit' ? (
              <form onSubmit={handleUpdateProfileSubmit} className="p-8 space-y-6">
                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-medium">
                    {modalError}
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {selectedImagePreview || profile?.profile_image_url ? (
                      <img
                        src={selectedImagePreview || profile?.profile_image_url || ''}
                        alt="User Profile Preview"
                        className="size-28 rounded-full object-cover border border-neutral-200 shadow-inner group-hover:opacity-75 transition-opacity"
                      />
                    ) : (
                      <div className="size-28 rounded-full bg-slate-100 flex items-center justify-center font-bold text-neutral-700 text-3xl border border-neutral-200 select-none shadow-inner group-hover:bg-neutral-200 transition-colors">
                        {getInitials(profile?.name)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-neutral-900/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold font-sans">Change Image</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedImageFile(file);
                        setSelectedImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 block">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+639629518812"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                    />
                    <p className="text-[10px] text-neutral-400 font-semibold">Must start with + and country code (E164 format).</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => { setProfileMode('view'); setModalError(null); }}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-xl bg-brand-teal hover:bg-brand-teal-darker text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="p-8 space-y-6">
                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-medium">
                    {modalError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 block">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 block">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 block">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium text-neutral-800 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => { setProfileMode('view'); setModalError(null); }}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-xl bg-brand-teal hover:bg-brand-teal-darker text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4"
          data-testid="logout-modal"
        >
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="size-5 text-red-500" />
                <h3 className="text-base font-bold text-neutral-900">Confirm Logout</h3>
              </div>
              <button
                onClick={handleLogoutCancel}
                disabled={isLoggingOut}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all disabled:opacity-50"
                aria-label="Close logout modal"
                data-testid="close-logout-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed">
                Are you sure you want to log out? You will be redirected to the home page.
              </p>

              {logoutError && (
                <div
                  className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-medium animate-in fade-in duration-200"
                  data-testid="logout-error"
                >
                  {logoutError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleLogoutCancel}
                  disabled={isLoggingOut}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all disabled:opacity-50"
                  data-testid="cancel-logout-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="confirm-logout-btn"
                >
                  {isLoggingOut ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="size-4" />
                      Log Out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}