"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn, formatZAR } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import { TIER_CONFIGS, type Tier, type TierConfig } from "@/lib/payments/tier-config";

/* ─── Constants ─── */

const TIER_ORDER: Tier[] = ["seedling", "hustler", "grower", "mogul"];

const TIER_ICONS: Record<Tier, string> = {
  seedling: "🌱",
  hustler: "🔥",
  grower: "🚀",
  mogul: "👑",
};

const TIER_INDEX: Record<Tier, number> = {
  seedling: 0,
  hustler: 1,
  grower: 2,
  mogul: 3,
};

/* ─── Props ─── */

interface PricingCardsProps {
  currentTier?: Tier;
  onSelectTier: (tier: Tier, interval: "monthly" | "annual") => void;
  isLoading?: boolean;
}

/* ─── Helpers ─── */

/** Annual savings percentage. Returns 0 for free tier. */
function annualSavingsPercent(config: TierConfig): number {
  if (config.monthlyPriceZAR === 0) return 0;
  const yearlyAtMonthly = config.monthlyPriceZAR * 12;
  return Math.round(
    ((yearlyAtMonthly - config.annualPriceZAR) / yearlyAtMonthly) * 100,
  );
}

/* ─── Component ─── */

/**
 * Pricing comparison grid with monthly/annual toggle.
 *
 * Renders all 4 tiers from TIER_CONFIGS. The current tier is highlighted
 * and its CTA button is disabled. Hustler is marked as "Most Popular".
 */
export function PricingCards({
  currentTier,
  onSelectTier,
  isLoading = false,
}: PricingCardsProps) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const t = useTranslations("billing");

  /** Build the feature list for a tier card from its config. */
  function getFeatureItems(
    config: TierConfig,
  ): { label: string; available: boolean }[] {
    const unlimited = t("features.unlimited");
    return [
      {
        label: t("features.socialAccountsCount", {
          count: config.limits.socialAccounts === -1 ? unlimited : String(config.limits.socialAccounts),
        }),
        available: true,
      },
      {
        label: t("features.aiPostsCount", { count: String(config.limits.aiPostsPerMonth) }),
        available: true,
      },
      {
        label: t("features.creditsCount", { count: String(config.creditAllocation) }),
        available: true,
      },
      {
        label: t("features.imageGenCount", { count: String(config.limits.imageGenPerMonth) }),
        available: config.limits.imageGenPerMonth > 0,
      },
      {
        label: t("features.videoGenCount", { count: String(config.limits.videoGenPerMonth) }),
        available: config.limits.videoGenPerMonth > 0,
      },
      {
        label: t("features.teamSeatsCount", {
          count: config.limits.teamSeats === -1 ? unlimited : String(config.limits.teamSeats),
        }),
        available: true,
      },
      {
        label: t("features.creditRollover"),
        available: config.features.creditRollover,
      },
      {
        label: t("features.whatsappBusiness"),
        available: config.features.whatsappBusiness,
      },
    ];
  }

  /** CTA label for a tier relative to the current tier. */
  function getCtaLabel(tier: Tier): string {
    if (currentTier === tier) return t("currentPlanBadge");
    if (!currentTier) return tier === "seedling" ? t("getStarted") : t("upgrade");
    if (TIER_INDEX[tier] > TIER_INDEX[currentTier]) return t("upgrade");
    return t("downgrade");
  }

  return (
    <div data-testid="pricing-cards">
      {/* Monthly / Annual toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            interval === "monthly" ? "text-text" : "text-text-muted",
          )}
        >
          {t("monthly")}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={interval === "annual"}
          aria-label={t("toggleAnnual")}
          onClick={() =>
            setInterval((prev) => (prev === "monthly" ? "annual" : "monthly"))
          }
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
            interval === "annual" ? "bg-brand" : "bg-surface-inset",
          )}
          data-testid="billing-toggle"
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              interval === "annual" ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>

        <span
          className={cn(
            "text-sm font-medium transition-colors",
            interval === "annual" ? "text-text" : "text-text-muted",
          )}
        >
          {t("annually")}
        </span>
      </div>

      {/* Tier cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((tier) => {
          const config = TIER_CONFIGS[tier];
          const isCurrent = currentTier === tier;
          const isPopular = tier === "hustler";
          const savings = annualSavingsPercent(config);
          const price =
            interval === "annual" && config.annualPriceZAR > 0
              ? config.annualPriceZAR / 12
              : config.monthlyPriceZAR;
          const features = getFeatureItems(config);
          const ctaLabel = getCtaLabel(tier);

          return (
            <Card
              key={tier}
              interactive={!isCurrent}
              padding="none"
              className={cn(
                "relative flex flex-col",
                isCurrent && "ring-2 ring-brand",
              )}
            >
              <div
                className="flex flex-1 flex-col p-5"
                data-testid={`tier-card-${tier}`}
              >
                {/* Badges */}
                {isPopular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white shadow-sm"
                    data-testid="most-popular-badge"
                  >
                    {t("mostPopular")}
                  </span>
                )}
                {isCurrent && (
                  <span
                    className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm"
                    data-testid="current-plan-badge"
                  >
                    {t("currentPlanBadge")}
                  </span>
                )}

                {/* Header */}
                <div className="mb-4 text-center">
                  <span className="text-3xl" aria-hidden="true">
                    {TIER_ICONS[tier]}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold text-text">
                    {config.displayName}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-5 text-center">
                  <span
                    className="font-mono text-3xl font-bold text-text"
                    data-testid={`price-${tier}`}
                  >
                    {formatZAR(price)}
                  </span>
                  <span className="text-sm text-text-muted">{" "}{t("perMonth")}</span>

                  {interval === "annual" && savings > 0 && (
                    <div className="mt-1">
                      <span
                        className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                        data-testid={`savings-badge-${tier}`}
                      >
                        {t("savePercent", { percent: savings })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Credits */}
                <div className="mb-5 text-center text-sm text-text-muted">
                  <span className="font-semibold text-text">
                    {config.creditAllocation}
                  </span>{" "}
                  {t("creditsPerMonth")}
                </div>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-2">
                  {features.map((feature) => (
                    <li
                      key={feature.label}
                      className={cn(
                        "flex items-start gap-2 text-sm",
                        feature.available
                          ? "text-text-muted"
                          : "text-text-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 text-sm",
                          feature.available
                            ? "text-emerald-400"
                            : "text-red-400/50",
                        )}
                        aria-hidden="true"
                      >
                        {feature.available ? "✓" : "✗"}
                      </span>
                      {feature.label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  disabled={isCurrent || isLoading}
                  onClick={() => onSelectTier(tier, interval)}
                  className={cn(
                    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    isCurrent
                      ? "cursor-not-allowed bg-surface-inset text-text-muted"
                      : "bg-brand text-white shadow-sm hover:bg-brand-vivid",
                    isLoading && !isCurrent && "cursor-wait opacity-60",
                  )}
                  data-testid={`cta-${tier}`}
                >
                  {isLoading && !isCurrent ? t("processing") : ctaLabel}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
