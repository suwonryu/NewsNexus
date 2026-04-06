'use client';

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'newsnexus-theme-preference';

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyTheme(preference: ThemePreference) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const resolvedTheme = resolveTheme(preference);

  root.dataset.themePreference = preference;
  root.dataset.theme = resolvedTheme;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.style.colorScheme = resolvedTheme;
}

function getInitialThemePreference(): ThemePreference {
  if (typeof document !== 'undefined' && isThemePreference(document.documentElement.dataset.themePreference)) {
    return document.documentElement.dataset.themePreference;
  }

  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) {
      return stored;
    }
  }

  return 'system';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getInitialThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getInitialThemePreference()),
  );

  useEffect(() => {
    applyTheme(themePreference);
    setResolvedTheme(resolveTheme(themePreference));
    window.localStorage.setItem(STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themePreference !== 'system') {
        return;
      }

      applyTheme('system');
      setResolvedTheme(resolveTheme('system'));
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themePreference]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !isThemePreference(event.newValue)) {
        return;
      }

      setThemePreferenceState(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference: setThemePreferenceState,
    }),
    [resolvedTheme, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
