'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { runNetworkDiscovery } from '@/server/services/discovery';
import { revalidatePath } from 'next/cache';

export interface DiscoveryActionResponse {
  success: boolean;
  error?: string;
  runId?: string;
}

export async function triggerScanAction(formData: FormData): Promise<DiscoveryActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const name = (formData.get('name') as string)?.trim();
  const cidr = (formData.get('cidr') as string)?.trim();
  const vlanId = (formData.get('vlanId') as string)?.trim() || null;

  if (!name || !cidr) {
    return { success: false, error: 'Scope name and CIDR subnet are required.' };
  }

  // Validate CIDR format
  const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/;
  if (!cidrRegex.test(cidr)) {
    return { success: false, error: 'Invalid CIDR format. Example: 192.168.1.0/24' };
  }

  const prefix = parseInt(cidr.split('/')[1]!, 10);
  if (prefix < 16 || prefix > 32) {
    return { success: false, error: 'CIDR prefix must be between /16 and /32 to prevent network saturation.' };
  }

  try {
    // Upsert or create network scope
    const [scope] = await db.insert(schema.networkScopes).values({
      name,
      cidr,
      vlanId,
      enabled: true,
      scanIntervalMinutes: 60,
    }).returning({ id: schema.networkScopes.id });

    if (!scope) throw new Error('Failed to create network scope.');

    // Create discovery run
    const [run] = await db.insert(schema.discoveryRuns).values({
      scopeId: scope.id,
      status: 'PENDING',
      startedAt: new Date(),
    }).returning({ id: schema.discoveryRuns.id });

    if (!run) throw new Error('Failed to create discovery run record.');

    await auditAction({
      action: 'NETWORK_SCAN_TRIGGERED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DISCOVERY_RUN',
      resourceId: run.id,
      metadata: { scopeName: name, cidr },
    });

    // Fire discovery asynchronously in background
    runNetworkDiscovery(run.id).catch((err) => {
      console.error('[Discovery Background Execution Failed]:', err);
    });

    revalidatePath('/network');
    revalidatePath('/network/discovery');
    return { success: true, runId: run.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start discovery scan.';
    console.error('Failed to trigger scan:', err);
    return { success: false, error: msg };
  }
}

export async function deleteScanAction(runId: string): Promise<DiscoveryActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  await db.delete(schema.discoveryRuns).where(eq(schema.discoveryRuns.id, runId));

  await auditAction({
    action: 'DISCOVERY_RUN_DELETED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'DISCOVERY_RUN',
    resourceId: runId,
  });

  revalidatePath('/network');
  revalidatePath('/network/discovery');
  return { success: true };
}
