import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface ProgressProps {
  /** Current value (0–100 by default, or 0–max). Ignored when indeterminate. */
  value?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Renders an animated indeterminate bar instead of a fixed fill. */
  indeterminate?: boolean;
  /** Optional label displayed below the bar. */
  label?: string;
  className?: string;
}

/* ─── Component ─── */

export function Progress({
  value = 0,
  max = 100,
  indeterminate = false,
  label,
  className,
}: ProgressProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1.5 bg-surface-inset rounded-full overflow-hidden relative"
      >
        <div
          className={cn(
            'h-full bg-brand rounded-full',
            indeterminate
              ? 'w-[40%] animate-[progress-indeterminate_1.5s_cubic-bezier(0.16,1,0.3,1)_infinite]'
              : 'transition-[width] duration-250 ease-out'
          )}
          style={indeterminate ? undefined : { width: `${percent}%` }}
        />
      </div>
      {label && (
        <p className="font-mono text-[0.6875rem] text-text-muted mt-1">
          {label}
        </p>
      )}
    </div>
  );
}
