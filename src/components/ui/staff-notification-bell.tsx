'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '../../utils/api';

export default function StaffNotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // Skip loading notifications in test environments to avoid leaking active promises
    if (process.env.NODE_ENV === 'test') return;

    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/api/notifications');
        const raw = res.data?.data ?? res.data ?? [];
        if (!Array.isArray(raw)) return;

        const count = raw.filter((n: any) => !n.is_read).length;
        if (active) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch unread notification count:', err);
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const displayCount = unreadCount >= 100 ? '99+' : String(unreadCount);

  return (
    <Link
      href="/work/notification"
      className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200 shrink-0"
      data-testid="header-notification-btn"
      aria-label={`${unreadCount} notifications`}
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-teal text-white text-[9px] font-sans font-extrabold flex items-center justify-center rounded-full border border-white leading-none shrink-0"
          data-testid="header-notification-badge"
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}
