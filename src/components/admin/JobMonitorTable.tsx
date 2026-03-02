/**
 * Job monitoring table — client component
 *
 * Interactive table for viewing and managing Inngest job runs.
 *
 * Features:
 * - Filter by status (running, failed, queued, completed)
 * - Filter by function name
 * - Auto-refresh toggle (polls every 30 seconds)
 * - Expandable error details for failed jobs
 * - Retry button for failed jobs (with loading state)
 * - Human-readable durations (2m 30s)
 * - Pulsing dot for running jobs
 */

"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type {
  JobRun,
  JobStatus,
  JobsApiResponse,
  JobRetryResponse,
} from "@/types/admin-jobs";

// ─── Helpers ────────────────────────────────────────────────────

const STATUS_ALL = "all" as const;
type StatusFilter = JobStatus | typeof STATUS_ALL;

/** Format a duration between two ISO timestamps as human-readable string */
function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/** Format an ISO date as a local time string */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Africa/Johannesburg",
  });
}

// ─── Status Badge ───────────────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, { dot: string; bg: string; text: string }> = {
  running: {
    dot: "bg-blue-400 animate-pulse",
    bg: "bg-blue-500/10",
    text: "text-blue-300",
  },
  failed: {
    dot: "bg-red-400",
    bg: "bg-red-500/10",
    text: "text-red-300",
  },
  queued: {
    dot: "bg-yellow-400",
    bg: "bg-yellow-500/10",
    text: "text-yellow-300",
  },
  completed: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
  },
};

function StatusBadge({ status }: { status: JobStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
      data-testid={`status-badge-${status}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Spinner icon ───────────────────────────────────────────────

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
    </svg>
  );
}

// ─── Refresh icon ───────────────────────────────────────────────

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={spinning ? "animate-spin" : ""}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      data-testid="refresh-icon"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.015 4.356v4.992"
      />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────

interface JobMonitorTableProps {
  /** Initial job data (from server) */
  initialJobs: JobRun[];
}

function JobMonitorTable({ initialJobs }: JobMonitorTableProps) {
  const [jobs, setJobs] = useState<JobRun[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_ALL);
  const [functionFilter, setFunctionFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Unique function names for the filter dropdown
  const functionNames = Array.from(
    new Set(jobs.map((j) => j.functionName)),
  ).sort();

  // ── Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== STATUS_ALL && job.status !== statusFilter) return false;
    if (functionFilter && job.functionName !== functionFilter) return false;
    return true;
  });

  // ── Fetch latest jobs from API
  const fetchJobs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/jobs");
      if (!response.ok) return;
      const data = (await response.json()) as JobsApiResponse;
      if (data.success) {
        setJobs(data.jobs);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchJobs, 30_000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchJobs]);

  // ── Retry a failed job
  const handleRetry = async (job: JobRun) => {
    setRetryingIds((prev) => new Set(prev).add(job.id));
    try {
      const response = await fetch("/api/admin/jobs/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: job.id, functionId: job.functionId }),
      });
      const data = (await response.json()) as JobRetryResponse;
      if (data.success) {
        // Optimistically update the job status to queued
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "queued" as const, error: null } : j,
          ),
        );
      }
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  // ── Toggle expanded error row
  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4" data-testid="job-monitor-table">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-label="Filter by status"
            data-testid="status-filter"
          >
            <option value="all">All statuses</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
            <option value="completed">Completed</option>
          </select>

          {/* Function name filter */}
          <select
            value={functionFilter}
            onChange={(e) => setFunctionFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-label="Filter by function"
            data-testid="function-filter"
          >
            <option value="">All functions</option>
            {functionNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Auto-refresh toggle */}
        <button
          type="button"
          onClick={() => setAutoRefresh((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            autoRefresh
              ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
          }`}
          aria-label={
            autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"
          }
          aria-pressed={autoRefresh}
          data-testid="auto-refresh-toggle"
        >
          <RefreshIcon spinning={autoRefresh && isRefreshing} />
          {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                Function
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                Started At
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                Duration
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                Attempt
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                  data-testid="empty-state"
                >
                  No jobs match the current filters.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job, index) => {
                const isLast = index === filteredJobs.length - 1;
                const isExpanded = expandedRow === job.id;
                const isRetrying = retryingIds.has(job.id);
                const showBorder = !isLast && !isExpanded;

                return (
                  <Fragment key={job.id}>
                    <tr data-testid="job-row">
                      {/* Function name + ID */}
                      <td
                        className={`px-4 py-3 ${showBorder ? "border-b border-slate-700/30" : ""}`}
                      >
                        <div className="font-medium text-slate-200">
                          {job.functionName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {job.functionId}
                        </div>
                      </td>

                      {/* Status */}
                      <td
                        className={`px-4 py-3 ${showBorder ? "border-b border-slate-700/30" : ""}`}
                      >
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Started at */}
                      <td
                        className={`px-4 py-3 text-slate-300 ${showBorder ? "border-b border-slate-700/30" : ""}`}
                      >
                        {formatTime(job.startedAt)}
                      </td>

                      {/* Duration */}
                      <td
                        className={`px-4 py-3 text-slate-300 ${showBorder ? "border-b border-slate-700/30" : ""}`}
                      >
                        {formatDuration(job.startedAt, job.endedAt)}
                      </td>

                      {/* Attempt */}
                      <td
                        className={`px-4 py-3 text-slate-300 ${showBorder ? "border-b border-slate-700/30" : ""}`}
                      >
                        {job.attempt}
                      </td>

                      {/* Actions */}
                      <td
                        className={`px-4 py-3 ${showBorder ? "border-b border-slate-700/30" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {job.status === "failed" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRetry(job)}
                                disabled={isRetrying}
                                className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                data-testid="retry-button"
                                aria-busy={isRetrying}
                              >
                                {isRetrying ? (
                                  <>
                                    <SpinnerIcon className="text-red-300" />
                                    <span role="status" aria-label="Loading">
                                      Retrying…
                                    </span>
                                  </>
                                ) : (
                                  "Retry"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleExpand(job.id)}
                                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-300"
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? "Hide" : "Show"} error details`}
                                data-testid="expand-error-button"
                              >
                                {isExpanded ? "Hide error" : "View error"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded error detail row */}
                    {isExpanded && job.error && (
                      <tr data-testid="error-detail-row">
                        <td
                          colSpan={6}
                          className={`bg-red-950/20 px-4 py-3 ${!isLast ? "border-b border-slate-700/30" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-xs font-medium text-red-400">
                              Error:
                            </span>
                            <pre className="whitespace-pre-wrap break-all font-mono text-xs text-red-300/80">
                              {job.error}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { JobMonitorTable };
export type { JobMonitorTableProps };
