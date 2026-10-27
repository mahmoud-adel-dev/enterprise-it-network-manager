import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export function BrandLogo({ size = 36, className = '', withGlow = true }: BrandLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary via-indigo-500 to-cyan-400 opacity-60 blur-[8px] pointer-events-none"
          style={{ width: size, height: size }}
        />
      )}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 select-none drop-shadow-md"
      >
        <defs>
          <linearGradient id="logo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="logo-accent-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Shield Container */}
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logo-bg-grad)" />
        <rect x="4" y="4" width="56" height="56" rx="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

        {/* Top Node */}
        <circle cx="32" cy="18" r="4.5" fill="#ffffff" />
        {/* Bottom Left Node */}
        <circle cx="19" cy="42" r="4.5" fill="#ffffff" />
        {/* Bottom Right Node */}
        <circle cx="45" cy="42" r="4.5" fill="#ffffff" />

        {/* Core Center Hub */}
        <circle cx="32" cy="33" r="6.5" fill="url(#logo-accent-grad)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="32" cy="33" r="2.5" fill="#ffffff" />

        {/* Interconnecting Circuit Lines */}
        <path d="M32 22.5 L32 26.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22.5 39.5 L27 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M41.5 39.5 L37 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M23.5 42 L40.5 42" stroke="rgba(255,255,255,0.7)" strokeWidth="1.75" strokeDasharray="2 2" strokeLinecap="round" />

        {/* Live Status Indicator Node */}
        <circle cx="50" cy="14" r="3.5" fill="#10b981" />
        <circle cx="50" cy="14" r="5" stroke="#10b981" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}
