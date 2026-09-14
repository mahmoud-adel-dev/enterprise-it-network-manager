'use client';

import { useState } from 'react';
import { Terminal, Copy, Check, Play, RefreshCw } from 'lucide-react';
import { type Language, i18n } from './landing-i18n';

interface TerminalDemoProps {
  lang: Language;
}

const DISCOVERY_LOGS = [
  { time: '10:14:02.104', text: '[INFO] Initializing async discovery runner on interface eth0 (10.0.20.1/24)', color: 'text-zinc-400' },
  { time: '10:14:02.312', text: '[DISC] Dispatched 254 parallel ARP probes across CIDR range 10.0.20.0/24', color: 'text-sky-400' },
  { time: '10:14:03.018', text: '[RECV] 10.0.20.1 -> MAC: 2c:c8:1b:00:fa:40 (MikroTik Cloud Router Switch CRS328)', color: 'text-emerald-400' },
  { time: '10:14:03.140', text: '[RECV] 10.0.20.5 -> MAC: 70:85:c2:51:9b:10 (PTR: SRV-DC01-PROD.corp.local)', color: 'text-emerald-400' },
  { time: '10:14:03.221', text: '[SNMP] Polling sysDescr on 10.0.20.5 via SNMPv3 authPriv (SHA/AES)... OK', color: 'text-indigo-400' },
  { time: '10:14:03.490', text: '[RECV] 10.0.20.42 -> MAC: 00:50:56:b2:41:a9 (Dell Latitude 5540 - Windows 11)', color: 'text-emerald-400' },
  { time: '10:14:03.882', text: '[WARN] 10.0.20.114 -> MAC: d8:3b:bf:6a:11:42 (Unregistered device in Workgroup)', color: 'text-amber-400' },
  { time: '10:14:04.200', text: '[LLDP] Received Chassis-ID TLV from 10.0.20.2 (Port Gi1/0/24 uplink confirmed)', color: 'text-sky-400' },
  { time: '10:14:04.650', text: '[SYNC] Correlated 38 endpoints with active VLAN 20 database records', color: 'text-zinc-300' },
  { time: '10:14:04.910', text: '[DONE] Subnet discovery sweep finished in 2.806s. 1 new unapproved device queued.', color: 'text-emerald-400 font-bold' },
];

const INSTALL_SCRIPT = `Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13;
Invoke-WebRequest -Uri "https://endpoint-mgr.internal/api/v1/agent/install.ps1" -OutFile "$env:TEMP\\epm-agent.ps1";
& "$env:TEMP\\epm-agent.ps1" -ServerUrl "https://endpoint-mgr.internal" -EnrollToken "epm_live_sec_7fa83e9b11" -Quiet;`;

export function TerminalDemo({ lang }: { lang: Language }) {
  const t = i18n[lang].showcase;
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number>(DISCOVERY_LOGS.length);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(INSTALL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rerunSimulation = () => {
    setIsRunning(true);
    setVisibleLines(1);
    let current = 1;
    const interval = setInterval(() => {
      current++;
      setVisibleLines(current);
      if (current >= DISCOVERY_LOGS.length) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 280);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-xs text-zinc-400 font-medium">
            epm-scanner-daemon (pid: 14820) — 10.0.20.0/24
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={rerunSimulation}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Scanning...' : 'Rerun Sweep'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-2 h-[340px] overflow-y-auto font-mono text-xs select-text">
        <div className="text-zinc-500 mb-3">
          # Target: Class-C Subnet 10.0.20.0/24 (VLAN 20: Finance & Executive)
          <br />
          # Engine: Async ICMP ping + raw ARP frame listening + SNMP v3 USM
        </div>

        <div className="flex items-center gap-2 text-zinc-300 pb-2 border-b border-zinc-800/80">
          <span className="text-emerald-400 font-bold">$</span>
          <span>{t.terminalPrompt}</span>
        </div>

        <div className="pt-2 space-y-1.5">
          {DISCOVERY_LOGS.slice(0, visibleLines).map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 leading-relaxed">
              <span className="text-zinc-500 select-none">{log.time}</span>
              <span className={log.color}>{log.text}</span>
            </div>
          ))}

          {isRunning && (
            <div className="flex items-center gap-2 text-sky-400 pt-1">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              <span>Analyzing socket response buffers...</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Footer Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-zinc-300">{t.scanSummary}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Worker: async-worker-pool#2</span>
          <span>Engine: Raw Sockets + Nmap</span>
        </div>
      </div>
    </div>
  );
}

export function AgentInstallSnippet({ lang }: { lang: Language }) {
  const t = i18n[lang].install;
  const [activeTab, setActiveTab] = useState<'ps' | 'gpo' | 'cmd'>('ps');
  const [copied, setCopied] = useState(false);

  const scripts = {
    ps: `# Automated Remote PowerShell Installation (Run as Administrator)
$Endpoint = "https://endpoint-mgr.internal"
$Token    = "epm_live_sec_89fa21bc70"
Invoke-WebRequest -Uri "$Endpoint/api/v1/agent/install.ps1" -OutFile "$env:TEMP\\epm.ps1"
& "$env:TEMP\\epm.ps1" -ServerUrl $Endpoint -EnrollToken $Token -Silent -AutoStartService`,
    gpo: `REM Active Directory GPO Startup Script (Computers Container)
\\\\domain.local\\sysvol\\domain.local\\Policies\\EPM-Agent\\setup.exe /quiet /norestart SERVER="https://endpoint-mgr.internal" TOKEN="epm_live_sec_89fa21bc70"`,
    cmd: `REM Silent SCCM / PDQ Deploy Package
msiexec.exe /i "EndpointManagerAgent-x64.msi" /qn /norestart EPM_SERVER="https://endpoint-mgr.internal" EPM_TOKEN="epm_live_sec_89fa21bc70" ALLUSERS=1`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scripts[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ps')}
            className={`rounded px-3 py-1 text-xs transition-colors ${
              activeTab === 'ps' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.psTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gpo')}
            className={`rounded px-3 py-1 text-xs transition-colors ${
              activeTab === 'gpo' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.gpoTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cmd')}
            className={`rounded px-3 py-1 text-xs transition-colors ${
              activeTab === 'cmd' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.cmdTab}
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'نسخ الكود' : 'Copy Code'}</span>
            </>
          )}
        </button>
      </div>

      {/* Code Box */}
      <div className="p-4 bg-zinc-950 overflow-x-auto text-zinc-300 font-mono text-xs leading-relaxed">
        <pre>{scripts[activeTab]}</pre>
      </div>

      {/* Verification footer */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>HTTPS TLS 1.3 • Mutual Token Handshake • Auto-Enrollment Enabled</span>
        </span>
        <span className="font-mono text-zinc-500">Service: EndpointManagerAgent.exe</span>
      </div>
    </div>
  );
}
