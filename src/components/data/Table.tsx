'use client';

import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Generic data table matching the ds-table design.
 *
 * Renders a bordered, rounded table with monospace uppercase headers,
 * subtle inset header background, and purple-surface row hover.
 */
export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className,
}: TableProps<T>) {
  const isLastRow = (index: number) => index === data.length - 1;

  return (
    <div
      className={cn(
        'border border-border rounded-none overflow-hidden bg-surface-raised',
        className,
      )}
    >
      <table className="w-full border-collapse text-[0.8125rem]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'font-mono text-[0.6875rem] font-medium uppercase tracking-wide',
                  'text-text-muted text-left',
                  'p-3 px-4',
                  'bg-surface-inset border-b border-border',
                  'whitespace-nowrap select-none',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr
              key={keyExtractor(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={cn(
                'transition-colors duration-150',
                'hover:bg-brand-surface',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'p-3 px-4 align-middle',
                    !isLastRow(rowIndex) && 'border-b border-border',
                    col.className,
                  )}
                >
                  {col.render
                    ? col.render(item)
                    : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
