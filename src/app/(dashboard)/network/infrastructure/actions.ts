'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';

export interface InfrastructureActionResponse {
  success: boolean;
  error?: string;
}

export async function addNetworkDeviceAction(formData: FormData): Promise<InfrastructureActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const hostname = (formData.get('hostname') as string)?.trim() || null;
  const managementIp = (formData.get('managementIp') as string)?.trim();
  const deviceType = (formData.get('deviceType') as string) || 'SWITCH';
  const manufacturer = (formData.get('manufacturer') as string)?.trim() || null;
  const model = (formData.get('model') as string)?.trim() || null;
  const serialNumber = (formData.get('serialNumber') as string)?.trim() || null;
  const site = (formData.get('site') as string)?.trim() || null;
  const rack = (formData.get('rack') as string)?.trim() || null;
  const snmpEnabled = formData.get('snmpEnabled') === 'true';
  const snmpVersion = (formData.get('snmpVersion') as string) || 'v2c';
  const snmpCommunity = (formData.get('snmpCommunity') as string)?.trim() || null;

  if (!managementIp) {
    return { success: false, error: 'Management IP address is required.' };
  }

  // Check duplicate IP
  const existing = await db.select().from(schema.networkDevices).where(eq(schema.networkDevices.managementIp, managementIp)).get();
  if (existing) {
    return { success: false, error: `A network device with IP ${managementIp} already exists.` };
  }

  try {
    const [device] = await db.insert(schema.networkDevices).values({
      hostname,
      managementIp,
      deviceType,
      manufacturer,
      model,
      serialNumber,
      site,
      rack,
      snmpEnabled,
      snmpVersion: snmpEnabled ? snmpVersion : null,
      snmpCommunity: snmpEnabled ? snmpCommunity : null,
      status: 'ONLINE',
      lastSeenAt: new Date(),
    }).returning({ id: schema.networkDevices.id });

    await auditAction({
      action: 'NETWORK_DEVICE_ADDED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'NETWORK_DEVICE',
      resourceId: device?.id,
      metadata: { hostname, managementIp, deviceType },
    });

    revalidatePath('/network/infrastructure');
    revalidatePath('/network/topology');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add network device.';
    return { success: false, error: msg };
  }
}

export async function deleteNetworkDeviceAction(deviceId: string): Promise<InfrastructureActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const dev = await db.select().from(schema.networkDevices).where(eq(schema.networkDevices.id, deviceId)).get();
  if (!dev) return { success: false, error: 'Device not found.' };

  await db.delete(schema.networkDevices).where(eq(schema.networkDevices.id, deviceId));

  await auditAction({
    action: 'NETWORK_DEVICE_DELETED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'NETWORK_DEVICE',
    resourceId: deviceId,
    metadata: { hostname: dev.hostname, managementIp: dev.managementIp },
  });

  revalidatePath('/network/infrastructure');
  revalidatePath('/network/topology');
  return { success: true };
}
