'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Network,
  Cpu,
  Layers,
  Workflow,
  Lock,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { type Language, i18n } from './landing-i18n';

interface BentoFeaturesProps {
  lang: Language;
}

export function BentoFeatures({ lang }: BentoFeaturesProps) {
  const t = i18n[lang];
  const [activePort, setActivePort] = useState<number>(3);
  const [isTestPassed, setIsTestPassed] = useState(true);

  return (
    <section id="features" className="py-20 border-t border-border/60 scroll-mt-16 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-mono font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" />
            <span>{t.bento.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {t.bento.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.bento.subtitle}
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-5">
          {/* Card 1: 100% Air-Gapped (Col span 7) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="space-y-3 z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-emerald-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.bento.f1Badge}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  No Internet Required
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {t.bento.f1Title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {t.bento.f1Desc}
              </p>
            </div>

            {/* Interactive Air-Gapped Status Simulator */}
            <div className="mt-8 pt-6 border-t border-border/60 z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 text-center">
                <div className="text-[11px] text-muted-foreground font-mono">External Cloud Traffic</div>
                <div className="text-base font-mono font-bold text-emerald-500 mt-1">0.00 KB/s (BLOCKED)</div>
              </div>
              <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 text-center">
                <div className="text-[11px] text-muted-foreground font-mono">LAN Encryption</div>
                <div className="text-base font-mono font-bold text-primary mt-1">TLS 1.3 / AES-256</div>
              </div>
              <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 text-center">
                <div className="text-[11px] text-muted-foreground font-mono">Local Persistence</div>
                <div className="text-base font-mono font-bold text-foreground mt-1">SQLite WAL SSD</div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Switch Port Correlation (Col span 5) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all duration-300"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono font-semibold text-primary">
                <Network className="h-3.5 w-3.5" />
                {t.bento.f2Badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {t.bento.f2Title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.bento.f2Desc}
              </p>
            </div>

            {/* Interactive Mini Switch Mockup */}
            <div className="mt-6 rounded-2xl border border-border/80 bg-background/80 p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Core-SW01 • Port #{activePort}</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LINK UP (1 Gbps)
                </span>
              </div>
              {/* 8 mini ports */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((port) => (
                  <button
                    key={port}
                    type="button"
                    onClick={() => setActivePort(port)}
                    className={`h-8 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                      activePort === port
                        ? 'border-primary bg-primary/20 text-primary shadow-sm scale-105'
                        : 'border-border/70 bg-secondary/40 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mb-0.5" />
                    <span className="text-[9px] font-bold">P{port}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-lg bg-secondary/50 p-2 text-[10px] text-foreground/90 space-y-0.5">
                <div>Host: <strong className="text-primary font-bold">WS-ENG-0{activePort}.corp.local</strong></div>
                <div>MAC: <span className="text-muted-foreground">70:85:c2:51:9b:0{activePort}</span> • VLAN: <strong>VLAN 20 (Engineering)</strong></div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Featherlight C# Agent (Col span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-4 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between group hover:border-sky-500/50 transition-all duration-300"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-sky-500">
                <Cpu className="h-3.5 w-3.5" />
                {t.bento.f3Badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {t.bento.f3Title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.bento.f3Desc}
              </p>
            </div>

            {/* Performance telemetry widget */}
            <div className="mt-6 rounded-2xl border border-border/80 bg-background/80 p-4 space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">RAM Footprint</span>
                  <span className="font-bold text-sky-500">11.8 MB (0.07%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full w-[8%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">CPU Overhead</span>
                  <span className="font-bold text-emerald-500">0.03% Idle</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[3%]" />
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 text-center">
                .NET 8.0 AOT Compilation • Zero JVM/V8 Bloat
              </div>
            </div>
          </motion.div>

          {/* Card 4: Active Directory Integration (Col span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-300"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-indigo-500">
                <Layers className="h-3.5 w-3.5" />
                {t.bento.f4Badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {t.bento.f4Title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.bento.f4Desc}
              </p>
            </div>

            {/* AD OU Preview */}
            <div className="mt-6 rounded-2xl border border-border/80 bg-background/80 p-3.5 font-mono text-xs space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-[11px]">
                <Server className="h-3.5 w-3.5 text-indigo-500" />
                <span>DC01.CORP.LOCAL</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1 rounded">SYNCED</span>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground pl-3 border-l border-border/80 rtl:pl-0 rtl:pr-3 rtl:border-l-0 rtl:border-r">
                <div className="text-foreground">📁 OU=Corporate_Devices</div>
                <div className="pl-3 rtl:pl-0 rtl:pr-3">├── 💻 OU=Laptops (218 PCs)</div>
                <div className="pl-3 rtl:pl-0 rtl:pr-3">├── 🖥️ OU=Workstations (340 PCs)</div>
                <div className="pl-3 rtl:pl-0 rtl:pr-3 text-emerald-500 font-bold">└── 🔒 Rogue Device Auto-Detection: ON</div>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Staged Deployment Rings (Col span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="lg:col-span-4 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between group hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-amber-500">
                <Workflow className="h-3.5 w-3.5" />
                {t.bento.f5Badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {t.bento.f5Title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.bento.f5Desc}
              </p>
            </div>

            {/* Canary Rings Progress Bar */}
            <div className="mt-6 rounded-2xl border border-border/80 bg-background/80 p-3.5 font-mono text-xs space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Ring 0: IT Lab</span>
                <span className="text-emerald-500 font-bold">100% Passed</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Ring 1: Pilot Dept</span>
                <span className="text-emerald-500 font-bold">100% Passed</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-foreground font-semibold">Ring 2: Production Fleet</span>
                <span className="text-primary font-bold">92% In Progress</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[92%]" />
              </div>
            </div>
          </motion.div>

          {/* Card 6: Forensic Audit Trail (Col span 12) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-12 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/50 transition-all duration-300"
          >
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono font-semibold text-primary">
                <Lock className="h-3.5 w-3.5" />
                {t.bento.f6Badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {t.bento.f6Title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.bento.f6Desc}
              </p>
            </div>

            {/* Live Audit Log Ticker */}
            <div className="w-full md:w-auto flex-1 max-w-xl rounded-2xl border border-border/80 bg-black/60 text-emerald-400 p-4 font-mono text-xs space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-white/10 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  IMMUTABLE AUDIT LEDGER (SHA-256)
                </span>
                <span className="text-emerald-400 font-bold">VERIFIED SEAL</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="truncate"><span className="text-muted-foreground">[15:16:47]</span> <span className="text-sky-400">admin@10.0.10.5</span>: USER_CREATED <strong className="text-white">mem1 (SUPER_ADMIN)</strong></div>
                <div className="truncate"><span className="text-muted-foreground">[15:08:22]</span> <span className="text-sky-400">core-daemon</span>: SWEEP_COMPLETED <strong className="text-white">10.0.20.0/24 (42 hosts discovered)</strong></div>
                <div className="truncate"><span className="text-muted-foreground">[15:01:05]</span> <span className="text-sky-400">system</span>: DB_SNAPSHOT_WAL <strong className="text-white">endpoint-manager.sqlite (Hash: a49f...8b2)</strong></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
