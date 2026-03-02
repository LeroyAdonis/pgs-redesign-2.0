"use client";

import { Modal } from "@/components/overlays/Modal";
import { Button } from "@/components/ui/Button";
import { cn, formatZAR } from "@/lib/utils";
import {
  TIER_CONFIGS,
  type Tier,
  type TierConfig,
  type BillingInterval,
} from "@/lib/payments/tier-config";

/* ─── Constants ─── */

const TIER_INDEX: Record<Tier, number> = {
  seedling: 0,
  hustler: 1,
  grower: 2,
  mogul: 3,
};

const TIER_ICONS: Record<Tier, string> = {
  seedling: "🌱",
  hustler: "🔥",
  grower: "🚀",
  mogul: "👑",
};

const SCHEDULING_LABELS: Record<string, string> = {
  manual: "Manual only",
  manual_ai_weekly: "Manual + AI weekly",
  ai_daily_weekly: "AI daily & weekly",
  full_autonomous: "Full autonomous",
};

/* ─── Types ─── */

interface TierChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: Tier;
  targetTier: Tier;
  billingInterval: BillingInterval;
  onConfirm: () => void;
  isLoading: boolean;
}

interface LimitComparison {
  label: string;
  currentValue: string;
  targetValue: string;
  /** positive = gain, negative = loss, 0 = same */
  direction: "gain" | "loss" | "same";
}

interface FeatureChange {
  label: string;
  type: "gained" | "lost";
}

/* ─── Helpers ─── */

function formatLimit(value: number, suffix?: string): string {
  if (value === -1) return "Unlimited";
  return suffix ? `${value} ${suffix}` : String(value);
}

function getEffectivePrice(config: TierConfig, interval: BillingInterval): number {
  if (interval === "annual" && config.annualPriceZAR > 0) {
    return config.annualPriceZAR / 12;
  }
  return config.monthlyPriceZAR;
}

function compareLimits(
  current: TierConfig,
  target: TierConfig,
): LimitComparison[] {
  const pairs: {
    label: string;
    key: keyof TierConfig["limits"];
    suffix?: string;
  }[] = [
    { label: "Social accounts", key: "socialAccounts" },
    { label: "AI posts / month", key: "aiPostsPerMonth" },
    { label: "Image generations / month", key: "imageGenPerMonth" },
    { label: "Video generations / month", key: "videoGenPerMonth" },
    { label: "Team seats", key: "teamSeats" },
  ];

  return pairs.map(({ label, key, suffix }) => {
    const cv = current.limits[key];
    const tv = target.limits[key];

    let direction: LimitComparison["direction"] = "same";
    // -1 means unlimited, so it's always >= any finite value
    if (tv === -1 && cv !== -1) direction = "gain";
    else if (cv === -1 && tv !== -1) direction = "loss";
    else if (tv > cv) direction = "gain";
    else if (tv < cv) direction = "loss";

    return {
      label,
      currentValue: formatLimit(cv, suffix),
      targetValue: formatLimit(tv, suffix),
      direction,
    };
  });
}

function getFeatureChanges(
  current: TierConfig,
  target: TierConfig,
): FeatureChange[] {
  const changes: FeatureChange[] = [];

  // Credit rollover
  if (!current.features.creditRollover && target.features.creditRollover) {
    changes.push({ label: "Credit rollover", type: "gained" });
  } else if (current.features.creditRollover && !target.features.creditRollover) {
    changes.push({ label: "Credit rollover", type: "lost" });
  }

  // WhatsApp Business
  if (!current.features.whatsappBusiness && target.features.whatsappBusiness) {
    changes.push({ label: "WhatsApp Business", type: "gained" });
  } else if (current.features.whatsappBusiness && !target.features.whatsappBusiness) {
    changes.push({ label: "WhatsApp Business", type: "lost" });
  }

  // Platforms gained/lost
  const currentPlatforms = new Set(current.features.platforms);
  const targetPlatforms = new Set(target.features.platforms);

  for (const p of targetPlatforms) {
    if (!currentPlatforms.has(p)) {
      changes.push({
        label: `${p.charAt(0).toUpperCase()}${p.slice(1)} integration`,
        type: "gained",
      });
    }
  }
  for (const p of currentPlatforms) {
    if (!targetPlatforms.has(p)) {
      changes.push({
        label: `${p.charAt(0).toUpperCase()}${p.slice(1)} integration`,
        type: "lost",
      });
    }
  }

  // Scheduling mode change
  if (current.features.schedulingMode !== target.features.schedulingMode) {
    const currentLabel = SCHEDULING_LABELS[current.features.schedulingMode];
    const targetLabel = SCHEDULING_LABELS[target.features.schedulingMode];
    const currentIdx = Object.keys(SCHEDULING_LABELS).indexOf(current.features.schedulingMode);
    const targetIdx = Object.keys(SCHEDULING_LABELS).indexOf(target.features.schedulingMode);

    if (targetIdx > currentIdx) {
      changes.push({ label: `Scheduling: ${targetLabel}`, type: "gained" });
    } else {
      changes.push({ label: `Scheduling downgraded to: ${targetLabel}`, type: "lost" });
    }
  }

  return changes;
}

/* ─── Sub-components ─── */

