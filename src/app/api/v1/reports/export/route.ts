import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const reportType = url.searchParams.get('type') || 'devices';

  let csvContent = '';
  const filename = `report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (reportType === 'devices') {
    const devices = await db.select().from(schema.devices).orderBy(desc(schema.devices.createdAt));
    const headers = ['Hostname', 'IP Address', 'MAC Address', 'OS', 'OS Edition', 'Architecture', 'Status', 'Management Status', 'Domain Status', 'First Seen', 'Last Seen'];
    const rows = devices.map((d) => [
      csvEscape(d.hostname),
      csvEscape(d.ipAddress),
      csvEscape(d.macAddress),
      csvEscape(d.operatingSystem),
      csvEscape(d.operatingSystemEdition),
      csvEscape(d.architecture),
      csvEscape(d.onlineStatus),
      csvEscape(d.managementStatus),
      csvEscape(d.domainStatus),
      csvEscape(d.firstSeenAt ? new Date(d.firstSeenAt).toISOString() : ''),
      csvEscape(d.lastSeenAt ? new Date(d.lastSeenAt).toISOString() : ''),
    ].join(','));
    csvContent = [headers.join(','), ...rows].join('\n');

  } else if (reportType === 'deployments') {
    const jobs = await db
      .select({
        id: schema.deploymentJobs.id,
        name: schema.deploymentJobs.name,
        packageName: schema.applicationPackages.name,
        packageVersion: schema.applicationPackages.applicationVersion,
        status: schema.deploymentJobs.status,
        totalTargets: schema.deploymentJobs.totalTargets,
        successCount: schema.deploymentJobs.successCount,
        failureCount: schema.deploymentJobs.failureCount,
        createdAt: schema.deploymentJobs.createdAt,
      })
      .from(schema.deploymentJobs)
      .innerJoin(schema.applicationPackages, eq(schema.deploymentJobs.applicationPackageId, schema.applicationPackages.id))
      .orderBy(desc(schema.deploymentJobs.createdAt));

    const headers = ['Job ID', 'Deployment Name', 'Package Name', 'Version', 'Status', 'Total Targets', 'Successful', 'Failed', 'Created At'];
    const rows = jobs.map((j) => [
      csvEscape(j.id),
      csvEscape(j.name),
      csvEscape(j.packageName),
      csvEscape(j.packageVersion),
      csvEscape(j.status),
      csvEscape(j.totalTargets),
      csvEscape(j.successCount),
      csvEscape(j.failureCount),
      csvEscape(new Date(j.createdAt).toISOString()),
    ].join(','));
    csvContent = [headers.join(','), ...rows].join('\n');

  } else if (reportType === 'ad_computers') {
    const computers = await db.select().from(schema.adComputers).orderBy(desc(schema.adComputers.lastLogon));
    const headers = ['sAMAccountName', 'DNS Hostname', 'Operating System', 'OU', 'Enabled', 'Last Logon', 'Correlated Device ID'];
    const rows = computers.map((c) => [
      csvEscape(c.samAccountName),
      csvEscape(c.dnsHostname),
      csvEscape(c.operatingSystem),
      csvEscape(c.organizationalUnit),
      csvEscape(c.enabled ? 'Yes' : 'No'),
      csvEscape(c.lastLogon ? new Date(c.lastLogon).toISOString() : 'Never'),
      csvEscape(c.correlatedDeviceId || 'Uncorrelated'),
    ].join(','));
    csvContent = [headers.join(','), ...rows].join('\n');

  } else if (reportType === 'discovery') {
    const results = await db
      .select({
        ip: schema.discoveryResults.ipAddress,
        mac: schema.discoveryResults.macAddress,
        hostname: schema.discoveryResults.hostname,
        vendor: schema.discoveryResults.vendor,
        method: schema.discoveryResults.responseMethod,
        discoveredAt: schema.discoveryResults.discoveredAt,
        scopeName: schema.networkScopes.name,
      })
      .from(schema.discoveryResults)
      .innerJoin(schema.discoveryRuns, eq(schema.discoveryResults.runId, schema.discoveryRuns.id))
      .innerJoin(schema.networkScopes, eq(schema.discoveryRuns.scopeId, schema.networkScopes.id))
      .orderBy(desc(schema.discoveryResults.discoveredAt));

    const headers = ['IP Address', 'MAC Address', 'Hostname', 'Vendor', 'Response Method', 'Scope', 'Discovered At'];
    const rows = results.map((r) => [
      csvEscape(r.ip),
      csvEscape(r.mac),
      csvEscape(r.hostname),
      csvEscape(r.vendor),
      csvEscape(r.method),
      csvEscape(r.scopeName),
      csvEscape(new Date(r.discoveredAt).toISOString()),
    ].join(','));
    csvContent = [headers.join(','), ...rows].join('\n');

  } else {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  }

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
