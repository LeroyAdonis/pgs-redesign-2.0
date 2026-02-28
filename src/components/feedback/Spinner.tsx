import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/* ─── Size Config ─── */

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-3',
  lg: 'h-11 w-11 border-3',
};

/* ─── Component ─── */

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full border-border border-t-brand animate-spin',
        sizeClasses[size],
        className
      )}
      style={{ animationDuration: '0.7s' }}
    />
  );
}
