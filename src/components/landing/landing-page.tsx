'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Network,
  Shield,
  Activity,
  Layers,
  ArrowRight,
  ChevronUp,
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
  Zap,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/brand-logo';
import { type Language, i18n } from './landing-i18n';
import { LandingNavbar } from './landing-navbar';
import { HeroVisual } from './hero-visual';
import { InteractiveShowcase } from './interactive-showcase';
import { BentoFeatures } from './bento-features';
import { RoiCalculator } from './roi-calculator';
import { ArchitectureFlow } from './architecture-flow';
import { FaqSection } from './faq-section';
import { AgentInstallSnippet } from './terminal-demo';
import { PlexusBackground } from './plexus-background';

interface LandingPageProps {
  isAuthenticated: boolean;
  userName?: string | null;
  setupDone: boolean;
}

export function LandingPage({ isAuthenticated, userName, setupDone }: LandingPageProps) {
  const [lang, setLang] = useState<Language>('ar');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const t = i18n[lang];

  // Set page direction according to selected language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('lang', lang);
    } catch {}
  }, [lang]);

  // Monitor scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      {/* 2. Responsive Sticky Glass Navbar with Mobile Drawer */}
      <LandingNavbar
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        isAuthenticated={isAuthenticated}
        setupDone={setupDone}
      />

      {/* 3. Hero Section (Industrial Engineering Density + Modern SaaS Aesthetics) */}
      <section className="relative pt-14 sm:pt-20 pb-24 overflow-hidden border-b border-border/80 bg-gradient-to-b from-background via-card/25 to-background shadow-[inset_0_-20px_50px_rgba(0,0,0,0.06)]">
        {/* Luminous Top Spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-gradient-to-b from-primary/15 via-indigo-500/5 to-transparent blur-3xl pointer-events-none z-0" />

        {/* Vector Plexus Network Illustration Backdrop (matching user design) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 bg-center bg-no-repeat bg-cover z-0"
          style={{
            backgroundImage: `url('/images/network-plexus.svg')`,
          }}
        />

        {/* Animated Interactive Plexus Canvas (moving nodes & dynamic connecting lines) */}
        <PlexusBackground />

        {/* Fine Technical Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] z-0"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Operational Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs font-bold text-emerald-500 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{t.badge}</span>
            </motion.div>

            {/* Main Headline with Shimmering Gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.18]"
            >
              {t.titleMain}{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            >
              {t.heroSubtitle}
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
            >
              <Link
                href={isAuthenticated ? '/dashboard' : '/login'}
                className="flex items-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 font-mono text-sm font-bold text-primary-foreground shadow-xl hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                <span>{isAuthenticated ? t.dashboardCta : t.primaryCta}</span>
                <ArrowRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>

              <a
                href="#showcase"
                className="flex items-center gap-2 rounded-2xl border border-border/80 bg-secondary/80 px-6 py-3.5 font-mono text-sm font-bold text-foreground hover:bg-secondary transition-all hover:scale-[1.02]"
              >
                <Activity className="h-4 w-4 text-primary" />
                <span>{t.secondaryCta}</span>
              </a>
            </motion.div>

            {/* Operator & Customer Avatar Proof Stack */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
            >
              <div className="flex -space-x-2.5 rtl:space-x-reverse">
                {/* Avatar 1: Mahmoud Adel */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary via-indigo-600 to-cyan-400 text-xs font-bold text-white ring-2 ring-background shadow-md"
                  title="محمود عادل (Chief Architect)"
                >
                  MA
                </div>
                {/* Avatar 2: Network Admin */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-xs font-bold text-white ring-2 ring-background shadow-md"
                  title="مهندس بنية تحتية"
                >
                  NA
                </div>
                {/* Avatar 3: SysAdmin */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-xs font-bold text-white ring-2 ring-background shadow-md"
                  title="مسؤول خوادم ودومين"
                >
                  SA
                </div>
                {/* Avatar 4: SecOps */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 text-xs font-bold text-white ring-2 ring-background shadow-md"
                  title="أمن الشبكات والمعلومات"
                >
                  SO
                </div>
                {/* Avatar 5: Counter */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border/80 text-[11px] font-bold text-foreground ring-2 ring-background shadow-md"
                >
                  +500
                </div>
              </div>

              <div className="text-start rtl:text-right text-xs">
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  {'★'.repeat(5)}
                  <span className="font-bold text-foreground ml-1 rtl:ml-0 rtl:mr-1 font-mono">5.0</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  {t.footer.heroProofText}
                </div>
              </div>
            </motion.div>

            {/* Quick Metrics Ribbon */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-8 border-t border-border/60"
            >
              <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm hover:border-primary/40 transition-colors">
                <div className="font-mono text-lg sm:text-xl font-bold text-foreground">
                  {t.metrics.discoverySpeed}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.metrics.discoveryLabel}</div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
                <div className="font-mono text-lg sm:text-xl font-bold text-emerald-500">
                  {t.metrics.airgapped}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.metrics.airgappedLabel}</div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm hover:border-sky-500/40 transition-colors">
                <div className="font-mono text-lg sm:text-xl font-bold text-foreground">
                  {t.metrics.agentFootprint}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.metrics.agentLabel}</div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm hover:border-primary/40 transition-colors">
                <div className="font-mono text-lg sm:text-xl font-bold text-primary">
                  {t.metrics.encryption}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.metrics.encryptionLabel}</div>
              </div>
            </motion.div>
          </div>

          {/* 3D High-Fidelity Hero Cockpit Visual */}
          <HeroVisual lang={lang} />
        </div>
      </section>

      {/* 4. Interactive Live Showcase Simulator */}
      <InteractiveShowcase lang={lang} />

      {/* 5. Modern Enterprise Bento Grid */}
      <BentoFeatures lang={lang} />

      {/* 6. Dynamic ROI & Fleet Efficiency Calculator */}
      <RoiCalculator lang={lang} />

      {/* 7. Interactive LAN Architecture Flow */}
      <ArchitectureFlow lang={lang} />

      {/* 8. Fleet Agent Deployment Section */}
      <section id="deployment" className="py-20 border-t border-border/60 scroll-mt-16 bg-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 font-mono text-xs font-semibold text-primary mb-3">
              <Terminal className="h-3.5 w-3.5" />
              <span>{t.install.tag}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t.install.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t.install.subtitle}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AgentInstallSnippet lang={lang} />
          </div>
        </div>
      </section>

      {/* 9. Technical FAQ Accordion Section */}
      <FaqSection lang={lang} />

      {/* 10. Enterprise Air-Gapped & Security Specifications Table */}
      <section id="specs" className="py-20 border-t border-border/60 scroll-mt-16 bg-secondary/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 font-mono text-xs font-semibold text-primary mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t.specs.tag}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t.specs.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t.specs.subtitle}
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto rounded-3xl border border-border/80 bg-card/60 shadow-2xl backdrop-blur-md">
            <table className="w-full text-start font-mono text-xs">
              <thead className="border-b border-border/80 bg-secondary/60 text-[11px] text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-start">{t.specs.colFeature}</th>
                  <th className="py-4 px-6 text-start">{t.specs.colSpec}</th>
                  <th className="py-4 px-6 text-start">{t.specs.colAdvantage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {t.specs.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-foreground">{row.param}</td>
                    <td className="py-4 px-6 text-primary">{row.spec}</td>
                    <td className="py-4 px-6 text-muted-foreground leading-relaxed">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 11. Live System Status Bar */}
      <div className="border-t border-border/80 bg-card/50 py-3.5 px-4 font-mono text-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-foreground font-semibold">{t.footer.systemStatus}</span>
            </span>
            <span className="hidden sm:inline-block text-border">|</span>
            <span className="hidden sm:inline-block text-muted-foreground">
              Database: SQLite 3 (WAL Mode Enabled) • Ultra-Fast SSD
            </span>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Daemon: Worker Pool Active</span>
            <span className="text-emerald-500 font-bold">100% Air-Gapped Verified</span>
          </div>
        </div>
      </div>

      {/* 12. Industrial Enterprise Footer */}
      <footer className="border-t border-border/80 bg-background/95 py-16 text-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-border/60">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <BrandLogo size={36} withGlow />
                <div>
                  <span className="font-extrabold text-base text-foreground block">Endpoint Manager</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Enterprise Fleet & Network Core</span>
                </div>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                {t.footer.desc}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/50 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{t.footer.localDeployment}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] text-primary font-bold">
                  <span>هندسة وتطوير: محمود عادل</span>
                </div>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <div className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider">
                {lang === 'ar' ? 'بوابات النظام' : 'Console Portals'}
              </div>
              <ul className="space-y-2 text-muted-foreground">
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
            <div className="space-y-3">
              <div className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider">
                {lang === 'ar' ? 'التدقيق والأمان' : 'Security & Audit'}
              </div>
              <ul className="space-y-2 text-muted-foreground">
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

          {/* Bottom Copyright & Contact Banner */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground text-center sm:text-start">
              <span>&copy; {new Date().getFullYear()}</span>
              <span>{lang === 'ar' ? 'جميع الحقوق محفوظة لدى محمود عادل 2026' : 'All rights reserved to Mahmoud Adel 2026'}</span>
              <span>-</span>
              <a
                href="tel:01002840633"
                className="font-mono text-primary hover:underline font-extrabold inline-flex items-center gap-1"
                title="اتصال مباشر"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>01002840633</span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/201002840633"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all hover:scale-105"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'واتساب: 01002840633' : 'WhatsApp: 01002840633'}</span>
              </a>
              <span className="text-muted-foreground font-mono text-[11px] hidden md:inline-block">
                v1.0.0 Enterprise • 100% On-Premises Air-Gapped
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back-To-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-card/90 text-foreground shadow-2xl backdrop-blur-xl hover:bg-secondary hover:border-primary/50 transition-all active:scale-95"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-5 w-5 text-primary" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
