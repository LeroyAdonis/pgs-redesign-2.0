import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface SkeletonProps {
  variant?: 'text' | 'text-sm' | 'avatar' | 'card' | 'custom';
  className?: string;
  width?: string;
  height?: string;
}

/* ─── Variant Styles ─── */

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-3.5 w-4/5 mb-2 rounded-sm',
  'text-sm': 'h-2.5 w-3/5 mb-2 rounded-sm',
  avatar: 'w-11 h-11 rounded-full',
  card: 'h-[180px] w-full rounded-none',
  custom: '',
};

/* ─── Component ─── */

export function Skeleton({
  variant = 'text',
  className,
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-surface-inset relative overflow-hidden',
        variantClasses[variant],
        className
      )}
      style={{
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      }}
    >
      {/* Shimmer pseudo-element via CSS after:: — applied as a child div for Tailwind compatibility */}
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
