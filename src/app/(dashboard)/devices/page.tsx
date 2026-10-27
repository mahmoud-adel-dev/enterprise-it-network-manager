import { listDevices } from '@/server/repositories/devices';
import { DevicesDataTable } from './devices-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Monitor, Wifi, WifiOff, Clock, Shield, ShieldAlert,
  Server, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search,
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
    pageSize?: string;
    q?: string;
    os?: string;
    status?: string;
    domain?: string;
    approval?: string;
  }>;
}) {
  const params = await searchParams;
  const pageSize = parseInt(params.pageSize ?? '20', 10) || 20;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const search = params.q;
  const os = params.os;
  const onlineStatus = params.status as OnlineStatus | undefined;
  const domainStatus = params.domain as DomainStatus | undefined;
  const approvalStatus = params.approval as ApprovalStatus | undefined;

  const result = await listDevices({
    page,
    pageSize,
    search,
    os,
    onlineStatus,
    domainStatus,
    approvalStatus,
  });

  const totalPages = Math.max(1, result.totalPages);
  const startItem = result.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, result.total);

  const buildPageUrl = (targetPage: number, targetPageSize: number = pageSize) => {
    const qp = new URLSearchParams();
    if (targetPage > 1) qp.set('page', targetPage.toString());
    if (targetPageSize !== 20) qp.set('pageSize', targetPageSize.toString());
    if (search) qp.set('q', search);
    if (os) qp.set('os', os);
    if (onlineStatus) qp.set('status', onlineStatus);
    if (domainStatus) qp.set('domain', domainStatus);
    if (approvalStatus) qp.set('approval', approvalStatus);
    const qs = qp.toString();
    return `/devices${qs ? `?${qs}` : ''}`;
  };

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const pageNumbers = getPageNumbers(page, totalPages);

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
        {pageSize !== 20 && <input type="hidden" name="pageSize" value={pageSize} />}
        <Button type="submit" size="sm">Apply</Button>
        {(search || os || onlineStatus || domainStatus || approvalStatus) && (
          <Link href="/devices">
            <Button variant="ghost" size="sm" type="button">Reset</Button>
          </Link>
        )}
      </form>

      {/* TanStack Data Table with Bulk Actions */}
      <DevicesDataTable
        devices={result.devices}
        total={result.total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
      />

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border rounded-xl bg-card/40 text-sm">
        {/* Info & Page Size */}
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs sm:text-sm">
          <div>
            Showing <span className="font-semibold text-foreground">{startItem}</span>–<span className="font-semibold text-foreground">{endItem}</span> of{' '}
            <span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> devices
            <span className="mx-2 text-muted-foreground/40">|</span>
            الصفحة <span className="font-semibold text-foreground">{page}</span> من <span className="font-semibold text-foreground">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1 bg-background">
            <span className="text-xs text-muted-foreground">عرض:</span>
            {[20, 50, 100].map((size) => (
              <Link
                key={size}
                href={buildPageUrl(1, size)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  pageSize === size
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            <Link
              href={buildPageUrl(1)}
              aria-disabled={page <= 1}
              className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
              title="First Page"
            >
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1}>
                <ChevronsLeft className="size-4" />
              </Button>
            </Link>

            {/* Previous Page */}
            <Link
              href={buildPageUrl(page - 1)}
              aria-disabled={page <= 1}
              className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
              title="Previous Page"
            >
              <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs" disabled={page <= 1}>
                <ChevronLeft className="size-4" />
                <span>السابق</span>
              </Button>
            </Link>

            {/* Numbered Buttons */}
            <div className="flex items-center gap-1 mx-1">
              {pageNumbers.map((p, idx) => {
                if (typeof p === 'string') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted-foreground">
                      …
                    </span>
                  );
                }
                const isActive = p === page;
                return (
                  <Link key={p} href={buildPageUrl(p)}>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 min-w-8 px-2 text-xs font-medium ${
                        isActive ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Next Page */}
            <Link
              href={buildPageUrl(page + 1)}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
              title="Next Page"
            >
              <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs" disabled={page >= totalPages}>
                <span>التالي</span>
                <ChevronRight className="size-4" />
              </Button>
            </Link>

            {/* Last Page */}
            <Link
              href={buildPageUrl(totalPages)}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
              title="Last Page"
            >
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages}>
                <ChevronsRight className="size-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
