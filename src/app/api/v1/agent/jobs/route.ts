import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { authenticateAgent } from '@/server/auth/agent-auth';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function GET(req: NextRequest) {
  const device = await authenticateAgent(req.headers.get('authorization'));
  if (!device) return errorResponse('AGENT_UNAUTHORIZED', 'Invalid agent credentials.', 401);

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '5', 10), 10);

  const LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() + LEASE_DURATION_MS);

  // Find queued deployment targets for this device
  const targets = await db
    .select({
      target: schema.deploymentTargets,
      job: schema.deploymentJobs,
      pkg: schema.applicationPackages,
    })
    .from(schema.deploymentTargets)
    .innerJoin(schema.deploymentJobs, eq(schema.deploymentTargets.deploymentJobId, schema.deploymentJobs.id))
    .innerJoin(schema.applicationPackages, eq(schema.deploymentJobs.applicationPackageId, schema.applicationPackages.id))
    .where(
      and(
        eq(schema.deploymentTargets.deviceId, device.id),
        eq(schema.deploymentTargets.status, 'QUEUED'),
      ),
    )
    .limit(limit);

  const jobs = [];
  for (const { target, job, pkg } of targets) {
    // Issue a lease token to prevent duplicate execution
    const leaseToken = crypto.randomUUID();

    await db
      .update(schema.deploymentTargets)
      .set({
        status: 'DOWNLOADING',
        leaseToken,
        leaseExpiresAt: leaseExpiry,
        startedAt: target.startedAt ?? now,
        attempts: target.attempts + 1,
        lastAttemptAt: now,
      })
      .where(eq(schema.deploymentTargets.id, target.id));

    const detectionRule = JSON.parse(pkg.detectionRule);
    const installerArgs = JSON.parse(pkg.installerArguments ?? '[]');
    const successExitCodes = JSON.parse(pkg.successExitCodes ?? '[0,3010]');

    jobs.push({
      id: target.id,
      type: 'INSTALL_APPLICATION',
      leaseToken,
      leaseExpiresAt: leaseExpiry.toISOString(),
      payload: {
        packageId: pkg.id,
        fileName: pkg.installerFileName,
        installerType: pkg.installerType,
        sha256: pkg.sha256,
        fileSize: pkg.fileSize,
        installerArguments: installerArgs,
        detectionRule,
        successExitCodes,
        timeoutMinutes: pkg.timeoutMinutes ?? 120,
        allowKillOnTimeout: false,
      },
    });
  }

  return NextResponse.json({ jobs });
}
