"use client";

import { useTranslations } from "next-intl";

/**
 * AutonomousToggle — Toggle between manual and autonomous scheduling modes.
 *
 * Manual mode requires the user to review and approve each post.
 * Autonomous mode lets AI schedule and publish automatically.
 * Restricted to grower/mogul tiers.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { SchedulingMode, SubscriptionTier } from "./types";

/* ─── Props ─── */

interface AutonomousToggleProps {
  currentMode: SchedulingMode;
  onModeChange: (mode: SchedulingMode) => void;
  tier: SubscriptionTier;
}

/* ─── Tier access ─── */

const AUTONOMOUS_TIERS: SubscriptionTier[] = ["grower", "mogul"];

/* ─── Component ─── */

export function AutonomousToggle({
  currentMode,
  onModeChange,
  tier,
}: AutonomousToggleProps) {
  const canUseAutonomous = AUTONOMOUS_TIERS.includes(tier);
  const isAutonomous = currentMode === "autonomous";

  function handleToggle() {
    if (!canUseAutonomous) return;
    onModeChange(isAutonomous ? "manual" : "autonomous");
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-none border p-4 sm:flex-row sm:items-center sm:justify-between",
        isAutonomous
          ? "border-brand/30 bg-brand-surface/30"
          : "border-border bg-surface",
      )}
      data-testid="autonomous-toggle"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text">Scheduling Mode</h3>
          <Badge
            variant={isAutonomous ? "brand" : "default"}
            size="sm"
          >
            {isAutonomous ? "Autonomous" : "Manual"}
          </Badge>
        </div>
        <p className="text-xs text-text-muted">
          {isAutonomous
            ? "AI schedules and publishes automatically"
            : "Review and approve each post before publishing"}
        </p>

        {!canUseAutonomous && (
          <p className="mt-1 text-xs text-warning" data-testid="tier-restriction">
            Upgrade to Grower for autonomous scheduling
          </p>
        )}
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isAutonomous}
        aria-label="Toggle autonomous scheduling"
        disabled={!canUseAutonomous}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
          "transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          isAutonomous ? "bg-brand" : "bg-surface-inset",
          !canUseAutonomous && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            isAutonomous ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
