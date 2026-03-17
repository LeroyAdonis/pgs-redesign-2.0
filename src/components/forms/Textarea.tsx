'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
  hasSuccess?: boolean;
}

/**
 * Textarea matching ds-textarea from the design system.
 * min-height 100px, resize vertical, line-height 1.6.
 * Same focus/error/success ring treatment as Input.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, hasSuccess, ...props }, ref) => {
    const id = useId();

    return (
      <textarea
        id={props.id ?? id}
        ref={ref}
        className={cn(
          // Base
          'min-h-[100px] w-full p-3 font-body text-sm text-text leading-[1.6]',
          'bg-surface-inset border border-border rounded-md',
          'outline-none resize-y',
          'transition-[border-color,box-shadow] duration-150',
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
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
