"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TIER_CONFIGS,
  type Tier,
  type TierLimits,
} from "@/lib/payments/tier-config";
import type { LimitType } from "@/lib/payments/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_ORDER: Tier[] = ["seedling", "hustler", "grower", "mogul"];

const LIMIT_TYPE_LABELS: Record<LimitType, string> = {
  social_accounts: "social accounts",
  ai_posts: "AI posts per month",
  image_gen: "image generations per month",
  video_gen: "video generations per month",
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

function formatLimit(value: number): string {
  return value === -1 ? "unlimited" : value.toLocaleString("en-ZA");
}

function formatPrice(priceZAR: number): string {
  return priceZAR === 0
    ? "Free"
    : priceZAR.toLocaleString("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 0,
      });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface UpgradeBannerProps {
  /** The kind of limit that was reached */
  limitType: LimitType;
  /** The org's current tier */
  currentTier: Tier;
  /** Current usage count */
  currentCount: number;
  /** The tier's limit for this resource */
  limit: number;
  /** Explicit upgrade tier from enforcement result (optional) */
  upgradeRequired?: Tier;
  /** Callback when user dismisses the banner */
  onDismiss?: () => void;
}

/**
 * Full-width upgrade banner shown when a tier limit is reached.
 *
 * More prominent than UpgradePrompt — designed to sit at the top of
 * a page or section. Shows current usage, the limit, the next tier's
 * offering with price, and a clear upgrade CTA.
 *
 * Dismissible via X button or optional onDismiss callback.
 */
export function UpgradeBanner({
  limitType,
  currentTier,
  currentCount,
  limit,
  upgradeRequired,
  onDismiss,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tierConfig = TIER_CONFIGS[currentTier];
  const nextTier = upgradeRequired ?? getNextTier(currentTier);
  const nextTierConfig = nextTier ? TIER_CONFIGS[nextTier] : null;
  const featureLabel = LIMIT_TYPE_LABELS[limitType];
  const configKey = LIMIT_TYPE_TO_CONFIG_KEY[limitType];
  const nextTierLimit = nextTierConfig
    ? nextTierConfig.limits[configKey]
    : null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className="relative w-full overflow-hidden rounded-xl border border-purple-300/30 bg-gradient-to-r from-purple-900/20 via-purple-800/15 to-indigo-900/20 p-5 shadow-lg dark:border-purple-500/20 dark:from-purple-900/30 dark:via-purple-800/25 dark:to-indigo-900/30"
    >
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Icon + message */}
        <div className="flex items-start gap-3 sm:items-center">
          {/* Rocket icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 dark:bg-purple-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-purple-400"
              aria-hidden="true"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-purple-100 dark:text-purple-50">
              You&apos;ve used{" "}
              <span className="text-purple-300">
                {currentCount}/{formatLimit(limit)}
              </span>{" "}
              {featureLabel} on your{" "}
              <span className="font-bold">{tierConfig.displayName}</span> plan
            </p>

            {nextTierConfig && nextTierLimit !== null && (
              <p className="text-xs text-purple-300/80 dark:text-purple-300/70">
                Upgrade to{" "}
                <span className="font-semibold text-purple-200">
                  {nextTierConfig.displayName}
                </span>{" "}
                for {formatLimit(nextTierLimit)} {featureLabel} —{" "}
                {formatPrice(nextTierConfig.monthlyPriceZAR)}/mo
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/billing#pricing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-500 hover:shadow-lg active:scale-[0.98] dark:bg-purple-500 dark:hover:bg-purple-400"
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
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
            Upgrade Now
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-purple-400 transition-colors hover:bg-purple-500/20 hover:text-purple-200"
            aria-label="Dismiss upgrade banner"
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
        </div>
      </div>
    </div>
  );
}
