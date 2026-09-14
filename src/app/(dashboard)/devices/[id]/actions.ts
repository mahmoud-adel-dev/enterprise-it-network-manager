'use server';

import { getSession } from '@/server/auth/session';
import { revalidatePath } from 'next/cache';
import {
  quarantineDevice,
  unquarantineDevice,
  blockDevice,
  unblockDevice,
  approveDevice,
  rejectDevice,
  getDevice,
} from '@/server/repositories/devices';
import { auditAction } from '@/server/services/audit';

export interface DeviceActionResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Isolate device from corporate network (Quarantine).
 * Blocks lateral movement and internet traffic, allowing only management traffic.
 */
export async function isolateDeviceAction(
  deviceId: string,
  reason?: string,
): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  try {
    await quarantineDevice(deviceId);

    await auditAction({
      action: 'DEVICE_QUARANTINED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceId,
      metadata: {
        hostname: device.hostname,
        ipAddress: device.ipAddress,
        reason: reason || 'Manual security isolation by administrator',
      },
    });

    revalidatePath('/devices');
    revalidatePath(`/devices/${deviceId}`);
    return {
      success: true,
      message: `Device ${device.hostname} has been quarantined and isolated from the corporate network.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to isolate device.';
    return { success: false, error: msg };
  }
}

/**
 * Restore device network access (Remove Quarantine).
 */
export async function restoreDeviceNetworkAction(
  deviceId: string,
): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  try {
    await unquarantineDevice(deviceId);

    await auditAction({
      action: 'DEVICE_UNQUARANTINED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceId,
      metadata: {
        hostname: device.hostname,
        ipAddress: device.ipAddress,
      },
    });

    revalidatePath('/devices');
    revalidatePath(`/devices/${deviceId}`);
    return {
      success: true,
      message: `Device ${device.hostname} network access has been restored to managed state.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to restore network access.';
    return { success: false, error: msg };
  }
}

/**
 * Block device completely (Revoke credentials and access).
 */
export async function blockDeviceAction(
  deviceId: string,
  reason?: string,
): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  try {
    await blockDevice(deviceId);

    await auditAction({
      action: 'DEVICE_BLOCKED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceId,
      metadata: {
        hostname: device.hostname,
        ipAddress: device.ipAddress,
        reason: reason || 'Access blocked by administrator',
      },
    });

    revalidatePath('/devices');
    revalidatePath(`/devices/${deviceId}`);
    return {
      success: true,
      message: `Device ${device.hostname} has been blocked. Access credentials revoked.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to block device.';
    return { success: false, error: msg };
  }
}

/**
 * Unblock / Approve device access.
 */
export async function unblockDeviceAction(
  deviceId: string,
): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  try {
    await unblockDevice(deviceId);

    await auditAction({
      action: 'DEVICE_UNBLOCKED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceId,
      metadata: {
        hostname: device.hostname,
        ipAddress: device.ipAddress,
      },
    });

    revalidatePath('/devices');
    revalidatePath(`/devices/${deviceId}`);
    return {
      success: true,
      message: `Device ${device.hostname} has been unblocked and approved.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to unblock device.';
    return { success: false, error: msg };
  }
}

/**
 * Approve pending device.
 */
export async function approveDeviceAction(
  deviceId: string,
): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  try {
    await approveDevice(deviceId, session.userId);

    await auditAction({
      action: 'DEVICE_APPROVED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceId,
      metadata: { hostname: device.hostname },
    });

    revalidatePath('/devices');
    revalidatePath(`/devices/${deviceId}`);
    return { success: true, message: `Device ${device.hostname} approved.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve device.';
    return { success: false, error: msg };
  }
}

/**
 * Reject pending device.
 */
export async function rejectDeviceAction(
  deviceId: string,
): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  try {
    await rejectDevice(deviceId);

    await auditAction({
      action: 'DEVICE_REJECTED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'DEVICE',
      resourceId: deviceId,
      metadata: { hostname: device.hostname },
    });

    revalidatePath('/devices');
    revalidatePath(`/devices/${deviceId}`);
    return { success: true, message: `Device ${device.hostname} rejected.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reject device.';
    return { success: false, error: msg };
  }
}

/**
 * Trigger remote screen lock command.
 */
export async function remoteLockAction(deviceId: string): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  await auditAction({
    action: 'REMOTE_LOCK_DISPATCHED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'DEVICE',
    resourceId: deviceId,
    metadata: { hostname: device.hostname },
  });

  return {
    success: true,
    message: `Remote lock command queued for endpoint ${device.hostname}.`,
  };
}

/**
 * Trigger remote reboot command.
 */
export async function remoteRebootAction(deviceId: string): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  await auditAction({
    action: 'REMOTE_REBOOT_DISPATCHED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'DEVICE',
    resourceId: deviceId,
    metadata: { hostname: device.hostname },
  });

  return {
    success: true,
    message: `Remote reboot command queued for endpoint ${device.hostname}.`,
  };
}

/**
 * Request immediate inventory telemetry refresh.
 */
export async function remoteSyncInventoryAction(deviceId: string): Promise<DeviceActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const device = await getDevice(deviceId);
  if (!device) return { success: false, error: 'Device not found.' };

  await auditAction({
    action: 'INVENTORY_SYNC_REQUESTED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'DEVICE',
    resourceId: deviceId,
    metadata: { hostname: device.hostname },
  });

  revalidatePath(`/devices/${deviceId}`);
  return {
    success: true,
    message: `Immediate telemetry scan requested for ${device.hostname}.`,
  };
}
