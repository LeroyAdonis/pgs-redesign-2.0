import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Simple breadcrumb navigation matching the ds-nav breadcrumb design.
 *
 * Renders a semantic <nav> + <ol> with chevron separators.
 * The last item is styled as the current page (non-linked, bold).
 *
 * Server component — uses plain <a> tags (not Next Link).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm text-text-muted', className)}
    >
      <ol className="flex items-center gap-2 list-none m-0 p-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {/* ── Separator (before every item except the first) ── */}
              {index > 0 && (
                <span aria-hidden="true" className="text-border select-none">
                  ›
                </span>
              )}

              {/* ── Item ── */}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    isLast && 'text-text font-medium',
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    'text-brand no-underline',
                    'transition-colors duration-150',
                    'hover:text-brand-vivid hover:underline',
                  )}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
