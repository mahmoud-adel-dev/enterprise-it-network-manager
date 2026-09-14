import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, sql, count, and } from 'drizzle-orm';

export interface DashboardStats {
  devices: {
    total: number;
    online: number;
    offline: number;
    managed: number;
    unmanaged: number;
    pendingApproval: number;
  };
  os: {
    windows10: number;
    windows11: number;
    windowsServer: number;
    other: number;
  };
  domain: {
    joined: number;
    workgroup: number;
    pending: number;
    failed: number;
  };
  network: {
    vlans: number;
    switches: number;
    routers: number;
    accessPoints: number;
    unknownDevices: number;
  };
  deployments: {
    active: number;
    success: number;
    failed: number;
    queued: number;
  };
  compliance: {
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    devicesTotal,
    devicesOnline,
    devicesOffline,
    devicesManaged,
    devicesUnmanaged,
    devicesPending,
    osW10,
    osW11,
    osServer,
    domainJoined,
    domainWorkgroup,
    domainPending,
    domainFailed,
    vlanCount,
    switchCount,
    routerCount,
    apCount,
    deploymentsActive,
    deploymentsSuccess,
    deploymentsFailed,
    deploymentsQueued,
    complianceCompliant,
    complianceNonCompliant,
    compliancePending,
  ] = await Promise.all([
    db.select({ c: count() }).from(schema.devices).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.onlineStatus, 'ONLINE')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.onlineStatus, 'OFFLINE')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.managementStatus, 'MANAGED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.managementStatus, 'UNMANAGED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.approvalStatus, 'PENDING')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.osClassification, 'windows10')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.osClassification, 'windows11')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.osClassification, 'windowsserver')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.domainStatus, 'DOMAIN_JOINED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.domainStatus, 'WORKGROUP')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.domainStatus, 'DOMAIN_JOIN_PENDING')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.devices).where(eq(schema.devices.domainStatus, 'DOMAIN_JOIN_FAILED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.vlans).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.networkDevices).where(eq(schema.networkDevices.deviceType, 'SWITCH')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.networkDevices).where(eq(schema.networkDevices.deviceType, 'ROUTER')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.networkDevices).where(eq(schema.networkDevices.deviceType, 'ACCESS_POINT')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.deploymentJobs).where(eq(schema.deploymentJobs.status, 'RUNNING')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.deploymentJobs).where(eq(schema.deploymentJobs.status, 'COMPLETED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.deploymentJobs).where(eq(schema.deploymentJobs.status, 'FAILED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.deploymentJobs).where(eq(schema.deploymentJobs.status, 'QUEUED')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.policyCompliance).where(eq(schema.policyCompliance.status, 'COMPLIANT')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.policyCompliance).where(eq(schema.policyCompliance.status, 'NON_COMPLIANT')).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.policyCompliance).where(eq(schema.policyCompliance.status, 'PENDING')).then(r => r[0]?.c ?? 0),
  ]);

  return {
    devices: {
      total: devicesTotal,
      online: devicesOnline,
      offline: devicesOffline,
      managed: devicesManaged,
      unmanaged: devicesUnmanaged,
      pendingApproval: devicesPending,
    },
    os: {
      windows10: osW10,
      windows11: osW11,
      windowsServer: osServer,
      other: devicesTotal - osW10 - osW11 - osServer,
    },
    domain: {
      joined: domainJoined,
      workgroup: domainWorkgroup,
      pending: domainPending,
      failed: domainFailed,
    },
    network: {
      vlans: vlanCount,
      switches: switchCount,
      routers: routerCount,
      accessPoints: apCount,
      unknownDevices: 0,
    },
    deployments: {
      active: deploymentsActive,
      success: deploymentsSuccess,
      failed: deploymentsFailed,
      queued: deploymentsQueued,
    },
    compliance: {
      compliant: complianceCompliant,
      nonCompliant: complianceNonCompliant,
      pending: compliancePending,
    },
  };
}
