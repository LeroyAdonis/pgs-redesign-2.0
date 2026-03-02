/**
 * Error log component
 *
 * Displays recent error entries in a table with severity color coding.
 * Supports filtering by severity and source, and expandable rows
 * for viewing stack traces. Shows last 100 errors.
 *
 * Client component — uses local state for filters and expansion.
 */

"use client";

import { useMemo, useState } from "react";
import type { ErrorEntry, ErrorSeverity } from "@/types/admin-system";

/* ─── Severity display config ─── */

const SEVERITY_CONFIG: Record<ErrorSeverity, { color: string; bg: string; label: string }> = {
  info: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Info" },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Warning" },
  error: { color: "text-red-400", bg: "bg-red-500/10", label: "Error" },
  critical: { color: "text-rose-300", bg: "bg-rose-500/20", label: "Critical" },
};

const ALL_SEVERITIES: ErrorSeverity[] = ["info", "warning", "error", "critical"];

/* ─── Component ─── */

interface ErrorLogProps {
  initialData: ErrorEntry[];
}

export function ErrorLog({ initialData }: ErrorLogProps) {
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Derive unique sources for the filter dropdown
  const sources = useMemo(() => {
    const unique = [...new Set(initialData.map((e) => e.source))];
    return unique.sort();
  }, [initialData]);

  // Apply filters
  const filtered = useMemo(() => {
    return initialData
      .filter((entry) => {
        if (severityFilter !== "all" && entry.severity !== severityFilter) return false;
        if (sourceFilter !== "all" && entry.source !== sourceFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
  }, [initialData, severityFilter, sourceFilter]);

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
      data-testid="error-log"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Error Log</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {filtered.length} entries
            {severityFilter !== "all" || sourceFilter !== "all" ? " (filtered)" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as ErrorSeverity | "all")}
            className="rounded-md border border-slate-700/50 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Filter by severity"
          >
            <option value="all">All Severities</option>
            {ALL_SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>
                {SEVERITY_CONFIG[sev].label}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-md border border-slate-700/50 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Filter by source"
          >
            <option value="all">All Sources</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="error-table">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400">
              <th className="pb-2 pr-3 font-medium">Timestamp</th>
              <th className="pb-2 pr-3 font-medium">Source</th>
              <th className="pb-2 pr-3 font-medium">Message</th>
              <th className="pb-2 font-medium">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filtered.map((entry) => {
              const config = SEVERITY_CONFIG[entry.severity];
              const isExpanded = expandedId === entry.id;

              return (
                <tr key={entry.id} className="group" data-testid={`error-row-${entry.id}`}>
                  <td colSpan={4} className="p-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="flex w-full items-start gap-3 px-0 py-2.5 text-left transition-colors hover:bg-slate-800/30"
                      aria-expanded={isExpanded}
                    >
                      {/* Timestamp */}
                      <span className="w-36 shrink-0 font-mono text-slate-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>

                      {/* Source */}
                      <span className="w-32 shrink-0 text-slate-300">
                        {entry.source}
                      </span>

                      {/* Message */}
                      <span className="flex-1 font-mono text-slate-400 truncate">
                        {entry.message}
                      </span>

                      {/* Severity badge */}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${config.color} ${config.bg}`}
                      >
                        {config.label}
                      </span>

                      {/* Expand indicator */}
                      {entry.stackTrace && (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className={`shrink-0 text-slate-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" d="M3 5l4 4 4-4" />
                        </svg>
                      )}
                    </button>

                    {/* Expanded stack trace */}
                    {isExpanded && entry.stackTrace && (
                      <div
                        className="mb-2 ml-36 rounded-md border border-slate-700/30 bg-slate-950/60 p-3"
                        data-testid={`stack-trace-${entry.id}`}
                      >
                        <pre className="whitespace-pre-wrap font-mono text-[0.6875rem] leading-relaxed text-slate-500">
                          {entry.stackTrace}
                        </pre>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No errors match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Johannesburg",
  });
}
