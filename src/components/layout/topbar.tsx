'use client';

import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/login/actions';
import { LogOut, ChevronRight } from 'lucide-react';
import type { SessionPayload } from '@/server/auth/session';
import { ThemeToggle } from './theme-toggle';
import { NotificationsDropdown } from './notifications-dropdown';
import { useLanguage, LanguageToggle } from '@/lib/i18n/language-context';

interface TopBarProps {
  session: SessionPayload;
  userRoles?: string[];
}

export function TopBar({ session, userRoles = [] }: TopBarProps) {
  const pathname = usePathname();
  const { t, lang } = useLanguage();

  // Dynamic breadcrumb translation
  const parts = pathname.split('/').filter(Boolean);
  const rawSection = parts[0] || 'dashboard';
  const rawPage = parts[1] || rawSection;

  const sectionLabel =
    (t.topbar.sections as Record<string, string>)[rawSection] ||
    rawSection.charAt(0).toUpperCase() + rawSection.slice(1);

  const pageLabel =
    (t.topbar.pages as Record<string, string>)[rawPage] ||
    rawPage.charAt(0).toUpperCase() + rawPage.slice(1);

  const isAr = lang === 'ar';
  let roleText = isAr ? 'مستخدم مصرح' : 'Authorized User';

  if (userRoles.includes('SUPER_ADMIN')) {
    roleText = isAr ? 'سوبر أدمن (Super Admin)' : 'Super Admin';
  } else if (userRoles.includes('IT_ADMIN')) {
    roleText = isAr ? 'مدير تكنولوجيا المعلومات' : 'IT Admin';
  } else if (userRoles.includes('NETWORK_ADMIN')) {
    roleText = isAr ? 'مدير الشبكات' : 'Network Admin';
  } else if (userRoles.includes('HELPDESK')) {
    roleText = isAr ? 'دعم فني' : 'Helpdesk';
  } else if (userRoles.includes('AUDITOR')) {
    roleText = isAr ? 'مراجع أمني' : 'Auditor';
  } else if (userRoles.includes('VIEWER')) {
    roleText = isAr ? 'مستعرض (صلاحية مقيدة)' : 'Viewer (Restricted)';
  } else if (userRoles.length > 0) {
    roleText = userRoles[0]!;
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b bg-card border-border shrink-0 z-10 transition-colors">
      {/* Dynamic Breadcrumb / Page Title */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        <span className="font-medium text-foreground/70 hidden sm:inline">{sectionLabel}</span>
        <ChevronRight className="size-3.5 opacity-50 hidden sm:inline rtl:rotate-180 transition-transform" />
        <span className="font-semibold text-foreground truncate">{pageLabel}</span>
      </div>

      {/* Language Toggle + Theme Toggle + Notifications + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <LanguageToggle />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Center */}
        <NotificationsDropdown />

        <div className="h-5 w-px bg-border my-auto mx-0.5" />

        {/* User profile & Logout */}
        <form action={logoutAction} className="flex items-center">
          <div className="flex items-center gap-2 me-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/20">
              {session.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-start">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {session.username}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {roleText}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t.topbar.signOut}
            title={t.topbar.signOut}
          >
            <LogOut className="size-3.5 rtl:rotate-180" />
            <span className="hidden sm:inline">{t.topbar.signOut}</span>
          </button>
        </form>
      </div>
    </header>
  );
}
