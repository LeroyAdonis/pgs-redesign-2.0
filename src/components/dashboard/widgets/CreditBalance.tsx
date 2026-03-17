"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import type { CreditBalance as CreditBalanceType } from "@/lib/credits";

/* ─── Props ─── */

interface CreditBalanceProps {
  balance: CreditBalanceType;
  className?: string;
}

/* ─── Helpers ─── */

/**
 * Remaining-credits percentage (inverse of usagePercentage).
 * Used for the circular progress and colour thresholds.
 */
function remainingPercent(usagePercentage: number): number {
  return Math.max(0, Math.min(100, 100 - usagePercentage));
}

/** Colour bucket based on how much credit is left. */
function statusColor(remaining: number): {
  stroke: string;
  text: string;
  label: string;
} {
  if (remaining > 50)
    return { stroke: "stroke-emerald-500", text: "text-emerald-500", label: "Healthy" };
  if (remaining > 25)
    return { stroke: "stroke-amber-400", text: "text-amber-400", label: "Getting low" };
  return { stroke: "stroke-red-500", text: "text-red-500", label: "Low" };
}

/* ─── Circular Progress ─── */

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularProgress({
  percent,
  colorClass,
}: {
  percent: number;
  colorClass: string;
}) {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 120 120"
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Background ring */}
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        strokeWidth="10"
        className="stroke-surface-inset"
      />
      {/* Value ring */}
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        className={cn("transition-all duration-700 ease-out", colorClass)}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

/* ─── Main Component ─── */

/**
 * Credit balance display widget with circular progress indicator.
 *
 * Shows the current balance prominently inside a circular gauge,
 * with colour-coded status (green → yellow → red) based on
 * remaining credit percentage.
 */
export function CreditBalance({ balance, className }: CreditBalanceProps) {
  const remaining = remainingPercent(balance.usagePercentage);
  const { stroke, text, label } = statusColor(remaining);

  return (
    <Card as="section" padding="lg" className={className}>
      <div data-testid="credit-balance-widget">
      {/* Header */}
      <h2 className="mb-5 font-display text-lg font-semibold text-text">
        Credit Balance
      </h2>

      {/* Circular gauge + balance */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        <div className="relative flex items-center justify-center">
          <CircularProgress percent={remaining} colorClass={stroke} />
          {/* Centered number inside the ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display text-3xl font-bold tracking-tight text-text"
              data-testid="balance-value"
            >
              {balance.balance.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted">credits</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4">
          {/* Usage percentage */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Usage
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-text">
                {balance.usagePercentage}%
              </span>
              <span className={cn("text-xs font-medium", text)} data-testid="status-label">
                {label}
              </span>
            </div>
          </div>

          {/* Monthly allocation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Monthly
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-text">
                {balance.monthlyAllocation.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Rollover
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-text">
                {balance.rolloverBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low-balance warning */}
      {balance.isLowBalance && (
        <div
          className="mt-5 flex items-center gap-2 rounded-none border border-red-500/20 bg-red-500/10 px-4 py-3"
          role="alert"
          data-testid="low-balance-warning"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="shrink-0 text-red-500"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 2 1 17h18L10 2ZM10 7v5M10 14.5v.5"
            />
          </svg>
          <p className="text-sm font-medium text-red-400">
            Your credit balance is running low. Top up to avoid service interruptions.
          </p>
        </div>
      )}
      </div>
    </Card>
  );
}
