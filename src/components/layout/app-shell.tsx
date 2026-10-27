import type { SessionPayload } from '@/server/auth/session';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

interface AppShellProps {
  session: SessionPayload;
  userRoles?: string[];
  children: React.ReactNode;
}

export function AppShell({ session, userRoles = [], children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sleek Enterprise Sidebar with comfortable width */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col border-e border-border">
        <Sidebar userRoles={userRoles} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar session={session} userRoles={userRoles} />
        <main className="flex-1 overflow-y-auto w-full min-w-0 flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>

          {/* Global Dashboard Platform Footer */}
          <footer className="border-t border-border/60 bg-card/50 py-2.5 px-4 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <span>جميع الحقوق محفوظة لدى محمود عادل 2026</span>
              <span>-</span>
              <a
                href="tel:01002840633"
                className="text-primary hover:underline font-extrabold"
              >
                01002840633
              </a>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              <a
                href="https://wa.me/201002840633"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-500 font-bold transition-colors"
              >
                واتساب: 01002840633
              </a>
              <span>•</span>
              <span className="hidden sm:inline-block">v1.0.0 Enterprise • Air-Gapped Network</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
