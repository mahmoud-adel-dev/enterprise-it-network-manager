import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { recordSystemEvent } from '@/server/services/audit';

export async function createDeploymentJob(params: {
  name: string;
  applicationPackageId: string;
  createdByUserId: string;
  targetDeviceIds: string[];
  targetGroupIds?: string[];
}) {
  const { name, applicationPackageId, createdByUserId, targetDeviceIds, targetGroupIds } = params;

  // Resolve target devices (direct + groups)
  const deviceIds = new Set<string>(targetDeviceIds);

  if (targetGroupIds && targetGroupIds.length > 0) {
    for (const groupId of targetGroupIds) {
      const members = await db
        .select({ deviceId: schema.deviceGroupMembers.deviceId })
        .from(schema.deviceGroupMembers)
        .where(eq(schema.deviceGroupMembers.groupId, groupId));
      for (const m of members) deviceIds.add(m.deviceId);
    }
  }

  if (deviceIds.size === 0) {
    throw new Error('Deployment must have at least one target device.');
  }

  // Create the job
  const [job] = await db.insert(schema.deploymentJobs).values({
    name,
    applicationPackageId,
    createdBy: createdByUserId,
    status: 'QUEUED',
    targetType: 'INDIVIDUAL',
    targetDefinition: JSON.stringify({ deviceIds: Array.from(deviceIds) }),
    totalTargets: deviceIds.size,
    queuedCount: deviceIds.size,
    successCount: 0,
    failureCount: 0,
    runningCount: 0,
  }).returning({ id: schema.deploymentJobs.id });

  if (!job) throw new Error('Failed to create deployment job.');

  // Create targets (bulk insert)
  const targetValues = Array.from(deviceIds).map((deviceId) => ({
    deploymentJobId: job.id,
    deviceId,
    status: 'QUEUED' as const,
    attempts: 0,
    maxAttempts: 3,
  }));

  // SQLite has limits on max variables per query (usually 32766 or 999). Batch inserts if needed.
  const BATCH_SIZE = 100;
  for (let i = 0; i < targetValues.length; i += BATCH_SIZE) {
    const batch = targetValues.slice(i, i + BATCH_SIZE);
    await db.insert(schema.deploymentTargets).values(batch);
  }

  await recordSystemEvent({
    event: 'DEPLOYMENT_CREATED',
    resourceType: 'DEPLOYMENT_JOB',
    resourceId: job.id,
    metadata: { name, packageId: applicationPackageId, targetCount: targetValues.length },
  });

  return job;
}

export async function cancelDeploymentJob(jobId: string, canceledByUserId: string) {
  // Only QUEUED and RUNNING jobs can be cancelled
  const job = await db
    .select()
    .from(schema.deploymentJobs)
    .where(eq(schema.deploymentJobs.id, jobId))
    .get();

  if (!job) throw new Error('Job not found.');
  if (job.status !== 'QUEUED' && job.status !== 'RUNNING') {
    throw new Error('Cannot cancel a completed or failed job.');
  }

  // Cancel all targets that haven't finished
  await db
    .update(schema.deploymentTargets)
    .set({
      status: 'CANCELLED',
      errorMessage: 'Deployment cancelled by administrator.',
      completedAt: new Date(),
    })
    .where(
      and(
        eq(schema.deploymentTargets.deploymentJobId, jobId),
        inArray(schema.deploymentTargets.status, ['QUEUED', 'DOWNLOADING', 'INSTALLING', 'VERIFYING_PACKAGE', 'VERIFYING_INSTALLATION', 'RETRY_PENDING']),
      ),
    );

  // Recalculate job status
  const allTargets = await db
    .select({ status: schema.deploymentTargets.status })
    .from(schema.deploymentTargets)
    .where(eq(schema.deploymentTargets.deploymentJobId, jobId));

  const counts = allTargets.reduce(
    (acc, t) => {
      if (t.status === 'SUCCESS') acc.success++;
      else if (t.status === 'FAILED') acc.failed++;
      else if (t.status === 'CANCELLED') acc.cancelled++;
      return acc;
    },
    { success: 0, failed: 0, cancelled: 0 },
  );

  await db
    .update(schema.deploymentJobs)
    .set({
      status: 'CANCELLED',
      successCount: counts.success,
      failureCount: counts.failed + counts.cancelled, // Treat cancel as failure for stats
      queuedCount: 0,
      runningCount: 0,
      completedAt: new Date(),
    })
    .where(eq(schema.deploymentJobs.id, jobId));

  await recordSystemEvent({
    event: 'DEPLOYMENT_CANCELLED',
    resourceType: 'DEPLOYMENT_JOB',
    resourceId: jobId,
    metadata: { canceledBy: canceledByUserId },
    severity: 'WARN',
  });
}
