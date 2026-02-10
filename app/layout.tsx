import localFont from 'next/font/local';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
  title: '오늘의 카카오뱅크',
  description: '오늘의 카카오뱅크 기사 요약 서비스',
  openGraph: {
    title: '오늘의 카카오뱅크',
    description: '오늘의 카카오뱅크 기사 요약 서비스',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/og-kabang-summary.svg',
        width: 1200,
        height: 630,
        alt: '오늘의 카카오뱅크',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '오늘의 카카오뱅크',
    description: '오늘의 카카오뱅크 기사 요약 서비스',
    images: ['/og-kabang-summary.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={pretendard.variable}>{children}</body>
    </html>
  );
}
