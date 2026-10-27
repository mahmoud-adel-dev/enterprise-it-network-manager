import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import Script from 'next/script';
import { LanguageProvider } from '@/lib/i18n/language-context';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Endpoint Manager',
  description: 'Enterprise Endpoint & Network Management Platform',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
  },
};

const initScript = `
  try {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    var savedLang = localStorage.getItem('lang') || 'ar';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <Script
          id="theme-lang-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: initScript }}
        />
      </head>
      <body className={`${cairo.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
