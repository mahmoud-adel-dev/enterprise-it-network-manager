import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq, ne } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Info, Clock, CheckCircle2, XCircle, Loader2, Monitor } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { DomainJoinDialog } from './domain-join-dialog';
import { JobCancelButton } from './job-cancel-button';

export const metadata = { title: 'Domain Join — Endpoint Manager' };

function JobStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary" className="gap-1 text-[10px]"><Clock className="size-3" /> Queued</Badge>;
    case 'JOINING':
    case 'VALIDATING':
      return <Badge variant="default" className="gap-1 text-[10px] bg-blue-600"><Loader2 className="size-3 animate-spin" /> {status}</Badge>;
    case 'SUCCESS':
      return <Badge variant="success" className="gap-1 text-[10px]"><CheckCircle2 className="size-3" /> Completed</Badge>;
    case 'FAILED':
      return <Badge variant="destructive" className="gap-1 text-[10px]"><XCircle className="size-3" /> Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline" className="text-[10px]">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export default async function DomainJoinPage() {
  const adConfig = await db.select().from(schema.adConfiguration).where(eq(schema.adConfiguration.id, 'singleton')).get();

  const jobs = await db
    .select({
      id: schema.domainJoinJobs.id,
      targetOu: schema.domainJoinJobs.targetOu,
      status: schema.domainJoinJobs.status,
      errorMessage: schema.domainJoinJobs.errorMessage,
      createdAt: schema.domainJoinJobs.createdAt,
      startedAt: schema.domainJoinJobs.startedAt,
      completedAt: schema.domainJoinJobs.completedAt,
      device: {
        id: schema.devices.id,
        hostname: schema.devices.hostname,
        ipAddress: schema.devices.ipAddress,
        operatingSystem: schema.devices.operatingSystem,
      },
    })
    .from(schema.domainJoinJobs)
    .innerJoin(schema.devices, eq(schema.domainJoinJobs.deviceId, schema.devices.id))
    .orderBy(desc(schema.domainJoinJobs.createdAt));

  // Find devices not currently joined to domain
  const eligibleDevices = await db
    .select({
      id: schema.devices.id,
      hostname: schema.devices.hostname,
      ipAddress: schema.devices.ipAddress,
      operatingSystem: schema.devices.operatingSystem,
      domainStatus: schema.devices.domainStatus,
    })
    .from(schema.devices)
    .where(ne(schema.devices.domainStatus, 'DOMAIN_JOINED'))
    .orderBy(schema.devices.hostname);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            Active Directory Domain Join
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automated provisioning of workgroup endpoints into the corporate Active Directory domain.
          </p>
        </div>
        <DomainJoinDialog devices={eligibleDevices} defaultOu={adConfig?.computerOu || null} />
      </div>

      {/* Architectural Support Notice */}
      <div className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-start gap-3">
        <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">Domain Join Engine & Execution Mechanics</p>
          <p className="text-muted-foreground leading-relaxed">
            Target validation, credentials retrieval from secure settings, job queue orchestration, and audit logging are implemented server-side.
            Actual client-side domain joining requires the Windows Agent background worker to invoke the Windows NetJoinDomain Win32 API and reboot the machine.
          </p>
        </div>
      </div>

      {/* Configuration Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Domain</h4>
          <p className="font-mono text-sm font-semibold">{adConfig?.domainFqdn || 'Not Configured'}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Default Computer OU</h4>
          <p className="font-mono text-xs truncate" title={adConfig?.computerOu || 'Default Domain Computers Container'}>
            {adConfig?.computerOu || 'Default Computers Container'}
          </p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Unjoined Eligible Endpoints</h4>
          <p className="text-2xl font-bold text-amber-500">{eligibleDevices.length}</p>
        </div>
      </div>

      {/* Job History Table */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Domain Join Task Queue & History
        </h3>

        {jobs.length === 0 ? (
          <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
            <ShieldCheck className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg text-foreground">No domain join requests submitted</p>
            <p className="text-sm mt-1">Select an unjoined endpoint from the inventory to queue a domain join task.</p>
            <div className="mt-4 inline-block">
              <DomainJoinDialog devices={eligibleDevices} defaultOu={adConfig?.computerOu || null} />
            </div>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Endpoint</th>
                  <th className="text-left px-4 py-3 font-medium">Target OU</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Error / Diagnostics</th>
                  <th className="text-left px-4 py-3 font-medium">Requested</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-1.5">
                        <Monitor className="size-4 text-muted-foreground" />
                        {job.device.hostname}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {job.device.ipAddress || 'DHCP'} • {job.device.operatingSystem || 'Windows'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate" title={job.targetOu || ''}>
                      {job.targetOu || 'Default Computers OU'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-destructive">
                      {job.errorMessage || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(job.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <JobCancelButton jobId={job.id} status={job.status} />
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
