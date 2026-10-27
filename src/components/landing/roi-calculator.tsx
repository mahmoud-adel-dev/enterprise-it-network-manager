'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Clock, Zap, DollarSign, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type Language, i18n } from './landing-i18n';

interface RoiCalculatorProps {
  lang: Language;
}

export function RoiCalculator({ lang }: RoiCalculatorProps) {
  const t = i18n[lang];
  const [deviceCount, setDeviceCount] = useState<number>(350);

  // Dynamic calculations based on device count
  const hoursSavedPerMonth = Math.round(deviceCount * 0.42);
  const automatedDeployments = Math.round(deviceCount * 7.5);
  const annualSavingsUsd = Math.round(hoursSavedPerMonth * 40 * 12);

  return (
    <section id="calculator" className="py-20 border-t border-border/60 scroll-mt-16 bg-secondary/15 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-emerald-500">
            <Calculator className="h-3.5 w-3.5" />
            <span>{t.calculator.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {t.calculator.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.calculator.subtitle}
          </p>
        </motion.div>

        {/* Calculator Main Container */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-border/80 bg-card/70 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
          {/* Slider Controls */}
          <div className="space-y-4 pb-8 border-b border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label htmlFor="device-slider" className="text-sm sm:text-base font-bold text-foreground">
                {t.calculator.sliderLabel}
              </label>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary">{deviceCount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground font-semibold uppercase">{lang === 'ar' ? 'جهاز' : 'Endpoints'}</span>
              </div>
            </div>

            <div className="relative pt-2">
              <input
                id="device-slider"
                type="range"
                min="25"
                max="2500"
                step="25"
                value={deviceCount}
                onChange={(e) => setDeviceCount(Number(e.target.value))}
                className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] font-mono text-muted-foreground mt-2">
                <span>25 {lang === 'ar' ? 'جهاز (فرع)' : 'Devices'}</span>
                <span>500 {lang === 'ar' ? 'جهاز (متوسط)' : 'Devices'}</span>
                <span>1,500 {lang === 'ar' ? 'جهاز (مؤسسة)' : 'Devices'}</span>
                <span>2,500+ {lang === 'ar' ? 'جهاز (حرم كامل)' : 'Campus'}</span>
              </div>
            </div>
          </div>

          {/* Real-time Dynamic Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
            {/* Metric 1: Hours Saved */}
            <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary text-xs font-mono font-semibold">
                <Clock className="h-4 w-4" />
                <span>{t.calculator.metricHours}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                {hoursSavedPerMonth.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{lang === 'ar' ? 'ساعة' : 'hrs'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t.calculator.metricHoursDesc}
              </p>
            </div>

            {/* Metric 2: MTTR Speedup */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono font-semibold">
                <Zap className="h-4 w-4" />
                <span>{t.calculator.metricMttr}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-500">
                {t.calculator.metricMttrTo}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {lang === 'ar' ? `بدلاً من ${t.calculator.metricMttrFrom} في البحث اليدوي` : `Reduced from ${t.calculator.metricMttrFrom}`}
              </p>
            </div>

            {/* Metric 3: Automated Deployments */}
            <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-sky-500 text-xs font-mono font-semibold">
                <TrendingUp className="h-4 w-4" />
                <span>{t.calculator.metricDeployments}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                {automatedDeployments.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t.calculator.metricDeploymentsDesc}
              </p>
            </div>

            {/* Metric 4: Estimated Cost Savings */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary text-xs font-mono font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>{t.calculator.metricCost}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-primary">
                ${annualSavingsUsd.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t.calculator.metricCostDesc}
              </p>
            </div>
          </div>

          {/* Quick Highlight Guarantee */}
          <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {lang === 'ar' ? 'تشغيل ذاتي بدون تراخيص شهرية متكررة للأجهزة' : 'Self-hosted with zero per-endpoint monthly SaaS fees'}
            </span>
            <span>SQLite WAL • 100% On-Premises</span>
          </div>
        </div>
      </div>
    </section>
  );
}
