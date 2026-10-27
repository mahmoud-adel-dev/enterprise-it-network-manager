'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserItemActions } from './user-item-actions';
import { EditPlanDialog } from './edit-plan-dialog';
import { 
  Search, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Infinity as InfinityIcon, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Shield,
  Layers,
  Calendar
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export interface UserRowData {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  enabled: boolean;
  planName: string | null;
  planExpiresAt: Date | number | null;
  maxManagedDevices: number | null;
  notes: string | null;
  lastLoginAt: Date | number | null;
  createdAt: Date | number;
  roles: string[];
}

interface UsersTableProps {
  users: UserRowData[];
  currentUserId?: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'UNLIMITED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const now = Date.now();

  // Extract all unique roles
  const allRoleNames = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.roles.forEach((r) => set.add(r)));
    return Array.from(set);
  }, [users]);

  // Compute status helpers
  const enrichedUsers = useMemo(() => {
    return users.map((u) => {
      const isExpired = !!(u.planExpiresAt && new Date(u.planExpiresAt).getTime() < now);
      const isUnlimited = !u.planExpiresAt;
      
      let daysRemaining: number | null = null;
      if (u.planExpiresAt && !isExpired) {
        const diffMs = new Date(u.planExpiresAt).getTime() - now;
        daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        ...u,
        isExpired,
        isUnlimited,
        daysRemaining,
      };
    });
  }, [users, now]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((u) => {
      // Search match
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.planName && u.planName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && (!u.enabled || u.isExpired)) return false;
      if (statusFilter === 'DISABLED' && u.enabled) return false;
      if (statusFilter === 'EXPIRED' && !u.isExpired) return false;
      if (statusFilter === 'UNLIMITED' && !u.isUnlimited) return false;

      // Role filter
      if (roleFilter !== 'ALL' && !u.roles.includes(roleFilter)) return false;

      return true;
    });
  }, [enrichedUsers, search, statusFilter, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، اسم المستخدم، البريد، أو الباقة..."
            className="pl-9 h-9 text-sm bg-card"
          />
        </div>

        {/* Filter Badges / Selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Status Tabs */}
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              الكل ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'ACTIVE' ? 'bg-background text-emerald-600 shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              نشط
            </button>
            <button
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'DISABLED' ? 'bg-background text-destructive shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              معطل
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'EXPIRED' ? 'bg-background text-amber-600 shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              باقة منتهية
            </button>
            <button
              onClick={() => setStatusFilter('UNLIMITED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'UNLIMITED' ? 'bg-background text-primary shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              دائم
            </button>
          </div>

          {/* Role Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground shadow-xs focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">كل الأدوار</option>
              {allRoleNames.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3.5 font-medium">المستخدم / الحساب</th>
                <th className="text-left px-4 py-3.5 font-medium">الرتبة</th>
                <th className="text-center px-4 py-3.5 font-medium">حالة الدخول</th>
                <th className="text-left px-4 py-3.5 font-medium">نوع الباقة والصلاحية</th>
                <th className="text-left px-4 py-3.5 font-medium">الأجهزة (Quota)</th>
                <th className="text-left px-4 py-3.5 font-medium">آخر ظهور</th>
                <th className="text-right px-4 py-3.5 font-medium">إجراءات التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="size-8 text-muted-foreground/50" />
                      <p className="font-medium text-foreground">لا توجد حسابات تطابق خيارات البحث الحالية.</p>
                      <p className="text-xs">جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUserId;

                  return (
                    <tr key={u.id} className="hover:bg-muted/15 transition-colors group">
                      {/* User Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-1.5">
                              {u.displayName}
                              {isSelf && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/40 text-primary">
                                  أنت
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">@{u.username}</div>
                            {u.email && <div className="text-[11px] text-muted-foreground/80">{u.email}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r, i) => (
                            <Badge
                              key={i}
                              variant={r === 'SUPER_ADMIN' ? 'default' : 'secondary'}
                              className={`text-[10px] font-mono ${
                                r === 'SUPER_ADMIN' ? 'bg-primary/90 text-primary-foreground' : ''
                              }`}
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      {/* Account Enabled Status */}
                      <td className="px-4 py-3.5 text-center">
                        {u.enabled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="size-3" />
                            مفعل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20">
                            <XCircle className="size-3" />
                            معطل
                          </span>
                        )}
                      </td>

                      {/* Plan & Validity Status */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                              {u.planName || 'ENTERPRISE'}
                            </span>

                            {/* Plan Validity Tag */}
                            {u.isUnlimited ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                <InfinityIcon className="size-3" /> دائم
                              </span>
                            ) : u.isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 animate-pulse">
                                <AlertTriangle className="size-3" /> باقة منتهية!
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                <Clock className="size-3" /> متبقي {u.daysRemaining} يوم
                              </span>
                            )}
                          </div>

                          {/* Expiry Date Display */}
                          {u.planExpiresAt && (
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="size-3 text-muted-foreground/70" />
                              تنتهي: {new Date(u.planExpiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          )}

                          {u.notes && (
                            <div className="text-[10px] text-muted-foreground/80 italic line-clamp-1" title={u.notes}>
                              ملاحظة: {u.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quota */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        {u.maxManagedDevices ?? 100} جهاز
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'لم يسجل دخول'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <UserItemActions
                          user={{
                            id: u.id,
                            username: u.username,
                            displayName: u.displayName,
                            enabled: u.enabled,
                            planName: u.planName,
                            planExpiresAt: u.planExpiresAt,
                            maxManagedDevices: u.maxManagedDevices,
                            notes: u.notes,
                          }}
                          isSelf={isSelf}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
