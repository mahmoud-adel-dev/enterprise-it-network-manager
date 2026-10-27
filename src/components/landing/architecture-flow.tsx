'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Network,
  Shield,
  Layers,
  Database,
  Monitor,
  CheckCircle2,
  Lock,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { type Language, i18n } from './landing-i18n';

interface ArchitectureFlowProps {
  lang: Language;
}

export function ArchitectureFlow({ lang }: ArchitectureFlowProps) {
  const t = i18n[lang];
  const [selectedNode, setSelectedNode] = useState<'endpoints' | 'switches' | 'core' | 'ad' | 'db'>('core');

  const nodes = [
    {
      id: 'endpoints' as const,
      name: t.architectureFlow.nodeEndpoints,
      desc: t.architectureFlow.nodeEndpointsDesc,
      icon: Monitor,
      protocol: 'TLS 1.3 (Port 443 / 8080)',
      security: 'Mutual Certificate Auth + SHA-256 Checksums',
      details: lang === 'ar' 
        ? 'العميل الأصيل يقوم بجمع مؤشرات العتاد، والبرامج المثبتة، وعنوان الماك الفيزيائي وإرسالها كل 60 ثانية بحزمة خفيفة جداً.'
        : 'Native lightweight C# service collecting hardware, OS build, logged-in user, and MAC address every 60s.',
    },
    {
      id: 'switches' as const,
      name: t.architectureFlow.nodeSwitches,
      desc: t.architectureFlow.nodeSwitchesDesc,
      icon: Network,
      protocol: 'SNMPv2c / SNMPv3 USM + LLDP',
      security: 'AES-128 / SHA Privacy Community Encryption',
      details: lang === 'ar'
        ? 'استعلام دوري لقراءة جداول الـ Bridge MIB وجداول MAC Address Table لمطابقة كل كابل فيزيائي مع الجهاز المتصل به.'
        : 'Continuous polling of Bridge MIB and dot1dTpFdbTable to map each physical switch port to connected workstation MAC.',
    },
    {
      id: 'core' as const,
      name: t.architectureFlow.nodeCore,
      desc: t.architectureFlow.nodeCoreDesc,
      icon: Server,
      protocol: 'Next.js 16 + Fast Local Daemon',
      security: 'Role-Based Access Control (RBAC) + Bcrypt 12',
      details: lang === 'ar'
        ? 'محرك المعالجة المركزي الذي يدير الأجهزة، ويطلق مسح الشبكات المتوازي، وينسق عمليات التوزيع ويوثق سجلات التدقيق.'
        : 'The central orchestration brain coordinating subnet sweeps, switch correlation, deployment rings, and security audits.',
    },
    {
      id: 'ad' as const,
      name: t.architectureFlow.nodeAd,
      desc: t.architectureFlow.nodeAdDesc,
      icon: Shield,
      protocol: 'LDAPS (Port 636) / Kerberos',
      security: 'Zero Schema Modification Required',
      details: lang === 'ar'
        ? 'مزامنة مباشرة مع الدليل النشط Active Directory لمطابقة الأجهزة مع الـ OU المناسبة والكشف الفوري عن أي أجهزة غريبة (Rogue).'
        : 'Direct secure LDAP query to discover domain computer accounts, OU structure, and instantly flag rogue workgroup PCs.',
    },
    {
      id: 'db' as const,
      name: t.architectureFlow.nodeDb,
      desc: t.architectureFlow.nodeDbDesc,
      icon: Database,
      protocol: 'SQLite Write-Ahead Logging (WAL)',
      security: 'Local Encrypted Disk + Automatic Snapshot Backups',
      details: lang === 'ar'
        ? 'محرك بيانات فائق السرعة وموثوق لا يتطلب خوادم خارجية، يعمل بنمط WAL لقراءة وكتابة متزامنة حتى 10,000 عملية/ثانية.'
        : 'High-throughput embedded database running in WAL mode with memory-mapped I/O, supporting thousands of concurrent reads.',
    },
  ];

  const activeNodeData = nodes.find((n) => n.id === selectedNode) ?? nodes[2];

  return (
    <section id="architecture" className="py-20 border-t border-border/60 scroll-mt-16 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-mono font-semibold text-primary">
            <Layers className="h-3.5 w-3.5" />
            <span>{t.architectureFlow.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {t.architectureFlow.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.architectureFlow.subtitle}
          </p>
        </motion.div>

        {/* Interactive Architecture Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-6xl mx-auto">
          {/* Left: Node Selector Cockpit (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {nodes.map((node) => {
              const Icon = node.icon;
              const isSelected = selectedNode === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(node.id)}
                  className={`w-full text-start p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg scale-[1.01]'
                      : 'border-border/70 bg-card/50 hover:bg-card hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                        isSelected
                          ? 'border-primary/40 bg-primary text-primary-foreground'
                          : 'border-border/80 bg-secondary/80 text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-foreground">{node.name}</span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{node.desc}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end text-xs font-mono shrink-0">
                    <span className="text-primary font-semibold">{node.protocol}</span>
                    <span className="text-[10px] text-muted-foreground">Click to inspect</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Inspection Card (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-primary/30 bg-card/80 p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary">
                <activeNodeData.icon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Node Diagnostics</span>
                <h3 className="text-lg font-bold text-foreground">{activeNodeData.name}</h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {activeNodeData.details}
            </p>

            <div className="space-y-3 pt-2 text-xs font-mono">
              <div className="rounded-xl border border-border/80 bg-background/80 p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Transport Protocol</span>
                <div className="font-bold text-primary">{activeNodeData.protocol}</div>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/80 p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Security Baseline</span>
                <div className="font-bold text-emerald-500">{activeNodeData.security}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Air-Gapped Validated
              </span>
              <span>100% On-Premises</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
