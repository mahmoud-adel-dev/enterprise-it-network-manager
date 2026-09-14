'use client';

import Link from 'next/link';
import {
  Monitor,
  Wifi,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Server,
  Network,
  Globe,
  Layers,
  Workflow,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  GitBranch,
  Shield,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface DashboardStats {
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
  };
  deployments: {
    active: number;
    queued: number;
    success: number;
    failed: number;
  };
  compliance: {
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
}

export function DashboardView({ stats }: { stats: DashboardStats }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const onlinePercent = stats.devices.total > 0
    ? Math.round((stats.devices.online / stats.devices.total) * 100)
    : 0;

  const domainJoinedPercent = stats.devices.total > 0
    ? Math.round((stats.domain.joined / stats.devices.total) * 100)
    : 0;

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header with Quick Analytics CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t.dashboard.title}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/analytics"
            className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/25 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all shadow-xs"
          >
            <Activity className="size-4" />
            <span>{isAr ? 'فتح شاشة التحليلات البيانية' : 'Open Visual Analytics'}</span>
            <ArrowRight className={`size-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>

      {/* 2. Top Executive KPI Hero Cards (4 Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Inventory & Availability */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.dashboard.kpiFleet}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Monitor className="size-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.devices.total}
            </span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {stats.devices.online} {t.dashboard.cards.online} ({onlinePercent}%)
            </span>
          </div>

          {/* Mini multi-status bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{t.dashboard.cards.managed}: {stats.devices.managed}</span>
              <span>{t.dashboard.cards.unmanaged}: {stats.devices.unmanaged}</span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="bg-emerald-500"
                style={{ width: `${stats.devices.total > 0 ? (stats.devices.managed / stats.devices.total) * 100 : 0}%` }}
                title="Managed"
              />
              <div
                className="bg-amber-500"
                style={{ width: `${stats.devices.total > 0 ? (stats.devices.unmanaged / stats.devices.total) * 100 : 0}%` }}
                title="Unmanaged"
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Active Directory Domain Health */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.dashboard.kpiDomain}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <ShieldCheck className="size-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {domainJoinedPercent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {stats.domain.joined} / {stats.devices.total} {t.dashboard.cards.domainJoined}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between pt-1 border-t border-border/60 text-xs">
            <span className="text-amber-500 font-semibold flex items-center gap-1 text-[11px]">
              <AlertTriangle className="size-3.5" />
              {stats.domain.workgroup} {t.dashboard.cards.outsideDomain}
            </span>
            <Link
              href="/active-directory/computers"
              className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
            >
              {isAr ? 'فحص الدومين' : 'Inspect AD'}
            </Link>
          </div>
        </div>

        {/* KPI 3: Network Infrastructure Fabric */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.dashboard.kpiNetwork}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Network className="size-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.network.switches + stats.network.routers}
              </span>
              <span className="text-xs text-muted-foreground ms-1.5">
                {isAr ? 'أجهزة بنية تحتية' : 'Fabric Devices'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-1 border-t border-border/60 text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">
              VLANs: <span className="font-bold text-foreground">{stats.network.vlans}</span>
            </span>
            <span className="font-mono text-[11px]">
              Switches: <span className="font-bold text-foreground">{stats.network.switches}</span>
            </span>
            <span className="font-mono text-[11px]">
              AP: <span className="font-bold text-foreground">{stats.network.accessPoints}</span>
            </span>
          </div>
        </div>

        {/* KPI 4: Software Deployment Pipeline */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.dashboard.kpiDeploy}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Workflow className="size-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.deployments.success}
            </span>
            <span className="text-xs text-emerald-500 font-semibold">
              {t.dashboard.cards.successful}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between pt-1 border-t border-border/60 text-xs text-muted-foreground">
            <span className="text-[11px]">
              {isAr ? 'المهام الجارية:' : 'Active:'}{' '}
              <span className="font-bold text-primary">{stats.deployments.active}</span>
            </span>
            <span className="text-[11px]">
              {isAr ? 'قيد الانتظار:' : 'Queued:'}{' '}
              <span className="font-bold text-foreground">{stats.deployments.queued}</span>
            </span>
            <span className="text-[11px]">
              {isAr ? 'فاشلة:' : 'Failed:'}{' '}
              <span className={stats.deployments.failed > 0 ? 'font-bold text-rose-500' : 'font-bold text-foreground'}>
                {stats.deployments.failed}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Body: 2 Columns (8 / 4 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Operating System Breakdown */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  {t.dashboard.sections.os}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'توزيع أنظمة التشغيل ومستويات الإصدارات عبر الأجهزة' : 'Distribution of operating systems across enterprise endpoints'}
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {stats.devices.total} {isAr ? 'أجهزة مراقبة' : 'Nodes Total'}
              </span>
            </div>

            {/* OS Visual Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.dashboard.cards.windows11}</span>
                  <Monitor className="size-4 text-sky-500" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">{stats.os.windows11}</div>
                <div className="text-[10px] text-muted-foreground">Enterprise / Pro 23H2</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.dashboard.cards.windows10}</span>
                  <Monitor className="size-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">{stats.os.windows10}</div>
                <div className="text-[10px] text-muted-foreground">Pro 22H2 / LTSC</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.dashboard.cards.windowsServer}</span>
                  <Server className="size-4 text-primary" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">{stats.os.windowsServer}</div>
                <div className="text-[10px] text-muted-foreground">2022 / 2019 Datacenter</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.dashboard.cards.otherOs}</span>
                  <Globe className="size-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">{stats.os.other}</div>
                <div className="text-[10px] text-muted-foreground">RouterOS / Linux / Embedded</div>
              </div>
            </div>
          </div>

          {/* Section: Endpoint Lifecycle & Approval Pipeline */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  {t.dashboard.sections.devices}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'مسار انضمام واعتماد الأجهزة الجديدة في الشبكة' : 'Device discovery & zero-trust approval workflow stages'}
                </p>
              </div>
              <Link
                href="/devices/pending"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>{isAr ? 'عرض الأجهزة المعلقة' : 'View Pending Queue'}</span>
                <ChevronRight className={`size-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {/* Workflow Pipeline Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1: Managed */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-500">
                    {t.dashboard.cards.managed}
                  </span>
                  <ShieldCheck className="size-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {stats.devices.managed}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr ? 'أجهزة معتمدة ومثبت عليها العميل وتخضع للمراقبة' : 'Approved, monitored, and running native agent'}
                </p>
              </div>

              {/* Step 2: Unmanaged */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-500">
                    {t.dashboard.cards.unmanaged}
                  </span>
                  <ShieldAlert className="size-4 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {stats.devices.unmanaged}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr ? 'أجهزة تم اكتشافها بالشبكة دون تثبيت العميل' : 'Discovered on subnets without installed agent'}
                </p>
              </div>

              {/* Step 3: Pending Approval */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t.dashboard.cards.pendingApproval}
                  </span>
                  <Clock className="size-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {stats.devices.pendingApproval}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr ? 'أجهزة بانتظار موافقة المسؤول لإدراجها في الأسطول' : 'Awaiting administrative clearance to join fleet'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Secondary Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Operations Hub Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Zap className="size-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                {t.dashboard.quickActions.title}
              </h3>
            </div>

            <div className="space-y-2">
              <Link
                href="/network/discovery/new"
                className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="size-4 text-sky-500" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t.dashboard.quickActions.newScan}
                  </span>
                </div>
                <ChevronRight className={`size-3.5 text-muted-foreground ${isAr ? 'rotate-180' : ''}`} />
              </Link>

              <Link
                href="/analytics"
                className="flex items-center justify-between p-3 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/15 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {t.dashboard.quickActions.viewAnalytics}
                  </span>
                </div>
                <ChevronRight className={`size-3.5 text-primary ${isAr ? 'rotate-180' : ''}`} />
              </Link>

              <Link
                href="/network/infrastructure"
                className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Server className="size-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t.dashboard.quickActions.addSwitch}
                  </span>
                </div>
                <ChevronRight className={`size-3.5 text-muted-foreground ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>

          {/* Active Directory Alignment Notice Card */}
          {stats.domain.workgroup > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="size-4 shrink-0" />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  {isAr ? 'تنبيه أمني: أجهزة خارج الدومين' : 'Security Notice: Unaligned Nodes'}
                </h4>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed">
                {isAr
                  ? `تم رصد ${stats.domain.workgroup} جهاز متصل بالشبكة بنمط Workgroup دون انضمام للدومين، مما يشكل ثغرة في تطبيق سياسات الأمان الموحدة.`
                  : `${stats.domain.workgroup} endpoints are operating in standalone Workgroup mode outside Active Directory domain trust.`}
              </p>

              <Link
                href="/devices?domain=WORKGROUP"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:underline pt-1"
              >
                <span>{isAr ? 'معاينة أجهزة Workgroup' : 'Inspect Workgroup Nodes'}</span>
                <ArrowRight className={`size-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          )}

          {/* Core System Engine Diagnostic */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                {isAr ? 'جاهزية السيرفر المحلي' : 'Server Engine Status'}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                HEALTHY
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database Engine:</span>
                <span className="text-foreground font-semibold">SQLite WAL (SSD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credential Vault:</span>
                <span className="text-emerald-500 font-semibold">AES-256 GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discovery Daemon:</span>
                <span className="text-foreground font-semibold">Online (pid: 14820)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notification Hub:</span>
                <span className="text-foreground font-semibold">Active Stream (SSE)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
