'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// ─── Public types ───────────────────────────────────────────────
export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// ─── Constants ──────────────────────────────────────────────────
const STORAGE_KEY = 'pgs-theme';
const ATTRIBUTE = 'data-theme';

// ─── Context (exported for useTheme hook) ───────────────────────
export const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Blocking inline script ─────────────────────────────────────
// Runs synchronously before React hydration to prevent flash of
// wrong theme. Mirrors the logic in getInitialTheme() below.
// Sets BOTH data-theme attribute AND .dark class for Tailwind v4.
const themeInitScript = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var t=s==="light"||s==="dark"?s:null;if(!t){t=window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"}document.documentElement.setAttribute("${ATTRIBUTE}",t);document.documentElement.classList.toggle("dark",t==="dark")}catch(e){document.documentElement.setAttribute("${ATTRIBUTE}","dark");document.documentElement.classList.add("dark")}})()`;

// ─── Helpers ────────────────────────────────────────────────────

function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Resolve the initial theme from (in priority order):
 * 1. localStorage
 * 2. OS prefers-color-scheme
 * 3. 'dark' as the project default
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
  } catch {
    // localStorage unavailable (private browsing, SSR, etc.)
  }

  try {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // matchMedia unavailable
  }

  return 'dark';
}

/**
 * Apply a theme to the document and persist to localStorage.
 * Sets both `data-theme` attribute (for CSS variables) and a `.dark` class
 * on `<html>` so Tailwind v4 `dark:` variants work.
 */
function applyTheme(next: Theme): void {
  document.documentElement.setAttribute(ATTRIBUTE, next);
  document.documentElement.classList.toggle('dark', next === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage write failed — silently ignore
  }
}

// ─── Provider ───────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  /** Set a specific theme (immediate DOM update + persist). */
  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  /** Toggle between dark ↔ light (reads current from DOM to avoid stale closures). */
  const toggleTheme = useCallback(() => {
    const current = document.documentElement.getAttribute(ATTRIBUTE);
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setThemeState(next);
  }, []);

  // Ensure DOM is in sync on mount (the inline script should have
  // already set it, but this covers edge cases like HMR).
  useEffect(() => {
    document.documentElement.setAttribute(ATTRIBUTE, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Follow OS preference changes when the user hasn't explicitly chosen.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange(e: MediaQueryListEvent) {
      try {
        // If user explicitly chose a theme, respect that over system changes.
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return;
      } catch {
        // Can't read localStorage — fall through to follow system
      }
      const next: Theme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setThemeState(next);
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: themeInitScript }}
        suppressHydrationWarning
      />
      {/* React 19: <Context value={…}> shorthand */}
      <ThemeContext value={value}>{children}</ThemeContext>
    </>
  );
}
