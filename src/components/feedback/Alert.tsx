'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface AlertProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

/* ─── Variant Icons (inline SVG) ─── */

const variantIcons: Record<AlertProps['variant'], ReactNode> = {
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

/* ─── Variant Styles ─── */

const variantClasses: Record<AlertProps['variant'], string> = {
  success: 'bg-success-surface border-success text-success',
  warning: 'bg-warning-surface border-warning text-warning',
  error: 'bg-error-surface border-error text-error',
  info: 'bg-info-surface border-info text-info',
};

/* ─── Component ─── */

export function Alert({
  variant,
  title,
  message,
  onClose,
  compact = false,
  className,
  children,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 border rounded-none',
        compact ? 'items-center px-4 py-2' : 'p-4',
        variantClasses[variant],
        className
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-px">{variantIcons[variant]}</div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text">{title}</p>
        {!compact && message && (
          <p className="text-[0.8125rem] text-text-muted mt-0.5">{message}</p>
        )}
        {!compact && children}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-text-muted hover:text-text transition-colors cursor-pointer p-0 bg-transparent border-none"
          aria-label="Dismiss alert"
        >
          <svg
            width="16"
            height="16"
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
      )}
    </div>
  );
}
