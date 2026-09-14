import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Radio, Plus } from 'lucide-react';
import Link from 'next/link';
import { DiscoveryRunsTable } from './discovery-runs-table';

export const metadata = { title: 'Network Discovery Scans — Endpoint Manager' };

export default async function NetworkDiscoveryPage() {
  const rawRuns = await db
    .select({
      run: schema.discoveryRuns,
      scope: schema.networkScopes,
    })
    .from(schema.discoveryRuns)
    .innerJoin(schema.networkScopes, eq(schema.discoveryRuns.scopeId, schema.networkScopes.id))
    .orderBy(desc(schema.discoveryRuns.createdAt));

  const runsWithResults = await Promise.all(
    rawRuns.map(async ({ run, scope }) => {
      const results = await db
        .select({
          id: schema.discoveryResults.id,
          ipAddress: schema.discoveryResults.ipAddress,
          macAddress: schema.discoveryResults.macAddress,
          hostname: schema.discoveryResults.hostname,
          vendor: schema.discoveryResults.vendor,
          responseMethod: schema.discoveryResults.responseMethod,
        })
        .from(schema.discoveryResults)
        .where(eq(schema.discoveryResults.runId, run.id))
        .orderBy(schema.discoveryResults.ipAddress);

      return {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        hostsChecked: run.hostsChecked,
        hostsResponded: run.hostsResponded,
        errors: run.errors,
        createdAt: run.createdAt,
        scope: {
          id: scope.id,
          name: scope.name,
          cidr: scope.cidr,
        },
        results,
      };
    })
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="size-6 text-primary" />
            Network Discovery
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automated subnet sweep history, host classification, and active IP detection.
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/network/discovery/new">
            <Plus className="size-4" /> Run New Scan
          </Link>
        </Button>
      </div>

      <DiscoveryRunsTable runs={runsWithResults} />
    </div>
  );
}
