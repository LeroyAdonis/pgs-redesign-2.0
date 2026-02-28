import { cn } from '@/lib/utils';

/**
 * Badge — status indicator label.
 *
 * Server component. Variants map to the semantic color tokens
 * from the Purple Glow design system (ds-part1.html).
 */

/* ─── Types ─── */

type BadgeVariant = 'default' | 'success' | 'info' | 'warning' | 'error' | 'brand';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show a small colored dot before the text */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

/* ─── Style Maps ─── */

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-inset border-border text-text-muted',
  success: 'bg-success-surface border-success/30 text-success',
  info: 'bg-info-surface border-info/30 text-info',
  warning: 'bg-warning-surface border-warning/30 text-warning',
  error: 'bg-error-surface border-error/30 text-error',
  brand: 'bg-brand-surface border-brand/30 text-brand',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-[0.5625rem]',
  md: 'h-[26px] px-3 text-[0.6875rem]',
};

/* ─── Component ─── */

function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Base
        'inline-flex items-center gap-1.5',
        'rounded-full border font-mono font-medium',
        'whitespace-nowrap leading-none',
        // Variant + Size
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
