'use client';

import React, { useState, useEffect } from 'react';
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
  Droplet
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

  // Redirect to login if session is inactive
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mhmb_logged_in') !== 'true') {
      router.push('/work');
    }
  }, [router]);

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    const timer = setTimeout(() => {
      setShowSidebarNotification(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleRoleChange = (role: 'manager' | 'staff') => {
    const updated = { ...profile, role };
    setProfile(updated);
    saveProfile(updated);
    reloadWindow();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('mhmb_logged_in');
      await api.post('/api/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    router.push('/work');
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const res = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Logout failed. Please try again.');
      }
      router.push('/');
    } catch (err) {
      setLogoutError(
        err instanceof Error ? err.message : 'Logout failed. Please try again.'
      );
      setIsLoggingOut(false);
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
        <div className="p-4 space-y-4 bg-neutral-50 border-t border-neutral-100 shrink-0">
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
              <div className="size-9 bg-neutral-200 rounded-lg overflow-hidden flex items-center justify-center font-bold text-neutral-700 text-sm group-hover:bg-brand-teal group-hover:text-white transition-colors duration-250 select-none">
                AM
              </div>
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
              onClick={handleLogout}
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
                <User className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">My Staff Profile</h3>
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

            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="size-28 rounded-full bg-slate-100 flex items-center justify-center font-bold text-neutral-700 text-3xl border border-neutral-200 select-none shadow-inner">
                AM
              </div>

              <div className="space-y-1.5 w-full">
                <h4 className="font-bold text-neutral-950 text-lg" data-testid="profile-modal-name">
                  {profile?.name}
                </h4>
                <p className="text-xs text-neutral-400 font-medium">Employee ID: {profile?.id}</p>
              </div>

              <hr className="w-full border-neutral-100" />

              <div className="w-full text-left space-y-3.5 text-xs">
                <div className="flex items-center gap-3.5">
                  <Mail className="size-4 text-neutral-400" />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Email Address</p>
                    <p className="font-bold text-neutral-800">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <Calendar className="size-4 text-neutral-400" />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Joined Date</p>
                    <p className="font-bold text-neutral-800">October 21, 2024</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <Shield className="size-4 text-neutral-400" />
                  <div className="flex-1">
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Role Access Level</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-neutral-800 capitalize">{profile?.role}</span>
                      <select
                        value={profile?.role}
                        onChange={(e) => handleRoleChange(e.target.value as 'manager' | 'staff')}
                        className="text-[10px] font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 cursor-pointer outline-none transition-all"
                        data-testid="role-selector"
                      >
                        <option value="manager">Manager Access</option>
                        <option value="staff">Staff Access</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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