import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/server/auth/rbac';
import { AccessDenied } from '@/components/ui/access-denied';
import { SettingsForm } from './settings-form';

export const metadata = { title: 'System Settings — Endpoint Manager' };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const userRoles = await getUserRoles(session.userId);
  if (!userRoles.includes('SUPER_ADMIN')) {
    return (
      <AccessDenied
        currentRole={userRoles[0] || 'VIEWER'}
        requiredRole="SUPER_ADMIN"
        customMessage="إعدادات النظام العامة وتوليد مفاتيح التسجيل وتهيئة الدليل النشط مخصصة حصرياً للسوبر أدمن."
      />
    );
  }

  const allSettings = await db.select().from(schema.appSettings);
  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const tokens = await db
    .select()
    .from(schema.enrollmentTokens)
    .orderBy(desc(schema.enrollmentTokens.createdAt));

  const adConfig = await db
    .select()
    .from(schema.adConfiguration)
    .limit(1);

  const serializedTokens = tokens.map((t) => ({
    id: t.id,
    label: t.label,
    maxUses: t.maxUses ?? 1,
    useCount: t.useCount ?? 0,
    enabled: Boolean(t.enabled),
    expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  const systemStatus = {
    nodeVersion: process.version,
    environment: process.env['NODE_ENV'] || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    databaseEngine: 'SQLite (Better-SQLite3)',
    databaseMode: 'WAL (Write-Ahead Logging)',
    storagePath: settingsMap['storage.package_path'] || './data/packages',
    adConfigured: Boolean(adConfig[0]?.enabled),
    adDomain: adConfig[0]?.domainFqdn || null,
  };

  return (
    <div className="w-full space-y-6 px-4 md:px-6 xl:px-8 2xl:px-10 py-6">
      <SettingsForm
        settingsMap={settingsMap}
        tokens={serializedTokens}
        systemStatus={systemStatus}
      />
    </div>
  );
}
