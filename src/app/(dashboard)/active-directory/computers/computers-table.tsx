'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Monitor, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface ComputerItem {
  id: string;
  samAccountName: string;
  dnsHostname: string | null;
  operatingSystem: string | null;
  enabled: boolean | null;
  lastLogon: Date | null;
  organizationalUnit: string | null;
  correlatedDeviceId: string | null;
  lastSyncAt: Date;
}

export function ComputersTable({ computers }: { computers: ComputerItem[] }) {
  const [filter, setFilter] = useState<'ALL' | 'STALE' | 'MANAGED' | 'UNMANAGED' | 'DISABLED'>('ALL');
  const [search, setSearch] = useState('');

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const filtered = computers.filter((c) => {
    // Search query
    const matchQuery =
      c.samAccountName.toLowerCase().includes(search.toLowerCase()) ||
      (c.dnsHostname && c.dnsHostname.toLowerCase().includes(search.toLowerCase())) ||
      (c.operatingSystem && c.operatingSystem.toLowerCase().includes(search.toLowerCase())) ||
      (c.organizationalUnit && c.organizationalUnit.toLowerCase().includes(search.toLowerCase()));

    if (!matchQuery) return false;

    // Filter tab
    if (filter === 'STALE') {
      return !c.lastLogon || c.lastLogon < ninetyDaysAgo;
    }
    if (filter === 'MANAGED') {
      return c.correlatedDeviceId !== null;
    }
    if (filter === 'UNMANAGED') {
      return c.correlatedDeviceId === null;
    }
    if (filter === 'DISABLED') {
      return c.enabled === false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-lg border border-border">
          {(['ALL', 'STALE', 'MANAGED', 'UNMANAGED', 'DISABLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === tab
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL'
                ? `All (${computers.length})`
                : tab === 'STALE'
                ? 'Stale (>90d)'
                : tab === 'MANAGED'
                ? 'Managed'
                : tab === 'UNMANAGED'
                ? 'Unmanaged'
                : 'Disabled'}
            </button>
          ))}
        </div>

        <Input
          placeholder="Filter by name, DNS, OS, or OU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-xs"
        />
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Computer / DNS Hostname</th>
              <th className="text-left px-4 py-3 font-medium">Operating System</th>
              <th className="text-left px-4 py-3 font-medium">Organizational Unit</th>
              <th className="text-left px-4 py-3 font-medium">Last Logon</th>
              <th className="text-center px-4 py-3 font-medium">Agent Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-xs">
                  No computer objects match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((comp) => {
                const isStale = !comp.lastLogon || comp.lastLogon < ninetyDaysAgo;

                return (
                  <tr key={comp.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-2">
                        <Monitor className="size-4 text-muted-foreground" />
                        {comp.dnsHostname || comp.samAccountName.replace('$', '')}
                        {!comp.enabled && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground ml-6">
                        {comp.samAccountName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {comp.operatingSystem || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground max-w-xs truncate" title={comp.organizationalUnit || ''}>
                      {comp.organizationalUnit || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3" />
                        <span className={isStale ? 'text-amber-500 font-medium' : ''}>
                          {comp.lastLogon ? timeAgo(comp.lastLogon) : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {comp.correlatedDeviceId ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <ShieldCheck className="size-3.5" /> Correlated
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <ShieldAlert className="size-3.5" /> Unmanaged
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
