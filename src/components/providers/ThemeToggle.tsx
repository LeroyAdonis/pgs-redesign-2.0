'use client';

import { cn } from '@/lib/utils';
import { useTheme } from './useTheme';

/**
 * Accessible theme toggle button (44 × 44 px minimum touch target).
 *
 * Shows ☾ in dark mode, ☀ in light mode. Clicking toggles between them.
 * Styled with design-system tokens from globals.css.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        // Size — meets WCAG 2.5.8 minimum target (44 × 44)
        'flex h-11 w-11 items-center justify-center',
        // Shape & border
        'rounded-lg border border-border',
        // Background
        'bg-surface-raised',
        // Text / icon
        'text-lg leading-none',
        // Hover state
        'hover:border-brand hover:shadow-glow',
        // Smooth transition
        'transition-all duration-200 ease-smooth',
        // Focus ring (handled globally, but ensure outline offset)
        'focus-visible:outline-offset-2',
        // Cursor
        'cursor-pointer',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block transition-transform duration-300 ease-spring',
          isDark ? 'rotate-0' : 'rotate-180',
        )}
      >
        {isDark ? '☾' : '☀'}
      </span>
    </button>
  );
}
