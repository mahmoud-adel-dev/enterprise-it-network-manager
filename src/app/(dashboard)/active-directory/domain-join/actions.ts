'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';

export interface DomainJoinResponse {
  success: boolean;
  error?: string;
  jobId?: string;
}

export async function queueDomainJoinAction(formData: FormData): Promise<DomainJoinResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const deviceId = (formData.get('deviceId') as string)?.trim();
  const targetOu = (formData.get('targetOu') as string)?.trim() || null;

  if (!deviceId) {
    return { success: false, error: 'Device selection is required.' };
  }

  // Verify device exists and is not already joined
  const device = await db.select().from(schema.devices).where(eq(schema.devices.id, deviceId)).get();
  if (!device) return { success: false, error: 'Selected device not found.' };

  if (device.domainStatus === 'DOMAIN_JOINED') {
    return { success: false, error: `Device ${device.hostname} is already joined to a domain.` };
  }

  try {
    const [job] = await db.insert(schema.domainJoinJobs).values({
      deviceId,
      targetOu,
      requestedBy: session.userId,
      status: 'PENDING',
    }).returning({ id: schema.domainJoinJobs.id });

    if (!job) throw new Error('Failed to create domain join request.');

    // Also queue into general jobQueue for worker processing
    await db.insert(schema.jobQueue).values({
      jobType: 'DOMAIN_JOIN',
      payload: JSON.stringify({
        domainJoinJobId: job.id,
        deviceId,
        targetOu,
        hostname: device.hostname,
      }),
      status: 'PENDING',
      priority: 3,
    });

    // Update device domainStatus to DOMAIN_JOIN_PENDING
    await db.update(schema.devices).set({
      domainStatus: 'DOMAIN_JOIN_PENDING',
      updatedAt: new Date(),
    }).where(eq(schema.devices.id, deviceId));

    await auditAction({
      action: 'DOMAIN_JOIN_REQUESTED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DOMAIN_JOIN_JOB',
      resourceId: job.id,
      metadata: { hostname: device.hostname, targetOu },
    });

    revalidatePath('/active-directory/domain-join');
    return { success: true, jobId: job.id };
  } catch (err: unknown) {
    console.error('Failed to queue domain join:', err);
    const msg = err instanceof Error ? err.message : 'Failed to request domain join.';
    return { success: false, error: msg };
  }
}

export async function cancelDomainJoinAction(jobId: string): Promise<DomainJoinResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const job = await db.select().from(schema.domainJoinJobs).where(eq(schema.domainJoinJobs.id, jobId)).get();
  if (!job) return { success: false, error: 'Job not found.' };

  await db.update(schema.domainJoinJobs).set({
    status: 'CANCELLED',
    errorMessage: 'Cancelled by administrator.',
    completedAt: new Date(),
  }).where(eq(schema.domainJoinJobs.id, jobId));

  // Reset device domain status if pending
  await db.update(schema.devices).set({
    domainStatus: 'WORKGROUP',
    updatedAt: new Date(),
  }).where(eq(schema.devices.id, job.deviceId));

  await auditAction({
    action: 'DOMAIN_JOIN_CANCELLED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'DOMAIN_JOIN_JOB',
    resourceId: jobId,
  });

  revalidatePath('/active-directory/domain-join');
  return { success: true };
}
