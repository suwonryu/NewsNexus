import localFont from 'next/font/local';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  preload: true,
  weight: '45 920',
});

export const metadata: Metadata = {
  title: '오늘의 카카오뱅크',
  description: 'NewsNexus article browser',
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
