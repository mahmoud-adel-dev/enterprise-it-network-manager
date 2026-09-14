import type { SessionPayload } from '@/server/auth/session';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

interface AppShellProps {
  session: SessionPayload;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sleek Enterprise Sidebar with comfortable width */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col border-e border-border">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar session={session} />
        <main className="flex-1 overflow-y-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
