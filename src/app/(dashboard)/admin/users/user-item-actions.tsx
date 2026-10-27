'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toggleUserEnabledAction, resetUserPasswordAction, deleteUserAdminAction } from './actions';
import { EditPlanDialog } from './edit-plan-dialog';
import { KeyRound, Power, Loader2, AlertCircle, X, Sparkles, Trash2 } from 'lucide-react';

interface UserItemActionsProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    enabled: boolean;
    planName: string | null;
    planExpiresAt: Date | number | null;
    maxManagedDevices: number | null;
    notes: string | null;
  };
  isSelf: boolean;
}

export function UserItemActions({ user, isSelf }: UserItemActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleUserEnabledAction(user.id);
      if (!res.success && res.error) alert(res.error);
    });
  };

  const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('userId', user.id);

    startTransition(async () => {
      const res = await resetUserPasswordAction(formData);
      if (res.success) {
        setResetOpen(false);
        alert(`تم تغيير كلمة المرور بنجاح للمستخدم: ${user.username}`);
      } else {
        setError(res.error || 'فشل تغيير كلمة المرور.');
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUserAdminAction(user.id);
      if (res.success) {
        setDeleteOpen(false);
      } else {
        alert(res.error || 'فشل حذف المستخدم.');
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-1" />}

      {/* Edit Plan & Validity */}
      <EditPlanDialog
        user={user}
        triggerButton={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
            title="تعديل الباقة وفترة الصلاحية"
          >
            <Sparkles className="size-3" />
            <span className="hidden sm:inline">الباقة</span>
          </Button>
        }
      />

      {/* Enable / Disable Toggle */}
      {!isSelf && (
        <Button
          variant={user.enabled ? 'outline' : 'default'}
          size="sm"
          className={`h-8 text-xs gap-1 transition-colors ${
            user.enabled
              ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          onClick={handleToggle}
          disabled={isPending}
          title={user.enabled ? 'تعطيل الحساب' : 'تفعيل الحساب'}
        >
          <Power className="size-3" />
          <span>{user.enabled ? 'تعطيل' : 'تفعيل'}</span>
        </Button>
      )}

      {/* Reset Password */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
        onClick={() => setResetOpen(true)}
        title="تغيير كلمة المرور"
      >
        <KeyRound className="size-3" />
      </Button>

      {/* Delete User */}
      {!isSelf && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          title="حذف المستخدم"
        >
          <Trash2 className="size-3" />
        </Button>
      )}

      {/* Reset Password Modal */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <KeyRound className="size-4 text-primary" />
                تغيير كلمة المرور: @{user.username}
              </h3>
              <button
                onClick={() => setResetOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleReset} className="p-5 space-y-3">
              {error && (
                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="12 خانة على الأقل"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(false)} disabled={isPending}>
                  إلغاء
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : 'حفظ كلمة المرور'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" />
                <h3 className="font-semibold text-base">تأكيد حذف المستخدم</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                هل أنت متأكد من رغبتك في حذف الحساب <span className="font-bold text-foreground">@{user.username}</span>؟ هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={isPending}>
                  إلغاء
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : 'نعم، احذف الحساب'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
