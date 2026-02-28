'use client';

import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  success?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form field wrapper matching ds-field from the design system.
 * Provides a label, helper text, error/success messages around any input.
 */
function FormField({
  label,
  htmlFor,
  helperText,
  error,
  success,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[0.8125rem] font-medium text-text"
        >
          {label}
        </label>
      )}

      {/* Helper text (shown when no error/success) */}
      {helperText && !error && !success && (
        <p className="text-xs text-text-muted">{helperText}</p>
      )}

      {/* Input slot */}
      {children}

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-error">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M7 4V7.5M7 9.5V10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Success message */}
      {success && !error && (
        <p className="flex items-center gap-1 text-xs text-success">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M4.5 7L6.5 9L9.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {success}
        </p>
      )}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
