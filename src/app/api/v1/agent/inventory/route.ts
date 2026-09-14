import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateAgent } from '@/server/auth/agent-auth';
import { recordSystemEvent } from '@/server/services/audit';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function POST(req: NextRequest) {
  const device = await authenticateAgent(req.headers.get('authorization'));
  if (!device) return errorResponse('AGENT_UNAUTHORIZED', 'Invalid agent credentials.', 401);

  let body: {
    deviceId: string;
    agentVersion: string;
    inventory: {
      hostname: string;
      fqdn?: string;
      manufacturer?: string;
      model?: string;
      serialNumber?: string;
      bios?: { manufacturer?: string; version?: string; serialNumber?: string };
      cpu?: string;
      cpuCores?: number;
      totalMemoryBytes?: number;
      diskTotalBytes?: number;
      diskFreeBytes?: number;
      operatingSystem: string;
      operatingSystemEdition: string;
      osVersion: string;
      osBuild: string;
      osDisplayVersion: string;
      osClassification: string;
      architecture: string;
      loggedInUser?: string;
      domainStatus: string;
      domainName?: string;
      lastBootAt?: string;
      networkInterfaces?: Array<{
        id: string;
        name: string;
        description: string;
        interfaceType: string;
        operationalStatus: string;
        macAddress?: string;
        ipv4Addresses: string[];
        speedBitsPerSecond: number;
      }>;
    };
  };

  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_REQUEST', 'Invalid JSON body.', 400);
  }

  if (body.deviceId !== device.id) {
    return errorResponse('AGENT_UNAUTHORIZED', 'Device ID mismatch.', 403);
  }

  const inv = body.inventory;

  // Update device hardware info
  await db
    .update(schema.devices)
    .set({
      hostname: inv.hostname,
      fqdn: inv.fqdn,
      manufacturer: inv.manufacturer,
      model: inv.model,
      serialNumber: inv.serialNumber,
      cpu: inv.cpu,
      cpuCores: inv.cpuCores,
      totalMemory: inv.totalMemoryBytes,
      diskTotal: inv.diskTotalBytes,
      diskFree: inv.diskFreeBytes,
      operatingSystem: inv.operatingSystem,
      operatingSystemEdition: inv.operatingSystemEdition,
      osVersion: inv.osVersion,
      osBuild: inv.osBuild,
      osDisplayVersion: inv.osDisplayVersion,
      osClassification: inv.osClassification,
      architecture: inv.architecture,
      loggedInUser: inv.loggedInUser,
      domainStatus: inv.domainStatus as typeof device.domainStatus,
      domainName: inv.domainName,
      lastBootAt: inv.lastBootAt ? new Date(inv.lastBootAt) : undefined,
      lastInventoryAt: new Date(),
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, device.id));

  // Update network interfaces
  if (inv.networkInterfaces?.length) {
    // Delete existing interfaces and re-insert
    await db
      .delete(schema.deviceInterfaces)
      .where(eq(schema.deviceInterfaces.deviceId, device.id));

    for (const iface of inv.networkInterfaces) {
      await db.insert(schema.deviceInterfaces).values({
        deviceId: device.id,
        interfaceId: iface.id,
        name: iface.name,
        description: iface.description,
        interfaceType: iface.interfaceType,
        operationalStatus: iface.operationalStatus,
        macAddress: iface.macAddress,
        ipv4Addresses: JSON.stringify(iface.ipv4Addresses),
        speedBitsPerSecond: iface.speedBitsPerSecond,
      });
    }
  }

  await recordSystemEvent({
    event: 'INVENTORY_UPDATED',
    deviceId: device.id,
    metadata: { hostname: inv.hostname, agentVersion: body.agentVersion },
    severity: 'DEBUG',
  });

  return NextResponse.json({ ok: true });
}
