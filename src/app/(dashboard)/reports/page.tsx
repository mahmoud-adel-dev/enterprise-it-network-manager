import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { sql } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Monitor, Rocket, BookUser, Radio, PieChart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Enterprise Reports — Endpoint Manager' };

export default async function ReportsPage() {
  // Device stats
  const allDevices = await db.select().from(schema.devices);
  const totalDevices = allDevices.length;
  const onlineDevices = allDevices.filter((d) => d.onlineStatus === 'ONLINE').length;
  const offlineDevices = allDevices.filter((d) => d.onlineStatus === 'OFFLINE').length;
  
  // OS Distribution
  const osCounts: Record<string, number> = {};
  allDevices.forEach((d) => {
    const os = d.osClassification || 'other';
    osCounts[os] = (osCounts[os] || 0) + 1;
  });

  // Deployments stats
  const allJobs = await db.select().from(schema.deploymentJobs);
  const totalDeployments = allJobs.length;
  const totalTargets = allJobs.reduce((sum, j) => sum + j.totalTargets, 0);
  const successTargets = allJobs.reduce((sum, j) => sum + j.successCount, 0);
  const failedTargets = allJobs.reduce((sum, j) => sum + j.failureCount, 0);
  const deploymentSuccessRate = totalTargets > 0 ? Math.round((successTargets / totalTargets) * 100) : 100;

  // Active Directory stats
  const adComputers = await db.select().from(schema.adComputers);
  const totalAdComputers = adComputers.length;
  const correlatedAd = adComputers.filter((c) => c.correlatedDeviceId !== null).length;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const staleAdComputers = adComputers.filter((c) => !c.lastLogon || c.lastLogon < ninetyDaysAgo).length;

  // Network Discovery stats
  const discoveryResults = await db.select().from(schema.discoveryResults);
  const vlans = await db.select().from(schema.vlans);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="size-6 text-primary" />
            Enterprise Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Grounded fleet metrics, rollout success statistics, and raw data export capabilities.
          </p>
        </div>
      </div>

      {/* CSV Export Center */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Download className="size-4 text-primary" />
          On-Demand Server-Side CSV Data Exports
        </h3>
        <p className="text-xs text-muted-foreground">
          Export verified telemetry and asset tables for compliance audits, external BI tooling, or record keeping.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <Button variant="outline" className="justify-between h-auto py-3 text-xs" asChild>
            <a href="/api/v1/reports/export?type=devices" download>
              <span className="flex items-center gap-2">
                <Monitor className="size-4 text-blue-500" /> Device Fleet Inventory
              </span>
              <Download className="size-3.5 text-muted-foreground" />
            </a>
          </Button>

          <Button variant="outline" className="justify-between h-auto py-3 text-xs" asChild>
            <a href="/api/v1/reports/export?type=deployments" download>
              <span className="flex items-center gap-2">
                <Rocket className="size-4 text-primary" /> Software Rollout History
              </span>
              <Download className="size-3.5 text-muted-foreground" />
            </a>
          </Button>

          <Button variant="outline" className="justify-between h-auto py-3 text-xs" asChild>
            <a href="/api/v1/reports/export?type=ad_computers" download>
              <span className="flex items-center gap-2">
                <BookUser className="size-4 text-purple-500" /> Active Directory Sync
              </span>
              <Download className="size-3.5 text-muted-foreground" />
            </a>
          </Button>

          <Button variant="outline" className="justify-between h-auto py-3 text-xs" asChild>
            <a href="/api/v1/reports/export?type=discovery" download>
              <span className="flex items-center gap-2">
                <Radio className="size-4 text-emerald-500" /> Discovered Network Hosts
              </span>
              <Download className="size-3.5 text-muted-foreground" />
            </a>
          </Button>
        </div>
      </div>

      {/* Aggregate Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Fleet Health & OS Distribution */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Monitor className="size-4 text-primary" />
              Device Fleet & Operating Systems
            </h3>
            <Badge variant="outline" className="text-xs">
              {totalDevices} Enrolled
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{onlineDevices}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Online</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-muted-foreground">{offlineDevices}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Offline</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-foreground">
                {totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Availability</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Operating System Breakdown
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span>Windows 11</span>
                <span className="font-mono font-medium">{osCounts['windows11'] || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Windows 10</span>
                <span className="font-mono font-medium">{osCounts['windows10'] || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Windows Server</span>
                <span className="font-mono font-medium">{osCounts['windowsserver'] || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Other / Unclassified</span>
                <span className="font-mono font-medium">{osCounts['other'] || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Software Rollout & Deployment Performance */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Rocket className="size-4 text-primary" />
              Software Rollout Performance
            </h3>
            <Badge variant="outline" className="text-xs">
              {totalDeployments} Jobs
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-foreground">{totalTargets}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Targets</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{successTargets}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Successful</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-destructive">{failedTargets}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Failed</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Overall Rollout Success Rate</span>
              <span className="text-emerald-600 dark:text-emerald-400">{deploymentSuccessRate}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${deploymentSuccessRate}%` }}
              />
              <div
                className="h-full bg-red-500"
                style={{ width: `${100 - deploymentSuccessRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Directory Integrity */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <BookUser className="size-4 text-primary" />
              Active Directory Hygiene
            </h3>
            <Badge variant="outline" className="text-xs">
              {totalAdComputers} Accounts
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-foreground">{totalAdComputers}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Synced AD Objects</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{correlatedAd}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Agent Correlated</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-amber-500">{staleAdComputers}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Stale (&gt;90d)</div>
            </div>
          </div>
        </div>

        {/* Network Asset Visibility */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Radio className="size-4 text-primary" />
              Network Visibility & Segments
            </h3>
            <Badge variant="outline" className="text-xs">
              {vlans.length} VLANs
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-foreground">{discoveryResults.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Discovered IP Hosts</div>
            </div>
            <div className="bg-muted/20 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-foreground">{vlans.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Configured VLANs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
