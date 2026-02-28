'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Drawer — side-panel overlay.
 *
 * Slides in from left or right. Renders via React Portal
 * at document.body level. Implements focus trap, body scroll
 * lock, and Escape-to-close.
 */

/* ─── Types ─── */

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  width?: 'narrow' | 'default' | 'wide';
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/* ─── Style Maps ─── */

const widthStyles: Record<NonNullable<DrawerProps['width']>, string> = {
  narrow: 'w-[320px]',
  default: 'w-[480px]',
  wide: 'w-[640px]',
};

/* ─── Constants ─── */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const TRANSITION_CLASSES = 'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]';

/* ─── Slide Animation Maps ─── */

const slideAnimations: Record<NonNullable<DrawerProps['side']>, string> = {
  right: 'animate-[drawer-slide-right_250ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
  left: 'animate-[drawer-slide-left_250ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
};

const positionStyles: Record<NonNullable<DrawerProps['side']>, string> = {
  right: 'right-0',
  left: 'left-0',
};

/* ─── Close Button ─── */

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close drawer"
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center',
        'rounded-md border border-border',
        'text-text-muted',
        'transition-all duration-150 ease-smooth',
        'hover:border-brand hover:text-text hover:bg-brand-surface',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'cursor-pointer',
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}

/* ─── Component ─── */

function Drawer({
  isOpen,
  onClose,
  side = 'right',
  width = 'default',
  title,
  children,
  footer,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  /* ── Escape key listener ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  /* ── Focus trap ── */
  const handleTabTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  /* ── Effects ── */
  useEffect(() => {
    if (!isOpen) return;

    // Save the currently focused element to restore later
    previousActiveElement.current = document.activeElement;

    // Focus the first focusable element inside the drawer
    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;

      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        panel.focus();
      }
    }, 0);

    // Attach listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleTabTrap);

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabTrap);
      document.body.style.overflow = originalOverflow;

      // Restore focus to the previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, handleTabTrap]);

  /* ── Backdrop click ── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  /* ── SSR guard ── */
  if (typeof document === 'undefined') return null;
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[300]',
          'bg-black/60 backdrop-blur-[8px]',
          TRANSITION_CLASSES,
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Drawer'}
        tabIndex={-1}
        className={cn(
          // Position
          'fixed top-0 bottom-0 z-[400]',
          positionStyles[side],
          // Size
          widthStyles[width],
          'max-w-[calc(100vw-2rem)]',
          // Surface
          'bg-surface-raised border border-border shadow-lg',
          // Layout
          'flex flex-col',
          // Animation
          slideAnimations[side],
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 px-6">
          {title ? (
            <h2 className="text-lg font-semibold text-text">{title}</h2>
          ) : (
            <div />
          )}
          <CloseButton onClick={onClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border p-4 px-6">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

export { Drawer };
export type { DrawerProps };
