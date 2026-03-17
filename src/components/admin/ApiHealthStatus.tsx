/**
 * API health status component
 *
 * Displays per-platform health indicators for social media APIs.
 * Each platform shows its current status (healthy/degraded/down),
 * last check time, and response latency. Auto-refreshes every 60s.
 *
 * Client component — uses polling for live updates.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlatformHealth, HealthStatus } from "@/types/admin-system";

/* ─── Platform display config ─── */

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📷",
  facebook: "📘",
  twitter: "🐦",
  linkedin: "💼",
  tiktok: "🎵",
};

const STATUS_CONFIG: Record<HealthStatus, { color: string; label: string; pulse: boolean }> = {
  healthy: { color: "bg-emerald-500", label: "Healthy", pulse: true },
  degraded: { color: "bg-amber-500", label: "Degraded", pulse: true },
  down: { color: "bg-red-500", label: "Down", pulse: false },
};

const REFRESH_INTERVAL_MS = 60_000;

/* ─── Component ─── */

interface ApiHealthStatusProps {
  initialData: PlatformHealth[];
}

export function ApiHealthStatus({ initialData }: ApiHealthStatusProps) {
  const [platforms, setPlatforms] = useState<PlatformHealth[]>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/system");
      if (res.ok) {
        const json = await res.json() as { success: boolean; data?: { platforms: PlatformHealth[] } };
        if (json.success && json.data) {
          setPlatforms(json.data.platforms);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
      data-testid="api-health-status"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">API Health</h3>
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          aria-label="Refresh health status"
        >
          {isRefreshing ? "Checking…" : "Refresh"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {platforms.map((platform) => {
          const config = STATUS_CONFIG[platform.status];
          const label = PLATFORM_LABELS[platform.platform] ?? platform.platform;
          const icon = PLATFORM_ICONS[platform.platform] ?? "🌐";
          const lastChecked = formatRelativeTime(platform.lastChecked);

          return (
            <div
              key={platform.platform}
              className="flex items-center gap-3 rounded-lg border border-slate-700/30 bg-slate-800/30 px-4 py-3"
              data-testid={`platform-health-${platform.platform}`}
            >
              {/* Platform icon + name */}
              <span className="text-lg" aria-hidden="true">
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">
                  Last checked {lastChecked}
                </p>
              </div>

              {/* Response time */}
              <div className="text-right">
                <p className="text-sm font-mono text-slate-300">
                  {platform.responseTimeMs}ms
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3" aria-hidden="true">
                  {config.pulse && (
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${config.color}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${config.color}`}
                  />
                </span>
                <span
                  className={`text-xs font-medium ${
                    platform.status === "healthy"
                      ? "text-emerald-400"
                      : platform.status === "degraded"
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                  data-testid={`status-label-${platform.platform}`}
                >
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-refresh note */}
      <p className="mt-3 text-xs text-slate-600">
        Auto-refreshes every 60 seconds
      </p>
    </div>
  );
}

/* ─── Helpers ─── */

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}
