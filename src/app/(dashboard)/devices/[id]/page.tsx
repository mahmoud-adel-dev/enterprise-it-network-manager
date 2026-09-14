import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import {
  getDevice,
  getDeviceInterfaces,
  getDeviceSoftware,
  getDeviceDeployments,
  getDeviceIpHistory,
  getDeviceAuditTrail,
} from '@/server/repositories/devices';
import { formatBytes, timeAgo, formatDate } from '@/lib/utils';
import { DeviceActionsPanel } from './device-actions-panel';
import {
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Activity,
  Shield,
  Layers,
  Clock,
  User,
  ArrowLeft,
  ChevronRight,
  FolderTree,
  AlertCircle,
  CheckCircle2,
  Server,
  FileCode,
  History,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeviceDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) return notFound();

  const { id } = await params;
  const device = await getDevice(id);
  if (!device) return notFound();

  const [interfaces, software, deployments, ipHistory, auditLogs, adComputer] = await Promise.all([
    getDeviceInterfaces(id),
    getDeviceSoftware(id),
    getDeviceDeployments(id),
    getDeviceIpHistory(id),
    getDeviceAuditTrail(id),
    db.select().from(schema.adComputers).where(eq(schema.adComputers.correlatedDeviceId, id)).get(),
  ]);

  const diskUsedBytes = device.diskTotal != null && device.diskFree != null 
    ? Math.max(0, device.diskTotal - device.diskFree) 
    : null;
  const diskPercentUsed = device.diskTotal && diskUsedBytes != null 
    ? Math.round((diskUsedBytes / device.diskTotal) * 100) 
    : null;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/devices" className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="size-3.5" /> Devices
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">{device.hostname}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Monitor className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{device.hostname}</h1>
                <Badge
                  variant="outline"
                  className={
                    device.onlineStatus === 'ONLINE'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  <span
                    className={`size-1.5 rounded-full mr-1.5 ${
                      device.onlineStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
                    }`}
                  />
                  {device.onlineStatus}
                </Badge>
                {device.managementStatus === 'QUARANTINED' && (
                  <Badge variant="destructive">
                    معزول عن الشبكة (QUARANTINED)
                  </Badge>
                )}
                {device.approvalStatus === 'REJECTED' && (
                  <Badge variant="destructive">
                    محظور (BLOCKED)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span>IP: <strong className="text-foreground font-mono">{device.ipAddress ?? 'N/A'}</strong></span>
                <span>•</span>
                <span>MAC: <strong className="text-foreground font-mono">{device.macAddress ?? 'N/A'}</strong></span>
                {device.domainName && (
                  <>
                    <span>•</span>
                    <span>Domain: <strong className="text-foreground">{device.domainName}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Last Seen: {timeAgo(device.lastSeenAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs py-1 px-2.5">
              {device.operatingSystem ?? 'Windows OS'} {device.architecture ? `(${device.architecture})` : ''}
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2.5">
              Agent: {device.agentInstalled ? `v${device.agentVersion ?? '1.0.0'}` : 'Not Installed'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Security, Network Isolation & Management Action Controls */}
      <DeviceActionsPanel
        device={{
          id: device.id,
          hostname: device.hostname,
          ipAddress: device.ipAddress,
          managementStatus: device.managementStatus,
          approvalStatus: device.approvalStatus,
          agentInstalled: device.agentInstalled,
          onlineStatus: device.onlineStatus,
        }}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Processor (CPU)</span>
            <Cpu className="size-4 text-primary" />
          </div>
          <div className="text-base font-bold truncate" title={device.cpu ?? 'Unknown CPU'}>
            {device.cpu ?? 'Unknown'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {device.cpuCores ? `${device.cpuCores} Physical Cores` : 'Architecture: ' + (device.architecture ?? 'x64')}
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">System RAM</span>
            <Activity className="size-4 text-blue-500" />
          </div>
          <div className="text-base font-bold">
            {formatBytes(device.totalMemory)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Logged User: {device.loggedInUser ?? 'None'}
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Primary Storage</span>
            <HardDrive className="size-4 text-amber-500" />
          </div>
          <div className="text-base font-bold">
            {device.diskTotal ? `${formatBytes(diskUsedBytes)} / ${formatBytes(device.diskTotal)}` : 'N/A'}
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${
                (diskPercentUsed ?? 0) > 85 ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${diskPercentUsed ?? 0}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 text-right">
            {diskPercentUsed != null ? `${diskPercentUsed}% used (${formatBytes(device.diskFree)} free)` : ''}
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Active Directory</span>
            <Shield className="size-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold truncate">
            {device.domainStatus === 'DOMAIN_JOINED' ? 'Joined' : 'Workgroup'}
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate" title={device.domainName ?? 'None'}>
            {device.domainName ?? 'Not bound to domain'}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Network Interfaces, Installed Software, Deployments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Network Interfaces */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Network className="size-4 text-primary" />
                Network Interfaces & Adapters
              </h3>
              <Badge variant="outline" className="text-xs">{interfaces.length} Adapters</Badge>
            </div>

            {interfaces.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No network adapter telemetry reported yet.
              </div>
            ) : (
              <div className="space-y-3">
                {interfaces.map((nic) => {
                  let parsedIps: string[] = [];
                  try {
                    parsedIps = nic.ipv4Addresses ? JSON.parse(nic.ipv4Addresses) : [];
                  } catch {
                    // ignore
                  }

                  return (
                    <div key={nic.id} className="p-3.5 rounded-lg border bg-muted/30 flex flex-col md:flex-row justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {nic.name}
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {nic.operationalStatus ?? 'ACTIVE'}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">
                          {nic.description ?? 'Ethernet/Wireless Adapter'}
                        </div>
                        <div className="text-muted-foreground font-mono mt-1">
                          MAC: {nic.macAddress ?? 'N/A'}
                        </div>
                      </div>

                      <div className="md:text-right">
                        <span className="text-muted-foreground text-[11px]">IPv4 Addresses:</span>
                        <div className="font-mono font-medium text-foreground mt-0.5">
                          {parsedIps.length > 0 ? parsedIps.join(', ') : (device.ipAddress ?? 'N/A')}
                        </div>
                        {nic.speedBitsPerSecond && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Link Speed: {Math.round(nic.speedBitsPerSecond / 1_000_000)} Mbps
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Software Inventory */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Installed Software ({software.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applications cataloged by endpoint telemetry scanner.
                </p>
              </div>
              <Link href={`/software/deployments/new?device=${device.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                  + Deploy Package
                </Badge>
              </Link>
            </div>

            {software.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg text-xs text-muted-foreground">
                No software packages reported by agent yet.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border rounded-lg divide-y text-xs">
                {software.map((app) => (
                  <div key={app.id} className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{app.name}</div>
                      <div className="text-muted-foreground text-[11px] flex gap-2">
                        <span>Publisher: {app.publisher ?? 'Unknown'}</span>
                        {app.architecture && <span>• {app.architecture}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        v{app.version ?? '1.0'}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {app.firstDetectedAt ? `First seen ${timeAgo(app.firstDetectedAt)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deployment History for This Device */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileCode className="size-4 text-primary" />
                Package Deployments ({deployments.length})
              </h3>
              <Link href="/software/deployments">
                <span className="text-xs text-primary hover:underline">View All Deployments</span>
              </Link>
            </div>

            {deployments.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                No deployment jobs targeted at this device yet.
              </div>
            ) : (
              <div className="divide-y border rounded-lg text-xs">
                {deployments.map(({ target, job }) => (
                  <div key={target.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{job.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-2 items-center">
                        <span>Status: <strong className="text-foreground">{target.status}</strong></span>
                        <span>•</span>
                        <span>Attempts: {target.attempts}</span>
                        {target.exitCode != null && (
                          <>
                            <span>•</span>
                            <span>Exit Code: {target.exitCode}</span>
                          </>
                        )}
                      </div>
                      {target.errorMessage && (
                        <div className="text-destructive text-[11px] mt-1">
                          Error: {target.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-muted-foreground text-[11px]">
                      {timeAgo(target.completedAt ?? target.startedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Hardware, AD Correlation, IP History, Audit Trail */}
        <div className="space-y-6">
          {/* Detailed Hardware & OS Properties */}
          <div className="rounded-xl border bg-card p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <Server className="size-4 text-primary" />
              Hardware & OS Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-2 py-1">
              <span className="text-muted-foreground">Manufacturer:</span>
              <span className="font-medium text-foreground text-right truncate">{device.manufacturer ?? 'Standard PC'}</span>

              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium text-foreground text-right truncate">{device.model ?? 'N/A'}</span>

              <span className="text-muted-foreground">Serial Number:</span>
              <span className="font-mono text-foreground text-right truncate">{device.serialNumber ?? 'N/A'}</span>

              <span className="text-muted-foreground">Asset Tag:</span>
              <span className="font-mono text-foreground text-right truncate">{device.assetTag ?? 'N/A'}</span>

              <span className="text-muted-foreground">OS Edition:</span>
              <span className="font-medium text-foreground text-right truncate">{device.operatingSystemEdition ?? 'Enterprise'}</span>

              <span className="text-muted-foreground">OS Build:</span>
              <span className="font-mono text-foreground text-right truncate">{device.osBuild ?? 'N/A'}</span>

              <span className="text-muted-foreground">First Seen:</span>
              <span className="text-muted-foreground text-right truncate">{formatDate(device.firstSeenAt)}</span>

              <span className="text-muted-foreground">Last Boot:</span>
              <span className="text-muted-foreground text-right truncate">{formatDate(device.lastBootAt)}</span>
            </div>
          </div>

          {/* Active Directory Object Correlation */}
          <div className="rounded-xl border bg-card p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <FolderTree className="size-4 text-primary" />
              Active Directory Linkage
            </h3>

            {adComputer ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="size-3.5" /> Correlated with AD Computer Object
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] break-all">
                  DN: {adComputer.distinguishedName}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <span className="text-muted-foreground">sAMAccountName:</span>
                  <span className="font-mono text-right">{adComputer.samAccountName}</span>
                  <span className="text-muted-foreground">Organizational Unit:</span>
                  <span className="text-right truncate" title={adComputer.organizationalUnit ?? ''}>
                    {adComputer.organizationalUnit ?? 'Default Computers'}
                  </span>
                  <span className="text-muted-foreground">Last AD Sync:</span>
                  <span className="text-right">{timeAgo(adComputer.lastSyncAt)}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground space-y-2">
                <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="size-3.5 shrink-0" />
                  No direct AD directory object linked.
                </p>
                <p className="text-[11px]">
                  If this device is joined to your domain, run Active Directory Sync or Domain Join to link records.
                </p>
                <Link href="/active-directory/domain-join">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 mt-1">
                    Request Domain Join
                  </Badge>
                </Link>
              </div>
            )}
          </div>

          {/* IP History */}
          <div className="rounded-xl border bg-card p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <History className="size-4 text-primary" />
              Observed IP Address History
            </h3>

            {ipHistory.length === 0 ? (
              <div className="text-muted-foreground text-center py-2 text-[11px]">
                No historical IP address shifts recorded.
              </div>
            ) : (
              <div className="divide-y text-[11px]">
                {ipHistory.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <span className="font-mono font-medium">{item.ipAddress}</span>
                    <span className="text-muted-foreground">{timeAgo(item.lastSeenAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit & Security Log Trail */}
          <div className="rounded-xl border bg-card p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <Clock className="size-4 text-primary" />
              Device Security & Audit Trail
            </h3>

            {auditLogs.length === 0 ? (
              <div className="text-muted-foreground text-center py-4 text-[11px]">
                No security audit events recorded for this device.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded border bg-muted/20 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{log.action}</span>
                      <span className="text-muted-foreground">{timeAgo(log.timestamp)}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <User className="size-3" />
                      {log.usernameSnapshot ?? 'System'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
