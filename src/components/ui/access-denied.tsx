import Link from 'next/link';
import { ShieldAlert, ArrowLeft, ArrowRight, Lock, Home, UserCheck } from 'lucide-react';
import { BrandLogo } from '@/components/common/brand-logo';

interface AccessDeniedProps {
  currentRole?: string;
  requiredRole?: string;
  customMessage?: string;
}

export function AccessDenied({
  currentRole = 'VIEWER',
  requiredRole = 'SUPER_ADMIN',
  customMessage,
}: AccessDeniedProps) {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-lg w-full bg-card border border-destructive/20 rounded-2xl p-8 shadow-xl shadow-destructive/5 space-y-6 relative overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo & Lock icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 ring-8 ring-destructive/5 animate-pulse">
              <ShieldAlert className="size-12" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-background border border-destructive/30 text-destructive">
              <Lock className="size-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <BrandLogo size={24} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Endpoint Manager Security Isolation
            </span>
          </div>
        </div>

        {/* Headers */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-destructive/15 text-destructive border border-destructive/25">
            <span>HTTP 403 — FORBIDDEN ACCESS</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            عذراً، الوصول غير مصرح به
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {customMessage ||
              'هذه الصفحة مخصصة حصرياً للمديرين برتبة (سوبر أدمن). حسابك الحالي لا يمتلك الصلاحيات الإدارية الكافية لعرض هذه البيانات أو إجراء تعديلات عليها.'}
          </p>
        </div>

        {/* Roles Details Box */}
        <div className="bg-muted/40 border border-border/80 rounded-xl p-4 text-xs font-mono space-y-2 text-start">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">رتبة حسابك الحالي:</span>
            <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-bold border border-border">
              {currentRole}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الرتبة المطلوبة للوصول:</span>
            <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-bold border border-destructive/20">
              {requiredRole}
            </span>
          </div>
          <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground/90 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>تم تسجيل محاولة الوصول غير المصرح في سجلات التدقيق الأمني (Audit Logs).</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            <Home className="size-4" />
            <span>العودة للوحة القيادة</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-foreground font-medium text-xs transition-colors"
          >
            <UserCheck className="size-4" />
            <span>تبديل الحساب (تسجيل الخروج)</span>
          </Link>
        </div>

        {/* Copyright notice */}
        <div className="pt-4 border-t border-border/60 text-[10px] text-muted-foreground">
          جميع الحقوق محفوظة لدى محمود عادل 2026 - 01002840633
        </div>
      </div>
    </div>
  );
}
