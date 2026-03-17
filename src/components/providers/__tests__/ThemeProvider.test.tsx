import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useTheme } from '@/components/providers/useTheme';
import { ThemeToggle } from '@/components/providers/ThemeToggle';

// ─── Constants (must match source) ──────────────────────────────
const STORAGE_KEY = 'pgs-theme';
const ATTRIBUTE = 'data-theme';

// ─── Helpers ────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

/**
 * Reset DOM and localStorage to a clean state between tests.
 * matchMedia mock defaults to "prefers dark" (our project default).
 */
function resetEnvironment() {
  localStorage.clear();
  document.documentElement.removeAttribute(ATTRIBUTE);

  // Default: system prefers dark
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ─── Setup / teardown ───────────────────────────────────────────

beforeEach(() => {
  resetEnvironment();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// ThemeProvider
// ═══════════════════════════════════════════════════════════════
describe('ThemeProvider', () => {
  it('defaults to dark theme when nothing is stored', () => {
    render(<ThemeProvider><span data-testid="child">hi</span></ThemeProvider>);

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('reads stored "light" preference from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'light');

    render(<ThemeProvider><span>hi</span></ThemeProvider>);

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('light');
  });

  it('reads stored "dark" preference from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');

    render(<ThemeProvider><span>hi</span></ThemeProvider>);

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
  });

  it('ignores invalid localStorage values and falls back to system/default', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-theme');

    render(<ThemeProvider><span>hi</span></ThemeProvider>);

    // Falls through to matchMedia (dark) or project default (dark)
    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
  });

  it('respects OS light preference when nothing is stored', () => {
    // Override matchMedia to prefer light
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<ThemeProvider><span>hi</span></ThemeProvider>);

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('light');
  });

  it('renders the blocking inline script for flash prevention', () => {
    const { container } = render(<ThemeProvider><span>hi</span></ThemeProvider>);

    const script = container.querySelector('script');
    expect(script).not.toBeNull();
    expect(script?.innerHTML).toContain(STORAGE_KEY);
    expect(script?.innerHTML).toContain(ATTRIBUTE);
  });

  it('renders children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-1">one</div>
        <div data-testid="child-2">two</div>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// useTheme hook
// ═══════════════════════════════════════════════════════════════
describe('useTheme', () => {
  it('returns current theme value', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
  });

  it('provides a toggleTheme function', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('provides a setTheme function', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(typeof result.current.setTheme).toBe('function');
  });

  it('throws when used outside ThemeProvider', () => {
    // Suppress React error boundary console noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme() must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });

  it('toggleTheme switches from dark to light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('light');
  });

  it('toggleTheme switches from light back to dark', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
  });

  it('setTheme directly applies the requested theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('light');

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
  });

  it('persists theme change to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });
});

// ═══════════════════════════════════════════════════════════════
// ThemeToggle
// ═══════════════════════════════════════════════════════════════
describe('ThemeToggle', () => {
  it('renders a button with accessible aria-label', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    expect(
      screen.getByRole('button', { name: /switch to light mode/i }),
    ).toBeInTheDocument();
  });

  it('shows moon icon in dark mode', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    expect(screen.getByRole('button').textContent).toContain('☾');
  });

  it('shows sun icon in light mode', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    expect(screen.getByRole('button').textContent).toContain('☀');
  });

  it('toggles from dark to light on click', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    const button = screen.getByRole('button', { name: /switch to light mode/i });
    await user.click(button);

    // After click: now in light mode
    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('light');
    expect(
      screen.getByRole('button', { name: /switch to dark mode/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button').textContent).toContain('☀');
  });

  it('toggles from light to dark on click', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, 'light');
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(button);

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
    expect(
      screen.getByRole('button', { name: /switch to light mode/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button').textContent).toContain('☾');
  });

  it('persists preference to localStorage after toggle', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    await user.click(screen.getByRole('button'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('double-toggle returns to original theme', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('merges custom className', () => {
    render(<ThemeProvider><ThemeToggle className="my-custom" /></ThemeProvider>);

    const button = screen.getByRole('button');
    expect(button.className).toContain('my-custom');
  });

  it('has type="button" to prevent form submission', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
