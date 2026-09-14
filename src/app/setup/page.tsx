import { redirect } from 'next/navigation';
import { isSetupComplete } from '@/server/auth/rbac';
import { SetupForm } from './setup-form';

export const metadata = { title: 'Initial Setup — Endpoint Manager' };

export default async function SetupPage() {
  const done = await isSetupComplete();
  if (done) redirect('/login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-13.5 0V11.25m13.5 3V11.25m0 0a3 3 0 00-3-3H9a3 3 0 00-3 3m12 0h1.5a2.25 2.25 0 100-4.5H18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Endpoint Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">First-time setup</p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Create Administrator Account</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This account will have full access to the management platform. This setup screen will be permanently disabled after completion.
            </p>
          </div>

          <SetupForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Enterprise Endpoint & Network Management Platform
        </p>
      </div>
    </div>
  );
}
