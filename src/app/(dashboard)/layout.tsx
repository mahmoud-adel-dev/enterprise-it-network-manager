import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { isSetupComplete, getUserRoles } from '@/server/auth/rbac';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const setupDone = await isSetupComplete();
  if (!setupDone) redirect('/setup');

  const session = await getSession();
  if (!session) redirect('/login');

  const userRoles = await getUserRoles(session.userId);

  return <AppShell session={session} userRoles={userRoles}>{children}</AppShell>;
}
