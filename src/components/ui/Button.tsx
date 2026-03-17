'use client';

import { cn } from '@/lib/utils';

/**
 * Button — primary interactive control.
 *
 * Variants follow the Purple Glow design system (ds-part1.html).
 * Uses React 19 ref-as-prop pattern (no forwardRef needed).
 */

/* ─── Types ─── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

/* ─── Style Maps ─── */

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: [
    'bg-brand text-white',
    'hover:bg-brand-vivid',
    'active:bg-brand-deep',
    'shadow-sm hover:shadow-glow',
  ].join(' '),
  secondary: [
    'bg-transparent border border-border text-text-secondary',
    'hover:border-brand hover:text-brand hover:bg-brand-surface',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-muted',
    'hover:text-text hover:bg-brand-surface',
  ].join(' '),
  danger: [
    'bg-error text-white',
    'hover:brightness-115',
  ].join(' '),
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-4 text-xs gap-1.5',
  md: 'h-10 px-6 text-sm gap-2',
  lg: 'h-12 px-8 text-base gap-2.5',
};

/* ─── Spinner ─── */

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-[18px] w-[18px] shrink-0',
        'rounded-full border-2 border-transparent border-t-current',
        'animate-spin',
      )}
    />
  );
}

/* ─── Component ─── */

function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ref,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        // Base
        'inline-flex items-center justify-center',
        'rounded-none font-medium',
        'transition-all duration-150 ease-smooth',
        'cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        // Variant + Size
        variantStyles[variant],
        sizeStyles[size],
        // Disabled state
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}

      {/* Hide text visually during loading but keep it for layout width */}
      <span className={cn(isLoading && 'invisible')}>{children}</span>

      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}

export { Button };
export type { ButtonProps };
