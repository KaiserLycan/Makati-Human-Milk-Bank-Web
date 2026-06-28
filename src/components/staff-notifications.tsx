'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Info,
  Users,
  Baby,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';
import { api } from '../utils/api';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: 'donor' | 'beneficiary' | 'inventory' | 'system';
  read: boolean;
  group: 'Today' | 'Yesterday' | 'Past 7 Days' | 'Past Month' | 'Past Year' | 'Past Years';
}



export default function StaffNotifications() {
  // Collapsible Sub-menus state
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);

  // Auto-dismiss sidebar banner state
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);

  // Dynamic Date State
  const [currentTime, setCurrentTime] = useState('');

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

  // Loading / error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // ─── Pagination State ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // ─── Filter / Search State ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Convert a created_at timestamp to a relative string. Returns a formatted date if old. */
  const formatRelativeTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Unknown time';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown time';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays < 365) return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /** Map a created_at timestamp to one of the six display groups. */
  const getGroup = (dateStr: string | null | undefined): NotificationItem['group'] => {
    if (!dateStr) return 'Past Years';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Past Years';
    const now = new Date();

    // Strip time for calendar-day comparisons
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);
    const start7Days = new Date(startOfToday);
    start7Days.setDate(startOfToday.getDate() - 7);
    const start30Days = new Date(startOfToday);
    start30Days.setDate(startOfToday.getDate() - 30);
    const start365Days = new Date(startOfToday);
    start365Days.setDate(startOfToday.getDate() - 365);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    if (date >= start7Days) return 'Past 7 Days';
    if (date >= start30Days) return 'Past Month';
    if (date >= start365Days) return 'Past Year';
    return 'Past Years';
  };

  /**
   * Map the API entity_type / notification_type to one of the four UI categories.
   */
  const mapCategory = (
    entityType: string,
    notificationType: string,
  ): NotificationItem['category'] => {
    const t = (entityType || notificationType || '').toLowerCase();
    if (t.includes('donor')) return 'donor';
    if (t.includes('beneficiar') || t.includes('request') || t.includes('recipient')) return 'beneficiary';
    if (t.includes('milk') || t.includes('inventor') || t.includes('expir') || t.includes('buffer')) return 'inventory';
    return 'system';
  };

  // ─── Fetch notifications on mount ───────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/api/notifications');

        const raw: Array<{
          nid: number;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
          notification_type: string;
          entity_type: string;
        }> = res.data?.data ?? res.data;

        if (cancelled) return;

        const mapped: NotificationItem[] = raw.map((n) => ({
          id: String(n.nid),
          title: n.title,
          description: n.message,
          time: formatRelativeTime(n.created_at),
          category: mapCategory(n.entity_type, n.notification_type),
          read: n.is_read,
          group: getGroup(n.created_at),
        }));

        setNotifications(mapped);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'Failed to load notifications.';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await Promise.all(
        unread.map((n) => api.patch(`/api/notifications/${n.id}/read`)),
      );
    } catch {
      setNotifications((prev) =>
        prev.map((n) => {
          const wasUnread = unread.some((u) => u.id === n.id);
          return wasUnread ? { ...n, read: false } : n;
        }),
      );
    }
  };

  const toggleRead = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    if (!notification.read) {
      // Unread → Read: call /read endpoint
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );

      try {
        await api.patch(`/api/notifications/${id}/read`);
      } catch {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
        );
      }
    } else {
      // Read → Unread: call /unread endpoint and persist to DB
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );

      try {
        await api.patch(`/api/notifications/${id}/unread`);
      } catch {
        // Revert if API call fails
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Filtered list (search + unread toggle) ──────────────────────────────────
  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      if (showUnreadOnly && n.read) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [notifications, searchQuery, showUnreadOnly]);

  // ─── Pagination derived values ───────────────────────────────────────────────

  const totalItems = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp currentPage if notifications shrink
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * pageSize;           // 0-based inclusive
  const endIndex = Math.min(startIndex + pageSize, totalItems); // 0-based exclusive

  /** The slice of notifications visible on the current page */
  const pageItems = useMemo(
    () => filteredNotifications.slice(startIndex, endIndex),
    [filteredNotifications, startIndex, endIndex],
  );



  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleUnreadToggle = () => {
    setShowUnreadOnly((prev) => !prev);
    setCurrentPage(1);
  };

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // ─── Category icons ──────────────────────────────────────────────────────────

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'donor':
        return (
          <div className="size-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
        );
      case 'beneficiary':
        return (
          <div className="size-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
            <Baby className="size-5" />
          </div>
        );
      case 'inventory':
        return (
          <div className="size-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Database className="size-5" />
          </div>
        );
      default:
        return (
          <div className="size-10 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center shrink-0">
            <Info className="size-5" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">

      {/* Sidebar Navigation */}
      <StaffSidebar activeItem="dashboard" />

      {/* Main Workspace Notification Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">

        {/* Top Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0">
          <div>
            <h2 className="text-xl font-sans font-bold text-neutral-900">
              Staff Portal
            </h2>
          </div>
          <div className="text-neutral-500 font-sans text-xs sm:text-sm font-medium">
            {currentTime || 'Loading date...'}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-6 flex-1 max-w-4xl w-full mx-auto">

          {/* Navigation Back & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/work/dashboard"
                className="hidden"
                data-testid="back-btn"
              >
                <ArrowLeft className="size-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-sans font-bold text-neutral-900">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span
                    className="bg-brand-teal text-white text-xs font-sans font-bold px-2.5 py-0.5 rounded-full"
                    data-testid="unread-badge"
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-sans font-bold text-brand-teal bg-brand-teal/5 hover:bg-brand-teal/10 border border-brand-teal/20 rounded-xl transition-all duration-200 shrink-0 shadow-sm"
                data-testid="mark-all-read-btn"
              >
                <CheckCheck className="size-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* ── Filter Bar: Search + Unread toggle ─────────────────────────── */}
          {!loading && !error && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search notifications…"
                  className="w-full h-10 pl-9 pr-9 rounded-xl border border-neutral-200 bg-white text-sm font-sans text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal/50 transition-all duration-150 shadow-sm"
                  data-testid="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Unread only toggle */}
              <button
                onClick={handleUnreadToggle}
                className={`h-10 px-4 rounded-xl border text-xs font-sans font-bold shrink-0 flex items-center gap-2 transition-all duration-150 shadow-sm ${showUnreadOnly
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                data-testid="unread-filter-btn"
              >
                <span className={`size-2 rounded-full shrink-0 ${showUnreadOnly ? 'bg-white' : 'bg-brand-teal'}`} />
                Unread only
                {showUnreadOnly && unreadCount > 0 && (
                  <span className="ml-1 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Gmail-style Pagination Toolbar  */}
          {!loading && !error && totalItems > 0 && (
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-2xl px-4 py-2.5 shadow-sm">
              {/* Left: page-size input spinner */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-sans font-medium">Show:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Math.min(Number(e.target.value) || 1, 100));
                    setCurrentPage(1);
                  }}
                  className="w-16 h-8 text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-2.5 outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all text-center"
                  data-testid="page-size-select"
                />
              </div>

              {/* Right: counter + prev/next */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-sans font-medium text-neutral-500" data-testid="page-counter">
                  {startIndex + 1}–{endIndex} of {totalItems}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrev}
                    disabled={safePage === 1}
                    className="size-7 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                    aria-label="Previous page"
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={safePage === totalPages}
                    className="size-7 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                    aria-label="Next page"
                    data-testid="next-page-btn"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Notifications */}
          <div className="space-y-8">

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-start gap-4 animate-pulse"
                  >
                    <div className="size-10 bg-neutral-100 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-neutral-100 rounded w-1/3" />
                      <div className="h-3 bg-neutral-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-red-200 space-y-4">
                <div className="size-12 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto">
                  <Info className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-bold text-neutral-800">
                    Could not load notifications
                  </p>
                  <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Notification groups (scoped to current page slice) */}
            {!loading && !error && (
              <>
                {(['Today', 'Yesterday', 'Past 7 Days', 'Past Month', 'Past Year', 'Past Years'] as const).map((groupName) => {
                  const groupItems = pageItems.filter((n) => n.group === groupName);
                  if (groupItems.length === 0) return null;

                  return (
                    <div key={groupName} className="space-y-3">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-wider pl-1">
                        {groupName}
                      </h3>

                      <div className="space-y-3">
                        {groupItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleRead(item.id)}
                            className={`bg-white rounded-2xl border p-4 sm:p-5 flex items-start gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-200 cursor-pointer hover:border-neutral-300 hover:shadow-md ${item.read
                              ? 'border-neutral-200/80 opacity-75'
                              : 'border-brand-teal/30 bg-gradient-to-r from-brand-teal/[0.01] to-transparent ring-1 ring-brand-teal/10'
                              }`}
                            data-testid={`notification-card-${item.id}`}
                            aria-label={`Notification: ${item.title}`}
                          >
                            {/* Icon column */}
                            {getCategoryIcon(item.category)}

                            {/* Text Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`text-sm sm:text-base font-sans font-bold truncate ${item.read ? 'text-neutral-700' : 'text-neutral-900'
                                  }`}>
                                  {item.title}
                                </h4>
                                <span className="text-[10px] sm:text-xs text-neutral-400 font-sans shrink-0 whitespace-nowrap">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-neutral-500 font-sans leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            {/* Unread dot column */}
                            {!item.read && (
                              <div className="pt-2 shrink-0">
                                <span className="block size-2 bg-brand-teal rounded-full animate-pulse" data-testid={`unread-dot-${item.id}`} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-neutral-200 space-y-4">
                    <div className="size-12 bg-neutral-50 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                      <Bell className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-sans font-bold text-neutral-800">
                        All caught up!
                      </p>
                      <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                        You have no notifications in your queue.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </main>
      </div>

    </div>
  );
}
