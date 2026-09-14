'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollText, CheckCircle2, XCircle, Clock, User, Shield, Info, Eye, X } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface AuditEntry {
  id: string;
  timestamp: Date;
  username: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  success: boolean;
  sourceIp: string | null;
  metadata: string | null;
  errorCode: string | null;
}

export function AuditLogViewer({ logs }: { logs: AuditEntry[] }) {
  const [search, setSearch] = useState('');
  const [filterSuccess, setFilterSuccess] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const filtered = logs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.username && log.username.toLowerCase().includes(search.toLowerCase())) ||
      (log.sourceIp && log.sourceIp.includes(search)) ||
      (log.resourceType && log.resourceType.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (filterSuccess === 'SUCCESS') return log.success;
    if (filterSuccess === 'FAILURE') return !log.success;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-lg border border-border">
          {(['ALL', 'SUCCESS', 'FAILURE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterSuccess(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterSuccess === tab
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL' ? `All Events (${logs.length})` : tab === 'SUCCESS' ? 'Successful' : 'Failed / Blocked'}
            </button>
          ))}
        </div>

        <Input
          placeholder="Filter by action, user, or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-xs"
        />
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Resource</th>
              <th className="text-left px-4 py-3 font-medium">Source IP</th>
              <th className="text-center px-4 py-3 font-medium">Result</th>
              <th className="text-right px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-xs">
                  No audit events found matching the criteria.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <div className="font-mono text-foreground">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="text-[11px]">{new Date(log.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-foreground flex items-center gap-1.5">
                      <User className="size-3 text-muted-foreground" />
                      {log.username || 'System / Agent'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {log.resourceType ? `${log.resourceType}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.sourceIp || 'Internal / localhost'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {log.success ? (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="size-3" /> Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-[10px]">
                        <XCircle className="size-3" /> Failed
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {log.metadata ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        title="View Sanitized Metadata"
                      >
                        <Eye className="size-4" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Metadata Inspector Drawer/Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <ScrollText className="size-4 text-primary" />
                  Audit Event Payload: {selectedLog.action}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sanitized telemetry metadata recorded at {new Date(selectedLog.timestamp).toISOString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs space-y-1 font-mono">
                <div>User: {selectedLog.username || 'System'}</div>
                <div>Source IP: {selectedLog.sourceIp || 'Internal'}</div>
                <div>Result: {selectedLog.success ? 'Success' : `Failed (${selectedLog.errorCode || 'Error'})`}</div>
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sanitized Metadata JSON
              </h4>
              <pre className="p-4 bg-muted/50 border border-border rounded-lg text-xs font-mono overflow-x-auto max-h-60 text-foreground">
                {selectedLog.metadata
                  ? JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)
                  : 'No metadata recorded'}
              </pre>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-medium rounded-md border border-border hover:bg-muted/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
