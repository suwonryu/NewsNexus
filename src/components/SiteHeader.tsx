'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type MouseEvent, useEffect, useState } from 'react';
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

function getActiveSection(pathname: string): SiteSection | undefined {
  if (pathname === '/') {
    return 'today';
  }
  if (
    pathname === '/archive' ||
    pathname.startsWith('/briefing/') ||
    pathname.startsWith('/topics/')
  ) {
    return 'briefings';
  }
  if (pathname === '/explore' || pathname.startsWith('/news/')) {
    return 'explore';
  }
  return undefined;
}

export function SiteHeader({ active, className }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<SiteSection | null>(null);
  const resolvedActive = active ?? getActiveSection(pathname);

  useEffect(() => {
    for (const item of NAV_ITEMS) {
      router.prefetch(item.href);
    }
  }, [router]);

  useEffect(() => {
    setPendingKey(null);
  }, [pathname]);

  const handleNavigate = (
    event: MouseEvent<HTMLAnchorElement>,
    item: (typeof NAV_ITEMS)[number],
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (pathname === item.href && window.location.search === '') {
      event.preventDefault();
      setPendingKey(null);
      return;
    }

    setPendingKey(item.key);
  };

  return (
    <>
      {pendingKey && (
        <div
          className="site-route-progress"
          role="progressbar"
          aria-label={`${NAV_ITEMS.find((item) => item.key === pendingKey)?.label ?? '페이지'}로 이동 중`}
        />
      )}
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 pb-4 dark:border-white/10 ${
          className ?? ''
        }`}
        aria-busy={pendingKey !== null}
      >
        <Link
          href="/"
          className="min-w-0"
          onClick={(event) => handleNavigate(event, NAV_ITEMS[0])}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
            KakaoBank News Analysis
          </p>
          <p className="mt-1 truncate text-lg font-[700] tracking-[-0.03em] text-slate-950 dark:text-white">
            {SITE_NAME}
          </p>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="order-3 grid w-full grid-cols-3 rounded-full bg-slate-100 p-1 dark:bg-white/[0.06] sm:order-none sm:ml-auto sm:w-[16.5rem]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = resolvedActive === item.key;
            const isPending = pendingKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={(event) => handleNavigate(event, item)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-white/15 dark:text-white'
                    : isPending
                      ? 'bg-blue-50 text-[#0066cc] dark:bg-blue-500/15 dark:text-[#2997ff]'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isPending && (
                  <span
                    className="absolute right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-[#0071e3] dark:bg-[#2997ff]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle compact />
      </header>
    </>
  );
}
