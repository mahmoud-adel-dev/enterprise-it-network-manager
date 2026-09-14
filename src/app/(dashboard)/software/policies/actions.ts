'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';

export interface PolicyActionResponse {
  success: boolean;
  error?: string;
}

export async function createPolicyAction(formData: FormData): Promise<PolicyActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const targetGroupId = (formData.get('targetGroupId') as string)?.trim() || null;
  const packageIds = formData.getAll('packageIds') as string[];

  if (!name) {
    return { success: false, error: 'Policy name is required.' };
  }

  if (packageIds.length === 0) {
    return { success: false, error: 'At least one required application package must be selected.' };
  }

  try {
    const [policy] = await db.insert(schema.softwarePolicies).values({
      name,
      description,
      targetGroupId,
      enabled: true,
      createdBy: session.userId,
    }).returning({ id: schema.softwarePolicies.id });

    if (!policy) throw new Error('Failed to create policy.');

    // Insert policy applications
    for (const packageId of packageIds) {
      await db.insert(schema.policyApplications).values({
        policyId: policy.id,
        packageId,
        versionMatch: 'ANY',
      });
    }

    await auditAction({
      action: 'SOFTWARE_POLICY_CREATED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'SOFTWARE_POLICY',
      resourceId: policy.id,
      metadata: { name, targetGroupId, packageCount: packageIds.length },
    });

    // Run initial compliance evaluation
    await evaluatePolicyComplianceInternal(policy.id);

    revalidatePath('/software/policies');
    revalidatePath('/software/compliance');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create policy.';
    console.error('Failed to create software policy:', err);
    return { success: false, error: msg };
  }
}

export async function togglePolicyAction(policyId: string): Promise<PolicyActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const policy = await db.select().from(schema.softwarePolicies).where(eq(schema.softwarePolicies.id, policyId)).get();
  if (!policy) return { success: false, error: 'Policy not found.' };

  const newEnabled = !policy.enabled;
  await db.update(schema.softwarePolicies).set({
    enabled: newEnabled,
    updatedAt: new Date(),
  }).where(eq(schema.softwarePolicies.id, policyId));

  await auditAction({
    action: newEnabled ? 'SOFTWARE_POLICY_ENABLED' : 'SOFTWARE_POLICY_DISABLED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'SOFTWARE_POLICY',
    resourceId: policyId,
  });

  revalidatePath('/software/policies');
  revalidatePath('/software/compliance');
  return { success: true };
}

export async function deletePolicyAction(policyId: string): Promise<PolicyActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  await db.delete(schema.softwarePolicies).where(eq(schema.softwarePolicies.id, policyId));

  await auditAction({
    action: 'SOFTWARE_POLICY_DELETED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'SOFTWARE_POLICY',
    resourceId: policyId,
  });

  revalidatePath('/software/policies');
  revalidatePath('/software/compliance');
  return { success: true };
}

export async function evaluateComplianceAction(policyId?: string): Promise<PolicyActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  try {
    if (policyId) {
      await evaluatePolicyComplianceInternal(policyId);
    } else {
      const allPolicies = await db.select({ id: schema.softwarePolicies.id }).from(schema.softwarePolicies).where(eq(schema.softwarePolicies.enabled, true));
      for (const p of allPolicies) {
        await evaluatePolicyComplianceInternal(p.id);
      }
    }

    revalidatePath('/software/compliance');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to evaluate compliance.';
    return { success: false, error: msg };
  }
}

async function evaluatePolicyComplianceInternal(policyId: string): Promise<void> {
  const policy = await db.select().from(schema.softwarePolicies).where(eq(schema.softwarePolicies.id, policyId)).get();
  if (!policy || !policy.enabled) return;

  // Resolve target devices
  let targetDevices: { id: string }[] = [];
  if (policy.targetGroupId) {
    const members = await db
      .select({ id: schema.deviceGroupMembers.deviceId })
      .from(schema.deviceGroupMembers)
      .where(eq(schema.deviceGroupMembers.groupId, policy.targetGroupId));
    targetDevices = members;
  } else {
    targetDevices = await db.select({ id: schema.devices.id }).from(schema.devices);
  }

  const reqApps = await db
    .select({
      packageId: schema.policyApplications.packageId,
      name: schema.applicationPackages.name,
    })
    .from(schema.policyApplications)
    .innerJoin(schema.applicationPackages, eq(schema.policyApplications.packageId, schema.applicationPackages.id))
    .where(eq(schema.policyApplications.policyId, policyId));

  const now = new Date();

  for (const dev of targetDevices) {
    const installed = await db
      .select({ name: schema.deviceSoftware.name })
      .from(schema.deviceSoftware)
      .where(eq(schema.deviceSoftware.deviceId, dev.id));

    const installedNames = new Set(installed.map((i) => i.name.toLowerCase()));
    const missing: string[] = [];

    for (const app of reqApps) {
      // Fuzzy name match
      const matched = Array.from(installedNames).some((n) => n.includes(app.name.toLowerCase()) || app.name.toLowerCase().includes(n));
      if (!matched) {
        missing.push(app.name);
      }
    }

    const status = missing.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';

    // Upsert compliance record
    const existing = await db
      .select()
      .from(schema.policyCompliance)
      .where(
        and(
          eq(schema.policyCompliance.policyId, policyId),
          eq(schema.policyCompliance.deviceId, dev.id),
        ),
      )
      .get();

    if (existing) {
      await db.update(schema.policyCompliance).set({
        status,
        lastEvaluatedAt: now,
        missingPackages: JSON.stringify(missing),
      }).where(eq(schema.policyCompliance.id, existing.id));
    } else {
      await db.insert(schema.policyCompliance).values({
        policyId,
        deviceId: dev.id,
        status,
        lastEvaluatedAt: now,
        missingPackages: JSON.stringify(missing),
      });
    }
  }
}
