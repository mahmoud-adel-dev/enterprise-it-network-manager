import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatBytes, timeAgo, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Monitor,
  Terminal,
  Activity,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeploymentDetailsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) return notFound();

  const { id } = await params;

  const job = await db
    .select({
      id: schema.deploymentJobs.id,
      name: schema.deploymentJobs.name,
      status: schema.deploymentJobs.status,
      targetType: schema.deploymentJobs.targetType,
      targetDefinition: schema.deploymentJobs.targetDefinition,
      totalTargets: schema.deploymentJobs.totalTargets,
      successCount: schema.deploymentJobs.successCount,
      failureCount: schema.deploymentJobs.failureCount,
      queuedCount: schema.deploymentJobs.queuedCount,
      runningCount: schema.deploymentJobs.runningCount,
      cancelledCount: schema.deploymentJobs.cancelledCount,
      createdAt: schema.deploymentJobs.createdAt,
      startedAt: schema.deploymentJobs.startedAt,
      completedAt: schema.deploymentJobs.completedAt,
      createdBy: schema.deploymentJobs.createdBy,
      pkg: {
        id: schema.applicationPackages.id,
        name: schema.applicationPackages.name,
        applicationVersion: schema.applicationPackages.applicationVersion,
        installerType: schema.applicationPackages.installerType,
        fileSize: schema.applicationPackages.fileSize,
      },
    })
    .from(schema.deploymentJobs)
    .innerJoin(
      schema.applicationPackages,
      eq(schema.deploymentJobs.applicationPackageId, schema.applicationPackages.id),
    )
    .where(eq(schema.deploymentJobs.id, id))
    .get();

  if (!job) return notFound();

  // Targets
  const targets = await db
    .select({
      target: schema.deploymentTargets,
      device: {
        id: schema.devices.id,
        hostname: schema.devices.hostname,
        ipAddress: schema.devices.ipAddress,
        macAddress: schema.devices.macAddress,
        operatingSystem: schema.devices.operatingSystem,
        onlineStatus: schema.devices.onlineStatus,
      },
    })
    .from(schema.deploymentTargets)
    .innerJoin(schema.devices, eq(schema.deploymentTargets.deviceId, schema.devices.id))
    .where(eq(schema.deploymentTargets.deploymentJobId, id))
    .orderBy(desc(schema.deploymentTargets.startedAt));

  const completionPercent = job.totalTargets > 0
    ? Math.round(((job.successCount + job.failureCount) / job.totalTargets) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/software/deployments" className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="size-3.5" /> Deployments
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">{job.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Package className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{job.name}</h1>
                <Badge
                  variant={
                    job.status === 'COMPLETED'
                      ? 'secondary'
                      : job.status === 'RUNNING'
                      ? 'default'
                      : job.status === 'FAILED'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {job.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Package: <strong className="text-foreground">{job.pkg.name} v{job.pkg.applicationVersion}</strong></span>
                <span>•</span>
                <span>Type: {job.pkg.installerType}</span>
                <span>•</span>
                <span>Size: {formatBytes(job.pkg.fileSize)}</span>
                <span>•</span>
                <span>Created {timeAgo(job.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/software/deployments">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Deployments
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex justify-between items-center text-sm font-medium">
          <span className="text-foreground font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Overall Rollout Progress ({completionPercent}%)
          </span>
          <span className="text-xs text-muted-foreground">
            {job.successCount + job.failureCount} of {job.totalTargets} endpoints completed
          </span>
        </div>

        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${job.totalTargets > 0 ? (job.successCount / job.totalTargets) * 100 : 0}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${job.totalTargets > 0 ? (job.failureCount / job.totalTargets) * 100 : 0}%` }}
          />
          <div
            className="h-full bg-blue-500 opacity-60 animate-pulse transition-all duration-500"
            style={{ width: `${job.totalTargets > 0 ? (job.runningCount / job.totalTargets) * 100 : 0}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-lg border bg-muted/20 text-center">
            <div className="text-xl font-bold">{job.totalTargets}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Total Targets</div>
          </div>
          <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-center text-emerald-600 dark:text-emerald-400">
            <div className="text-xl font-bold">{job.successCount}</div>
            <div className="text-[11px] mt-0.5">Successful</div>
          </div>
          <div className="p-3 rounded-lg border bg-destructive/10 border-destructive/20 text-center text-destructive">
            <div className="text-xl font-bold">{job.failureCount}</div>
            <div className="text-[11px] mt-0.5">Failed</div>
          </div>
          <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20 text-center text-blue-600 dark:text-blue-400">
            <div className="text-xl font-bold">{job.runningCount}</div>
            <div className="text-[11px] mt-0.5">In Progress</div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/20 text-center text-muted-foreground">
            <div className="text-xl font-bold">{job.queuedCount}</div>
            <div className="text-[11px] mt-0.5">Pending Queue</div>
          </div>
        </div>
      </div>

      {/* Target Device Breakdown Table */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Monitor className="size-4 text-primary" /> Target Endpoints ({targets.length})
          </h3>
          <Badge variant="outline" className="text-xs">
            Target Type: {job.targetType}
          </Badge>
        </div>

        {targets.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
            No target devices registered for this deployment.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Device Hostname</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Target Status</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Exit Code</th>
                  <th className="p-3">Last Activity</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {targets.map(({ target, device }) => (
                  <tr key={target.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">
                      <Link href={`/devices/${device.id}`} className="hover:underline flex items-center gap-2">
                        <Monitor className="size-3.5 text-muted-foreground" />
                        {device.hostname}
                      </Link>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {device.ipAddress ?? 'N/A'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          target.status === 'SUCCESS'
                            ? 'secondary'
                            : target.status === 'FAILED'
                            ? 'destructive'
                            : target.status === 'INSTALLING' || target.status === 'DOWNLOADING'
                            ? 'default'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {target.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {target.attempts} / {target.maxAttempts}
                    </td>
                    <td className="p-3 font-mono">
                      {target.exitCode != null ? target.exitCode : '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {timeAgo(target.completedAt ?? target.lastAttemptAt ?? target.startedAt)}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/devices/${device.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                          View Device
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
