import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import { Link } from "@/i18n/navigation";

// ─── Mock Data ──────────────────────────────────────────────────

const CREDITS_DATA = {
  currentBalance: 42,
  usedThisMonth: 158,
  monthlyAllocation: 200,
} as const;

// ─── Component ──────────────────────────────────────────────────

/**
 * Credits summary card for the dashboard overview.
 *
 * Displays current credit balance, monthly usage with a visual
 * progress bar, and a link to purchase more credits.
 *
 * Server component — no interactivity needed.
 */
export function CreditsSummary({ className }: { className?: string }) {
  const t = useTranslations("dashboard");

  const { currentBalance, usedThisMonth, monthlyAllocation } = CREDITS_DATA;
  const usagePercent = Math.round((usedThisMonth / monthlyAllocation) * 100);

  return (
    <Card as="section" padding="lg" className={className}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text">
          {t("creditsSummaryTitle")}
        </h2>
        <Link
          href="/billing"
          className={cn(
            "text-xs font-medium text-brand",
            "transition-colors hover:text-brand-vivid",
          )}
        >
          {t("buyMoreCredits")}
        </Link>
      </div>

      {/* Balance highlight */}
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("currentBalance")}
        </div>
        <div className="font-display text-4xl leading-none tracking-tight text-text mt-1">
          {currentBalance}
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {t("creditsRemaining")}
        </div>
      </div>

      {/* Usage stats */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("usedThisMonth")}
          </div>
          <div className="mt-1 font-mono text-xl font-semibold text-text">
            {usedThisMonth}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("monthlyAllocation")}
          </div>
          <div className="mt-1 font-mono text-xl font-semibold text-text">
            {monthlyAllocation}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span>{t("usageLabel")}</span>
          <span className="font-mono">{usagePercent}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-inset"
          role="progressbar"
          aria-valuenow={usagePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("usageLabel")}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              usagePercent >= 90
                ? "bg-error"
                : usagePercent >= 70
                  ? "bg-warning"
                  : "bg-brand",
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
