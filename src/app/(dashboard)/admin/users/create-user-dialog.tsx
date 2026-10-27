'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUserAdminAction } from './actions';
import { Plus, UserPlus, Loader2, AlertCircle, X, Clock, Calendar, Sparkles } from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

export function CreateUserDialog({ roles }: { roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [planDuration, setPlanDuration] = useState<string>('UNLIMITED');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0] ?? '';
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('planDuration', planDuration);
    if (planDuration === 'CUSTOM') {
      formData.set('customExpiresAt', customDate);
    }

    startTransition(async () => {
      const res = await createUserAdminAction(formData);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || 'فشل إنشاء المستخدم.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 shadow-sm font-medium">
        <Plus className="size-4" /> إضافة مستخدم جديد
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    إنشاء حساب مستخدم جديد
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تحديد بيانات الدخول، الرتبة، وفترة صلاحية الباقة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="username" className="text-xs">اسم المستخدم (Username) *</Label>
                  <Input id="username" name="username" required placeholder="مثال: ahmed_it" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label htmlFor="displayName" className="text-xs">اسم العرض (Display Name) *</Label>
                  <Input id="displayName" name="displayName" required placeholder="مثال: أحمد عبد الله" className="mt-1 h-9 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email" className="text-xs">البريد الإلكتروني</Label>
                  <Input id="email" name="email" type="email" placeholder="user@company.com" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs">كلمة المرور *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="12 خانة مع رموز وأرقام"
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="roleName" className="text-xs">الدور / الرتبة *</Label>
                  <select
                    id="roleName"
                    name="roleName"
                    defaultValue="IT_ADMIN"
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:ring-1 focus:ring-ring"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name} className="bg-popover text-popover-foreground">
                        {r.name} {r.description ? `(${r.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="planName" className="text-xs">نوع الباقة (Plan Tier)</Label>
                  <select
                    id="planName"
                    name="planName"
                    defaultValue="ENTERPRISE"
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:ring-1 focus:ring-ring"
                  >
                    <option value="ENTERPRISE">Enterprise (مؤسسات)</option>
                    <option value="PRO">Professional (احترافية)</option>
                    <option value="STANDARD">Standard (قياسية)</option>
                    <option value="TRIAL">Trial (تجريبية)</option>
                  </select>
                </div>
              </div>

              {/* Plan Validity Duration Selection */}
              <div className="pt-2 border-t border-border">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground mb-2">
                  <Clock className="size-3.5 text-primary" />
                  فترة فتح الصلاحية للحساب (مدة الباقة):
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'UNLIMITED', label: 'دائم (Lifetime)' },
                    { id: '7_DAYS', label: 'أسبوع (7 أيام)' },
                    { id: '30_DAYS', label: 'شهر (30 يوماً)' },
                    { id: '90_DAYS', label: '3 أشهر (90 يوماً)' },
                    { id: '365_DAYS', label: 'سنة (365 يوماً)' },
                    { id: 'CUSTOM', label: 'تاريخ مخصص' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanDuration(p.id)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                        planDuration === p.id
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-border hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {planDuration === 'CUSTOM' && (
                  <div className="mt-2.5 p-3 bg-muted/30 border border-border rounded-lg">
                    <Label htmlFor="customDate" className="text-xs font-medium flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      تاريخ انتهاء الصلاحية:
                    </Label>
                    <Input
                      id="customDate"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      required
                      className="mt-1 h-9 text-sm bg-background"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs">ملاحظات إدارية (اختياري)</Label>
                <Input id="notes" name="notes" placeholder="ملاحظات حول الحساب أو سبب الإنشاء..." className="mt-1 h-9 text-sm" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  إنشاء الحساب وتفعيل الباقة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
