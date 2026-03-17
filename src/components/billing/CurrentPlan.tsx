"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn, formatZAR, formatDateSAST } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import type { SubscriptionInfo, SubscriptionStatus } from "@/lib/payments/types";
import type { TierConfig, Tier } from "@/lib/payments/tier-config";

/* ─── Constants ─── */

const TIER_ICONS: Record<Tier, string> = {
  seedling: "🌱",
  hustler: "🔥",
  grower: "🚀",
  mogul: "👑",
};

const STATUS_STYLES: Record<
  SubscriptionStatus,
  { bg: string; text: string }
> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  past_due: { bg: "bg-amber-500/10", text: "text-amber-400" },
  canceled: { bg: "bg-red-500/10", text: "text-red-400" },
  trialing: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

const STATUS_KEYS: Record<SubscriptionStatus, string> = {
  active: "status.active",
  past_due: "status.pastDue",
  canceled: "status.canceled",
  trialing: "status.trialing",
};

/* ─── Props ─── */

interface CurrentPlanProps {
  subscription: SubscriptionInfo | null;
  tierConfig: TierConfig;
  locale: string;
}

/* ─── Component ─── */

/**
 * Displays the user's current subscription plan with status,
 * pricing, billing date, limits summary, and management actions.
 */
export function CurrentPlan({ subscription, tierConfig }: CurrentPlanProps) {
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const t = useTranslations("billing");

  const tier = subscription?.tier ?? "seedling";
  const icon = TIER_ICONS[tier];
  const status = subscription?.status ?? "active";
  const statusStyle = STATUS_STYLES[status];

  const isPaidActive =
    subscription !== null &&
    subscription.status === "active" &&
    tier !== "seedling";

  async function handleCancel() {
    const confirmed = window.confirm(t("cancelConfirm"));
    if (!confirmed) return;

    setCanceling(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to cancel subscription");
      }
      window.location.reload();
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "Failed to cancel subscription",
      );
    } finally {
      setCanceling(false);
    }
  }

  return (
    <Card as="section" padding="lg">
      <div data-testid="current-plan">
        <h2 className="mb-5 font-display text-lg font-semibold text-text">
          {t("currentPlan")}
        </h2>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Plan info */}
          <div className="space-y-4">
            {/* Tier name + status */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl" data-testid="tier-icon">
                {icon}
              </span>
              <h3
                className="font-display text-xl font-bold text-text"
                data-testid="tier-name"
              >
                {tierConfig.displayName}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusStyle.bg,
                  statusStyle.text,
                )}
                data-testid="status-badge"
              >
                {t(STATUS_KEYS[status])}
              </span>
            </div>

            {/* Price */}
            <div className="text-sm text-text-muted">
              <span
                className="font-mono text-lg font-semibold text-text"
                data-testid="plan-price"
              >
                {formatZAR(tierConfig.monthlyPriceZAR)}
              </span>
              {" "}{tierConfig.monthlyPriceZAR > 0 ? t("perMonth") : t("freeForever")}
            </div>

            {/* Next billing date */}
            {subscription?.currentPeriodEnd && !subscription.canceledAt && (
              <p className="text-sm text-text-muted" data-testid="next-billing-date">
                {t("nextBilling")}{" "}
                <span className="font-medium text-text">
                  {formatDateSAST(new Date(subscription.currentPeriodEnd), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

            {/* Cancellation notice */}
            {subscription?.canceledAt && subscription.currentPeriodEnd && (
              <div
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
                data-testid="cancellation-notice"
              >
                {t("activeUntil")}{" "}
                <span className="font-medium">
                  {formatDateSAST(new Date(subscription.currentPeriodEnd), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Key limits */}
            <div className="flex flex-wrap gap-4 text-sm" data-testid="plan-limits">
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <span className="text-text-muted">{t("features.socialAccounts")}</span>{" "}
                <span className="font-semibold text-text">
                  {tierConfig.limits.socialAccounts === -1
                    ? t("features.unlimited")
                    : tierConfig.limits.socialAccounts}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <span className="text-text-muted">{t("features.aiPosts")}</span>{" "}
                <span className="font-semibold text-text">
                  {tierConfig.limits.aiPostsPerMonth}{t("moSuffix")}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <span className="text-text-muted">{t("features.teamSeats")}</span>{" "}
                <span className="font-semibold text-text">
                  {tierConfig.limits.teamSeats === -1
                    ? t("features.unlimited")
                    : tierConfig.limits.teamSeats}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:items-end">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-vivid"
              data-testid="change-plan-button"
            >
              {t("changePlan")}
            </a>

            {isPaidActive && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={canceling}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="cancel-subscription-button"
              >
                {canceling ? t("canceling") : t("cancelSubscription")}
              </button>
            )}

            {cancelError && (
              <p className="text-sm text-red-400" data-testid="cancel-error">
                {cancelError}
              </p>
            )}
          </div>
        </div>

        {/* Free plan state */}
        {subscription === null && (
          <div
            className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted"
            data-testid="free-plan-notice"
          >
            {t("freePlanNotice")}{" "}
            <a
              href="#pricing"
              className="font-medium text-brand hover:text-brand-vivid"
            >
              {t("upgradeToUnlock")}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
