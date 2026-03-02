/**
 * Job stats summary cards
 *
 * Displays Inngest job counts by status as a grid of stat cards.
 * Uses the AdminStatCard component for consistent styling.
 *
 * Color coding:
 * - Running  → blue (in-progress indicator)
 * - Failed   → red  (needs attention)
 * - Queued   → yellow (waiting)
 * - Completed → green (success)
 *
 * Server component — rendered on the jobs page.
 */

import type { JobStats } from "@/types/admin-jobs";

interface JobStatsCardsProps {
  stats: JobStats;
}

/** SVG icon for total jobs */
function TotalIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
      />
    </svg>
  );
}

/** SVG icon for running jobs */
function RunningIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
      />
    </svg>
  );
}

/** SVG icon for failed jobs */
function FailedIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

/** SVG icon for queued jobs */
function QueuedIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

/** SVG icon for completed jobs */
function CompletedIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

interface StatCardConfig {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
}

function JobStatsCards({ stats }: JobStatsCardsProps) {
  const cards: StatCardConfig[] = [
    {
      label: "Total Jobs",
      value: stats.total,
      icon: <TotalIcon />,
      accentColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
    },
    {
      label: "Running",
      value: stats.running,
      icon: <RunningIcon />,
      accentColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: <FailedIcon />,
      accentColor: "text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Queued",
      value: stats.queued,
      icon: <QueuedIcon />,
      accentColor: "text-yellow-400",
      iconBg: "bg-yellow-500/10",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: <CompletedIcon />,
      accentColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      data-testid="job-stats-cards"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 transition-colors hover:border-slate-600/50"
          data-testid="admin-stat-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[0.8125rem] font-medium text-slate-400">
                {card.label}
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-100">
                {card.value.toLocaleString()}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.accentColor}`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { JobStatsCards };
export type { JobStatsCardsProps };
