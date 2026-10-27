import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { recordSystemEvent } from '@/server/services/audit';
import {
  type DiscoveredNetworkHost,
  normalizeMacAddress,
  parseNeighborTable,
  parseNmapXml,
} from '@/server/services/discovery-network';
import * as net from 'net';
import * as cp from 'child_process';
import { promisify } from 'util';

const execFile = promisify(cp.execFile);

export async function runNetworkDiscovery(runId: string) {
  const run = await db
    .select({ run: schema.discoveryRuns, scope: schema.networkScopes })
    .from(schema.discoveryRuns)
    .innerJoin(schema.networkScopes, eq(schema.discoveryRuns.scopeId, schema.networkScopes.id))
    .where(eq(schema.discoveryRuns.id, runId))
    .get();

  if (!run) return;

  try {
    await db.update(schema.discoveryRuns).set({ status: 'RUNNING' }).where(eq(schema.discoveryRuns.id, runId));

    // Parse CIDR targets
    const targets = run.scope.cidr.split(',').map((s) => s.trim()).filter(Boolean);

    let hostsResponded = 0;

    for (const target of targets) {
      if (!isValidCidr(target)) {
        await recordSystemEvent({
          event: 'DISCOVERY_ERROR',
          metadata: { message: `Invalid CIDR: ${target}`, runId },
          severity: 'WARN',
        });
        continue;
      }

      // 1. Perform Ping Sweep using Nmap (if installed) or Native Socket/Ping Fallback
      const activeHosts = new Map<string, DiscoveredNetworkHost>();
      try {
        const { stdout } = await execFile('nmap', ['-sn', '-T4', '-oX', '-', target], {
          timeout: 30000,
          windowsHide: true,
          maxBuffer: 10 * 1024 * 1024,
        });
        for (const host of parseNmapXml(stdout)) {
          activeHosts.set(host.ip, host);
        }
      } catch (e: unknown) {
        const warnMsg = e instanceof Error ? e.message : 'Sweep error';
        console.warn('[Discovery] Nmap sweep not available or timed out, executing native sweep fallback:', warnMsg);
        // Fallback: sweep using native socket/ping probes
        const candidateIps = parseCidrToIps(target, 254);
        const BATCH_SIZE = 25;
        for (let i = 0; i < candidateIps.length; i += BATCH_SIZE) {
          const batch = candidateIps.slice(i, i + BATCH_SIZE);
          const probeResults = await Promise.all(batch.map((ip) => probeHostAlive(ip)));
          for (let j = 0; j < batch.length; j++) {
            if (probeResults[j]) {
              const ip = batch[j]!;
              activeHosts.set(ip, { ip });
            }
          }
        }
      }

      // 2. Classify active hosts. These TCP probes also warm the local ARP/neighbor cache.
      const classifiedHosts: Array<{
        host: DiscoveredNetworkHost;
        classification: Awaited<ReturnType<typeof classifyDevice>>;
      }> = [];

      for (const host of activeHosts.values()) {
        try {
          const classification = await classifyDevice(host.ip);
          classifiedHosts.push({ host, classification });
        } catch (scanErr) {
          console.error(`Failed to classify ${host.ip}:`, scanErr);
        }
      }

      // Read the cache after probing so native fallback scans can resolve local MAC addresses.
      const neighborMacs = await readNeighborMacAddresses();

      for (const { host, classification } of classifiedHosts) {
        const macAddress = normalizeMacAddress(host.mac) ?? neighborMacs.get(host.ip);
        const hostname = host.hostname;
        const vendor = host.vendor;

        try {
          await db.insert(schema.discoveryResults).values({
            runId,
            ipAddress: host.ip,
            macAddress,
            hostname,
            vendor,
            responseMethod: classification.snmp ? 'SNMP' : macAddress ? 'ARP' : 'ICMP',
          });

          // Check if it exists in devices table
          const existing = await db
            .select({
              id: schema.devices.id,
              agentInstalled: schema.devices.agentInstalled,
              macAddress: schema.devices.macAddress,
            })
            .from(schema.devices)
            .where(eq(schema.devices.ipAddress, host.ip))
            .get();

          if (!existing && classification.type !== 'SWITCH' && classification.type !== 'ROUTER') {
             // Provisionally add unmanaged device
             await db.insert(schema.devices).values({
               deviceUuid: crypto.randomUUID(),
               hostname: hostname || `Unknown-${host.ip.replace(/\./g, '-')}`,
               ipAddress: host.ip,
               macAddress,
               operatingSystem: classification.os,
               managementStatus: 'DISCOVERED',
               onlineStatus: 'ONLINE',
               approvalStatus: 'PENDING',
               firstSeenAt: new Date(),
               lastSeenAt: new Date(),
             });
          } else if (existing) {
            await db
              .update(schema.devices)
              .set({
                onlineStatus: 'ONLINE',
                lastSeenAt: new Date(),
                ...(macAddress && (!existing.agentInstalled || !existing.macAddress) ? { macAddress } : {}),
              })
              .where(eq(schema.devices.id, existing.id));
          }

          hostsResponded++;
        } catch (scanErr) {
           console.error(`Failed to save scan result for ${host.ip}:`, scanErr);
        }
      }
    }

    await db.update(schema.discoveryRuns).set({
      status: 'COMPLETED',
      completedAt: new Date(),
      hostsResponded,
    }).where(eq(schema.discoveryRuns.id, runId));

    await recordSystemEvent({
      event: 'DISCOVERY_COMPLETED',
      metadata: { runId, hostsResponded, subnets: targets },
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown discovery error';
    await db.update(schema.discoveryRuns).set({
      status: 'FAILED',
      errors: JSON.stringify([errorMsg]),
      completedAt: new Date(),
    }).where(eq(schema.discoveryRuns.id, runId));
  }
}

function isValidCidr(cidr: string): boolean {
  return /^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/.test(cidr);
}

// Basic classification engine
async function classifyDevice(ip: string): Promise<{
  type: string;
  os?: string;
  snmp: boolean;
}> {
  // Try port 445 (SMB/Windows)
  // Try port 22 (SSH/Linux/Mac/Switches)
  const [isWindows, isSsh] = await Promise.all([
    checkPort(ip, 445),
    checkPort(ip, 22),
  ]);
  // Try port 161 (SNMP) - Normally requires UDP check

  let type = 'UNKNOWN';
  let os = 'Unknown';

  if (isWindows) {
    type = 'WORKSTATION';
    os = 'Windows';
  } else if (isSsh) {
    type = 'SERVER';
    os = 'Linux/Network OS';
  }

  // TODO: Add proper SNMP querying (e.g., using net-snmp node module)
  // to fetch sysDescr and sysName for deep classification of switches/routers

  return {
    type,
    os,
    snmp: false,
  };
}

function checkPort(ip: string, port: number, timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

function parseCidrToIps(cidr: string, maxHosts = 254): string[] {
  const [baseIp, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr || '32', 10);
  if (!baseIp || isNaN(prefix) || prefix < 16 || prefix > 32) return [];

  const parts = baseIp.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return [];

  const ipNum = ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;

  const ips: string[] = [];
  if (prefix >= 31) {
    for (let i = network; i <= broadcast; i++) {
      ips.push(`${(i >>> 24) & 255}.${(i >>> 16) & 255}.${(i >>> 8) & 255}.${i & 255}`);
    }
  } else {
    for (let i = network + 1; i < broadcast && ips.length < maxHosts; i++) {
      ips.push(`${(i >>> 24) & 255}.${(i >>> 16) & 255}.${(i >>> 8) & 255}.${i & 255}`);
    }
  }
  return ips;
}

async function probeHostAlive(ip: string): Promise<boolean> {
  // Test common ports concurrently for fast discovery
  const ports = [445, 135, 80, 22, 443, 3389];
  const portChecks = ports.map((p) => checkPort(ip, p, 400));
  const results = await Promise.all(portChecks);
  if (results.some(Boolean)) return true;

  // Fallback to ping command
  try {
    const pingArgs = process.platform === 'win32'
      ? ['-n', '1', '-w', '500', ip]
      : process.platform === 'darwin'
        ? ['-c', '1', '-W', '1000', ip]
        : ['-c', '1', '-W', '1', ip];
    const { stdout } = await execFile('ping', pingArgs, { timeout: 2000, windowsHide: true });
    
    // On Windows, verify that the reply is actually from the target IP and not an unreachable notice
    if (process.platform === 'win32') {
      const isUnreachable = stdout.includes('Destination host unreachable') || 
                            stdout.includes('Request timed out') ||
                            stdout.includes('General failure');
      const hasReplyFromTarget = stdout.includes(`Reply from ${ip}:`) && stdout.includes('TTL=');
      return !isUnreachable && hasReplyFromTarget;
    }

    return true;
  } catch {
    return false;
  }
}

async function readNeighborMacAddresses(): Promise<Map<string, string>> {
  const commands = process.platform === 'win32'
    ? [{ file: 'arp', args: ['-a'] }]
    : process.platform === 'linux'
      ? [
          { file: 'ip', args: ['neigh', 'show'] },
          { file: 'arp', args: ['-an'] },
        ]
      : [{ file: 'arp', args: ['-an'] }];

  const neighbors = new Map<string, string>();

  for (const command of commands) {
    try {
      const { stdout } = await execFile(command.file, command.args, {
        timeout: 5000,
        windowsHide: true,
        maxBuffer: 2 * 1024 * 1024,
      });
      for (const [ip, mac] of parseNeighborTable(stdout)) {
        neighbors.set(ip, mac);
      }
    } catch {
      // Some minimal Linux hosts do not ship both iproute2 and net-tools.
    }
  }

  return neighbors;
}
