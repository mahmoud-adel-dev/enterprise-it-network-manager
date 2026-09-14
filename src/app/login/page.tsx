import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { isSetupComplete } from '@/server/auth/rbac';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign In — Endpoint Manager' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  // Redirect if not set up
  const setupDone = await isSetupComplete();
  if (!setupDone) redirect('/setup');

  // Redirect if already logged in
  const session = await getSession();
  if (session) redirect('/dashboard');

  const params = await searchParams;

  return <LoginForm setupComplete={params.setup === 'complete'} />;
}
