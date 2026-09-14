'use client';

import { useState, useMemo } from 'react';
import {
  Monitor,
  Network,
  Terminal,
  Workflow,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  HardDrive,
  Cpu,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { type Language, i18n } from './landing-i18n';
import { PortCorrelator } from './port-correlator';
import { TerminalDemo } from './terminal-demo';

interface EndpointRow {
  id: string;
  hostname: string;
  ip: string;
  mac: string;
  os: string;
  osFamily: 'win11' | 'win10' | 'server' | 'network';
  domainStatus: 'DOMAIN_JOINED' | 'WORKGROUP';
  mgmtStatus: 'MANAGED' | 'PENDING' | 'QUARANTINED';
  cpuLoad: number;
  ramUsage: number;
  user: string;
  lastHeartbeat: string;
}

const SAMPLE_DEVICES: EndpointRow[] = [
  {
    id: '1',
    hostname: 'SRV-DC01-PROD',
    ip: '10.0.10.5',
    mac: '70:85:c2:51:9b:10',
    os: 'Windows Server 2022 Datacenter (21H2)',
    osFamily: 'server',
    domainStatus: 'DOMAIN_JOINED',
    mgmtStatus: 'MANAGED',
    cpuLoad: 18,
    ramUsage: 46,
    user: 'CORP\\svc_domain_admin',
    lastHeartbeat: '4s ago',
  },
  {
    id: '2',
    hostname: 'WS-FIN-042',
    ip: '10.0.20.42',
    mac: '00:50:56:b2:41:a9',
    os: 'Windows 11 Enterprise 23H2 (Build 22631)',
    osFamily: 'win11',
    domainStatus: 'DOMAIN_JOINED',
    mgmtStatus: 'MANAGED',
    cpuLoad: 32,
    ramUsage: 64,
    user: 'CORP\\sarah.connor',
    lastHeartbeat: '12s ago',
  },
  {
    id: '3',
    hostname: 'DEV-CAD-STATION-01',
    ip: '10.0.30.88',
    mac: '48:21:0b:39:aa:10',
    os: 'Windows 11 Pro for Workstations',
    osFamily: 'win11',
    domainStatus: 'DOMAIN_JOINED',
    mgmtStatus: 'MANAGED',
    cpuLoad: 78,
    ramUsage: 82,
    user: 'CORP\\alex.mercer',
    lastHeartbeat: '8s ago',
  },
  {
    id: '4',
    hostname: 'WS-ACCT-PAYABLE',
    ip: '10.0.20.55',
    mac: '00:50:56:b2:99:34',
    os: 'Windows 10 Pro 22H2 (Build 19045)',
    osFamily: 'win10',
    domainStatus: 'DOMAIN_JOINED',
    mgmtStatus: 'MANAGED',
    cpuLoad: 24,
    ramUsage: 58,
    user: 'CORP\\john.miller',
    lastHeartbeat: '22s ago',
  },
  {
    id: '5',
    hostname: 'DESKTOP-TEMP-NEW',
    ip: '10.0.20.199',
    mac: 'f4:4d:30:11:80:a2',
    os: 'Windows 11 Pro 23H2',
    osFamily: 'win11',
    domainStatus: 'DOMAIN_JOINED',
    mgmtStatus: 'PENDING',
    cpuLoad: 12,
    ramUsage: 35,
    user: 'CORP\\temp.contractor',
    lastHeartbeat: '1m ago',
  },
  {
    id: '6',
    hostname: 'UNKNOWN-ROGUE-DEVICE',
    ip: '10.0.99.14',
    mac: 'd8:3b:bf:6a:11:42',
    os: 'Linux 6.8 (Unregistered)',
    osFamily: 'network',
    domainStatus: 'WORKGROUP',
    mgmtStatus: 'QUARANTINED',
    cpuLoad: 5,
    ramUsage: 14,
    user: 'root (Unauthenticated)',
    lastHeartbeat: '2m ago',
  },
];

interface RingDeployment {
  id: string;
  name: string;
  version: string;
  type: 'MSI' | 'EXE' | 'SCRIPT';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  progress: number;
  totalNodes: number;
  successNodes: number;
  failedNodes: number;
  ring: 'Ring 0: Pilot' | 'Ring 1: Canary (15%)' | 'Ring 2: Production';
  checksum: string;
}

const SAMPLE_DEPLOYMENTS: RingDeployment[] = [
  {
    id: 'd1',
    name: 'CrowdStrike Falcon Sensor',
    version: '7.14.18002',
    type: 'MSI',
    status: 'COMPLETED',
    progress: 100,
    totalNodes: 350,
    successNodes: 349,
    failedNodes: 1,
    ring: 'Ring 2: Production',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'd2',
    name: 'Google Chrome Enterprise (x64)',
    version: '128.0.6613.120',
    type: 'MSI',
    status: 'IN_PROGRESS',
    progress: 74,
    totalNodes: 350,
    successNodes: 259,
    failedNodes: 0,
    ring: 'Ring 1: Canary (15%)',
    checksum: 'a8b941f23851b209e7c37db45100efb1192e47c1809ba8cf610e201bfa82e811',
  },
  {
    id: 'd3',
    name: 'KB5041585 - Windows 11 Cumulative Security Patch',
    version: '2026-09 Update',
    type: 'SCRIPT',
    status: 'IN_PROGRESS',
    progress: 35,
    totalNodes: 85,
    successNodes: 30,
    failedNodes: 0,
    ring: 'Ring 0: Pilot',
    checksum: '49c0258bb279b9b46e330a84d43425f1873099951662fb8467df84e60b13cf10',
  },
];

export function InteractiveShowcase({ lang }: { lang: Language }) {
  const t = i18n[lang].showcase;
  const [activeTab, setActiveTab] = useState<'fleet' | 'switch' | 'discovery' | 'deploy'>('fleet');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = useMemo(() => {
    if (!searchTerm.trim()) return SAMPLE_DEVICES;
    const term = searchTerm.toLowerCase();
    return SAMPLE_DEVICES.filter(
      (d) =>
        d.hostname.toLowerCase().includes(term) ||
        d.ip.includes(term) ||
        d.os.toLowerCase().includes(term) ||
        d.user.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <section id="showcase" className="relative py-16 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary mb-3">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {t.tag}
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            {t.desc}
          </p>
        </div>

        {/* Console Showcase Outer Box */}
        <div className="rounded-2xl border border-border/80 bg-card/60 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Top Tab Switcher Navigation */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/80 bg-secondary/30 px-4 py-3 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-medium transition-all ${
                  activeTab === 'fleet'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span>{t.tabFleet}</span>
                <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px]">
                  {SAMPLE_DEVICES.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('switch')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-medium transition-all ${
                  activeTab === 'switch'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Network className="h-4 w-4" />
                <span>{t.tabSwitch}</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-500 px-1.5 py-0.2 text-[10px] font-bold">
                  24-PORT
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('discovery')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-medium transition-all ${
                  activeTab === 'discovery'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Terminal className="h-4 w-4" />
                <span>{t.tabDiscovery}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deploy')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-medium transition-all ${
                  activeTab === 'deploy'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Workflow className="h-4 w-4" />
                <span>{t.tabDeploy}</span>
              </button>
            </div>

            {/* Live Indicator Pill */}
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>ENGINE: CONNECTED (LOCAL IPC)</span>
            </div>
          </div>

          {/* Tab 1: Fleet Inventory */}
          {activeTab === 'fleet' && (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t.fleetSearch}
                    className="w-full rounded-lg border border-border/80 bg-background/80 py-2 pl-9 pr-4 text-xs font-mono placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">Showing {filteredDevices.length} nodes</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-border/70 bg-secondary/50 text-[11px] text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{t.fleetColHost}</th>
                      <th className="py-3 px-4">{t.fleetColIp}</th>
                      <th className="py-3 px-4">{t.fleetColOs}</th>
                      <th className="py-3 px-4">{t.fleetColStatus}</th>
                      <th className="py-3 px-4">{t.fleetColHealth}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredDevices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-secondary text-foreground">
                              {dev.osFamily === 'server' ? (
                                <Server className="h-3.5 w-3.5 text-primary" />
                              ) : dev.mgmtStatus === 'QUARANTINED' ? (
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <Monitor className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{dev.hostname}</div>
                              <div className="text-[10px] text-muted-foreground">{dev.user}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-foreground">{dev.ip}</div>
                          <div className="text-[10px] text-muted-foreground">{dev.mac}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="truncate max-w-[200px] text-foreground">{dev.os}</div>
                          <div className="text-[10px] text-muted-foreground">Last Ping: {dev.lastHeartbeat}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                dev.mgmtStatus === 'MANAGED'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : dev.mgmtStatus === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {dev.mgmtStatus === 'MANAGED'
                                ? t.managedBadge
                                : dev.mgmtStatus === 'PENDING'
                                ? t.pendingBadge
                                : t.quarantineBadge}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {dev.domainStatus === 'DOMAIN_JOINED' ? (
                                <span className="text-sky-500 flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> {t.domainJoined}
                                </span>
                              ) : (
                                <span className="text-amber-500 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> {t.workgroup}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">CPU:</span>
                              <span className="font-semibold text-foreground">{dev.cpuLoad}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  dev.cpuLoad > 70
                                    ? 'bg-rose-500'
                                    : dev.cpuLoad > 40
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${dev.cpuLoad}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">RAM:</span>
                              <span className="font-semibold text-foreground">{dev.ramUsage}%</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Switch Port Correlator */}
          {activeTab === 'switch' && (
            <div className="p-4 sm:p-6">
              <PortCorrelator lang={lang} />
            </div>
          )}

          {/* Tab 3: Subnet Discovery Radar */}
          {activeTab === 'discovery' && (
            <div className="p-4 sm:p-6">
              <TerminalDemo lang={lang} />
            </div>
          )}

          {/* Tab 4: Software Deployment Rings */}
          {activeTab === 'deploy' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-mono text-sm font-bold text-foreground">{t.deployTitle}</h3>
                  <p className="text-xs text-muted-foreground">
                    Staged canary ring execution pipeline with cryptographic SHA-256 pre-verification.
                  </p>
                </div>
                <span className="rounded border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                  Policy: Strict Rollback on &gt; 1% Failure
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMPLE_DEPLOYMENTS.map((dep) => (
                  <div
                    key={dep.id}
                    className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3 font-mono text-xs shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                        {dep.ring}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          dep.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-sky-500/10 text-sky-500 animate-pulse'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-foreground truncate">{dep.name}</div>
                      <div className="text-[11px] text-muted-foreground">Version: {dep.version} • Type: {dep.type}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Nodes Deployed</span>
                        <span className="font-bold text-foreground">
                          {dep.successNodes} / {dep.totalNodes} ({dep.progress}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${dep.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded border border-border/50 bg-secondary/40 p-2 space-y-1 text-[10px]">
                      <div className="text-muted-foreground truncate">
                        <span className="font-semibold">SHA-256:</span> {dep.checksum.slice(0, 24)}...
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Exit Code: <span className="text-emerald-500 font-bold">0 (SUCCESS)</span></span>
                        <span>Failed: <span className={dep.failedNodes > 0 ? 'text-rose-500 font-bold' : 'text-zinc-400'}>{dep.failedNodes}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
