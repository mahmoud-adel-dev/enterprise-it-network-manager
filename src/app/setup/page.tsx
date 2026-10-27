import { redirect } from 'next/navigation';
import { isSetupComplete } from '@/server/auth/rbac';
import { SetupForm } from './setup-form';
import { BrandLogo } from '@/components/common/brand-logo';

export const metadata = { title: 'Initial Setup — Endpoint Manager' };

export default async function SetupPage() {
  const done = await isSetupComplete();
  if (done) redirect('/login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <BrandLogo size={52} withGlow />
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

        <div className="mt-8 pt-4 border-t border-border/60 text-center space-y-1.5 font-mono text-xs">
          <p className="text-foreground font-bold">
            جميع الحقوق محفوظة لدى محمود عادل 2026
          </p>
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-[11px]">
            <a href="tel:01002840633" className="text-primary hover:underline font-bold">
              01002840633
            </a>
            <span>•</span>
            <a
              href="https://wa.me/201002840633"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 font-bold"
            >
              واتساب: 01002840633
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
