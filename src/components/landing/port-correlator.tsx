'use client';

import { useState } from 'react';
import { Network, Server, ShieldAlert, Cpu, Activity, ArrowDownUp, CheckCircle2, AlertTriangle, Monitor } from 'lucide-react';
import { type Language, i18n } from './landing-i18n';

interface PortData {
  id: number;
  name: string;
  status: 'UP' | 'DOWN' | 'ALERT';
  speed: string;
  vlan: number;
  vlanName: string;
  mac: string;
  hostname: string;
  ip: string;
  os: string;
  rxRate: string;
  txRate: string;
  protocol: string;
  isUplink?: boolean;
}

const SWITCH_PORTS: PortData[] = [
  {
    id: 1,
    name: 'Gi1/0/1',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 10,
    vlanName: 'Management / Infra',
    mac: '70:85:c2:51:9b:10',
    hostname: 'SRV-DC01-PROD',
    ip: '10.0.10.5',
    os: 'Windows Server 2022 Datacenter',
    rxRate: '342.4 Mbps',
    txRate: '189.2 Mbps',
    protocol: 'LLDP',
  },
  {
    id: 2,
    name: 'Gi1/0/2',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 10,
    vlanName: 'Management / Infra',
    mac: '70:85:c2:51:9b:11',
    hostname: 'SRV-DC02-BACKUP',
    ip: '10.0.10.6',
    os: 'Windows Server 2022 Datacenter',
    rxRate: '124.1 Mbps',
    txRate: '98.5 Mbps',
    protocol: 'LLDP',
  },
  {
    id: 3,
    name: 'Gi1/0/3',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '00:50:56:b2:41:a9',
    hostname: 'WS-FIN-042',
    ip: '10.0.20.42',
    os: 'Windows 11 Pro 23H2',
    rxRate: '14.2 Mbps',
    txRate: '3.8 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 4,
    name: 'Gi1/0/4',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '00:50:56:b2:41:b2',
    hostname: 'WS-FIN-019',
    ip: '10.0.20.19',
    os: 'Windows 11 Enterprise',
    rxRate: '8.4 Mbps',
    txRate: '1.2 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 5,
    name: 'Gi1/0/5',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 30,
    vlanName: 'Engineering & DevOps',
    mac: '48:21:0b:39:aa:10',
    hostname: 'DEV-CAD-STATION-01',
    ip: '10.0.30.88',
    os: 'Windows 11 Pro for Workstations',
    rxRate: '88.5 Mbps',
    txRate: '45.1 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 6,
    name: 'Gi1/0/6',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 30,
    vlanName: 'Engineering & DevOps',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 7,
    name: 'Gi1/0/7',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 40,
    vlanName: 'VoIP Telephony',
    mac: '00:04:f2:8c:31:0a',
    hostname: 'POLYCOM-VVX450-CEO',
    ip: '10.0.40.12',
    os: 'Poly UC Software 7.1.3',
    rxRate: '64.0 kbps',
    txRate: '64.0 kbps',
    protocol: 'CDP v2',
  },
  {
    id: 8,
    name: 'Gi1/0/8',
    status: 'ALERT',
    speed: '100 Mbps (Half)',
    vlan: 99,
    vlanName: 'Quarantine / Rogue',
    mac: 'd8:3b:bf:6a:11:42',
    hostname: 'UNKNOWN-ROGUE-LAPTOP',
    ip: '10.0.99.14',
    os: 'Linux 6.8 / Unmanaged',
    rxRate: '4.1 Mbps',
    txRate: '12.8 Mbps',
    protocol: 'ARP Sniff / Nmap',
  },
  {
    id: 9,
    name: 'Gi1/0/9',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '3c:22:fb:a1:04:19',
    hostname: 'WS-FIN-088',
    ip: '10.0.20.88',
    os: 'Windows 11 Pro 23H2',
    rxRate: '21.0 Mbps',
    txRate: '6.4 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 10,
    name: 'Gi1/0/10',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 11,
    name: 'Gi1/0/11',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 30,
    vlanName: 'Engineering & DevOps',
    mac: '48:21:0b:39:aa:99',
    hostname: 'DEV-BUILD-RUNNER',
    ip: '10.0.30.104',
    os: 'Windows 10 Enterprise LTSC',
    rxRate: '194.2 Mbps',
    txRate: '88.3 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 12,
    name: 'Gi1/0/12',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 50,
    vlanName: 'IoT / Access Control',
    mac: 'ec:71:db:12:00:8f',
    hostname: 'DOOR-CTRL-MAIN-GATE',
    ip: '10.0.50.4',
    os: 'Embedded Firmware v3.2',
    rxRate: '12.0 kbps',
    txRate: '4.0 kbps',
    protocol: 'SNMP v2c',
  },
  {
    id: 13,
    name: 'Gi1/0/13',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '00:50:56:b2:88:21',
    hostname: 'WS-EXEC-001',
    ip: '10.0.20.101',
    os: 'Windows 11 Pro 23H2',
    rxRate: '18.4 Mbps',
    txRate: '5.1 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 14,
    name: 'Gi1/0/14',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 15,
    name: 'Gi1/0/15',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 30,
    vlanName: 'Engineering & DevOps',
    mac: '48:21:0b:39:bb:12',
    hostname: 'DESKTOP-QA-LAB03',
    ip: '10.0.30.45',
    os: 'Windows 11 Enterprise',
    rxRate: '42.1 Mbps',
    txRate: '18.2 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 16,
    name: 'Gi1/0/16',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 30,
    vlanName: 'Engineering & DevOps',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 17,
    name: 'Gi1/0/17',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '00:50:56:b2:99:34',
    hostname: 'WS-ACCT-PAYABLE',
    ip: '10.0.20.55',
    os: 'Windows 10 Pro 22H2',
    rxRate: '9.2 Mbps',
    txRate: '2.1 Mbps',
    protocol: 'Agent Beacon',
  },
  {
    id: 18,
    name: 'Gi1/0/18',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 20,
    vlanName: 'Workstations / Finance',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 19,
    name: 'Gi1/0/19',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 40,
    vlanName: 'VoIP Telephony',
    mac: '00:04:f2:8c:44:91',
    hostname: 'POLYCOM-VVX250-OPS',
    ip: '10.0.40.18',
    os: 'Poly UC Software 7.1.3',
    rxRate: '56.0 kbps',
    txRate: '56.0 kbps',
    protocol: 'CDP v2',
  },
  {
    id: 20,
    name: 'Gi1/0/20',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 40,
    vlanName: 'VoIP Telephony',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 21,
    name: 'Gi1/0/21',
    status: 'UP',
    speed: '1000 Mbps',
    vlan: 10,
    vlanName: 'Management / Infra',
    mac: 'b8:27:eb:04:19:a1',
    hostname: 'PRN-OFFICE-HP-LJ9050',
    ip: '10.0.10.150',
    os: 'HP FutureSmart 5.4',
    rxRate: '2.1 Mbps',
    txRate: '800 kbps',
    protocol: 'SNMP v2c',
  },
  {
    id: 22,
    name: 'Gi1/0/22',
    status: 'DOWN',
    speed: 'Disconnected',
    vlan: 10,
    vlanName: 'Management / Infra',
    mac: '—',
    hostname: 'No Device Detected',
    ip: '—',
    os: '—',
    rxRate: '0.0 kbps',
    txRate: '0.0 kbps',
    protocol: '—',
  },
  {
    id: 23,
    name: 'Gi1/0/23',
    status: 'UP',
    speed: '1000 Mbps (PoE+)',
    vlan: 60,
    vlanName: 'Wireless APs',
    mac: '74:83:c2:91:fa:01',
    hostname: 'AP-FLOOR2-EAST',
    ip: '10.0.60.11',
    os: 'UniFi AP U6-Pro v6.6.65',
    rxRate: '184.5 Mbps',
    txRate: '215.1 Mbps',
    protocol: 'LLDP',
  },
  {
    id: 24,
    name: 'Gi1/0/24',
    status: 'UP',
    speed: '10000 Mbps (10G Trunk)',
    vlan: 1,
    vlanName: '802.1Q TRUNK (VLAN 10,20,30,40,60,99)',
    mac: '2c:c8:1b:00:fa:40',
    hostname: 'CORE-ROUTER-CCR2004',
    ip: '10.0.0.1',
    os: 'MikroTik RouterOS v7.14.3',
    rxRate: '940.2 Mbps',
    txRate: '890.7 Mbps',
    protocol: 'LLDP / BGP / OSPF',
    isUplink: true,
  },
];

