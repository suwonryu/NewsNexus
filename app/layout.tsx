import localFont from 'next/font/local';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteHeader } from '../src/components/SiteHeader';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { WebVitalsReporter } from '../src/components/WebVitalsReporter';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '../src/lib/siteMetadata';
import { getSiteUrl } from '../src/lib/siteUrl';
import './globals.css';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  preload: true,
  weight: '45 920',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
    url: '/',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const themeInitializerScript = `
(() => {
  const storageKey = 'newsnexus-theme-preference';
  const root = document.documentElement;
  const isValidPreference = (value) => value === 'system' || value === 'light' || value === 'dark';
  const preference = isValidPreference(localStorage.getItem(storageKey))
    ? localStorage.getItem(storageKey)
    : 'system';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  root.dataset.themePreference = preference;
  root.dataset.theme = resolvedTheme;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.style.colorScheme = resolvedTheme;
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} transition-colors duration-300`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
        <ThemeProvider>
          <WebVitalsReporter />
          <div className="site-header-shell">
            <div className="site-container">
              <SiteHeader />
            </div>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