function TierSummaryCard({
  config,
  interval,
  variant,
}: {
  config: TierConfig;
  interval: BillingInterval;
  variant: "current" | "target";
}) {
  const price = getEffectivePrice(config, interval);
  const isCurrent = variant === "current";

  return (
    <div
      className={cn(
        "flex-1 rounded-lg border p-4",
        isCurrent
          ? "border-border bg-surface"
          : "border-brand/30 bg-brand-surface",
      )}
    >
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
        {isCurrent ? "Current Plan" : "New Plan"}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          {TIER_ICONS[config.tier]}
        </span>
        <span className="font-display text-lg font-bold text-text">
          {config.displayName}
        </span>
      </div>
      <div className="mt-2">
        <span className="font-mono text-xl font-bold text-text">
          {formatZAR(price)}
        </span>
        <span className="text-sm text-text-muted"> / month</span>
      </div>
      <div className="mt-1 text-xs text-text-muted">
        {config.creditAllocation} credits/month
      </div>
    </div>
  );
}

function ChangesList({
  limitComparisons,
  featureChanges,
  isUpgrade,
}: {
  limitComparisons: LimitComparison[];
  featureChanges: FeatureChange[];
  isUpgrade: boolean;
}) {
  const gains = featureChanges.filter((f) => f.type === "gained");
  const losses = featureChanges.filter((f) => f.type === "lost");
  const limitChanges = limitComparisons.filter((l) => l.direction !== "same");

  const hasChanges = limitChanges.length > 0 || gains.length > 0 || losses.length > 0;

  if (!hasChanges) {
    return (
      <p className="text-sm text-text-muted">
        No significant changes between these tiers.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Limit changes */}
      {limitChanges.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Limit Changes
          </h4>
          <div className="space-y-1.5">
            {limitChanges.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-muted">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">{item.currentValue}</span>
                  <span className="text-text-muted" aria-hidden="true">
                    →
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      item.direction === "gain"
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {item.targetValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features gained */}
      {gains.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {isUpgrade ? "You'll gain" : "New features"}
          </h4>
          <ul className="space-y-1">
            {gains.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-400" aria-hidden="true">
                  ✓
                </span>
                <span className="text-text-muted">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Features lost */}
      {losses.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
            {isUpgrade ? "Note" : "You'll lose"}
          </h4>
          <ul className="space-y-1">
            {losses.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm">
                <span className="text-red-400" aria-hidden="true">
                  ✗
                </span>
                <span className="text-text-muted">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

/**
 * Tier change confirmation modal.
 *
 * Shows a side-by-side comparison of the current and target tiers,
 * listing feature gains/losses and pricing differences. Uses the
 * existing Modal overlay for focus trap, ESC-to-close, and scroll lock.
 */
export function TierChangeModal({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  billingInterval,
  onConfirm,
  isLoading,
}: TierChangeModalProps) {
  const currentConfig = TIER_CONFIGS[currentTier];
  const targetConfig = TIER_CONFIGS[targetTier];
  const isUpgrade = TIER_INDEX[targetTier] > TIER_INDEX[currentTier];

  const currentPrice = getEffectivePrice(currentConfig, billingInterval);
  const targetPrice = getEffectivePrice(targetConfig, billingInterval);
  const priceDiff = targetPrice - currentPrice;

  const limitComparisons = compareLimits(currentConfig, targetConfig);
  const featureChanges = getFeatureChanges(currentConfig, targetConfig);

  const title = isUpgrade
    ? `Upgrade to ${targetConfig.displayName}`
    : `Downgrade to ${targetConfig.displayName}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={isUpgrade ? "primary" : "danger"}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Side-by-side tier summary */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <TierSummaryCard
            config={currentConfig}
            interval={billingInterval}
            variant="current"
          />
          {/* Arrow between cards */}
          <div className="flex items-center justify-center sm:flex-col">
            <span
              className="text-xl text-text-muted sm:rotate-0"
              aria-hidden="true"
            >
              →
            </span>
          </div>
          <TierSummaryCard
            config={targetConfig}
            interval={billingInterval}
            variant="target"
          />
        </div>

        {/* Pricing difference banner */}
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm",
            isUpgrade
              ? "border border-brand/20 bg-brand-surface text-text"
              : "border border-amber-500/20 bg-amber-500/10 text-amber-200",
          )}
        >
          {priceDiff === 0 ? (
            <span>No change in monthly cost.</span>
          ) : priceDiff > 0 ? (
            <span>
              Your monthly cost will increase by{" "}
              <strong className="font-semibold">{formatZAR(priceDiff)}</strong>{" "}
              (from {formatZAR(currentPrice)} to {formatZAR(targetPrice)}).
            </span>
          ) : (
            <span>
              Your monthly cost will decrease by{" "}
              <strong className="font-semibold">
                {formatZAR(Math.abs(priceDiff))}
              </strong>{" "}
              (from {formatZAR(currentPrice)} to {formatZAR(targetPrice)}).
            </span>
          )}
          {billingInterval === "annual" && (
            <span className="ml-1 text-text-muted">(billed annually)</span>
          )}
        </div>

        {/* Downgrade warning */}
        {!isUpgrade && (
          <div
            className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
            role="alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p className="text-sm text-red-300">
              Downgrading may result in loss of access to features and data that
              exceed the new plan&apos;s limits. This change takes effect at the
              end of your current billing period.
            </p>
          </div>
        )}

        {/* Detailed changes */}
        <ChangesList
          limitComparisons={limitComparisons}
          featureChanges={featureChanges}
          isUpgrade={isUpgrade}
        />
      </div>
    </Modal>
  );
}

export type { TierChangeModalProps };
