/**
 * Admin job monitoring page
 *
 * Server component showing Inngest background job status overview.
 * Displays summary stats cards and a job monitoring table.
 *
 * Protected by admin session — redirects non-admins.
 */

import { setRequestLocale } from "next-intl/server";
import { JobStatsCards } from "@/components/admin/JobStatsCards";
import { JobMonitorTable } from "@/components/admin/JobMonitorTable";
import type { JobRun, JobStats, JobStatus } from "@/types/admin-jobs";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Inngest function definitions — used to generate realistic
 * mock data on the server side (no API call needed for SSR).
 */
const INNGEST_FUNCTIONS = [
  { id: "post-publish", name: "Publish Post", event: "post/publish" },
  { id: "post-retry", name: "Retry Post", event: "post/retry" },
  { id: "schedule-check", name: "Check Scheduled Posts", event: "cron" },
  { id: "notify-post-published", name: "Notify Post Published", event: "notification/post-published" },
  { id: "notify-post-failed", name: "Notify Post Failed", event: "notification/post-failed" },
  { id: "notify-low-credits", name: "Notify Low Credits", event: "notification/low-credits" },
  { id: "notify-check-expiring-tokens", name: "Check Expiring Tokens", event: "cron" },
  { id: "notify-admin-signup", name: "Admin Signup Alert", event: "notification/admin-signup" },
  { id: "notify-admin-subscription-change", name: "Subscription Change Alert", event: "notification/admin-subscription-change" },
  { id: "analytics-fetch-initial", name: "Fetch Initial Metrics", event: "analytics/fetch-initial" },
  { id: "analytics-refresh-recent", name: "Refresh Recent Metrics", event: "cron" },
  { id: "analytics-refresh-daily", name: "Refresh Daily Metrics", event: "cron" },
  { id: "analytics-weekly-digest", name: "Weekly Analytics Digest", event: "cron" },
] as const;

function generateServerJobs(): { jobs: JobRun[]; stats: JobStats } {
  const now = Date.now();
  const statuses: JobStatus[] = [
    "completed", "completed", "completed", "completed",
    "running", "queued", "failed", "completed",
    "completed", "running", "completed", "failed",
    "completed", "completed", "queued", "completed",
    "completed", "completed", "completed", "completed",
  ];

  const jobs: JobRun[] = statuses.map((status, i) => {
    const fn = INNGEST_FUNCTIONS[i % INNGEST_FUNCTIONS.length];
    const minutesAgo = (i + 1) * 7;
    const startedAt = new Date(now - minutesAgo * 60 * 1000).toISOString();
    const durationMs = (i + 1) * 15000 + i * 3000;

    let endedAt: string | null = null;
    if (status === "completed" || status === "failed") {
      endedAt = new Date(new Date(startedAt).getTime() + durationMs).toISOString();
    }

    const errorMessage =
      status === "failed"
        ? i % 2 === 0
          ? "Platform API rate limit exceeded: 429 Too Many Requests. Retry after 60s."
          : "OAuth token expired for account acc_xK9mL2. Token refresh failed: invalid_grant."
        : null;

    return {
      id: `run_${String(i + 1).padStart(4, "0")}_${fn.id}`,
      functionId: fn.id,
      functionName: fn.name,
      status,
      startedAt,
      endedAt,
      attempt: status === "failed" ? 3 : 1,
      error: errorMessage,
      eventName: fn.event,
    };
  });

  const stats: JobStats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    queued: jobs.filter((j) => j.status === "queued").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  };

  return { jobs, stats };
}

export default async function AdminJobsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { jobs, stats } = generateServerJobs();

  /** Inngest dashboard URL (configurable via env, defaults to local dev) */
  const inngestDashboardUrl =
    process.env.INNGEST_DASHBOARD_URL ?? "http://localhost:8288";

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Job Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor Inngest background job runs, view errors, and retry failed
            jobs.
          </p>
        </div>
        <a
          href={inngestDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
          Inngest Dashboard
        </a>
      </div>

      {/* ── Stats cards ──────────────────────────────────── */}
      <JobStatsCards stats={stats} />

      {/* ── Job table ────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-200">
            Recent Job Runs
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Showing the latest {jobs.length} job runs across all functions.
          </p>
        </div>
        <JobMonitorTable initialJobs={jobs} />
      </div>
    </div>
  );
}
