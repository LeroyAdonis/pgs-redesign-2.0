"use client";

/**
 * PostFilters — Toolbar for filtering posts by platform, status, and date range.
 *
 * Stateless controlled component. All filter state lives in PostsManager.
 */

import { cn } from "@/lib/utils";
import { ALL_PLATFORM_IDS, PLATFORM_CONFIG } from "./platform-config";
import type { PostFiltersState } from "./types";

/* ─── Props ─── */

interface PostFiltersProps {
  filters: PostFiltersState;
  onFilterChange: (filters: PostFiltersState) => void;
}

/* ─── Status options ─── */

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "publishing", label: "Publishing" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
] as const;

/* ─── Component ─── */

export function PostFilters({ filters, onFilterChange }: PostFiltersProps) {
  function update(patch: Partial<PostFiltersState>) {
    onFilterChange({ ...filters, ...patch });
  }

  const hasActiveFilters =
    filters.platform || filters.status || filters.dateFrom || filters.dateTo;

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3",
        "rounded-none border border-border bg-surface p-3",
      )}
      role="search"
      aria-label="Filter posts"
    >
      {/* Platform */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-platform"
          className="text-xs font-medium text-text-muted"
        >
          Platform
        </label>
        <select
          id="filter-platform"
          value={filters.platform ?? ""}
          onChange={(e) => update({ platform: e.target.value || null })}
          className={cn(
            "rounded-none border border-border bg-surface px-3 py-2",
            "text-sm text-text",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
            "transition-colors",
          )}
        >
          <option value="">All platforms</option>
          {ALL_PLATFORM_IDS.map((id) => (
            <option key={id} value={id}>
              {PLATFORM_CONFIG[id].label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-status"
          className="text-xs font-medium text-text-muted"
        >
          Status
        </label>
        <select
          id="filter-status"
          value={filters.status ?? ""}
          onChange={(e) => update({ status: e.target.value || null })}
          className={cn(
            "rounded-none border border-border bg-surface px-3 py-2",
            "text-sm text-text",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
            "transition-colors",
          )}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-date-from"
          className="text-xs font-medium text-text-muted"
        >
          From
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => update({ dateFrom: e.target.value || null })}
          className={cn(
            "rounded-none border border-border bg-surface px-3 py-2",
            "text-sm text-text",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
            "transition-colors",
          )}
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-date-to"
          className="text-xs font-medium text-text-muted"
        >
          To
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => update({ dateTo: e.target.value || null })}
          className={cn(
            "rounded-none border border-border bg-surface px-3 py-2",
            "text-sm text-text",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
            "transition-colors",
          )}
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              platform: null,
              status: null,
              dateFrom: null,
              dateTo: null,
            })
          }
          className={cn(
            "rounded-none px-3 py-2 text-sm font-medium",
            "text-text-muted hover:text-text hover:bg-brand-surface",
            "transition-colors",
          )}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
