'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

type ToastVariant = 'success' | 'warning' | 'error' | 'info';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

/* ─── Variant Icons ─── */

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  warning: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
};

const variantProgressBg: Record<ToastVariant, string> = {
  success: 'bg-success-surface',
  warning: 'bg-warning-surface',
  error: 'bg-error-surface',
  info: 'bg-info-surface',
};

const variantProgressFill: Record<ToastVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};

/* ─── Context ─── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

/* ─── Default duration (ms) ─── */
const DEFAULT_DURATION = 4000;

/* ─── Individual Toast ─── */

interface ToastCardProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

function ToastCard({ toast, onRemove }: ToastCardProps) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = toast.duration ?? DEFAULT_DURATION;

  const dismiss = useCallback(() => {
    setLeaving(true);
    // Wait for exit animation to complete before removing from DOM
    setTimeout(() => onRemove(toast.id), 150);
  }, [onRemove, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, duration]);

  return (
    <div
      role="alert"
      className={cn(
        'min-w-[320px] max-w-[420px] bg-surface-raised border border-border shadow-lg rounded-lg p-4',
        'flex gap-3 relative overflow-hidden pointer-events-auto',
        leaving
          ? 'animate-[toast-out_150ms_cubic-bezier(0.7,0,0.84,0)_forwards]'
          : 'animate-[toast-in_250ms_cubic-bezier(0.16,1,0.3,1)_forwards]'
      )}
    >
      {/* Icon */}
      <div className={cn('shrink-0 mt-px', variantIconColors[toast.variant])}>
        {variantIcons[toast.variant]}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.8125rem] font-semibold text-text">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-muted mt-0.5">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-text-muted hover:text-text transition-colors cursor-pointer p-0 bg-transparent border-none"
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Countdown progress bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-[3px]',
          variantProgressBg[toast.variant]
        )}
      >
        <span
          className={cn(
            'block h-full',
            variantProgressFill[toast.variant]
          )}
          style={{
            animationName: 'toast-countdown',
            animationDuration: `${duration}ms`,
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
          }}
        />
      </div>
    </div>
  );
}

/* ─── Provider ─── */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++nextId}-${Date.now()}`;
    setToasts((prev) => {
      // Cap at 5 visible toasts
      const next = [...prev, { ...toast, id }];
      return next.length > 5 ? next.slice(-5) : next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ addToast, removeToast }}>
      {children}
      {/* Toast container — fixed top-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-6 right-6 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext>
  );
}
