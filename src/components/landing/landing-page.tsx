'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Network,
  Shield,
  Activity,
  Layers,
  ArrowRight,
  ChevronRight,
  Lock,
  Database,
  Cpu,
  Workflow,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Terminal,
  ShieldCheck,
  FileText,
  Key,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { type Language, i18n } from './landing-i18n';
import { InteractiveShowcase } from './interactive-showcase';
import { AgentInstallSnippet } from './terminal-demo';

interface LandingPageProps {
  isAuthenticated: boolean;
  userName?: string | null;
  setupDone: boolean;
}

export function LandingPage({ isAuthenticated, userName, setupDone }: LandingPageProps) {
  const [lang, setLang] = useState<Language>('ar');
  const t = i18n[lang];

  // Set page direction according to selected language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className={`min-h-screen bg-background text-foreground selection:bg-primary/20 ${lang === 'ar' ? 'font-sans' : ''}`}>
      {/* 1. Top Setup Warning Banner (if setup incomplete) */}
      {!setupDone && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs font-mono text-amber-500 flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{t.setupAlert}</span>
          <Link
            href="/setup"
            className="underline font-bold hover:text-amber-400 ml-2"
          >
            {t.setupAction} &rarr;
          </Link>
        </div>
      )}

      {/* 2. Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary shadow-sm group-hover:bg-primary/20 transition-colors">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
                  Endpoint Manager
                </span>
                <span className="hidden sm:inline-block rounded border border-border/80 bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-none">
                {lang === 'ar' ? 'البنية التحتية والشبكات المؤسسية' : 'Enterprise Infrastructure Core'}
              </p>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#showcase" className="hover:text-foreground transition-colors">
              {t.nav.showcase}
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              {t.nav.architecture}
            </a>
            <a href="#deployment" className="hover:text-foreground transition-colors">
              {t.nav.deployment}
            </a>
            <a href="#specs" className="hover:text-foreground transition-colors">
              {t.nav.specs}
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/60 px-2.5 py-1.5 font-mono text-xs text-foreground hover:bg-secondary transition-colors"
              title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>{lang === 'ar' ? 'EN' : 'العربية'}</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Console Auth Button */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 font-mono text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                <span>{t.dashboardCta}</span>
                <ArrowRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 font-mono text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                <span>{t.primaryCta}</span>
                <ArrowRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Industrial Engineering Density) */}
      <section className="relative pt-12 pb-16 overflow-hidden border-b border-border/60">
        {/* Fine Technical Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Operational Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{t.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              {t.titleMain}{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-sky-500 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t.heroSubtitle}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={isAuthenticated ? '/dashboard' : '/login'}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAuthenticated ? t.dashboardCta : t.primaryCta}</span>
                <ArrowRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>

              <a
                href="#showcase"
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/80 px-6 py-3 font-mono text-sm font-semibold text-foreground hover:bg-secondary transition-all"
              >
                <Activity className="h-4 w-4 text-primary" />
                <span>{t.secondaryCta}</span>
              </a>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 border-t border-border/60">
              <div className="rounded-xl border border-border/70 bg-card/40 p-3.5 backdrop-blur-sm">
                <div className="font-mono text-lg sm:text-xl font-bold text-foreground">
                  {t.metrics.discoverySpeed}
                </div>
                <div className="text-[11px] text-muted-foreground">{t.metrics.discoveryLabel}</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/40 p-3.5 backdrop-blur-sm">
                <div className="font-mono text-lg sm:text-xl font-bold text-emerald-500">
                  {t.metrics.airgapped}
                </div>
                <div className="text-[11px] text-muted-foreground">{t.metrics.airgappedLabel}</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/40 p-3.5 backdrop-blur-sm">
                <div className="font-mono text-lg sm:text-xl font-bold text-foreground">
                  {t.metrics.agentFootprint}
                </div>
                <div className="text-[11px] text-muted-foreground">{t.metrics.agentLabel}</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/40 p-3.5 backdrop-blur-sm">
                <div className="font-mono text-lg sm:text-xl font-bold text-primary">
                  {t.metrics.encryption}
                </div>
                <div className="text-[11px] text-muted-foreground">{t.metrics.encryptionLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Live Showcase Centerpiece */}
      <InteractiveShowcase lang={lang} />

      {/* 5. Core Architecture & Subsystems Deep-Dive */}
      <section id="architecture" className="py-16 border-t border-border/60 scroll-mt-16 bg-secondary/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary mb-3">
              {t.pillars.tag}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t.pillars.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t.pillars.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1: Layer-2/3 Network Topology */}
            <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8 space-y-4 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Network className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.pillars.p1Title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.pillars.p1Desc}
              </p>
              <ul className="space-y-2 pt-2 border-t border-border/60 text-xs font-mono">
                {t.pillars.p1Points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 2: Fleet Telemetry & Lifecycle */}
            <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8 space-y-4 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Monitor className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.pillars.p2Title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.pillars.p2Desc}
              </p>
              <ul className="space-y-2 pt-2 border-t border-border/60 text-xs font-mono">
                {t.pillars.p2Points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 3: Active Directory Alignment */}
            <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8 space-y-4 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.pillars.p3Title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.pillars.p3Desc}
              </p>
              <ul className="space-y-2 pt-2 border-t border-border/60 text-xs font-mono">
                {t.pillars.p3Points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 4: Silent Software Packaging & Ring Deployments */}
            <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8 space-y-4 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Workflow className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.pillars.p4Title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.pillars.p4Desc}
              </p>
              <ul className="space-y-2 pt-2 border-t border-border/60 text-xs font-mono">
                {t.pillars.p4Points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Fleet Agent Deployment Section */}
      <section id="deployment" className="py-16 border-t border-border/60 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary mb-3">
              {t.install.tag}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t.install.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t.install.subtitle}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AgentInstallSnippet lang={lang} />
          </div>
        </div>
      </section>

      {/* 7. Enterprise Air-Gapped & Security Specifications Table */}
      <section id="specs" className="py-16 border-t border-border/60 scroll-mt-16 bg-secondary/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary mb-3">
              {t.specs.tag}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t.specs.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t.specs.subtitle}
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto rounded-2xl border border-border/80 bg-card/60 shadow-xl backdrop-blur-md">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-border/80 bg-secondary/50 text-[11px] text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">{t.specs.colFeature}</th>
                  <th className="py-3.5 px-5">{t.specs.colSpec}</th>
                  <th className="py-3.5 px-5">{t.specs.colAdvantage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {t.specs.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-foreground">{row.param}</td>
                    <td className="py-3.5 px-5 text-primary">{row.spec}</td>
                    <td className="py-3.5 px-5 text-muted-foreground">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. Live System Status Bar */}
      <div className="border-t border-border/80 bg-card/40 py-3 px-4 font-mono text-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-foreground font-medium">{t.footer.systemStatus}</span>
            </span>
            <span className="hidden sm:inline-block text-border">|</span>
            <span className="hidden sm:inline-block text-muted-foreground">
              DB: SQLite (WAL Mode) • Fast SSD Local
            </span>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Daemon: Worker Pool Online</span>
            <span>Security: AES-256 GCM</span>
          </div>
        </div>
      </div>

      {/* 9. Industrial Enterprise Footer */}
      <footer className="border-t border-border/80 bg-background/95 py-12 text-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border/60">
            {/* Col 1: Brand Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 border border-primary/20 text-primary">
                  <Server className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-foreground">Endpoint Manager</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                {t.footer.desc}
              </p>
              <div className="inline-block rounded border border-border/70 bg-secondary/50 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {t.footer.localDeployment}
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <div className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider">
                {lang === 'ar' ? 'بوابات النظام' : 'Console Portals'}
              </div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'لوحة المراقبة الرئيسية' : 'Operational Dashboard'}
                  </Link>
                </li>
                <li>
                  <Link href="/devices" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'إدارة أجهزة الأسطول' : 'Fleet Device Inventory'}
                  </Link>
                </li>
                <li>
                  <Link href="/network/infrastructure" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'أجهزة الشبكة والسويتشات' : 'Switch & Infrastructure'}
                  </Link>
                </li>
                <li>
                  <Link href="/active-directory/configuration" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'إعدادات الدليل النشط (AD)' : 'Active Directory Sync'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Operations & Compliance */}
            <div className="space-y-2">
              <div className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider">
                {lang === 'ar' ? 'التدقيق والأمان' : 'Security & Audit'}
              </div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link href="/audit" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'سجل العمليات والتدقيق' : 'Immutable Audit Log'}
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'تقارير الامتثال المؤسسي' : 'Compliance Reports'}
                  </Link>
                </li>
                <li>
                  <Link href="/network/discovery" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'رادار استكشاف الشبكة' : 'Subnet Discovery Run'}
                  </Link>
                </li>
                <li>
                  <Link href="/admin/system-health" className="hover:text-foreground transition-colors">
                    {lang === 'ar' ? 'مؤشرات كفاءة السيرفر' : 'System Health Monitor'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-muted-foreground font-mono text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} Endpoint Manager. {t.footer.allRights}
            </div>
            <div>
              v1.0.0 Enterprise Edition • Local Air-Gapped Network
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
