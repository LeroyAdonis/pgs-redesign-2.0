/**
 * Billing / Credits Page — Server Component
 *
 * Route: /[locale]/dashboard/billing
 *
 * Displays the organisation's current plan, credit balance with a circular
 * gauge, usage stats, a low-balance warning, top-up packages, pricing
 * comparison cards, and paginated transaction history.
 * Data is fetched server-side via the credit and subscription services.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { getBalance, getTransactionHistory } from "@/lib/credits";
import { getCurrentSubscription } from "@/lib/payments/subscription-service";
import { getTierConfig } from "@/lib/payments/tier-config";
import { CreditBalance } from "@/components/dashboard/widgets/CreditBalance";
import { TransactionHistory } from "@/components/dashboard/widgets/TransactionHistory";
import { CurrentPlan } from "@/components/billing/CurrentPlan";
import { TopUpWidget } from "@/components/billing/TopUpWidget";
import { PricingSection } from "@/components/billing/PricingSection";
import { logger } from "@/lib/logger";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata() {
  return {
    title: "Billing & Credits | Purple Glow Social",
    description: "Manage your credits, view usage, and top up your account",
  };
}

export default async function BillingPage({ params, searchParams }: Props) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const session = await requireServerSession();

  // Resolve orgId — fall back to user id when org context isn't available
  const orgId =
    (session as unknown as { organization?: { id: string } }).organization?.id ??
    session.user.id;

  let billingDataUnavailable = false;
  let balance: Awaited<ReturnType<typeof getBalance>> = {
    balance: 0,
    monthlyAllocation: 0,
    rolloverBalance: 0,
    rolloverExpiresAt: null,
    usagePercentage: 0,
    isLowBalance: true,
  };
  let transactions: Awaited<ReturnType<typeof getTransactionHistory>> = [];
  let subscription: Awaited<ReturnType<typeof getCurrentSubscription>> = null;

  try {
    [balance, transactions, subscription] = await Promise.all([
      getBalance(orgId),
      getTransactionHistory(orgId, { limit: 10 }),
      getCurrentSubscription(orgId),
    ]);
  } catch (error) {
    billingDataUnavailable = true;
    logger.error("Failed to load billing data", {
      orgId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const currentTier = subscription?.tier ?? "seedling";
  const tierConfig = getTierConfig(currentTier);

  // Checkout / top-up success flags from query params
  const checkoutSuccess = sp.checkout === "success";
  const topUpSuccess = sp.topup === "success";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {billingDataUnavailable && (
        <div
          className="rounded-none border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-300"
          role="status"
          data-testid="billing-data-warning"
        >
          Billing data is temporarily unavailable. You can still browse this page
          while we reconnect your credit data.
        </div>
      )}

      {/* Success banners */}
      {checkoutSuccess && (
        <div
          className="flex items-center gap-3 rounded-none border border-emerald-500/20 bg-emerald-500/10 px-5 py-3"
          role="status"
          data-testid="checkout-success-banner"
        >
          <span className="text-lg" aria-hidden="true">
            🎉
          </span>
          <p className="text-sm font-medium text-emerald-400">
            Your subscription has been activated! Welcome to the{" "}
            {tierConfig.displayName} plan.
          </p>
        </div>
      )}

      {topUpSuccess && (
        <div
          className="flex items-center gap-3 rounded-none border border-emerald-500/20 bg-emerald-500/10 px-5 py-3"
          role="status"
          data-testid="topup-success-banner"
        >
          <span className="text-lg" aria-hidden="true">
            ✨
          </span>
          <p className="text-sm font-medium text-emerald-400">
            Credits have been added to your account successfully!
          </p>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
            Billing &amp; Credits
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Monitor your usage and manage your credit balance.
          </p>
        </div>

        {/* Top-up CTA */}
        <a
          href="#topup"
          className="inline-flex items-center gap-2 rounded-none bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-vivid"
          data-testid="top-up-button"
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 3v12M3 9h12"
            />
          </svg>
          Top Up Credits
        </a>
      </div>

      {/* Current plan */}
      <CurrentPlan
        subscription={subscription}
        tierConfig={tierConfig}
        locale={locale}
      />

      {/* Credit balance widget */}
      <CreditBalance balance={balance} />

      {/* Credit top-up packages */}
      <div id="topup">
        <TopUpWidget currentBalance={balance.balance} />
      </div>

      {/* Transaction history */}
      <TransactionHistory transactions={transactions} orgId={orgId} />

      {/* Pricing comparison */}
      <PricingSection currentTier={currentTier} />
    </div>
  );
}
