import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { GitBranch } from 'lucide-react';
import { TopologyView } from './topology-view';

export const metadata = { title: 'Network Topology — Endpoint Manager' };

export default async function NetworkTopologyPage() {
  const devices = await db
    .select({
      id: schema.networkDevices.id,
      hostname: schema.networkDevices.hostname,
      managementIp: schema.networkDevices.managementIp,
      deviceType: schema.networkDevices.deviceType,
      manufacturer: schema.networkDevices.manufacturer,
      model: schema.networkDevices.model,
      status: schema.networkDevices.status,
    })
    .from(schema.networkDevices);

  const rawLinks = await db
    .select({
      link: schema.networkLinks,
      source: schema.networkDevices,
    })
    .from(schema.networkLinks)
    .innerJoin(schema.networkDevices, eq(schema.networkLinks.sourceDeviceId, schema.networkDevices.id));

  const links = await Promise.all(
    rawLinks.map(async ({ link, source }) => {
      let destDevice = null;
      if (link.destinationDeviceId) {
        destDevice = await db
          .select({
            id: schema.networkDevices.id,
            hostname: schema.networkDevices.hostname,
            ip: schema.networkDevices.managementIp,
          })
          .from(schema.networkDevices)
          .where(eq(schema.networkDevices.id, link.destinationDeviceId))
          .get();
      }

      return {
        id: link.id,
        sourceDevice: {
          id: source.id,
          hostname: source.hostname,
          ip: source.managementIp,
        },
        sourceInterface: link.sourceInterface,
        destinationDevice: destDevice || null,
        destinationHostname: link.destinationHostname,
        destinationInterface: link.destinationInterface,
        protocol: link.discoveryProtocol,
        confidence: link.confidence,
      };
    })
  );

  const endpoints = await db
    .select({
      id: schema.devices.id,
      hostname: schema.devices.hostname,
      ipAddress: schema.devices.ipAddress,
      operatingSystem: schema.devices.operatingSystem,
      onlineStatus: schema.devices.onlineStatus,
      switchId: schema.devices.networkDeviceId,
    })
    .from(schema.devices);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="size-6 text-primary" />
          Network Topology
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Map of physical and logical network links, core infrastructure, and connected endpoints.
        </p>
      </div>

      <TopologyView devices={devices} links={links} endpoints={endpoints} />
    </div>
  );
}
