import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Plus, Radio, Server, Monitor, HelpCircle, Activity } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

export const metadata = { title: 'Network Overview — Endpoint Manager' };

function DeviceIcon({ type }: { type: string }) {
  switch (type) {
    case 'SERVER': return <Server className="size-4" />;
    case 'WORKSTATION': return <Monitor className="size-4" />;
    case 'SWITCH':
    case 'ROUTER': return <Network className="size-4" />;
    default: return <HelpCircle className="size-4 opacity-50" />;
  }
}

export default async function NetworkPage() {
  const latestRunData = await db
    .select({ run: schema.discoveryRuns, scope: schema.networkScopes })
    .from(schema.discoveryRuns)
    .innerJoin(schema.networkScopes, eq(schema.discoveryRuns.scopeId, schema.networkScopes.id))
    .orderBy(desc(schema.discoveryRuns.createdAt))
    .limit(1)
    .get();

  const latestRun = latestRunData?.run;
  const targetScope = latestRunData?.scope;

  const results = latestRun 
    ? await db
        .select()
        .from(schema.discoveryResults)
        .where(eq(schema.discoveryResults.runId, latestRun.id))
        .orderBy(desc(schema.discoveryResults.discoveredAt))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="size-6 text-primary" />
            Network Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visibility into discovered endpoints, switches, and rogue devices on the local network.
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/network/discovery/new"><Radio className="size-4" /> Run Network Scan</Link>
        </Button>
      </div>

      {!latestRun ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <Activity className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No network scans found</p>
          <p className="text-sm mt-1">Initiate a discovery scan to map out your infrastructure.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Scan Target</h4>
              <p className="font-mono text-sm">{targetScope?.cidr || '—'}</p>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
              <Badge variant={latestRun.status === 'COMPLETED' ? 'success' : latestRun.status === 'FAILED' ? 'destructive' : 'secondary'}>
                {latestRun.status}
              </Badge>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Devices Found</h4>
              <p className="font-semibold text-xl">{latestRun.hostsResponded}</p>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Completed At</h4>
              <p className="text-sm">{latestRun.completedAt ? timeAgo(latestRun.completedAt) : '—'}</p>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP Address</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hostname</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">MAC Address</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Response Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No devices were found in this scan.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{res.ipAddress}</td>
                      <td className="px-4 py-3 text-xs">{res.hostname || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{res.macAddress || '—'}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">{res.vendor || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="text-[10px]">{res.responseMethod || 'UNKNOWN'}</Badge>
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
