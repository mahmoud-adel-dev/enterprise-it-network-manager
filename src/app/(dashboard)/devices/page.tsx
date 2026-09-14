import { listDevices } from '@/server/repositories/devices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Monitor, Wifi, WifiOff, Clock, Shield, ShieldAlert,
  Server, AlertTriangle, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import { formatBytes, timeAgo } from '@/lib/utils';
import type { ManagementStatus, OnlineStatus, DomainStatus, ApprovalStatus } from '@/server/db/schema/devices';

export const metadata = { title: 'Devices — Endpoint Manager' };

function OnlineBadge({ status }: { status: string }) {
  if (status === 'ONLINE') return <Badge variant="success" className="gap-1"><Wifi className="size-2.5" />Online</Badge>;
  if (status === 'OFFLINE') return <Badge variant="destructive" className="gap-1"><WifiOff className="size-2.5" />Offline</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
}

function ManagementBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' | 'secondary' }> = {
    MANAGED: { label: 'Managed', variant: 'success' },
    PENDING_APPROVAL: { label: 'Pending', variant: 'warning' },
    UNMANAGED: { label: 'Unmanaged', variant: 'outline' },
    DISCOVERED: { label: 'Discovered', variant: 'secondary' },
    QUARANTINED: { label: 'Quarantined', variant: 'destructive' },
    RETIRED: { label: 'Retired', variant: 'outline' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={variant}>{label}</Badge>;
}

function OsBadge({ classification }: { classification: string | null }) {
  const map: Record<string, string> = {
    windows10: 'Win 10',
    windows11: 'Win 11',
    windowsserver: 'Server',
  };
  return (
    <span className="text-xs text-muted-foreground">
      {classification ? (map[classification] ?? classification) : 'Unknown'}
    </span>
  );
}

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    os?: string;
    status?: string;
    domain?: string;
    approval?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.q;
  const os = params.os;
  const onlineStatus = params.status as OnlineStatus | undefined;
  const domainStatus = params.domain as DomainStatus | undefined;
  const approvalStatus = params.approval as ApprovalStatus | undefined;

  const result = await listDevices({
    page,
    pageSize: 50,
    search,
    os,
    onlineStatus,
    domainStatus,
    approvalStatus,
  });

  return (
    <div className="p-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          <p className="text-muted-foreground text-sm">{result.total.toLocaleString()} total devices</p>
        </div>
        <div className="flex gap-2">
          <Link href="/devices/pending">
            <Button variant="outline" size="sm">
              <Clock className="size-4" />
              Pending Approval
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search hostname, IP, MAC..."
            className="pl-8 pr-3 h-9 rounded-md border bg-card text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <select
          name="os"
          defaultValue={os ?? ''}
          className="h-9 px-3 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All OS</option>
          <option value="windows10">Windows 10</option>
          <option value="windows11">Windows 11</option>
          <option value="windowsserver">Windows Server</option>
        </select>
        <select
          name="status"
          defaultValue={onlineStatus ?? ''}
          className="h-9 px-3 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All Status</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
        <select
          name="domain"
          defaultValue={domainStatus ?? ''}
          className="h-9 px-3 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All Domain Status</option>
          <option value="DOMAIN_JOINED">Domain Joined</option>
          <option value="WORKGROUP">Workgroup</option>
          <option value="DOMAIN_JOIN_PENDING">Join Pending</option>
          <option value="DOMAIN_JOIN_FAILED">Join Failed</option>
        </select>
        <select
          name="approval"
          defaultValue={approvalStatus ?? ''}
          className="h-9 px-3 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All Approval</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <Button type="submit" size="sm">Apply</Button>
      </form>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hostname</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP Address</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">OS</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Management</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Domain</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Agent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Seen</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.devices.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-muted-foreground">
                    <Monitor className="size-8 mx-auto mb-2 opacity-30" />
                    <p>No devices found</p>
                    <p className="text-xs mt-1">Devices appear when agents enroll or network discovery runs.</p>
                  </td>
                </tr>
              )}
              {result.devices.map((device) => (
                <tr key={device.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{device.hostname}</div>
                    {device.fqdn && <div className="text-xs text-muted-foreground">{device.fqdn}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{device.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3">
                    <OsBadge classification={device.osClassification} />
                    {device.osBuild && (
                      <div className="text-xs text-muted-foreground/70">Build {device.osBuild}</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><OnlineBadge status={device.onlineStatus} /></td>
                  <td className="px-4 py-3"><ManagementBadge status={device.managementStatus} /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {device.domainName ?? (device.domainStatus === 'WORKGROUP' ? 'Workgroup' : '—')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {device.agentInstalled ? (
                      <Badge variant="success" className="text-xs">v{device.agentVersion}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No agent</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {device.lastSeenAt ? timeAgo(device.lastSeenAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/devices/${device.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, result.total)} of {result.total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/devices?page=${page - 1}${search ? `&q=${search}` : ''}`}>
                <Button variant="outline" size="sm"><ChevronLeft className="size-4" />Previous</Button>
              </Link>
            )}
            {page < result.totalPages && (
              <Link href={`/devices?page=${page + 1}${search ? `&q=${search}` : ''}`}>
                <Button variant="outline" size="sm">Next<ChevronRight className="size-4" /></Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
