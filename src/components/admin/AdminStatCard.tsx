/**
 * Admin stat card component
 *
 * Displays a single metric with label, value, and optional trend.
 * Used on the admin overview page for summary statistics.
 *
 * Server component — no client-side interactivity needed.
 */

interface AdminStatCardProps {
  /** Label for the metric (e.g. "Total Users") */
  label: string;
  /** Display value (e.g. "1,234" or "98.5%") */
  value: string;
  /** Optional description or trend text */
  description?: string;
  /** Icon to display */
  icon: React.ReactNode;
  /** Trend direction for visual indicator */
  trend?: "up" | "down" | "neutral";
}

function AdminStatCard({
  label,
  value,
  description,
  icon,
  trend,
}: AdminStatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-slate-400";

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 transition-colors hover:border-slate-600/50"
      data-testid="admin-stat-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[0.8125rem] font-medium text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-100">
            {value}
          </p>
          {description && (
            <p className={`mt-1 text-xs font-medium ${trendColor}`}>
              {description}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

export { AdminStatCard };
export type { AdminStatCardProps };
