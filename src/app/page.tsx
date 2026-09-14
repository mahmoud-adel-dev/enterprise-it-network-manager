import { getSession } from '@/server/auth/session';
import { isSetupComplete } from '@/server/auth/rbac';
import { LandingPage } from '@/components/landing/landing-page';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const setupDone = await isSetupComplete().catch(() => false);
  const session = await getSession().catch(() => null);

  return (
    <LandingPage
      isAuthenticated={Boolean(session)}
      userName={session?.username ?? null}
      setupDone={setupDone}
    />
  );
}
