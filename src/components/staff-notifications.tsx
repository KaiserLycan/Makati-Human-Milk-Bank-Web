'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Info,
  Users,
  Baby,
  Database,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: 'donor' | 'beneficiary' | 'inventory' | 'system';
  read: boolean;
  group: 'Today' | 'Yesterday' | 'Earlier';
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

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'New Donor Application',
      description: 'Sarah Jenkins has submitted a donor application for the Walk-In (WI) program.',
      time: '20 mins ago',
      category: 'donor',
      read: false,
      group: 'Today',
    },
    {
      id: '2',
      title: 'Low Buffer Warning',
      description: 'O-Negative milk buffer is currently at 800 ml (below threshold of 1000 ml).',
      time: '2 hours ago',
      category: 'inventory',
      read: false,
      group: 'Today',
    },
    {
      id: '3',
      title: 'New Milk Request',
      description: 'Makati Medical Center requested 250ml of pasteurized breast milk.',
      time: 'Yesterday at 4:15 PM',
      category: 'beneficiary',
      read: true,
      group: 'Yesterday',
    },
    {
      id: '4',
      title: 'System Backup Success',
      description: 'Daily database backup and replication completed successfully at 03:00 AM.',
      time: 'Yesterday at 3:00 AM',
      category: 'system',
      read: true,
      group: 'Yesterday',
    },
    {
      id: '5',
      title: 'Donor Approved',
      description: "Maria Santos's application has been approved by Dr. Alice May Miller.",
      time: '3 days ago',
      category: 'donor',
      read: true,
      group: 'Earlier',
    },
  ]);

  // Handle Mark all as read
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Toggle single read status
  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Render category icons
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
                className="inline-flex items-center gap-2 text-xs font-sans font-bold text-neutral-500 hover:text-brand-teal transition-colors duration-200 group"
                data-testid="back-btn"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 duration-200" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-3 mt-1.5">
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

          {/* List of Notifications */}
          <div className="space-y-8">
            {['Today', 'Yesterday', 'Earlier'].map((groupName) => {
              const groupItems = notifications.filter((n) => n.group === groupName);
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
                        className={`bg-white rounded-2xl border p-4 sm:p-5 flex items-start gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-200 cursor-pointer hover:border-neutral-300 hover:shadow-md ${
                          item.read 
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
                            <h4 className={`text-sm sm:text-base font-sans font-bold truncate ${
                              item.read ? 'text-neutral-700' : 'text-neutral-900'
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
          </div>

        </main>
      </div>

    </div>
  );
}
