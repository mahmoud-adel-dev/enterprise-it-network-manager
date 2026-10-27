'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Globe,
  Menu,
  X,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Terminal,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandLogo } from '@/components/common/brand-logo';
import { type Language, i18n } from './landing-i18n';

interface LandingNavbarProps {
  lang: Language;
  onToggleLang: () => void;
  isAuthenticated: boolean;
  setupDone: boolean;
}

export function LandingNavbar({
  lang,
  onToggleLang,
  isAuthenticated,
  setupDone,
}: LandingNavbarProps) {
  const t = i18n[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#showcase', label: t.nav.showcase, icon: Activity },
    { href: '#features', label: lang === 'ar' ? 'المزايا المؤسسية' : 'Core Features', icon: Shield },
    { href: '#calculator', label: lang === 'ar' ? 'حاسبة التوفير' : 'Fleet ROI', icon: Calculator },
    { href: '#architecture', label: t.nav.architecture, icon: Layers },
    { href: '#deployment', label: t.nav.deployment, icon: Terminal },
    { href: '#faq', label: lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', icon: HelpCircle },
    { href: '#specs', label: t.nav.specs, icon: Server },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <BrandLogo size={36} withGlow />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
                Endpoint Manager
              </span>
              <span className="hidden sm:inline-block rounded-md border border-border/80 bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                v1.0 ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-none">
              {lang === 'ar' ? 'منظومة إدارة الشبكات والأجهزة المحلية' : 'Enterprise Infrastructure Core'}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-muted-foreground">
          {navLinks.slice(0, 5).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors hover:scale-105"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#faq"
            className="hover:text-foreground transition-colors hover:scale-105"
          >
            {lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Switcher Button */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground hover:bg-secondary transition-all"
            title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{lang === 'ar' ? 'EN' : 'العربية'}</span>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Primary CTA Button (Desktop) */}
          <div className="hidden sm:block">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t.dashboardCta}</span>
                <ArrowRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t.primaryCta}</span>
                <ArrowRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden items-center justify-center h-9 w-9 rounded-xl border border-border/80 bg-secondary/60 text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer (Framer Motion Animated) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-b border-border/80 bg-background/95 backdrop-blur-2xl overflow-hidden px-4 py-6 space-y-4"
          >
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/70 text-sm font-semibold text-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </nav>

            {/* Mobile Auth Button */}
            <div className="pt-4 border-t border-border/60">
              <Link
                href={isAuthenticated ? '/dashboard' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-mono text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
              >
                <span>{isAuthenticated ? t.dashboardCta : t.primaryCta}</span>
                <ArrowRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
