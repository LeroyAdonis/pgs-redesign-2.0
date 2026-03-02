"use client";

import Link from "next/link";
import { TIER_CONFIGS, type Tier, type TierLimits } from "@/lib/payments/tier-config";
import type { LimitType } from "@/lib/payments/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_ORDER: Tier[] = ["seedling", "hustler", "grower", "mogul"];

const LIMIT_TYPE_LABELS: Record<LimitType, string> = {
  social_accounts: "social accounts",
  ai_posts: "AI posts",
  image_gen: "image generations",
  video_gen: "video generations",
  team_seats: "team seats",
};

const LIMIT_TYPE_TO_CONFIG_KEY: Record<LimitType, keyof TierLimits> = {
  social_accounts: "socialAccounts",
  ai_posts: "aiPostsPerMonth",
  image_gen: "imageGenPerMonth",
  video_gen: "videoGenPerMonth",
  team_seats: "teamSeats",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNextTier(currentTier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface UpgradePromptProps {
  limitType: LimitType;
  currentTier: Tier;
  currentCount: number;
  limit: number;
  onDismiss?: () => void;
}

/**
 * Inline warning banner shown when a tier limit is reached.
 *
 * Displays the current usage, the limit, and what the next tier offers.
 * Includes a CTA button linking to the billing/pricing page and an
 * optional dismiss button.
 */
export function UpgradePrompt({
  limitType,
  currentTier,
  currentCount,
  limit,
  onDismiss,
}: UpgradePromptProps) {
  const tierConfig = TIER_CONFIGS[currentTier];
  const nextTier = getNextTier(currentTier);
  const nextTierConfig = nextTier ? TIER_CONFIGS[nextTier] : null;
  const featureLabel = LIMIT_TYPE_LABELS[limitType];
  const configKey = LIMIT_TYPE_TO_CONFIG_KEY[limitType];
  const nextTierLimit = nextTierConfig ? nextTierConfig.limits[configKey] : null;

  return (
    <div
      role="alert"
      className="relative flex flex-col gap-3 rounded-lg border border-amber-300/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:gap-4 dark:border-amber-500/20 dark:bg-amber-500/5"
    >
      {/* Warning icon */}
      <div className="flex shrink-0 items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          You&apos;ve reached your {limit} {featureLabel} limit on the{" "}
          {tierConfig.displayName} plan
          <span className="ml-1 text-amber-600 dark:text-amber-400">
            ({currentCount}/{limit === -1 ? "∞" : limit})
          </span>
        </p>
        {nextTierConfig && nextTierLimit !== null && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Upgrade to {nextTierConfig.displayName} for{" "}
            {nextTierLimit === -1 ? "unlimited" : nextTierLimit} {featureLabel}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/dashboard/billing#pricing"
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
          Upgrade Plan
        </Link>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