export function PortCorrelator({ lang }: { lang: Language }) {
  const t = i18n[lang].showcase;
  const [selectedPort, setSelectedPort] = useState<PortData>(SWITCH_PORTS[0]);

  // Split ports into top row (odd) and bottom row (even)
  const oddPorts = SWITCH_PORTS.filter((p) => p.id % 2 === 1);
  const evenPorts = SWITCH_PORTS.filter((p) => p.id % 2 === 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Switch Chassis Visualizer */}
      <div className="rounded-xl border border-border/80 bg-card/70 p-5 shadow-2xl backdrop-blur-md">
        {/* Chassis Faceplate Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                  CISCO CATALYST 9300-24T
                </span>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-500">
                  SYSTEM READY
                </span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                IP: 10.0.10.2 • MAC Forwarding Table: 38 Entries Active • LLDP Enabled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-muted-foreground">Link UP (1G/10G)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
              <span className="text-muted-foreground">Quarantine / Issue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">No Carrier (Down)</span>
            </div>
          </div>
        </div>

        {/* Port Matrix Grid (Cisco-style RJ-45 dual row) */}
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="min-w-[680px] rounded-lg border border-border/60 bg-background/80 p-3">
            {/* Top Row (Odd Ports) */}
            <div className="flex gap-2">
              {oddPorts.map((port) => {
                const isSelected = selectedPort.id === port.id;
                return (
                  <button
                    key={port.id}
                    type="button"
                    onClick={() => setSelectedPort(port)}
                    className={`group relative flex flex-1 flex-col items-center justify-between rounded-md border p-1.5 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(79,70,229,0.3)] ring-1 ring-primary'
                        : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/90'
                    }`}
                  >
                    {/* LED Indicator */}
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          port.status === 'UP'
                            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                            : port.status === 'ALERT'
                            ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse'
                            : 'bg-muted-foreground/20'
                        }`}
                      />
                      {port.isUplink && (
                        <span className="text-[8px] font-mono font-bold text-primary">10G</span>
                      )}
                    </div>

                    {/* RJ45 Port Hole Visual */}
                    <div className="my-1 flex h-6 w-7 items-center justify-center rounded bg-zinc-900 border border-zinc-700 shadow-inner">
                      <div className="h-3 w-4 rounded-sm border-t border-zinc-600 bg-zinc-950 flex items-center justify-center">
                        <div className="h-1 w-2 bg-amber-600/40 rounded-xs" />
                      </div>
                    </div>

                    {/* Port Number */}
                    <span className="font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                      {port.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row (Even Ports) */}
            <div className="mt-2 flex gap-2">
              {evenPorts.map((port) => {
                const isSelected = selectedPort.id === port.id;
                return (
                  <button
                    key={port.id}
                    type="button"
                    onClick={() => setSelectedPort(port)}
                    className={`group relative flex flex-1 flex-col items-center justify-between rounded-md border p-1.5 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(79,70,229,0.3)] ring-1 ring-primary'
                        : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/90'
                    }`}
                  >
                    {/* LED Indicator */}
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          port.status === 'UP'
                            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                            : port.status === 'ALERT'
                            ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse'
                            : 'bg-muted-foreground/20'
                        }`}
                      />
                      {port.isUplink && (
                        <span className="text-[8px] font-mono font-bold text-primary">TRK</span>
                      )}
                    </div>

                    {/* RJ45 Port Hole Visual */}
                    <div className="my-1 flex h-6 w-7 items-center justify-center rounded bg-zinc-900 border border-zinc-700 shadow-inner">
                      <div className="h-3 w-4 rounded-sm border-t border-zinc-600 bg-zinc-950 flex items-center justify-center">
                        <div className="h-1 w-2 bg-amber-600/40 rounded-xs" />
                      </div>
                    </div>

                    {/* Port Number */}
                    <span className="font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                      {port.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t.switchSubtitle}
        </p>
      </div>

      {/* Dynamic Port Telemetry Inspector Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm">
        {/* Col 1: Port Hardware Specs */}
        <div className="flex flex-col gap-3 border-b md:border-b-0 md:border-r border-border/60 pb-4 md:pb-0 md:pr-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.portInfo}
            </span>
            <span
              className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${
                selectedPort.status === 'UP'
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                  : selectedPort.status === 'ALERT'
                  ? 'border border-amber-500/30 bg-amber-500/10 text-amber-500'
                  : 'border border-zinc-500/30 bg-zinc-500/10 text-muted-foreground'
              }`}
            >
              {selectedPort.name} • {selectedPort.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.speedLabel}:</span>
              <span className="font-mono font-medium text-foreground">{selectedPort.speed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.duplexLabel}:</span>
              <span className="font-mono font-medium text-foreground">
                {selectedPort.status === 'UP' ? 'Full Duplex' : 'Auto / Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.vlanLabel}:</span>
              <span className="font-mono font-semibold text-primary">
                VLAN {selectedPort.vlan} ({selectedPort.vlanName})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neighbor Discovery:</span>
              <span className="font-mono text-foreground">{selectedPort.protocol}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Correlated Endpoint Hostname & MAC */}
        <div className="flex flex-col gap-3 border-b md:border-b-0 md:border-r border-border/60 pb-4 md:pb-0 md:pr-4">
          <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t.connectedHost}
          </span>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-secondary text-foreground">
              {selectedPort.isUplink ? (
                <Network className="h-4 w-4 text-primary" />
              ) : selectedPort.status === 'ALERT' ? (
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              ) : (
                <Monitor className="h-4 w-4 text-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-bold text-foreground">
                {selectedPort.hostname}
              </p>
              <p className="text-xs text-muted-foreground">{selectedPort.os}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP Address:</span>
              <span className="text-foreground">{selectedPort.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.macLabel}:</span>
              <span className="text-primary font-semibold">{selectedPort.mac}</span>
            </div>
          </div>
        </div>

        {/* Col 3: Real-Time Traffic & Action */}
        <div className="flex flex-col justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.bytesRxTx}
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded border border-border/60 bg-background/60 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Inbound (Rx)</div>
                <div className="font-mono text-xs font-bold text-emerald-500">{selectedPort.rxRate}</div>
              </div>
              <div className="rounded border border-border/60 bg-background/60 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Outbound (Tx)</div>
                <div className="font-mono text-xs font-bold text-sky-500">{selectedPort.txRate}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>Telemetry: 1s polling</span>
            </span>
            <span className="font-mono text-[11px] text-foreground font-medium">
              SNMP OID: ifInOctets.{selectedPort.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
