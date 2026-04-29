'use client';

import type { SVGProps } from 'react';
import { useTheme, type ThemePreference } from './ThemeProvider';

interface ThemeToggleProps {
  compact?: boolean;
}

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}> = [
  { value: 'system', label: '시스템 설정 따름', Icon: DesktopIcon },
  { value: 'dark', label: '다크 모드', Icon: MoonIcon },
  { value: 'light', label: '라이트 모드', Icon: SunIcon },
];

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { resolvedTheme, themePreference, setThemePreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="테마 설정"
      className={`inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white p-1 shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#272729] ${
        compact ? 'scale-[0.96]' : ''
      }`}
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const isActive = themePreference === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setThemePreference(value)}
            aria-label={label}
            aria-pressed={isActive}
            title={
              value === 'system'
                ? `${label} (${resolvedTheme === 'dark' ? '현재 다크' : '현재 라이트'})`
                : label
            }
            className={`inline-flex items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#272729] ${
              compact ? 'h-8 w-8' : 'h-9 w-9'
            } ${
              isActive
                ? 'bg-[#0071e3] text-white shadow-[0_8px_18px_rgba(0,113,227,0.22)]'
                : 'text-slate-500 hover:bg-[#f5f5f7] hover:text-[#0066cc] dark:text-slate-300 dark:hover:bg-[#2a2a2c] dark:hover:text-[#2997ff]'
            }`}
          >
            <Icon className={compact ? 'h-4 w-4' : 'h-[1.05rem] w-[1.05rem]'} />
          </button>
        );
      })}
    </div>
  );
}

function DesktopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.75 6.75C4.75 5.64543 5.64543 4.75 6.75 4.75H17.25C18.3546 4.75 19.25 5.64543 19.25 6.75V14.25C19.25 15.3546 18.3546 16.25 17.25 16.25H6.75C5.64543 16.25 4.75 15.3546 4.75 14.25V6.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M9 19.25H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 16.25V19.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M17.25 14.5C16.1666 15.3567 14.7984 15.75 13.4288 15.5984C12.0591 15.4468 10.809 14.7622 9.95344 13.678C9.09784 12.5939 8.7068 11.2251 8.86028 9.85565C9.01377 8.48615 9.70006 7.23695 10.7854 6.38281C9.7522 6.35894 8.72963 6.5924 7.80802 7.06301C6.88641 7.53361 6.09352 8.22715 5.49838 9.0803C4.90323 9.93346 4.52389 10.9187 4.39334 11.9502C4.26279 12.9818 4.3849 14.0296 4.74914 15.0037C5.11339 15.9778 5.70893 16.8487 6.48357 17.5412C7.2582 18.2337 8.18937 18.7273 9.19683 18.9799C10.2043 19.2325 11.258 19.2368 12.2675 18.9923C13.277 18.7479 14.2121 18.2618 14.9924 17.5757C15.7728 16.8895 16.3754 16.0235 16.7475 15.0524C17.1196 14.0814 17.2502 13.0345 17.1281 12.002C17.2831 12.7855 17.3242 13.5871 17.25 14.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.75V5.25M12 18.75V20.25M20.25 12H18.75M5.25 12H3.75M17.8345 17.8345L16.7738 16.7738M7.22623 7.22623L6.16557 6.16557M17.8345 6.16557L16.7738 7.22623M7.22623 16.7738L6.16557 17.8345"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
