'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';

export interface VlanActionResponse {
  success: boolean;
  error?: string;
}

export async function createVlanAction(formData: FormData): Promise<VlanActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const vlanNumber = parseInt(formData.get('vlanNumber') as string, 10);
  const name = (formData.get('name') as string)?.trim();
  const subnet = (formData.get('subnet') as string)?.trim() || null;
  const gateway = (formData.get('gateway') as string)?.trim() || null;
  const site = (formData.get('site') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;

  if (isNaN(vlanNumber) || vlanNumber < 1 || vlanNumber > 4094) {
    return { success: false, error: 'VLAN ID must be a number between 1 and 4094.' };
  }

  if (!name) {
    return { success: false, error: 'VLAN name is required.' };
  }

  // Check for duplicate VLAN number
  const existing = await db.select().from(schema.vlans).where(eq(schema.vlans.vlanNumber, vlanNumber)).get();
  if (existing) {
    return { success: false, error: `VLAN ${vlanNumber} already exists.` };
  }

  try {
    const [vlan] = await db.insert(schema.vlans).values({
      vlanNumber,
      name,
      subnet,
      gateway,
      site,
      description,
      active: true,
    }).returning({ id: schema.vlans.id });

    await auditAction({
      action: 'VLAN_CREATED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'VLAN',
      resourceId: vlan?.id,
      metadata: { vlanNumber, name, subnet },
    });

    revalidatePath('/network/vlans');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create VLAN.';
    return { success: false, error: msg };
  }
}

export async function deleteVlanAction(vlanId: string): Promise<VlanActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const vlan = await db.select().from(schema.vlans).where(eq(schema.vlans.id, vlanId)).get();
  if (!vlan) return { success: false, error: 'VLAN not found.' };

  await db.delete(schema.vlans).where(eq(schema.vlans.id, vlanId));

  await auditAction({
    action: 'VLAN_DELETED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'VLAN',
    resourceId: vlanId,
    metadata: { vlanNumber: vlan.vlanNumber, name: vlan.name },
  });

  revalidatePath('/network/vlans');
  return { success: true };
}
