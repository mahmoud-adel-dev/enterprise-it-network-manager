import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashAgentToken, generateAgentToken } from '@/server/auth/agent-auth';
import { auditAction, recordSystemEvent } from '@/server/services/audit';
import { v4 as uuidv4 } from 'uuid';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function POST(req: NextRequest) {
  // Validate enrollment token
  const enrollmentToken = req.headers.get('x-enrollment-token');
  if (!enrollmentToken) {
    return errorResponse('ENROLLMENT_TOKEN_REQUIRED', 'Enrollment token is required.', 401);
  }

  // Look up enrollment token (stored as bcrypt hash in DB)
  const bcrypt = await import('bcryptjs');
  const tokens = await db
    .select()
    .from(schema.enrollmentTokens)
    .where(eq(schema.enrollmentTokens.enabled, true));

  let matchedToken: typeof schema.enrollmentTokens.$inferSelect | null = null;
  for (const t of tokens) {
    if (!t.expiresAt || t.expiresAt > new Date()) {
      if (!t.maxUses || t.useCount < t.maxUses) {
        const valid = await bcrypt.compare(enrollmentToken, t.token);
        if (valid) {
          matchedToken = t;
          break;
        }
      }
    }
  }

  if (!matchedToken) {
    await auditAction({
      action: 'AGENT_ENROLLMENT_FAILED',
      success: false,
      sourceIp: req.headers.get('x-forwarded-for') ?? undefined,
      metadata: { reason: 'INVALID_ENROLLMENT_TOKEN' },
    });
    return errorResponse('ENROLLMENT_TOKEN_INVALID', 'Invalid or expired enrollment token.', 401);
  }

  let body: {
    deviceUuid: string;
    hostname: string;
    fqdn?: string;
    agentVersion: string;
    operatingSystem: string;
    osBuild: string;
    architecture: string;
    serialNumber?: string;
    networkInterfaces?: unknown[];
  };

  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_REQUEST', 'Invalid JSON body.', 400);
  }

  if (!body.deviceUuid || !body.hostname || !body.agentVersion) {
    return errorResponse('INVALID_REQUEST', 'Missing required fields.', 400);
  }

  // Check for re-enrollment (same deviceUuid)
  const existing = await db
    .select()
    .from(schema.devices)
    .where(eq(schema.devices.deviceUuid, body.deviceUuid))
    .get();

  const agentId = uuidv4();
  const { rawToken } = generateAgentToken(agentId);
  const hashedToken = await hashAgentToken(rawToken.split(':')[1]!);

  const heartbeatIntervalSeconds =
    parseInt(process.env['AGENT_HEARTBEAT_INTERVAL'] ?? '60', 10);

  let deviceId: string;

  if (existing) {
    // Re-enrollment — rotate credentials, update agent info
    deviceId = existing.id;
    await db
      .update(schema.devices)
      .set({
        agentId,
        agentToken: hashedToken,
        agentInstalled: true,
        agentVersion: body.agentVersion,
        hostname: body.hostname,
        fqdn: body.fqdn,
        lastSeenAt: new Date(),
        onlineStatus: 'ONLINE',
        updatedAt: new Date(),
      })
      .where(eq(schema.devices.id, existing.id));
  } else {
    // New enrollment
    const [device] = await db
      .insert(schema.devices)
      .values({
        deviceUuid: body.deviceUuid,
        hostname: body.hostname,
        fqdn: body.fqdn,
        operatingSystem: body.operatingSystem,
        osBuild: body.osBuild,
        architecture: body.architecture,
        serialNumber: body.serialNumber,
        agentId,
        agentToken: hashedToken,
        agentInstalled: true,
        agentVersion: body.agentVersion,
        managementStatus: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING',
        onlineStatus: 'ONLINE',
        lastSeenAt: new Date(),
      })
      .returning({ id: schema.devices.id });

    deviceId = device!.id;

    await recordSystemEvent({
      event: 'DEVICE_ENROLLED',
      deviceId,
      metadata: { hostname: body.hostname, agentVersion: body.agentVersion },
    });
  }

  // Update enrollment token usage
  await db
    .update(schema.enrollmentTokens)
    .set({
      useCount: matchedToken.useCount + 1,
      usedAt: matchedToken.usedAt ?? new Date(),
      usedByDeviceId: deviceId,
    })
    .where(eq(schema.enrollmentTokens.id, matchedToken.id));

  await auditAction({
    action: 'AGENT_ENROLLED',
    resourceType: 'DEVICE',
    resourceId: deviceId,
    success: true,
    sourceIp: req.headers.get('x-forwarded-for') ?? undefined,
    metadata: { hostname: body.hostname, agentVersion: body.agentVersion, isReEnrollment: !!existing },
  });

  return NextResponse.json({
    agentId,
    deviceId,
    accessToken: rawToken,
    expiresAt: null,
    heartbeatIntervalSeconds,
  });
}
