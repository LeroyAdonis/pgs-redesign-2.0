'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  hasSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Text input matching ds-input from the design system.
 * Height: 44px, font-body 0.875rem, surface-inset bg.
 * Supports error/success states and optional left/right icons.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, hasSuccess, leftIcon, rightIcon, ...props }, ref) => {
    const id = useId();

    const input = (
      <input
        id={props.id ?? id}
        ref={ref}
        className={cn(
          // Base
          'h-11 w-full font-body text-sm text-text',
          'bg-surface-inset border border-border rounded-md',
          'outline-none transition-[border-color,box-shadow] duration-150',
          // Padding — shifts when icons are present
          leftIcon && !rightIcon && 'pl-10 pr-4',
          rightIcon && !leftIcon && 'pl-4 pr-10',
          leftIcon && rightIcon && 'pl-10 pr-10',
          !leftIcon && !rightIcon && 'px-4',
          // Placeholder
          'placeholder:text-text-muted',
          // Hover
          'hover:border-[rgba(139,92,246,0.2)]',
          // Focus (default)
          !hasError &&
            !hasSuccess &&
            'focus:border-brand focus:ring-3 focus:ring-brand-surface',
          // Error state
          hasError && 'border-error focus:border-error focus:ring-3 focus:ring-error-surface',
          // Success state
          hasSuccess &&
            !hasError &&
            'border-success focus:border-success focus:ring-3 focus:ring-success-surface',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );

    // Without icons, render plain input
    if (!leftIcon && !rightIcon) {
      return input;
    }

    // With icons, wrap in relative container
    return (
      <div className="relative w-full">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </span>
        )}
        {input}
        {rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {rightIcon}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
