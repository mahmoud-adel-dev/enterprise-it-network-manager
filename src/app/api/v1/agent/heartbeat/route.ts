import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateAgent } from '@/server/auth/agent-auth';
import { recordSystemEvent } from '@/server/services/audit';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

// Classify OS from agent-reported strings
function classifyOs(os: string, edition?: string, build?: string): string {
  const osLower = (os + ' ' + (edition ?? '')).toLowerCase();
  if (osLower.includes('server')) return 'windowsserver';
  if (build) {
    const buildNum = parseInt(build, 10);
    // Windows 11 starts at build 22000
    if (!isNaN(buildNum) && buildNum >= 22000) return 'windows11';
  }
  if (osLower.includes('windows 11')) return 'windows11';
  if (osLower.includes('windows 10')) return 'windows10';
  return 'other';
}

export async function POST(req: NextRequest) {
  const device = await authenticateAgent(req.headers.get('authorization'));
  if (!device) return errorResponse('AGENT_UNAUTHORIZED', 'Invalid agent credentials.', 401);

  let body: {
    deviceId: string;
    agentVersion: string;
    hostname: string;
    activeIpAddresses: string[];
    macAddresses: string[];
    operatingSystem: string;
    operatingSystemEdition: string;
    osVersion: string;
    osBuild: string;
    architecture: string;
    uptimeSeconds: number;
    loggedInUser?: string;
    diskFreeBytes: number;
    domainStatus: string;
    domainName?: string;
    health: string;
    observedAt: string;
  };

  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_REQUEST', 'Invalid JSON body.', 400);
  }

  // Verify the device ID matches the authenticated agent's device
  if (body.deviceId !== device.id) {
    return errorResponse('AGENT_UNAUTHORIZED', 'Device ID mismatch.', 403);
  }

  const wasOffline = device.onlineStatus === 'OFFLINE';
  const primaryIp = body.activeIpAddresses[0];
  const primaryMac = body.macAddresses[0];
  const osClassification = classifyOs(body.operatingSystem, body.operatingSystemEdition, body.osBuild);

  await db
    .update(schema.devices)
    .set({
      hostname: body.hostname,
      ipAddress: primaryIp,
      macAddress: primaryMac,
      operatingSystem: body.operatingSystem,
      operatingSystemEdition: body.operatingSystemEdition,
      osVersion: body.osVersion,
      osBuild: body.osBuild,
      osClassification,
      architecture: body.architecture,
      loggedInUser: body.loggedInUser,
      diskFree: body.diskFreeBytes,
      domainStatus: body.domainStatus as typeof device.domainStatus,
      domainName: body.domainName,
      agentVersion: body.agentVersion,
      onlineStatus: 'ONLINE',
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, device.id));

  // Record IP history
  if (primaryIp) {
    const ipRecord = await db
      .select()
      .from(schema.deviceIpHistory)
      .where(
        and(
          eq(schema.deviceIpHistory.deviceId, device.id),
          eq(schema.deviceIpHistory.ipAddress, primaryIp),
        ),
      )
      .get();

    if (!ipRecord) {
      await db.insert(schema.deviceIpHistory).values({
        deviceId: device.id,
        ipAddress: primaryIp,
      });
    } else {
      await db
        .update(schema.deviceIpHistory)
        .set({ lastSeenAt: new Date() })
        .where(eq(schema.deviceIpHistory.id, ipRecord.id));
    }
  }

  // Fire system event if device came back online
  if (wasOffline) {
    await recordSystemEvent({
      event: 'DEVICE_ONLINE',
      deviceId: device.id,
      metadata: { hostname: body.hostname },
    });
  }

  return NextResponse.json({ 
    ok: true,
    quarantined: device.managementStatus === 'QUARANTINED',
  });
}
