'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Globe } from 'lucide-react';
import { type Language, dashboardTranslations } from './translations';

interface LanguageContextType {
  lang: Language;
  language: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: typeof dashboardTranslations['ar'];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLang(): Language {
  if (typeof window === 'undefined') return 'ar';
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {}
  return 'ar';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('lang', newLang);
    } catch {}
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const toggleLang = useCallback(() => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
  }, [lang, setLang]);

  const value = {
    lang,
    language: lang,
    setLang,
    toggleLang,
    t: dashboardTranslations[lang],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider (e.g. static tests)
    return {
      lang: 'ar',
      language: 'ar',
      setLang: () => {},
      toggleLang: () => {},
      t: dashboardTranslations['ar'],
    };
  }
  return context;
}

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border/50"
      aria-label={lang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
      title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
    >
      <Globe className="size-3.5 text-primary" />
      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}
