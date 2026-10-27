'use client';

import { motion } from 'framer-motion';
import {
  Server,
  Network,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Monitor,
  Terminal,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { type Language } from './landing-i18n';

interface HeroVisualProps {
  lang: Language;
}

export function HeroVisual({ lang }: HeroVisualProps) {
  return (
    <div className="relative mx-auto max-w-5xl mt-10">
      {/* Radiant Background Blur Glows */}
      <div className="absolute -top-12 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-96 rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />

      {/* Main Console Cockpit Frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative rounded-3xl border border-border/90 bg-card/70 p-4 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden"
      >
        {/* Top Window Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border/60 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-muted-foreground ml-1 hidden sm:inline-block">
              epm-core // console-v1.0 (Air-Gapped Edition)
            </span>
          </div>

          {/* Active Operator Avatar Pill */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-secondary/60 py-1 px-3">
            <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-primary via-indigo-600 to-cyan-400 text-[10px] font-bold text-white shadow-sm ring-1 ring-border">
              <span>MA</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
            </div>
            <div className="text-[10px] leading-tight text-start">
              <span className="font-bold text-foreground block">
                {lang === 'ar' ? 'محمود عادل (Lead Architect)' : 'Mahmoud Adel (Lead Architect)'}
              </span>
              <span className="text-[9px] text-emerald-500 font-bold block">
                SUPER_ADMIN • Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM OPTIMAL
            </span>
            <span className="text-[11px] text-muted-foreground hidden md:inline-block">
              WAL Mode • 0.00% Cloud Leaks
            </span>
          </div>
        </div>

        {/* Console Internal Dashboard Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Mini Left Column: Switch Port Telemetry (4 cols) */}
          <div className="md:col-span-5 rounded-2xl border border-border/80 bg-background/70 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground">Core-SW01 (Cisco 9300)</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold">24/24 UP</span>
            </div>

            {/* 16 Port LED Grid */}
            <div className="grid grid-cols-8 gap-1.5 pt-1">
              {Array.from({ length: 16 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-7 rounded border border-border/60 bg-secondary/50 flex flex-col items-center justify-center p-0.5"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      idx === 2 || idx === 7 || idx === 11
                        ? 'bg-amber-400 animate-led'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[8px] text-muted-foreground">P{idx + 1}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-secondary/60 p-2.5 text-[11px] space-y-1 text-foreground/90">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Correlated Port:</span>
                <strong className="text-primary font-bold">Gi1/0/3</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Endpoint:</span>
                <strong className="text-foreground">WS-ENG-CAD01</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP / MAC:</span>
                <span className="text-muted-foreground font-mono">10.0.20.42 • 70:85:c2</span>
              </div>
            </div>
          </div>

          {/* Mini Right Column: Live Subnet Sweep & Fleet Heartbeats (7 cols) */}
          <div className="md:col-span-7 rounded-2xl border border-border/80 bg-background/70 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-foreground">
                  {lang === 'ar' ? 'رادار الفحص وتدفق النبضات الحية' : 'Live Subnet Sweep & Telemetry'}
                </span>
              </div>
              <span className="text-[10px] text-primary font-bold">10.0.20.0/24</span>
            </div>

            {/* Subnet Sweep Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">ARP / ICMP Async Parallel Sweep</span>
                <span className="text-emerald-500 font-bold">100% Complete (42 Hosts Found)</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
            </div>

            {/* Live endpoint stream rows */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/50">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <strong className="text-foreground">SRV-DC01-PROD</strong>
                  <span className="text-[10px] text-muted-foreground">10.0.10.5</span>
                </span>
                <span className="text-emerald-500 font-semibold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  DOMAIN_CONTROLLER
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/50">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <strong className="text-foreground">WS-FIN-042</strong>
                  <span className="text-[10px] text-muted-foreground">10.0.20.88</span>
                </span>
                <span className="text-primary font-semibold text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                  WIN11_ENT (RAM: 11.2MB)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/50">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <strong className="text-foreground">ROGUE-DEVICE-MAC99</strong>
                  <span className="text-[10px] text-muted-foreground">10.0.20.199</span>
                </span>
                <span className="text-amber-500 font-semibold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                  UNMANAGED (PORT Gi1/0/12)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Mini Glass Badges for 3D realism */}
        <div className="hidden sm:flex absolute -bottom-5 right-8 rounded-2xl border border-emerald-500/40 bg-card/90 px-4 py-2.5 shadow-xl backdrop-blur-xl items-center gap-3 font-mono text-xs animate-float">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-foreground">100% Air-Gapped Validated</div>
            <div className="text-[10px] text-muted-foreground">Zero Cloud Egress • Local LAN Only</div>
          </div>
        </div>

        <div className="hidden sm:flex absolute -top-5 left-8 rounded-2xl border border-primary/40 bg-card/90 px-4 py-2.5 shadow-xl backdrop-blur-xl items-center gap-3 font-mono text-xs animate-float-delayed">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-foreground">C# Agent: 11.4 MB RAM</div>
            <div className="text-[10px] text-muted-foreground">0.03% CPU • Sub-second Response</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
