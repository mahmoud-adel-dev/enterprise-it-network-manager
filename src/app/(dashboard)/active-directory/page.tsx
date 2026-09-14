import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookUser, Settings, ServerCrash, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

export const metadata = { title: 'Active Directory Computers — Endpoint Manager' };

export default async function ActiveDirectoryPage() {
  const config = await db.select().from(schema.adConfiguration).where(eq(schema.adConfiguration.id, 'singleton')).get();
  
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

  const totalSynced = computers.length;
  const totalCorrelated = computers.filter(c => c.correlatedDeviceId !== null).length;
  const staleAccounts = computers.filter(c => {
    if (!c.lastLogon) return true;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return c.lastLogon < ninetyDaysAgo;
  }).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookUser className="size-6 text-primary" />
            Active Directory Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Computer objects synced from your domain controllers via LDAP.
          </p>
        </div>
        <Button className="gap-2" variant="outline" asChild>
          <Link href="/active-directory/configuration"><Settings className="size-4" /> AD Settings</Link>
        </Button>
      </div>

      {!config?.enabled ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <ServerCrash className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">Active Directory Integration Disabled</p>
          <p className="text-sm mt-1">Configure your LDAP endpoints and credentials to enable syncing.</p>
          <Button className="mt-4 gap-2" asChild>
             <Link href="/active-directory/configuration">Configure AD</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Domain FQDN</h4>
              <p className="font-mono text-sm">{config.domainFqdn}</p>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Computers Synced</h4>
              <p className="font-semibold text-xl">{totalSynced}</p>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Agent Coverage</h4>
              <div className="flex items-end justify-between">
                 <p className="font-semibold text-xl text-emerald-600 dark:text-emerald-500">{totalCorrelated}</p>
                 <p className="text-xs text-muted-foreground mb-1">({totalSynced > 0 ? Math.round((totalCorrelated/totalSynced)*100) : 0}%)</p>
              </div>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Stale Accounts (&gt;90d)</h4>
              <p className="font-semibold text-xl text-amber-500">{staleAccounts}</p>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Computer Name (sAMAccountName)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Operating System</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">OU Path</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Logon</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Agent Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {computers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No computer objects synced yet. Try running a manual sync from AD Configuration.
                    </td>
                  </tr>
                ) : (
                  computers.map((comp) => (
                    <tr key={comp.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium flex items-center gap-2">
                           {comp.dnsHostname || comp.samAccountName.replace('$', '')}
                           {!comp.enabled && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Disabled</Badge>}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{comp.samAccountName}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {comp.operatingSystem || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                        {comp.organizationalUnit || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5 mt-1">
                        <Clock className="size-3" />
                        {comp.lastLogon ? timeAgo(comp.lastLogon) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.correlatedDeviceId ? (
                          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-500 text-xs font-medium">
                            <ShieldCheck className="size-3.5" /> Managed
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-500 text-xs font-medium">
                            <ShieldAlert className="size-3.5" /> Unmanaged
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
