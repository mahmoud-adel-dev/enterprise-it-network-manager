import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateAgent } from '@/server/auth/agent-auth';
import { recordSystemEvent } from '@/server/services/audit';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

// Final terminal statuses
const TERMINAL_STATUSES = new Set([
  'SUCCESS', 'FAILED', 'CANCELLED',
]);

// Valid agent-reported statuses
const VALID_STATUSES = new Set([
  'ACKNOWLEDGED', 'DOWNLOADING', 'VERIFYING_PACKAGE',
  'INSTALLING', 'VERIFYING_INSTALLATION', 'SUCCESS',
  'FAILED', 'REBOOT_REQUIRED',
]);

export async function handleStatusUpdate(
  req: NextRequest,
  params: Promise<{ id: string }>,
) {
  const device = await authenticateAgent(req.headers.get('authorization'));
  if (!device) return errorResponse('AGENT_UNAUTHORIZED', 'Invalid agent credentials.', 401);

  const { id: targetId } = await params;

  let body: {
    leaseToken: string;
    status: string;
    observedAt: string;
    exitCode?: number;
    errorCode?: string;
    errorMessage?: string;
    rebootRequired?: boolean;
    diagnostics?: string;
  };

  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_REQUEST', 'Invalid JSON body.', 400);
  }

  if (!VALID_STATUSES.has(body.status)) {
    return errorResponse('INVALID_STATUS', `Invalid status: ${body.status}`, 400);
  }

  // Find the target and verify lease ownership
  const target = await db
    .select()
    .from(schema.deploymentTargets)
    .where(
      and(
        eq(schema.deploymentTargets.id, targetId),
        eq(schema.deploymentTargets.deviceId, device.id),
        eq(schema.deploymentTargets.leaseToken, body.leaseToken),
      ),
    )
    .get();

  if (!target) {
    return errorResponse('JOB_NOT_FOUND', 'Job not found or lease invalid.', 404);
  }

  // Don't allow re-updating terminal statuses
  if (TERMINAL_STATUSES.has(target.status)) {
    return NextResponse.json({ ok: true, note: 'Already in terminal state.' });
  }

  // Map agent status to our internal status
  const statusMap: Record<string, string> = {
    ACKNOWLEDGED: 'DOWNLOADING',
    DOWNLOADING: 'DOWNLOADING',
    VERIFYING_PACKAGE: 'VERIFYING_PACKAGE',
    INSTALLING: 'INSTALLING',
    VERIFYING_INSTALLATION: 'VERIFYING_INSTALLATION',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    REBOOT_REQUIRED: 'INSTALLING', // stays installing until reboot confirms
  };

  const newStatus = statusMap[body.status] ?? body.status;
  const isTerminal = body.status === 'SUCCESS' || body.status === 'FAILED';

  // Handle retries for failures
  let finalStatus = newStatus;
  let nextAttemptAt: Date | undefined;

  if (body.status === 'FAILED' && target.attempts < target.maxAttempts) {
    // Check if the error is retryable
    const permanentErrors = new Set(['OS_NOT_COMPATIBLE', 'PACKAGE_HASH_MISMATCH', 'PACKAGE_NOT_FOUND']);
    const isPermanent = body.errorCode && permanentErrors.has(body.errorCode);

    if (!isPermanent) {
      finalStatus = 'RETRY_PENDING';
      // Exponential backoff: 5min, 15min, 45min
      const backoffMinutes = Math.pow(3, target.attempts) * 5;
      nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
    }
  }

  await db
    .update(schema.deploymentTargets)
    .set({
      status: finalStatus,
      exitCode: body.exitCode,
      errorCode: body.errorCode,
      errorMessage: body.errorMessage ? body.errorMessage.slice(0, 2000) : undefined,
      diagnostics: body.diagnostics ? body.diagnostics.slice(0, 10000) : undefined,
      completedAt: isTerminal ? new Date() : undefined,
      nextAttemptAt,
    })
    .where(eq(schema.deploymentTargets.id, targetId));

  // Update job aggregate counts
  if (isTerminal || finalStatus === 'RETRY_PENDING') {
    const allTargets = await db
      .select({ id: schema.deploymentTargets.id, status: schema.deploymentTargets.status })
      .from(schema.deploymentTargets)
      .where(eq(schema.deploymentTargets.deploymentJobId, target.deploymentJobId));

    const counts = allTargets.reduce(
      (acc, t) => {
        const s = t.id === targetId ? finalStatus : t.status;
        if (s === 'SUCCESS') acc.success++;
        else if (s === 'FAILED') acc.failed++;
        else if (s === 'QUEUED' || s === 'RETRY_PENDING') acc.queued++;
        else if (['DOWNLOADING', 'INSTALLING', 'VERIFYING_PACKAGE', 'VERIFYING_INSTALLATION'].includes(s)) acc.running++;
        return acc;
      },
      { success: 0, failed: 0, queued: 0, running: 0 },
    );

    const jobDone = counts.queued === 0 && counts.running === 0;

    await db
      .update(schema.deploymentJobs)
      .set({
        successCount: counts.success,
        failureCount: counts.failed,
        queuedCount: counts.queued,
        runningCount: counts.running,
        status: jobDone ? (counts.failed > 0 && counts.success === 0 ? 'FAILED' : 'COMPLETED') : 'RUNNING',
        completedAt: jobDone ? new Date() : undefined,
      })
      .where(eq(schema.deploymentJobs.id, target.deploymentJobId));

    await recordSystemEvent({
      event: body.status === 'SUCCESS' ? 'DEPLOYMENT_SUCCESS' : 'DEPLOYMENT_FAILED',
      deviceId: device.id,
      resourceType: 'DEPLOYMENT_TARGET',
      resourceId: targetId,
      metadata: { exitCode: body.exitCode, errorCode: body.errorCode, jobId: target.deploymentJobId },
      severity: body.status === 'FAILED' ? 'WARN' : 'INFO',
    });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleStatusUpdate(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleStatusUpdate(req, params);
}
