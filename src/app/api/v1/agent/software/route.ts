import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
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
    applications: Array<{
      normalizedId: string;
      name: string;
      publisher?: string;
      version?: string;
      architecture: string;
      installLocation?: string;
      productCode?: string;
      detectedAt: string;
    }>;
    collectedAt: string;
  };

  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_REQUEST', 'Invalid JSON body.', 400);
  }

  if (body.deviceId !== device.id) {
    return errorResponse('AGENT_UNAUTHORIZED', 'Device ID mismatch.', 403);
  }

  const incoming = body.applications;
  const incomingIds = incoming.map((a) => a.normalizedId);

  // Get existing software records for this device
  const existing = await db
    .select()
    .from(schema.deviceSoftware)
    .where(eq(schema.deviceSoftware.deviceId, device.id));

  const existingMap = new Map(existing.map((e) => [e.normalizedId, e]));
  const incomingSet = new Set(incomingIds);

  // Upsert incoming apps
  for (const app of incoming) {
    const ex = existingMap.get(app.normalizedId);
    if (ex) {
      // Update last seen and version if changed
      if (ex.version !== app.version || ex.lastSeenAt < new Date(Date.now() - 3600_000)) {
        await db
          .update(schema.deviceSoftware)
          .set({
            version: app.version,
            publisher: app.publisher,
            lastSeenAt: new Date(),
          })
          .where(eq(schema.deviceSoftware.id, ex.id));
      }
    } else {
      await db.insert(schema.deviceSoftware).values({
        deviceId: device.id,
        normalizedId: app.normalizedId,
        name: app.name,
        publisher: app.publisher,
        version: app.version,
        architecture: app.architecture,
        installLocation: app.installLocation,
        productCode: app.productCode,
        firstDetectedAt: new Date(app.detectedAt),
        lastSeenAt: new Date(),
      });
    }
  }

  // Remove apps no longer present
  const toRemove = existing.filter((e) => !incomingSet.has(e.normalizedId));
  if (toRemove.length > 0) {
    await db
      .delete(schema.deviceSoftware)
      .where(
        inArray(schema.deviceSoftware.id, toRemove.map((r) => r.id)),
      );
  }

  // Update lastSoftwareInventoryAt
  await db
    .update(schema.devices)
    .set({ lastSoftwareInventoryAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.devices.id, device.id));

  await recordSystemEvent({
    event: 'SOFTWARE_INVENTORY_UPDATED',
    deviceId: device.id,
    metadata: { appCount: incoming.length },
    severity: 'DEBUG',
  });

  return NextResponse.json({ ok: true });
}
