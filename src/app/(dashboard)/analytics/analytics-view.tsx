'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  Filter,
  Globe,
  HardDrive,
  Layers,
  Monitor,
  Network,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function AnalyticsView() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'live'>('24h');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredIp, setHoveredIp] = useState<number | null>(null);

  // Time-series mock data for 12 data points
  const trafficPoints = [
    { time: '00:00', rx: 1.2, tx: 0.8 },
    { time: '02:00', rx: 0.9, tx: 0.6 },
    { time: '04:00', rx: 0.7, tx: 0.5 },
    { time: '06:00', rx: 1.5, tx: 1.1 },
    { time: '08:00', rx: 3.8, tx: 2.7 },
    { time: '10:00', rx: 4.8, tx: 3.4 },
    { time: '12:00', rx: 4.2, tx: 3.1 },
    { time: '14:00', rx: 4.6, tx: 3.5 },
    { time: '16:00', rx: 3.9, tx: 2.9 },
    { time: '18:00', rx: 2.8, tx: 2.1 },
    { time: '20:00', rx: 2.1, tx: 1.6 },
    { time: '22:00', rx: 1.7, tx: 1.2 },
  ];

  // SVG Area path generator
  const width = 600;
  const height = 180;
  const maxVal = 6.0;

  const getX = (index: number) => (index / (trafficPoints.length - 1)) * width;
  const getY = (val: number) => height - (val / maxVal) * height;

  // Build SVG path for Rx (Inbound)
  const rxPath = trafficPoints.reduce((acc, pt, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.rx)}`;
  }, '');

  const rxAreaPath = `${rxPath} L ${width} ${height} L 0 ${height} Z`;

  // Build SVG path for Tx (Outbound)
  const txPath = trafficPoints.reduce((acc, pt, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.tx)}`;
  }, '');

  const txAreaPath = `${txPath} L ${width} ${height} L 0 ${height} Z`;

  // Switch Port stats
  const switches = [
    {
      name: 'Cisco Catalyst 9300-24T (Core)',
      ip: '10.0.10.2',
      activePorts: 20,
      totalPorts: 24,
      poeUsed: 184,
      poeMax: 370,
      utilization: 83,
    },
    {
      name: 'MikroTik CRS328-24P-4S+ (Dist)',
      ip: '10.0.10.3',
      activePorts: 22,
      totalPorts: 24,
      poeUsed: 245,
      poeMax: 450,
      utilization: 91,
    },
    {
      name: 'Ubiquiti EdgeSwitch 24 PoE (Access)',
      ip: '10.0.20.2',
      activePorts: 14,
      totalPorts: 24,
      poeUsed: 92,
      poeMax: 250,
      utilization: 58,
    },
  ];

  // OS Distribution
  const osData = [
    { name: 'Windows 11 Enterprise', count: 16, pct: 50, color: '#0ea5e9' },
    { name: 'Windows 10 Pro', count: 8, pct: 25, color: '#6366f1' },
    { name: 'Windows Server 2022', count: 5, pct: 16, color: '#10b981' },
    { name: 'RouterOS / Embedded', count: 3, pct: 9, color: '#f59e0b' },
  ];

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header & Time Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Activity className="size-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t.analytics.title}
            </h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {t.analytics.subtitle}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs font-mono text-xs">
          <button
            type="button"
            onClick={() => setTimeRange('24h')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              timeRange === '24h'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.analytics.timeRange.h24}
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              timeRange === '7d'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.analytics.timeRange.d7}
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              timeRange === '30d'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.analytics.timeRange.d30}
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('live')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              timeRange === 'live'
                ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                : 'text-emerald-500 hover:bg-emerald-500/10'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
            <span>{t.analytics.timeRange.live}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Chart: Network Backbone Throughput (Line & Area Chart) */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              <span>{t.analytics.traffic.title}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.analytics.traffic.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">{t.analytics.traffic.inbound}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
              <span className="text-muted-foreground">{t.analytics.traffic.outbound}</span>
            </div>
            <span className="hidden sm:inline-block rounded-md border border-border/70 bg-secondary/60 px-2 py-0.5 text-[11px] text-foreground font-semibold">
              {t.analytics.traffic.peak}
            </span>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full pt-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 sm:h-56 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="rxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="txGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 1.5, 3.0, 4.5, 6.0].map((val, i) => (
              <line
                key={i}
                x1="0"
                y1={getY(val)}
                x2={width}
                y2={getY(val)}
                stroke="currentColor"
                className="text-border/40"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Area Fills */}
            <path d={rxAreaPath} fill="url(#rxGrad)" />
            <path d={txAreaPath} fill="url(#txGrad)" />

            {/* Stroke Lines */}
            <path d={rxPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d={txPath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />

            {/* Data point dots */}
            {trafficPoints.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(pt.rx)}
                  r={hoveredHour === i ? 5 : 3}
                  className="fill-emerald-500 stroke-background stroke-2 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredHour(i)}
                  onMouseLeave={() => setHoveredHour(null)}
                />
              </g>
            ))}
          </svg>

          {/* Time Labels */}
          <div className="flex justify-between pt-2 text-[10px] font-mono text-muted-foreground border-t border-border/40">
            {trafficPoints.map((pt, i) => (
              <span key={i} className={i % 2 === 0 ? 'inline' : 'hidden sm:inline'}>
                {pt.time}
              </span>
            ))}
          </div>

          {/* Hover tooltip card if hovered */}
          {hoveredHour !== null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono space-y-1">
              <div className="font-bold text-foreground">
                Time: {trafficPoints[hoveredHour].time}
              </div>
              <div className="text-emerald-500">
                Rx Inbound: {trafficPoints[hoveredHour].rx} Gbps
              </div>
              <div className="text-sky-500">
                Tx Outbound: {trafficPoints[hoveredHour].tx} Gbps
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Middle Grid: OS Donut Chart + Switch Port Capacity (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: OS Distribution Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-bold text-base text-foreground">
              {t.analytics.osDistribution.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.analytics.osDistribution.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-36 h-36 -rotate-90">
                {/* Circumference = 2 * PI * 60 ~= 377 */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="stroke-secondary fill-none"
                  strokeWidth="20"
                />
                {/* Slice 1: Windows 11 (50%) = 188.5 */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="fill-none stroke-sky-500"
                  strokeWidth="20"
                  strokeDasharray="188.5 377"
                  strokeDashoffset="0"
                />
                {/* Slice 2: Windows 10 (25%) = 94.25 */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="fill-none stroke-indigo-500"
                  strokeWidth="20"
                  strokeDasharray="94.25 377"
                  strokeDashoffset="-188.5"
                />
                {/* Slice 3: Windows Server (16%) = 60.3 */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="fill-none stroke-emerald-500"
                  strokeWidth="20"
                  strokeDasharray="60.3 377"
                  strokeDashoffset="-282.75"
                />
                {/* Slice 4: RouterOS / Other (9%) = 33.9 */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="fill-none stroke-amber-500"
                  strokeWidth="20"
                  strokeDasharray="33.9 377"
                  strokeDashoffset="-343.05"
                />
              </svg>

              {/* Centered Node Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-foreground">32</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Nodes</span>
              </div>
            </div>

            {/* Legend breakdown list */}
            <div className="space-y-2.5 flex-1 min-w-[160px] text-xs">
              {osData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-foreground truncate max-w-[140px] font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground font-semibold">
                    {item.pct}% ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Switch Port Capacity & PoE Budget (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-bold text-base text-foreground">
              {t.analytics.switchCapacity.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.analytics.switchCapacity.subtitle}
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {switches.map((sw, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/70 bg-secondary/30 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{sw.name}</h4>
                    <p className="font-mono text-[11px] text-muted-foreground">{sw.ip}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    {sw.utilization}% {isAr ? 'إشغال المنافذ' : 'Port Load'}
                  </span>
                </div>

                {/* Progress bar for Ports */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                    <span>
                      {isAr ? 'المنافذ النشطة:' : 'Active Interfaces:'}{' '}
                      <strong className="text-foreground">{sw.activePorts} / {sw.totalPorts}</strong>
                    </span>
                    <span>
                      {isAr ? 'استهلاك طاقة PoE:' : 'PoE Power Budget:'}{' '}
                      <strong className="text-primary">{sw.poeUsed}W / {sw.poeMax}W</strong>
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="bg-primary transition-all duration-500"
                      style={{ width: `${(sw.activePorts / sw.totalPorts) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Subnet Heatmap Matrix + Active Directory Trust Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subnet IP Allocation Matrix (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h3 className="font-bold text-base text-foreground">
                {t.analytics.subnetHeatmap.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.analytics.subnetHeatmap.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-sky-500" />
                <span className="text-muted-foreground">{t.analytics.subnetHeatmap.gateway}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                <span className="text-muted-foreground">{t.analytics.subnetHeatmap.assigned}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-amber-500" />
                <span className="text-muted-foreground">{t.analytics.subnetHeatmap.quarantined}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-secondary" />
                <span className="text-muted-foreground">{t.analytics.subnetHeatmap.unassigned}</span>
              </div>
            </div>
          </div>

          {/* Interactive 64-Block Subnet Visual Representation */}
          <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
              {Array.from({ length: 64 }).map((_, idx) => {
                const ipNum = idx + 1;
                const isGw = ipNum === 1;
                const isRogue = ipNum === 14;
                const isAgent = [5, 6, 12, 19, 21, 24, 42, 45, 55, 88, 101, 104, 150].includes(ipNum);

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIp(ipNum)}
                    onMouseLeave={() => setHoveredIp(null)}
                    className={`h-6 sm:h-7 rounded-md flex items-center justify-center font-mono text-[9px] font-bold cursor-pointer transition-all ${
                      isGw
                        ? 'bg-sky-500 text-white shadow-xs'
                        : isRogue
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isAgent
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    .{ipNum}
                  </div>
                );
              })}
            </div>

            {/* Hovered details box */}
            <div className="mt-3 flex items-center justify-between text-xs font-mono text-muted-foreground pt-2 border-t border-border/50">
              {hoveredIp !== null ? (
                <div className="text-foreground font-semibold">
                  IP: 10.0.20.{hoveredIp} • Status:{' '}
                  {hoveredIp === 1
                    ? 'Default Gateway (RouterOS CCR2004)'
                    : hoveredIp === 14
                    ? 'ROGUE DEVICE (Linux Workgroup / Alert)'
                    : [5, 6, 12, 19, 21, 24, 42, 45, 55, 88, 101, 104, 150].includes(hoveredIp)
                    ? 'Active Managed Agent (Beaconing OK)'
                    : 'Unallocated DHCP Pool'}
                </div>
              ) : (
                <span>Hover over any IP block to inspect DNS PTR and agent status.</span>
              )}
              <span className="text-[11px]">Subnet: 10.0.20.0/24 (CIDR)</span>
            </div>
          </div>
        </div>

        {/* Right: Active Directory Domain Health Score (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-bold text-base text-foreground">
              {t.analytics.domainHealth.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.analytics.domainHealth.subtitle}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 space-y-3">
            {/* Radial Score Gauge */}
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  className="stroke-secondary fill-none"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  className="fill-none stroke-amber-500"
                  strokeWidth="12"
                  strokeDasharray="283"
                  strokeDashoffset="120"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-foreground">68%</span>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase">
                  ATTENTION
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-sm text-foreground">
                {isAr ? '32 جهاز بحاجة لضم الدومين' : '32 Nodes Require Domain Join'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? 'تم العثور على أجهزة تعمل بنمط مجموعة عمل (Workgroup) تفتقر إلى تطبيق سياسات GPO الموحدة.'
                  : 'Workgroup machines do not receive centralized security baseline policies.'}
              </p>
            </div>

            <Link
              href="/active-directory/domain-join"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
            >
              <ShieldCheck className="size-4" />
              <span>{isAr ? 'معالجة انضمام الدومين الآن' : 'Remediate Domain Join'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
