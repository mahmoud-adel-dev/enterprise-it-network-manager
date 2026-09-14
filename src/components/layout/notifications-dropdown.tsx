'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  ExternalLink,
  Loader2,
  BellOff,
  X,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  category: 'ALL' | 'ALERTS' | 'SYSTEM';
  title: string;
  description: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  href?: string | null;
  read: boolean;
  createdAt: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function isValidInternalHref(href: string | null | undefined): href is string {
  if (!href) return false;
  const trimmed = href.trim();
  return /^\/[a-zA-Z0-9_\-][a-zA-Z0-9_\-\/\?&=#\.]*$/.test(trimmed) && !trimmed.startsWith('//');
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ALERTS' | 'SYSTEM'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (cat: 'ALL' | 'ALERTS' | 'SYSTEM' = activeTab) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications?category=${cat}&limit=25`);
      if (!res.ok) {
        throw new Error(`Failed to load notifications: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err: unknown) {
      console.error('[notifications] Fetch error:', err);
      setError('Unable to load alerts at this time');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/notifications?category=${activeTab}&limit=25`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active && data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        if (active) setError('Unable to load alerts at this time');
      }
    }

    void loadData();

    const interval = setInterval(() => {
      void loadData();
    }, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeTab]);

  // Handle outside click & Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTabChange = (tab: 'ALL' | 'ALERTS' | 'SYSTEM') => {
    setActiveTab(tab);
    void fetchNotifications(tab);
  };

  const markOneRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', id }),
      });
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const dismissOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const item = notifications.find((n) => n.id === id);
      if (item && !item.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);

      await fetch('/api/notifications', {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'ERROR':
        return <AlertCircle className="size-4 text-destructive shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="size-4 text-amber-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="size-4 text-blue-500 shrink-0" />;
    }
  };

  const { t, lang } = useLanguage();

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) void fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${t.notifications.title}${unreadCount > 0 ? `, ${unreadCount}` : ''}`}
        title={t.notifications.title}
        aria-expanded={isOpen}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">{t.notifications.title}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1"
                  title={t.notifications.markAllRead}
                >
                  <CheckCheck className="size-3.5" />
                  <span className="text-[11px] hidden sm:inline">{t.notifications.markAllRead}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={t.notifications.clearRead}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border px-3 pt-2 gap-2 text-xs font-medium text-muted-foreground bg-muted/20">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'ALL'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent hover:text-foreground'
              }`}
            >
              {t.notifications.all}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('ALERTS')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'ALERTS'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent hover:text-foreground'
              }`}
            >
              {t.notifications.alerts}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('SYSTEM')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'SYSTEM'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent hover:text-foreground'
              }`}
            >
              {t.notifications.system}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-xs">...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-destructive flex flex-col items-center gap-2">
                <AlertCircle className="size-6 text-destructive/70" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void fetchNotifications()}
                  className="text-xs font-medium text-primary hover:underline mt-1"
                >
                  {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                  <BellOff className="size-6 opacity-60" />
                </div>
                <p className="text-sm font-medium text-foreground">{t.notifications.noNotifications}</p>
              </div>
            ) : (
              notifications.map((item) => {
                const innerContent = (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${item.read ? 'text-foreground' : 'text-foreground font-bold'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    {item.href && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline">
                        View details <ExternalLink className="size-2.5" />
                      </span>
                    )}
                  </>
                );

                return (
                  <div
                    key={item.id}
                    className={`relative p-3.5 transition-colors group flex items-start gap-3 ${
                      item.read ? 'bg-card hover:bg-muted/40' : 'bg-primary/[0.04] hover:bg-primary/[0.08]'
                    }`}
                  >
                    <div className="mt-0.5">{getSeverityIcon(item.severity)}</div>

                    {isValidInternalHref(item.href) ? (
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (!item.read) void markOneRead(item.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 min-w-0 cursor-pointer block"
                      >
                        {innerContent}
                      </Link>
                    ) : (
                      <div
                        onClick={() => {
                          if (!item.read) void markOneRead(item.id);
                        }}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        {innerContent}
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {!item.read && (
                        <span
                          className="size-2 rounded-full bg-primary shrink-0"
                          title="Unread"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => void dismissOne(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-opacity"
                        title="Dismiss"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-border bg-muted/30 text-center">
            <Link
              href="/audit"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              View complete system audit logs &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
