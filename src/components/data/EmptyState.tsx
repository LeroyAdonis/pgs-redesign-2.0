import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Empty state placeholder matching the ds-empty design.
 *
 * Centered layout with optional icon/illustration, title,
 * descriptive text, and action slot. Use when a list, table,
 * or dashboard section has no data to display.
 *
 * Server component — no client-side interactivity.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-16 px-8 max-w-[400px] mx-auto',
        className,
      )}
    >
      {/* ── Illustration area ── */}
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center',
            'w-[120px] h-[120px] mx-auto mb-6',
            'rounded-full bg-surface-inset text-text-muted',
          )}
        >
          {icon}
        </div>
      )}

      {/* ── Title ── */}
      <h3 className="font-display text-xl mb-2">{title}</h3>

      {/* ── Description ── */}
      {description && (
        <p className="text-sm text-text-muted mb-6">{description}</p>
      )}

      {/* ── Action slot ── */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
