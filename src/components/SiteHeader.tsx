'use client';

import Link from 'next/link';
import { SITE_NAME } from '../lib/siteMetadata';
import { ThemeToggle } from './ThemeToggle';

export type SiteSection = 'today' | 'briefings' | 'explore';

interface SiteHeaderProps {
  active?: SiteSection;
  className?: string;
}

const NAV_ITEMS: Array<{
  key: SiteSection;
  href: string;
  label: string;
}> = [
  { key: 'today', href: '/', label: '오늘' },
  { key: 'briefings', href: '/archive', label: '브리핑' },
  { key: 'explore', href: '/explore', label: '탐색' },
];

export function SiteHeader({ active, className }: SiteHeaderProps) {
  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 pb-4 dark:border-white/10 ${
        className ?? ''
      }`}
    >
      <Link href="/" className="min-w-0" aria-label={`${SITE_NAME} 오늘 홈`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
          KakaoBank News Analysis
        </p>
        <p className="mt-1 truncate text-lg font-[700] tracking-[-0.03em] text-slate-950 dark:text-white">
          {SITE_NAME}
        </p>
      </Link>

      <nav
        aria-label="주요 메뉴"
        className="order-3 grid w-full grid-cols-3 rounded-full bg-slate-100 p-1 dark:bg-white/[0.06] sm:order-none sm:ml-auto sm:flex sm:w-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] ${
                isActive
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-white/15 dark:text-white'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ThemeToggle compact />
    </header>
  );
}
