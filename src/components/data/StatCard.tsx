import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────

export interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────

/**
 * KPI stat card matching the ds-kpi design.
 *
 * Displays a metric with optional icon and trend indicator.
 * On hover: purple top accent bar fades in, border shifts, glow shadow appears.
 *
 * Server component — no interactivity needed (hover is CSS-only).
 */
export function StatCard({
  icon,
  label,
  value,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-surface-raised border border-border rounded-none p-5',
        'transition-all duration-200',
        'hover:border-[rgba(139,92,246,0.2)] hover:shadow-glow',
        className,
      )}
    >
      {/* ── Top accent bar (hidden → visible on hover) ── */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px]',
          'bg-gradient-to-r from-brand to-brand-vivid',
          'opacity-0 transition-opacity duration-200',
          'group-hover:opacity-100',
        )}
      />

      {/* ── Icon ── */}
      {icon && (
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center',
            'rounded-none bg-brand-surface text-brand',
            'mb-3 text-base',
          )}
        >
          {icon}
        </div>
      )}

      {/* ── Label ── */}
      <div className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">
        {label}
      </div>

      {/* ── Value ── */}
      <div className="font-display text-4xl leading-none tracking-tight mb-2">
        {value}
      </div>

      {/* ── Trend ── */}
      {trend && (
        <span
          className={cn(
            'inline-flex items-center gap-1',
            'font-mono text-[0.6875rem] font-medium',
            'rounded-full px-2 py-0.5',
            trend.direction === 'up' && 'text-success bg-success-surface',
            trend.direction === 'down' && 'text-error bg-error-surface',
          )}
        >
          {trend.value}
          {trend.direction === 'up' ? ' ↑' : ' ↓'}
        </span>
      )}
    </div>
  );
}
