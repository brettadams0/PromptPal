'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  isDark: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'promptpal-theme',
  attribute = 'data-theme',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  // Render starts from the default on both server and client. Reading
  // localStorage or matchMedia during render throws a ReferenceError under
  // static generation — those globals do not merely evaluate to undefined on
  // the server, they are undeclared, so `localStorage?.getItem` still throws.
  // The stored and system values are adopted in effects, which only run in the
  // browser, keeping the first client render identical to the server's.
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeState(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!enableSystem) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemPrefersDark(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [enableSystem]);

  const isDark = theme === 'dark' || (theme === 'system' && enableSystem && systemPrefersDark);

  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = isDark ? 'dark' : 'light';

    // Suppress the colour transition while the theme swaps, so switching does
    // not animate every themed property across the whole page at once.
    let cleanup: (() => void) | undefined;
    if (disableTransitionOnChange) {
      const style = document.createElement('style');
      style.appendChild(
        document.createTextNode('*{transition:none !important}')
      );
      document.head.appendChild(style);
      cleanup = () => {
        // Force a reflow so the suppression applies before it is removed.
        window.getComputedStyle(document.body);
        document.head.removeChild(style);
      };
    }

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.setAttribute(attribute, resolved);

    cleanup?.();
  }, [isDark, attribute, disableTransitionOnChange]);

  const value: ThemeProviderState = {
    theme,
    setTheme: (next: Theme) => {
      window.localStorage.setItem(storageKey, next);
      setThemeState(next);
    },
    isDark,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
