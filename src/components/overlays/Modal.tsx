'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Modal — centered overlay dialog.
 *
 * Renders via React Portal at document.body level.
 * Implements focus trap, body scroll lock, and Escape-to-close.
 * Follows Purple Glow design system overlay patterns.
 */

/* ─── Types ─── */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/* ─── Style Maps ─── */

const sizeStyles: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'w-[400px]',
  md: 'w-[520px]',
  lg: 'w-[680px]',
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

/* ─── Close Button ─── */

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close modal"
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

function Modal({
  isOpen,
  onClose,
  size = 'md',
  title,
  children,
  footer,
  className,
}: ModalProps) {
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

    // Focus the first focusable element inside the modal
    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;

      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        // If no focusable children, focus the panel itself
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
      // Only close if clicking the backdrop itself, not the panel
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
        aria-hidden="true"
      />

      {/* Centering wrapper — receives backdrop clicks */}
      <div
        className="fixed inset-0 z-[400] flex items-center justify-center"
        onClick={handleBackdropClick}
        role="presentation"
      >
        {/* Modal panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn(
            // Layout
            sizeStyles[size],
            'max-w-[calc(100vw-2rem)]',
            'max-h-[85vh] flex flex-col',
            // Surface
            'bg-surface-raised border border-border',
            'rounded-lg shadow-lg',
            // Animation — enter from slightly scaled down
            'animate-[modal-enter_250ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
            className,
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-border p-5 px-6">
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              <CloseButton onClick={onClose} />
            </div>
          )}

          {/* Header without title — just the close button */}
          {!title && (
            <div className="flex justify-end p-3 px-4">
              <CloseButton onClick={onClose} />
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-border p-4 px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

export { Modal };
export type { ModalProps };
