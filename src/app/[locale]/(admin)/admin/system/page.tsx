/**
 * Admin system health page
 *
 * Server component that displays overall system health status
 * and renders client-side monitoring components. Data is fetched
 * server-side for initial render; components handle their own
 * polling for live updates.
 *
 * Protected by requireAdminSession() — non-admins are redirected.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { requireAdminSession } from "@/lib/admin-session";
import { ApiHealthStatus } from "@/components/admin/ApiHealthStatus";
import { RateLimitMonitor } from "@/components/admin/RateLimitMonitor";
import { ErrorLog } from "@/components/admin/ErrorLog";
import { UptimeDisplay } from "@/components/admin/UptimeDisplay";
import type { SystemHealthData, HealthStatus } from "@/types/admin-system";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "System Health — Admin Dashboard",
};

type Props = {
  params: Promise<{ locale: string }>;
};

/** Fetch system health data server-side for initial render */
async function getSystemHealth(): Promise<SystemHealthData> {
  try {
    // Use the shared data generator directly (no HTTP roundtrip needed server-side)
    const { generateSystemHealthData } = await import(
      "@/lib/admin-system-data"
    );
    return generateSystemHealthData();
  } catch (error) {
    logger.error("Failed to fetch system health data", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      overallStatus: "down",
      platforms: [],
      rateLimits: [],
      errors: [],
      uptime: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

/* ─── Status banner config ─── */

const STATUS_BANNER: Record<
  HealthStatus,
  { bg: string; border: string; dot: string; text: string; label: string }
> = {
  healthy: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    label: "All Systems Operational",
  },
  degraded: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    text: "text-amber-400",
    label: "Partial System Degradation",
  },
  down: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    dot: "bg-red-500",
    text: "text-red-400",
    label: "System Outage Detected",
  },
};

export default async function SystemHealthPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminSession();

  const health = await getSystemHealth();
  const banner = STATUS_BANNER[health.overallStatus];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          System Health
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Monitor platform APIs, rate limits, errors, and service uptime.
        </p>
      </div>

      {/* Overall status banner */}
      <div
        className={`flex items-center gap-4 rounded-xl border p-5 ${banner.bg} ${banner.border}`}
        data-testid="system-status-banner"
      >
        <span className="relative flex h-4 w-4">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${banner.dot}`}
          />
          <span
            className={`relative inline-flex h-4 w-4 rounded-full ${banner.dot}`}
          />
        </span>
        <div>
          <p className={`text-sm font-semibold ${banner.text}`}>
            {banner.label}
          </p>
          <p className="text-xs text-slate-500">
            Last updated{" "}
            {new Date(health.generatedAt).toLocaleString("en-ZA", {
              timeZone: "Africa/Johannesburg",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
            {" SAST"}
          </p>
        </div>
      </div>

      {/* Health monitoring grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ApiHealthStatus initialData={health.platforms} />
        <RateLimitMonitor initialData={health.rateLimits} />
      </div>

      {/* Uptime display */}
      <UptimeDisplay initialData={health.uptime} />

      {/* Error log (full width) */}
      <ErrorLog initialData={health.errors} />
    </div>
  );
}
