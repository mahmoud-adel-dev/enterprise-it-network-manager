import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, or, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import { recordSystemEvent } from '@/server/services/audit';

const POLL_INTERVAL = parseInt(process.env['WORKER_POLL_INTERVAL_SECONDS'] ?? '10', 10) * 1000;
const CONCURRENCY = parseInt(process.env['WORKER_CONCURRENCY'] ?? '5', 10);

let isShuttingDown = false;

export async function processQueue() {
  if (isShuttingDown) return;

  try {
    // 1. Mark RETRY_PENDING targets as QUEUED if their backoff has expired
    await db
      .update(schema.deploymentTargets)
      .set({ status: 'QUEUED', nextAttemptAt: undefined })
      .where(
        and(
          eq(schema.deploymentTargets.status, 'RETRY_PENDING'),
          sql`${schema.deploymentTargets.nextAttemptAt} <= ${new Date()}`,
        ),
      );

    // 2. Identify expired leases and re-queue them
    const expiredLeases = await db
      .select({ id: schema.deploymentTargets.id })
      .from(schema.deploymentTargets)
      .where(
        and(
          inArray(schema.deploymentTargets.status, ['DOWNLOADING', 'INSTALLING', 'VERIFYING_PACKAGE', 'VERIFYING_INSTALLATION']),
          isNotNull(schema.deploymentTargets.leaseExpiresAt),
          sql`${schema.deploymentTargets.leaseExpiresAt} < ${new Date()}`,
        ),
      );

    if (expiredLeases.length > 0) {
      const ids = expiredLeases.map((t) => t.id);
      await db
        .update(schema.deploymentTargets)
        .set({
          status: 'QUEUED',
          leaseToken: null,
          leaseExpiresAt: null,
          errorMessage: 'Job timed out (agent did not report status). Re-queued.',
        })
        .where(inArray(schema.deploymentTargets.id, ids));

      for (const id of ids) {
        await recordSystemEvent({
          event: 'DEPLOYMENT_TIMEOUT',
          resourceType: 'DEPLOYMENT_TARGET',
          resourceId: id,
          severity: 'WARN',
        });
      }
    }

    // 3. Process the background job queue (e.g., domain joining, heavy AD syncs)
    const pendingJobs = await db
      .select()
      .from(schema.jobQueue)
      .where(
        and(
          eq(schema.jobQueue.status, 'PENDING'),
          or(isNull(schema.jobQueue.scheduledAt), sql`${schema.jobQueue.scheduledAt} <= ${new Date()}`),
        ),
      )
      .orderBy(schema.jobQueue.priority, schema.jobQueue.createdAt)
      .limit(CONCURRENCY);

    for (const job of pendingJobs) {
      // Claim the job
      const [claimed] = await db
        .update(schema.jobQueue)
        .set({
          status: 'RUNNING',
          workerId: 'main-worker',
          startedAt: new Date(),
          workerHeartbeatAt: new Date(),
        })
        .where(
          and(
            eq(schema.jobQueue.id, job.id),
            eq(schema.jobQueue.status, 'PENDING'),
          ),
        )
        .returning();

      if (!claimed) continue; // Someone else grabbed it

      try {
        // ... Dispatch logic here (e.g., AD Sync, Domain Join) ...

        await db
          .update(schema.jobQueue)
          .set({ status: 'SUCCESS', completedAt: new Date() })
          .where(eq(schema.jobQueue.id, job.id));

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await db
          .update(schema.jobQueue)
          .set({
            status: 'FAILED',
            errorMessage: msg,
            completedAt: new Date(),
          })
          .where(eq(schema.jobQueue.id, job.id));
      }
    }
  } catch (error) {
    console.error('[Worker] Error processing queue:', error);
  } finally {
    if (!isShuttingDown) {
      setTimeout(processQueue, POLL_INTERVAL);
    }
  }
}

export function startWorker() {
  console.log(`[Worker] Started. Polling every ${POLL_INTERVAL}ms with concurrency ${CONCURRENCY}`);
  isShuttingDown = false;
  processQueue();
}

export function stopWorker() {
  console.log('[Worker] Shutting down...');
  isShuttingDown = true;
}
