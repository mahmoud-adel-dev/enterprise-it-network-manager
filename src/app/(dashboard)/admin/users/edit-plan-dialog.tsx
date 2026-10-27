'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserPlanAction } from './actions';
import { Sparkles, Calendar, Shield, Loader2, AlertCircle, X, CheckCircle2, Clock } from 'lucide-react';

interface EditPlanDialogProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    planName: string | null;
    planExpiresAt: Date | number | null;
    maxManagedDevices: number | null;
    notes: string | null;
  };
  triggerButton?: React.ReactNode;
}

export function EditPlanDialog({ user, triggerButton }: EditPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initial duration selection
  const initialDuration = user.planExpiresAt ? 'CUSTOM' : 'UNLIMITED';
  const [selectedDuration, setSelectedDuration] = useState<string>(initialDuration);
  const [customDate, setCustomDate] = useState<string>(() => {
    if (user.planExpiresAt) {
      const d = new Date(user.planExpiresAt);
      return d.toISOString().split('T')[0] ?? '';
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate.toISOString().split('T')[0] ?? '';
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    formData.set('userId', user.id);
    formData.set('planDuration', selectedDuration);
    if (selectedDuration === 'CUSTOM') {
      formData.set('customExpiresAt', customDate);
    }

    startTransition(async () => {
      const res = await updateUserPlanAction(formData);
      if (res.success) {
        setSuccess('تم تحديث الباقة وفترة الصلاحية بنجاح.');
        setTimeout(() => {
          setOpen(false);
          setSuccess(null);
        }, 1000);
      } else {
        setError(res.error || 'فشل تحديث الباقة.');
      }
    });
  };

  const durationOptions = [
    { id: 'UNLIMITED', label: 'دائم / غير محدود (Lifetime)', desc: 'صلاحية مفتوحة بدون تاريخ انتهاء' },
    { id: '7_DAYS', label: 'أسبوع (7 أيام تجريبي)', desc: 'صلاحية تنتهي بعد أسبوع واحد' },
    { id: '30_DAYS', label: 'شهر واحد (30 يوماً)', desc: 'باقة شهرية قياسية' },
    { id: '90_DAYS', label: '3 أشهر (ربع سنوي)', desc: 'صلاحية لمدة 90 يوماً' },
    { id: '180_DAYS', label: '6 أشهر (نصف سنوي)', desc: 'صلاحية لمدة نصف سنة' },
    { id: '365_DAYS', label: 'سنة كاملة (365 يوماً)', desc: 'باقة اشتراك سنوية' },
    { id: 'CUSTOM', label: 'تحديد تاريخ انتهاء مخصص', desc: 'اختر يدوياً اليوم والشهر والسنة' },
    { id: 'EXPIRED_NOW', label: 'إنهاء الصلاحية فوراً', desc: 'تعطيل دخول الحساب فوراً بسبب انتهاء الباقة' },
  ];

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setOpen(true)}>{triggerButton}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="size-3.5" />
          تعديل الباقة والصلاحية
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    إدارة باقة المستخدم والصلاحية
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    الحساب: <span className="font-mono font-medium text-foreground">{user.displayName}</span> (@{user.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Plan Name & Quota */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planName" className="text-xs font-medium">نوع الباقة (Plan Tier)</Label>
                  <select
                    id="planName"
                    name="planName"
                    defaultValue={user.planName ?? 'ENTERPRISE'}
                    className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:ring-1 focus:ring-ring"
                  >
                    <option value="ENTERPRISE">Enterprise (مؤسسات كاملة)</option>
                    <option value="PRO">Professional (احترافية)</option>
                    <option value="STANDARD">Standard (قياسية)</option>
                    <option value="TRIAL">Trial (تجريبية)</option>
                    <option value="CUSTOM">Custom (مخصصة)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="maxManagedDevices" className="text-xs font-medium">أقصى عدد أجهزة مسموح (Quota)</Label>
                  <Input
                    id="maxManagedDevices"
                    name="maxManagedDevices"
                    type="number"
                    min="1"
                    max="10000"
                    defaultValue={user.maxManagedDevices ?? 100}
                    className="mt-1.5 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Duration Options */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  تحديد فترة فتح الصلاحية يدوياً:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {durationOptions.map((opt) => {
                    const isSelected = selectedDuration === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedDuration(opt.id)}
                        className={`text-right p-3 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                            : 'border-border hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[11px] opacity-75 mt-1">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Input */}
              {selectedDuration === 'CUSTOM' && (
                <div className="p-3.5 bg-muted/30 border border-border rounded-lg space-y-1.5 animate-in fade-in duration-100">
                  <Label htmlFor="customDate" className="text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    تاريخ انتهاء الصلاحية المخصص:
                  </Label>
                  <Input
                    id="customDate"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    required
                    className="h-9 text-sm bg-background"
                  />
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs font-medium">ملاحظات إدارية عن الحساب / العقد</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="مثال: تم التجديد بعد سداد الفاتورة السنوية..."
                  defaultValue={user.notes ?? ''}
                  className="mt-1.5 h-9 text-sm"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="text-xs gap-1.5"
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />}
                  حفظ وتطبيق الصلاحية
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
