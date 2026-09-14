import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Server, Network, Shield, Radio, Router as RouterIcon } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { AddDeviceDialog } from './add-device-dialog';
import { DeviceItemActions } from './device-item-actions';

export const metadata = { title: 'Network Infrastructure — Endpoint Manager' };

function DeviceTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'SWITCH': return <Network className="size-4 text-blue-500" />;
    case 'ROUTER': return <RouterIcon className="size-4 text-indigo-500" />;
    case 'FIREWALL': return <Shield className="size-4 text-amber-500" />;
    case 'ACCESS_POINT': return <Radio className="size-4 text-emerald-500" />;
    default: return <Server className="size-4 text-muted-foreground" />;
  }
}

export default async function InfrastructurePage() {
  const devices = await db
    .select()
    .from(schema.networkDevices)
    .orderBy(desc(schema.networkDevices.createdAt));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="size-6 text-primary" />
            Network Infrastructure
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Switches, routers, firewalls, and gateways connecting your endpoints.
          </p>
        </div>
        <AddDeviceDialog />
      </div>

      {devices.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <Server className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No infrastructure devices registered</p>
          <p className="text-sm mt-1">Register your network switches and routers to monitor ports and build topology maps.</p>
          <div className="mt-4 inline-block">
            <AddDeviceDialog />
          </div>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Device / Hostname</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Management IP</th>
                <th className="text-left px-4 py-3 font-medium">Model / Vendor</th>
                <th className="text-left px-4 py-3 font-medium">Site / Rack</th>
                <th className="text-center px-4 py-3 font-medium">SNMP</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devices.map((dev) => (
                <tr key={dev.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      <DeviceTypeIcon type={dev.deviceType} />
                      {dev.hostname || 'Unnamed Appliance'}
                    </div>
                    {dev.serialNumber && (
                      <div className="text-[11px] font-mono text-muted-foreground">
                        S/N: {dev.serialNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {dev.deviceType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    {dev.managementIp}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {dev.manufacturer ? `${dev.manufacturer} ` : ''}{dev.model || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {dev.site || dev.rack ? `${dev.site || ''} ${dev.rack ? `(${dev.rack})` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {dev.snmpEnabled ? (
                      <Badge variant="success" className="text-[10px] font-mono">
                        {dev.snmpVersion || 'SNMP'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Disabled</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={dev.status === 'ONLINE' ? 'success' : 'secondary'} className="text-[10px]">
                      {dev.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeviceItemActions deviceId={dev.id} />
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
