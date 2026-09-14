'use server';

import { revalidatePath } from 'next/cache';
import { approveDevice, rejectDevice, quarantineDevice } from '@/server/repositories/devices';
import { auditAction } from '@/server/services/audit';

export async function approveDeviceAction(deviceId: string, userId: string): Promise<void> {
  await approveDevice(deviceId, userId);
  await auditAction({
    action: 'DEVICE_APPROVED',
    userId,
    resourceType: 'DEVICE',
    resourceId: deviceId,
    success: true,
  });
  revalidatePath('/devices/pending');
  revalidatePath('/devices');
  revalidatePath('/dashboard');
}

export async function rejectDeviceAction(deviceId: string): Promise<void> {
  await rejectDevice(deviceId);
  await auditAction({
    action: 'DEVICE_REJECTED',
    resourceType: 'DEVICE',
    resourceId: deviceId,
    success: true,
  });
  revalidatePath('/devices/pending');
  revalidatePath('/devices');
}

export async function quarantineDeviceAction(deviceId: string, userId: string): Promise<void> {
  await quarantineDevice(deviceId);
  await auditAction({
    action: 'DEVICE_QUARANTINED',
    userId,
    resourceType: 'DEVICE',
    resourceId: deviceId,
    success: true,
  });
  revalidatePath('/devices');
}
