import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, like, and, or, desc, asc, sql, count, inArray, isNull, isNotNull } from 'drizzle-orm';
import type { ManagementStatus, OnlineStatus, DomainStatus, ApprovalStatus } from '@/server/db/schema/devices';

export interface DeviceListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  os?: string;
  managementStatus?: ManagementStatus;
  onlineStatus?: OnlineStatus;
  domainStatus?: DomainStatus;
  approvalStatus?: ApprovalStatus;
  vlanId?: string;
  agentInstalled?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DeviceListResult {
  devices: typeof schema.devices.$inferSelect[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listDevices(params: DeviceListParams = {}): Promise<DeviceListResult> {
  const {
    page = 1,
    pageSize = 20,
    search,
    os,
    managementStatus,
    onlineStatus,
    domainStatus,
    approvalStatus,
    vlanId,
    agentInstalled,
    sort = 'lastSeenAt',
    order = 'desc',
  } = params;

  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (search) {
    const q = `%${search}%`;
    conditions.push(
      or(
        like(schema.devices.hostname, q),
        like(schema.devices.ipAddress, q),
        like(schema.devices.macAddress, q),
        like(schema.devices.serialNumber, q),
        like(schema.devices.fqdn, q),
      ),
    );
  }

  if (os) conditions.push(eq(schema.devices.osClassification, os));
  if (managementStatus) conditions.push(eq(schema.devices.managementStatus, managementStatus));
  if (onlineStatus) conditions.push(eq(schema.devices.onlineStatus, onlineStatus));
  if (domainStatus) conditions.push(eq(schema.devices.domainStatus, domainStatus));
  if (approvalStatus) conditions.push(eq(schema.devices.approvalStatus, approvalStatus));
  if (vlanId) conditions.push(eq(schema.devices.vlanId, vlanId));
  if (agentInstalled !== undefined) conditions.push(eq(schema.devices.agentInstalled, agentInstalled));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort === 'hostname' ? schema.devices.hostname
    : sort === 'ipAddress' ? schema.devices.ipAddress
    : sort === 'managementStatus' ? schema.devices.managementStatus
    : sort === 'onlineStatus' ? schema.devices.onlineStatus
    : sort === 'firstSeenAt' ? schema.devices.firstSeenAt
    : schema.devices.lastSeenAt;

  const orderFn = order === 'asc' ? asc : desc;

  const [devices, totalResult] = await Promise.all([
    db
      .select()
      .from(schema.devices)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ c: count() })
      .from(schema.devices)
      .where(where),
  ]);

  const total = totalResult[0]?.c ?? 0;

  return {
    devices,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getDevice(id: string) {
  return db.select().from(schema.devices).where(eq(schema.devices.id, id)).get();
}

export async function getDeviceByAgentId(agentId: string) {
  return db.select().from(schema.devices).where(eq(schema.devices.agentId, agentId)).get();
}

export async function getDeviceByUuid(deviceUuid: string) {
  return db.select().from(schema.devices).where(eq(schema.devices.deviceUuid, deviceUuid)).get();
}

export async function approveDevice(deviceId: string, approvedByUserId: string): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      approvalStatus: 'APPROVED',
      managementStatus: 'MANAGED',
      approvedBy: approvedByUserId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function rejectDevice(deviceId: string): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      approvalStatus: 'REJECTED',
      managementStatus: 'UNMANAGED',
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function quarantineDevice(deviceId: string): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      managementStatus: 'QUARANTINED',
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function getDeviceSoftware(deviceId: string) {
  return db
    .select()
    .from(schema.deviceSoftware)
    .where(eq(schema.deviceSoftware.deviceId, deviceId))
    .orderBy(asc(schema.deviceSoftware.name));
}

export async function getDeviceInterfaces(deviceId: string) {
  return db
    .select()
    .from(schema.deviceInterfaces)
    .where(eq(schema.deviceInterfaces.deviceId, deviceId));
}

export async function getDeviceDeployments(deviceId: string) {
  return db
    .select({
      target: schema.deploymentTargets,
      job: {
        id: schema.deploymentJobs.id,
        name: schema.deploymentJobs.name,
        status: schema.deploymentJobs.status,
        createdAt: schema.deploymentJobs.createdAt,
      },
    })
    .from(schema.deploymentTargets)
    .innerJoin(schema.deploymentJobs, eq(schema.deploymentTargets.deploymentJobId, schema.deploymentJobs.id))
    .where(eq(schema.deploymentTargets.deviceId, deviceId))
    .orderBy(desc(schema.deploymentTargets.startedAt))
    .limit(20);
}

export async function updateDeviceOnlineStatus(
  deviceId: string,
  onlineStatus: OnlineStatus,
  lastSeenAt?: Date,
): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      onlineStatus,
      lastSeenAt: lastSeenAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function unquarantineDevice(deviceId: string): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      managementStatus: 'MANAGED',
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function blockDevice(deviceId: string): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      approvalStatus: 'REJECTED',
      managementStatus: 'QUARANTINED',
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function unblockDevice(deviceId: string): Promise<void> {
  await db
    .update(schema.devices)
    .set({
      approvalStatus: 'APPROVED',
      managementStatus: 'MANAGED',
      updatedAt: new Date(),
    })
    .where(eq(schema.devices.id, deviceId));
}

export async function getDeviceIpHistory(deviceId: string) {
  return db
    .select()
    .from(schema.deviceIpHistory)
    .where(eq(schema.deviceIpHistory.deviceId, deviceId))
    .orderBy(desc(schema.deviceIpHistory.lastSeenAt))
    .limit(20);
}

export async function getDeviceAuditTrail(deviceId: string) {
  return db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.resourceId, deviceId))
    .orderBy(desc(schema.auditLogs.timestamp))
    .limit(25);
}

export async function bulkQuarantineDevices(deviceIds: string[]): Promise<void> {
  if (deviceIds.length === 0) return;
  await db
    .update(schema.devices)
    .set({
      managementStatus: 'QUARANTINED',
      updatedAt: new Date(),
    })
    .where(inArray(schema.devices.id, deviceIds));
}

export async function bulkUnquarantineDevices(deviceIds: string[]): Promise<void> {
  if (deviceIds.length === 0) return;
  await db
    .update(schema.devices)
    .set({
      managementStatus: 'MANAGED',
      updatedAt: new Date(),
    })
    .where(inArray(schema.devices.id, deviceIds));
}

export async function bulkBlockDevices(deviceIds: string[]): Promise<void> {
  if (deviceIds.length === 0) return;
  await db
    .update(schema.devices)
    .set({
      approvalStatus: 'REJECTED',
      managementStatus: 'QUARANTINED',
      updatedAt: new Date(),
    })
    .where(inArray(schema.devices.id, deviceIds));
}

export async function bulkUnblockDevices(deviceIds: string[]): Promise<void> {
  if (deviceIds.length === 0) return;
  await db
    .update(schema.devices)
    .set({
      approvalStatus: 'APPROVED',
      managementStatus: 'MANAGED',
      updatedAt: new Date(),
    })
    .where(inArray(schema.devices.id, deviceIds));
}

