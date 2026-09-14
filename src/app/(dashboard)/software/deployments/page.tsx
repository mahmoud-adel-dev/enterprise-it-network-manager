import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Plus, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { DeploymentCardActions } from './deployment-card-actions';

export const metadata = { title: 'Software Deployments — Endpoint Manager' };

function DeploymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'QUEUED':
      return <Badge variant="secondary" className="gap-1"><Clock className="size-3" /> Queued</Badge>;
    case 'RUNNING':
      return <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700"><Loader2 className="size-3 animate-spin" /> Running</Badge>;
    case 'COMPLETED':
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" /> Completed</Badge>;
    case 'FAILED':
      return <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline" className="gap-1">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function DeploymentsPage() {
  // Join deployment jobs with packages and creators
  const jobs = await db
    .select({
      id: schema.deploymentJobs.id,
      name: schema.deploymentJobs.name,
      status: schema.deploymentJobs.status,
      targetCount: schema.deploymentJobs.totalTargets,
      successCount: schema.deploymentJobs.successCount,
      failureCount: schema.deploymentJobs.failureCount,
      runningCount: schema.deploymentJobs.runningCount,
      queuedCount: schema.deploymentJobs.queuedCount,
      createdAt: schema.deploymentJobs.createdAt,
      package: {
        name: schema.applicationPackages.name,
        version: schema.applicationPackages.applicationVersion,
      },
      creator: {
        name: schema.users.displayName,
      },
    })
    .from(schema.deploymentJobs)
    .innerJoin(schema.applicationPackages, eq(schema.deploymentJobs.applicationPackageId, schema.applicationPackages.id))
    .innerJoin(schema.users, eq(schema.deploymentJobs.createdBy, schema.users.id))
    .orderBy(desc(schema.deploymentJobs.createdAt));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="size-6 text-primary" />
            Deployment Jobs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage active software rollout jobs across the fleet.
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/software/deployments/new"><Plus className="size-4" /> New Deployment</Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <Rocket className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No deployments found</p>
          <p className="text-sm mt-1">Select an application from the Software Repository to start a deployment.</p>
          <Button className="mt-4 gap-2" asChild>
            <Link href="/software/deployments/new"><Plus className="size-4" /> Start First Rollout</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const completionPercent = job.targetCount > 0 
              ? Math.round(((job.successCount + job.failureCount) / job.targetCount) * 100) 
              : 0;

            return (
              <div key={job.id} className="border rounded-xl bg-card p-5 hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Link href={`/software/deployments/${job.id}`} className="hover:underline">
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors">{job.name}</h3>
                    </Link>
                    <div className="text-sm text-muted-foreground flex gap-3 mt-1 items-center">
                      <span>{job.package.name} v{job.package.version}</span>
                      <span>•</span>
                      <span>By {job.creator.name}</span>
                      <span>•</span>
                      <span>{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DeploymentStatusBadge status={job.status} />
                    <DeploymentCardActions jobId={job.id} status={job.status} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Progress ({completionPercent}%)</span>
                    <span className="text-muted-foreground">{job.successCount + job.failureCount} / {job.targetCount} targets</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    {/* Success bar */}
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${job.targetCount > 0 ? (job.successCount / job.targetCount) * 100 : 0}%` }}
                    />
                    {/* Failure bar */}
                    <div 
                      className="h-full bg-red-500 transition-all duration-500" 
                      style={{ width: `${job.targetCount > 0 ? (job.failureCount / job.targetCount) * 100 : 0}%` }}
                    />
                    {/* Running bar */}
                    <div 
                      className="h-full bg-blue-500 opacity-50 animate-pulse transition-all duration-500" 
                      style={{ width: `${job.targetCount > 0 ? (job.runningCount / job.targetCount) * 100 : 0}%` }}
                    />
                  </div>
                  
                  <div className="flex gap-4 text-xs pt-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
                      <CheckCircle2 className="size-3.5" />
                      {job.successCount} Successful
                    </div>
                    {job.failureCount > 0 && (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <XCircle className="size-3.5" />
                        {job.failureCount} Failed
                      </div>
                    )}
                    {job.runningCount > 0 && (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500">
                        <Loader2 className="size-3.5 animate-spin" />
                        {job.runningCount} Running
                      </div>
                    )}
                    {job.queuedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        {job.queuedCount} Queued
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
