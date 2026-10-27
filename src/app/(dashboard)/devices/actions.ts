'use server';

import { getSession } from '@/server/auth/session';
import { revalidatePath } from 'next/cache';
import {
  bulkQuarantineDevices,
  bulkUnquarantineDevices,
  bulkBlockDevices,
  bulkUnblockDevices,
} from '@/server/repositories/devices';
import { auditAction } from '@/server/services/audit';

export interface BulkActionResponse {
  success: boolean;
  count: number;
  error?: string;
  message?: string;
}

/**
 * Bulk isolate/quarantine devices from network
 */
export async function bulkQuarantineAction(
  deviceIds: string[],
  reason?: string,
): Promise<BulkActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, count: 0, error: 'Unauthorized.' };
  if (!deviceIds.length) return { success: false, count: 0, error: 'No devices selected.' };

  try {
    await bulkQuarantineDevices(deviceIds);

    await auditAction({
      action: 'DEVICE_QUARANTINED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceIds.join(','),
      metadata: {
        count: deviceIds.length,
        deviceIds,
        reason: reason || 'Bulk security isolation by administrator',
      },
    });

    revalidatePath('/devices');
    return {
      success: true,
      count: deviceIds.length,
      message: `تم عزل ${deviceIds.length} جهاز بنجاح.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل تنفيذ العزل الجماعي.';
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Bulk unquarantine/restore network access for devices
 */
export async function bulkRestoreAction(
  deviceIds: string[],
): Promise<BulkActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, count: 0, error: 'Unauthorized.' };
  if (!deviceIds.length) return { success: false, count: 0, error: 'No devices selected.' };

  try {
    await bulkUnquarantineDevices(deviceIds);

    await auditAction({
      action: 'DEVICE_UNQUARANTINED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceIds.join(','),
      metadata: {
        count: deviceIds.length,
        deviceIds,
        action: 'bulk_restore',
      },
    });

    revalidatePath('/devices');
    return {
      success: true,
      count: deviceIds.length,
      message: `تم فك العزل واستعادة الاتصال لـ ${deviceIds.length} جهاز بنجاح.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل استعادة الاتصال الجماعي.';
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Bulk block devices
 */
export async function bulkBlockAction(
  deviceIds: string[],
  reason?: string,
): Promise<BulkActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, count: 0, error: 'Unauthorized.' };
  if (!deviceIds.length) return { success: false, count: 0, error: 'No devices selected.' };

  try {
    await bulkBlockDevices(deviceIds);

    await auditAction({
      action: 'DEVICE_BLOCKED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceIds.join(','),
      metadata: {
        count: deviceIds.length,
        deviceIds,
        reason: reason || 'Bulk access block by administrator',
      },
    });

    revalidatePath('/devices');
    return {
      success: true,
      count: deviceIds.length,
      message: `تم حظر ${deviceIds.length} جهاز وإلغاء صلاحياتها بنجاح.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل تنفيذ الحظر الجماعي.';
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Bulk unblock and approve devices
 */
export async function bulkUnblockAction(
  deviceIds: string[],
): Promise<BulkActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, count: 0, error: 'Unauthorized.' };
  if (!deviceIds.length) return { success: false, count: 0, error: 'No devices selected.' };

  try {
    await bulkUnblockDevices(deviceIds);

    await auditAction({
      action: 'DEVICE_APPROVED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceIds.join(','),
      metadata: {
        count: deviceIds.length,
        deviceIds,
        action: 'bulk_unblock_approve',
      },
    });

    revalidatePath('/devices');
    return {
      success: true,
      count: deviceIds.length,
      message: `تم إلغاء الحظر واعتماد ${deviceIds.length} جهاز بنجاح.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل إلغاء الحظر الجماعي.';
    return { success: false, count: 0, error: msg };
  }
}
