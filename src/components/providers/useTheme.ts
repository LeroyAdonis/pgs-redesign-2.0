'use client';

import { use } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeProvider';

/**
 * Access the current theme context.
 *
 * Must be called inside a `<ThemeProvider>`.
 * Throws at runtime if the provider is missing so the bug is caught
 * immediately during development rather than silently returning undefined.
 */
export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext);

  if (ctx === null) {
    throw new Error(
      'useTheme() must be used within a <ThemeProvider>. ' +
        'Wrap your component tree with <ThemeProvider> in app/layout.tsx.',
    );
  }

  return ctx;
}
