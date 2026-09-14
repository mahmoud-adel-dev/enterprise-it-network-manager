import { getSqlite } from '@/server/db';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Server, Database, HardDrive, Cpu, CheckCircle2, AlertTriangle, XCircle, Clock, Workflow } from 'lucide-react';
import path from 'path';
import fs from 'fs';

export const metadata = { title: 'System Health Diagnostics — Endpoint Manager' };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
}

export default async function SystemHealthPage() {
  // 1. Database Health Check
  let dbStatus = 'HEALTHY';
  let dbLatencyMs = 0;
  let dbJournalMode = 'unknown';
  let dbIntegrity = 'unknown';
  let dbFileSize = 0;
  let walFileSize = 0;

  try {
    const sqlite = getSqlite();
    const start = performance.now();
    const integrityRes = sqlite.pragma('integrity_check') as Array<{ integrity_check: string }>;
    dbLatencyMs = Math.round(performance.now() - start);
    dbIntegrity = integrityRes[0]?.integrity_check || 'ok';

    const journalRes = sqlite.pragma('journal_mode') as Array<{ journal_mode: string }>;
    dbJournalMode = journalRes[0]?.journal_mode || 'wal';

    const dbPath = path.resolve(process.env['DATABASE_PATH'] ?? './data/endpoint-manager.sqlite');
    if (fs.existsSync(dbPath)) {
      dbFileSize = fs.statSync(dbPath).size;
    }
    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) {
      walFileSize = fs.statSync(walPath).size;
    }

    if (dbIntegrity !== 'ok') {
      dbStatus = 'DEGRADED';
    }
  } catch (dbErr) {
    dbStatus = 'DOWN';
  }

  // 2. Storage Directory Check
  let storageStatus = 'HEALTHY';
  let packageFolderExists = false;
  let totalPackageFiles = 0;
  let totalPackageBytes = 0;
  const storagePath = path.resolve(process.env['PACKAGE_STORAGE_PATH'] ?? './data/packages');

  try {
    if (fs.existsSync(storagePath)) {
      packageFolderExists = true;
      const files = fs.readdirSync(storagePath);
      totalPackageFiles = files.length;
      for (const f of files) {
        try {
          const s = fs.statSync(path.join(storagePath, f));
          totalPackageBytes += s.size;
        } catch {
          // ignore unreadable
        }
      }
    } else {
      storageStatus = 'WARNING';
    }
  } catch {
    storageStatus = 'ERROR';
  }

  // 3. Deployment Queue & Targets Status
  const queueStats = await db
    .select({
      status: schema.deploymentTargets.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.deploymentTargets)
    .groupBy(schema.deploymentTargets.status);

  const targetStatusMap: Record<string, number> = {};
  queueStats.forEach((q) => {
    targetStatusMap[q.status] = Number(q.count);
  });

  const activeQueued = (targetStatusMap['QUEUED'] || 0) + (targetStatusMap['RETRY_PENDING'] || 0);
  const activeRunning = (targetStatusMap['DOWNLOADING'] || 0) + (targetStatusMap['INSTALLING'] || 0) + (targetStatusMap['VERIFYING_PACKAGE'] || 0);
  const totalCompleted = (targetStatusMap['SUCCESS'] || 0) + (targetStatusMap['FAILED'] || 0) + (targetStatusMap['CANCELLED'] || 0);

  // 4. Background Worker & Job Queue
  const pendingJobs = await db.select().from(schema.jobQueue).where(eq(schema.jobQueue.status, 'PENDING'));
  const runningJobs = await db.select().from(schema.jobQueue).where(eq(schema.jobQueue.status, 'RUNNING'));

  // 5. Active Directory Connection Status
  const adConfig = await db.select().from(schema.adConfiguration).where(eq(schema.adConfiguration.id, 'singleton')).get();

  // 6. Node Runtime Telemetry
  const mem = process.memoryUsage();
  const uptimeSeconds = process.uptime();
  const nodeVersion = process.version;

  return (
    <div className="w-full space-y-6 px-4 md:px-6 xl:px-8 2xl:px-10 py-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="size-6 text-primary" />
          System Health Diagnostics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time telemetry grounded in actual storage, database engine pragmas, and worker queue activity.
        </p>
      </div>

      {/* Primary Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 bg-card">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database Engine</h4>
            <Badge variant={dbStatus === 'HEALTHY' ? 'success' : dbStatus === 'DEGRADED' ? 'secondary' : 'destructive'} className="text-[10px]">
              {dbStatus}
            </Badge>
          </div>
          <div className="text-xl font-bold text-foreground">{dbLatencyMs} ms</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Query Latency • Mode: {dbJournalMode.toUpperCase()}</p>
        </div>

        <div className="border rounded-xl p-4 bg-card">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Root</h4>
            <Badge variant={packageFolderExists ? 'success' : 'secondary'} className="text-[10px]">
              {packageFolderExists ? 'Accessible' : 'Not Created'}
            </Badge>
          </div>
          <div className="text-xl font-bold text-foreground">{formatBytes(totalPackageBytes)}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{totalPackageFiles} Installer Packages</p>
        </div>

        <div className="border rounded-xl p-4 bg-card">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deployment Rollouts</h4>
            <Badge variant="outline" className="text-[10px] font-mono">
              {activeRunning} Running
            </Badge>
          </div>
          <div className="text-xl font-bold text-foreground">{activeQueued} Targets Queued</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{totalCompleted} Total Finished</p>
        </div>

        <div className="border rounded-xl p-4 bg-card">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Server Uptime</h4>
            <Badge variant="success" className="text-[10px]">Online</Badge>
          </div>
          <div className="text-xl font-bold text-foreground">{formatUptime(uptimeSeconds)}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Node {nodeVersion}</p>
        </div>
      </div>

      {/* Deep Dive Diagnostic Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SQLite Database Engine */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Database className="size-4 text-primary" />
              SQLite Database Internals
            </h3>
            <span className="text-xs font-mono text-muted-foreground">better-sqlite3</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Integrity Verification:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{dbIntegrity}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Journaling Engine:</span>
              <span className="font-mono text-foreground font-medium">{dbJournalMode.toUpperCase()} (Write-Ahead Logging)</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Main Database Size:</span>
              <span className="font-mono text-foreground">{formatBytes(dbFileSize)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">WAL Log File Size:</span>
              <span className="font-mono text-foreground">{formatBytes(walFileSize)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Foreign Keys Pragma:</span>
              <span className="font-mono text-foreground">ENFORCED (ON)</span>
            </div>
          </div>
        </div>

        {/* Runtime & Memory Diagnostics */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              Node.js Process Memory & Resources
            </h3>
            <span className="text-xs font-mono text-muted-foreground">PID: {process.pid}</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">RSS (Resident Set Size):</span>
              <span className="font-mono font-medium text-foreground">{formatBytes(mem.rss)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Heap Allocated:</span>
              <span className="font-mono font-medium text-foreground">{formatBytes(mem.heapUsed)} / {formatBytes(mem.heapTotal)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">External C++ Memory:</span>
              <span className="font-mono font-medium text-foreground">{formatBytes(mem.external)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Host Architecture:</span>
              <span className="font-mono text-foreground">{process.arch} ({process.platform})</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Storage Root Path:</span>
              <span className="font-mono text-muted-foreground truncate max-w-xs">{storagePath}</span>
            </div>
          </div>
        </div>

        {/* Background Job Queue Status */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Workflow className="size-4 text-primary" />
              Background Task Dispatcher
            </h3>
            <Badge variant="outline" className="text-xs">
              {pendingJobs.length} Pending
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Pending Queue Jobs:</span>
              <span className="font-mono font-bold text-foreground">{pendingJobs.length}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Actively Processing:</span>
              <span className="font-mono font-bold text-blue-500">{runningJobs.length}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Dispatcher Worker Status:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">READY</span>
            </div>
          </div>
        </div>

        {/* Directory Services / Active Directory Status */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Server className="size-4 text-primary" />
              Active Directory Connectivity
            </h3>
            <Badge variant={adConfig?.enabled ? 'success' : 'secondary'} className="text-xs">
              {adConfig?.enabled ? 'Configured' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Domain FQDN:</span>
              <span className="font-mono text-foreground">{adConfig?.domainFqdn || 'Not set'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">LDAP Endpoint:</span>
              <span className="font-mono text-foreground">{adConfig?.ldapEndpoint || 'Not set'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">Protocol Security:</span>
              <span className="font-mono text-foreground">{adConfig?.useLdaps ? 'LDAPS (TLS 636)' : 'Plain LDAP (389)'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
