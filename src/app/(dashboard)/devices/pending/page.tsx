import { listDevices } from '@/server/repositories/devices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApproveDeviceButton, RejectDeviceButton } from './approve-buttons';
import { Clock, Monitor, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { getSession } from '@/server/auth/session';

export const metadata = { title: 'Pending Approval — Endpoint Manager' };

export default async function PendingDevicesPage() {
  const session = await getSession();
  const result = await listDevices({ approvalStatus: 'PENDING', pageSize: 100 });

  return (
    <div className="w-full space-y-5 px-4 md:px-6 xl:px-8 2xl:px-10 py-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Device Approval</h1>
        <p className="text-muted-foreground text-sm">
          {result.total} device{result.total !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex gap-3 text-sm text-amber-500">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <p>
          <strong>Security notice:</strong> Review each device carefully before approving.
          Unknown or unauthorized devices must never be granted managed access to your environment.
          Approval is logged in the audit trail.
        </p>
      </div>

      {result.devices.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground">
          <Clock className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No devices pending approval</p>
          <p className="text-sm mt-1">All discovered devices have been reviewed.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hostname</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP / MAC</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">OS</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">First Seen</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.devices.map((device) => (
                <tr key={device.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{device.hostname}</div>
                    {device.manufacturer && (
                      <div className="text-xs text-muted-foreground">{device.manufacturer} {device.model}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{device.ipAddress ?? '—'}</div>
                    <div className="font-mono text-xs text-muted-foreground">{device.macAddress ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{device.operatingSystem ?? 'Unknown'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {device.onlineStatus === 'ONLINE' ? (
                      <Badge variant="success" className="gap-1"><Wifi className="size-2.5" />Online</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1"><WifiOff className="size-2.5" />Offline</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {device.firstSeenAt ? timeAgo(device.firstSeenAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {device.agentInstalled ? 'Agent' : 'Discovery'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <ApproveDeviceButton deviceId={device.id} userId={session?.userId ?? ''} />
                      <RejectDeviceButton deviceId={device.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
