import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';
import { VlanDialog } from './vlan-dialog';
import { VlanItemActions } from './vlan-item-actions';

export const metadata = { title: 'VLAN Management — Endpoint Manager' };

export default async function VlansPage() {
  const vlanList = await db
    .select()
    .from(schema.vlans)
    .orderBy(schema.vlans.vlanNumber);

  // Get device count per VLAN
  const vlansWithCounts = await Promise.all(
    vlanList.map(async (v) => {
      const devices = await db
        .select({ id: schema.devices.id })
        .from(schema.devices)
        .where(eq(schema.devices.vlanId, v.id));
      return {
        ...v,
        deviceCount: devices.length,
      };
    })
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="size-6 text-primary" />
            VLAN Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Segment your network inventory and associate subnets with virtual LANs.
          </p>
        </div>
        <VlanDialog />
      </div>

      {vlansWithCounts.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <Layers className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No VLANs defined</p>
          <p className="text-sm mt-1">Add your enterprise VLAN IDs and subnets to organize device network segments.</p>
          <div className="mt-4 inline-block">
            <VlanDialog />
          </div>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">VLAN ID</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Subnet CIDR</th>
                <th className="text-left px-4 py-3 font-medium">Default Gateway</th>
                <th className="text-left px-4 py-3 font-medium">Site</th>
                <th className="text-center px-4 py-3 font-medium">Devices</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vlansWithCounts.map((v) => (
                <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary">
                    VLAN {v.vlanNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {v.name}
                    {v.description && (
                      <div className="text-xs text-muted-foreground">{v.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {v.subnet || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {v.gateway || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {v.site || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="font-mono text-xs">
                      {v.deviceCount}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={v.active ? 'success' : 'secondary'} className="text-[10px]">
                      {v.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <VlanItemActions vlanId={v.id} />
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
