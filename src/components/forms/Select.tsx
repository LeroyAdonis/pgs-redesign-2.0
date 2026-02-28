'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  children: React.ReactNode;
}

/**
 * Native <select> styled to match ds-select trigger appearance.
 * Height 44px, appearance-none with a custom chevron indicator.
 * Same focus/error ring treatment as Input.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => {
    const id = useId();

    return (
      <div className="relative w-full">
        <select
          id={props.id ?? id}
          ref={ref}
          className={cn(
            // Base — match ds-select__trigger
            'h-11 w-full appearance-none font-body text-sm text-text',
            'bg-surface-inset border border-border rounded-md',
            'pl-4 pr-10', // right padding for chevron
            'outline-none cursor-pointer',
            'transition-[border-color,box-shadow] duration-150',
            // Hover
            'hover:border-[rgba(139,92,246,0.2)]',
            // Focus (default)
            !hasError &&
              'focus:border-brand focus:ring-3 focus:ring-brand-surface',
            // Error state
            hasError && 'border-error focus:border-error focus:ring-3 focus:ring-error-surface',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        >
          {children}
        </select>

        {/* Chevron indicator */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps };
