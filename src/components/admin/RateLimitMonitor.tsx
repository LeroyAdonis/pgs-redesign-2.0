/**
 * Rate limit monitor component
 *
 * Displays rate limit usage per platform with visual progress bars.
 * Bars transition from green (low usage) through amber (warning >80%)
 * to red (critical >95%). Shows used/remaining quota and reset time.
 *
 * Client component — receives data via props, no direct fetching.
 */

"use client";

import { useState } from "react";
import type { RateLimitInfo, Platform } from "@/types/admin-system";

/* ─── Platform display names ─── */

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

/* ─── Component ─── */

interface RateLimitMonitorProps {
  initialData: RateLimitInfo[];
}

export function RateLimitMonitor({ initialData }: RateLimitMonitorProps) {
  const [limits] = useState<RateLimitInfo[]>(initialData);
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null);

  // Group by platform
  const grouped = limits.reduce<Record<string, RateLimitInfo[]>>((acc, limit) => {
    const key = limit.platform;
    if (!acc[key]) acc[key] = [];
    acc[key].push(limit);
    return acc;
  }, {});

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
      data-testid="rate-limit-monitor"
    >
      <h3 className="text-sm font-semibold text-slate-200">Rate Limits</h3>
      <p className="mt-1 text-xs text-slate-500">
        API quota usage across connected platforms
      </p>

      <div className="mt-4 space-y-3">
        {Object.entries(grouped).map(([platform, entries]) => {
          const isExpanded = expandedPlatform === platform;
          const worstRatio = Math.max(...entries.map((e) => e.used / e.limit));
          const worstLevel = getUsageLevel(worstRatio * 100);

          return (
            <div
              key={platform}
              className="rounded-lg border border-slate-700/30 bg-slate-800/30"
            >
              {/* Platform header — click to expand */}
              <button
                type="button"
                onClick={() =>
                  setExpandedPlatform(isExpanded ? null : (platform as Platform))
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-800/60"
                aria-expanded={isExpanded}
              >
                <span className="text-sm font-medium text-slate-200">
                  {PLATFORM_LABELS[platform] ?? platform}
                </span>
                <div className="flex items-center gap-2">
                  {worstLevel !== "normal" && (
                    <span
                      className={`text-xs font-medium ${
                        worstLevel === "critical"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                      data-testid={`rate-limit-badge-${platform}`}
                    >
                      {worstLevel === "critical" ? "⚠ Critical" : "⚡ Warning"}
                    </span>
                  )}
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6l4 4 4-4"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded endpoint details */}
              {isExpanded && (
                <div className="space-y-3 border-t border-slate-700/30 px-4 py-3">
                  {entries.map((entry) => {
                    const percent = (entry.used / entry.limit) * 100;
                    const level = getUsageLevel(percent);
                    const remaining = entry.limit - entry.used;
                    const resetsIn = formatTimeUntil(entry.resetsAt);

                    return (
                      <div key={`${entry.platform}-${entry.endpoint}`}>
                        <div className="flex items-baseline justify-between">
                          <p className="text-xs font-mono text-slate-400">
                            {entry.endpoint}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.used}/{entry.limit} · {remaining} left
                          </p>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                          <div
                            className={`h-full rounded-full transition-all ${getBarColor(level)}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                            role="progressbar"
                            aria-valuenow={entry.used}
                            aria-valuemin={0}
                            aria-valuemax={entry.limit}
                            aria-label={`${entry.endpoint}: ${entry.used} of ${entry.limit} used`}
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-600">
                          Resets {resetsIn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

type UsageLevel = "normal" | "warning" | "critical";

function getUsageLevel(percent: number): UsageLevel {
  if (percent >= 95) return "critical";
  if (percent >= 80) return "warning";
  return "normal";
}

function getBarColor(level: UsageLevel): string {
  switch (level) {
    case "critical":
      return "bg-gradient-to-r from-red-600 to-red-400";
    case "warning":
      return "bg-gradient-to-r from-amber-600 to-amber-400";
    default:
      return "bg-gradient-to-r from-emerald-600 to-emerald-400";
  }
}

function formatTimeUntil(isoString: string): string {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return "now";
  const diffMin = Math.ceil(diffMs / 60_000);
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  return `in ${diffHr}h ${diffMin % 60}m`;
}
