'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteScanAction } from './actions';
import { Radio, Loader2, CheckCircle2, XCircle, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface DiscoveryResultItem {
  id: string;
  ipAddress: string;
  macAddress: string | null;
  hostname: string | null;
  vendor: string | null;
  responseMethod: string | null;
}

interface DiscoveryRunItem {
  id: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  hostsChecked: number;
  hostsResponded: number;
  errors: string | null;
  createdAt: Date;
  scope: {
    id: string;
    name: string;
    cidr: string;
  };
  results: DiscoveryResultItem[];
}

export function DiscoveryRunsTable({ runs }: { runs: DiscoveryRunItem[] }) {
  const router = useRouter();
  const [expandedRunId, setExpandedRunId] = useState<string | null>(runs[0]?.id || null);
  const [isPending, startTransition] = useTransition();
  const hasActiveScan = runs.some((run) => run.status === 'PENDING' || run.status === 'RUNNING');

  useEffect(() => {
    if (!hasActiveScan) return;

    const refreshTimer = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(refreshTimer);
  }, [hasActiveScan, router]);

  const handleDelete = (runId: string) => {
    if (!confirm('Are you sure you want to delete this scan history?')) return;
    startTransition(async () => {
      await deleteScanAction(runId);
    });
  };

  if (runs.length === 0) {
    return (
      <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
        <Radio className="size-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-lg text-foreground">No discovery scans performed yet</p>
        <p className="text-sm mt-1">Run an IP sweep to discover devices, switches, and rogue hosts on your network.</p>
        <Button className="mt-4 gap-2" asChild>
          <Link href="/network/discovery/new">
            <Radio className="size-4" /> Start First Scan
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => {
        const isExpanded = expandedRunId === run.id;

        return (
          <div
            key={run.id}
            className="border border-border rounded-xl bg-card overflow-hidden transition-colors"
          >
            <div
              onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/10"
            >
              <div className="flex items-center gap-3">
                <button type="button" className="p-1 text-muted-foreground">
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{run.scope.name}</h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {run.scope.cidr}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3 mt-1 items-center">
                    <span>Started {run.startedAt ? timeAgo(run.startedAt) : 'Never'}</span>
                    {run.completedAt && (
                      <>
                        <span>•</span>
                        <span>Completed {timeAgo(run.completedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold">{run.hostsResponded} Hosts Found</div>
                  <div className="text-xs text-muted-foreground">
                    {run.results.length} records saved
                  </div>
                </div>

                <Badge
                  variant={
                    run.status === 'COMPLETED'
                      ? 'success'
                      : run.status === 'RUNNING'
                      ? 'default'
                      : run.status === 'FAILED'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="gap-1 text-xs"
                >
                  {run.status === 'RUNNING' && <Loader2 className="size-3 animate-spin" />}
                  {run.status === 'COMPLETED' && <CheckCircle2 className="size-3" />}
                  {run.status === 'FAILED' && <XCircle className="size-3" />}
                  {run.status}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(run.id);
                  }}
                  disabled={isPending}
                  title="Delete Scan"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Results Table */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/5 p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Discovered Hosts ({run.results.length})
                </h4>

                {run.results.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-3 text-center">
                    No active hosts responded during this scan.
                  </p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden bg-card">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/40 text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">IP Address</th>
                          <th className="text-left px-3 py-2 font-medium">Hostname</th>
                          <th className="text-left px-3 py-2 font-medium">MAC Address</th>
                          <th className="text-left px-3 py-2 font-medium">Vendor</th>
                          <th className="text-center px-3 py-2 font-medium">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {run.results.map((res) => (
                          <tr key={res.id} className="hover:bg-muted/10">
                            <td className="px-3 py-2 font-mono font-medium">{res.ipAddress}</td>
                            <td className="px-3 py-2 text-foreground">{res.hostname || '—'}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{res.macAddress || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{res.vendor || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge variant="secondary" className="text-[10px]">
                                {res.responseMethod || 'ICMP'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
