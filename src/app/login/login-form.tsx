'use client';

import { useActionState, useState } from 'react';
import { loginAction, type LoginState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useLanguage, LanguageToggle } from '@/lib/i18n/language-context';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandLogo } from '@/components/common/brand-logo';

interface LoginFormProps {
  setupComplete?: boolean;
}

const initial: LoginState = {};

export function LoginForm({ setupComplete }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [showPw, setShowPw] = useState(false);
  const { lang } = useLanguage();

  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Top right language and theme switch */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <BrandLogo size={52} withGlow />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Endpoint Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? 'المنظومة المؤسسية الموحدة' : 'Enterprise Management Platform'}
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-xl">
          {setupComplete && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 mb-4">
              {isAr ? '✓ تم إنشاء حساب المسؤول بنجاح. يرجى تسجيل الدخول.' : '✓ Administrator account created. Please sign in.'}
            </div>
          )}

          {state.error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">{isAr ? 'اسم المستخدم' : 'Username'}</Label>
              <Input
                id="username"
                name="username"
                placeholder={isAr ? 'أدخل اسم المستخدم' : 'Enter username'}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{isAr ? 'كلمة المرور' : 'Password'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter password'}
                  autoComplete="current-password"
                  className={isAr ? 'pl-10' : 'pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${
                    isAr ? 'left-3' : 'right-3'
                  }`}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className={`size-4 ${isAr ? 'rotate-180' : ''}`} />
              )}
              <span>
                {pending
                  ? isAr ? 'جاري تسجيل الدخول…' : 'Signing in…'
                  : isAr ? 'تسجيل الدخول' : 'Sign In'}
              </span>
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {isAr
            ? 'للمصرح لهم فقط. يتم تسجيل وحفظ كافة محاولات الدخول في سجلات التدقيق الأمني.'
            : 'Authorized personnel only. All access is logged.'}
        </p>

        {/* Global Platform Copyright */}
        <div className="mt-8 pt-4 border-t border-border/60 text-center space-y-1.5 font-mono text-xs">
          <p className="text-foreground font-bold">
            {isAr ? 'جميع الحقوق محفوظة لدى محمود عادل 2026' : 'All rights reserved to Mahmoud Adel 2026'}
          </p>
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-[11px]">
            <a
              href="tel:01002840633"
              className="text-primary hover:underline font-extrabold inline-flex items-center gap-1"
            >
              <span>01002840633</span>
            </a>
            <span>•</span>
            <a
              href="https://wa.me/201002840633"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 font-bold"
            >
              {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
