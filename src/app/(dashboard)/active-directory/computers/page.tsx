import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { BookUser } from 'lucide-react';
import { ComputersTable } from './computers-table';
import { AdSyncButton } from './sync-button';

export const metadata = { title: 'Active Directory Computers — Endpoint Manager' };

export default async function ActiveDirectoryComputersPage() {
  const computers = await db
    .select({
      id: schema.adComputers.id,
      samAccountName: schema.adComputers.samAccountName,
      dnsHostname: schema.adComputers.dnsHostname,
      operatingSystem: schema.adComputers.operatingSystem,
      enabled: schema.adComputers.enabled,
      lastLogon: schema.adComputers.lastLogon,
      organizationalUnit: schema.adComputers.organizationalUnit,
      correlatedDeviceId: schema.adComputers.correlatedDeviceId,
      lastSyncAt: schema.adComputers.lastSyncAt,
    })
    .from(schema.adComputers)
    .orderBy(desc(schema.adComputers.lastLogon));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookUser className="size-6 text-primary" />
            Active Directory Computers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse and filter computer accounts discovered via LDAP synchronization from your domain.
          </p>
        </div>
        <AdSyncButton />
      </div>

      <ComputersTable computers={computers} />
    </div>
  );
}
