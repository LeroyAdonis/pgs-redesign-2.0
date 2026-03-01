/**
 * Billing / Credits Page — Server Component
 *
 * Route: /[locale]/dashboard/billing
 *
 * Displays the organisation's credit balance with a circular gauge,
 * usage stats, a low-balance warning, and paginated transaction history.
 * Data is fetched server-side via the credit service.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { getBalance, getTransactionHistory } from "@/lib/credits";
import { CreditBalance } from "@/components/dashboard/widgets/CreditBalance";
import { TransactionHistory } from "@/components/dashboard/widgets/TransactionHistory";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Billing & Credits | Purple Glow Social",
    description: "Manage your credits, view usage, and top up your account",
  };
}

export default async function BillingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireServerSession();

  // Resolve orgId — fall back to user id when org context isn't available
  const orgId =
    (session as unknown as { organization?: { id: string } }).organization?.id ??
    session.user.id;

  // Fetch data in parallel
  const [balance, transactions] = await Promise.all([
    getBalance(orgId),
    getTransactionHistory(orgId, { limit: 10 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">
            Billing &amp; Credits
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Monitor your usage and manage your credit balance.
          </p>
        </div>

        {/* Top-up CTA */}
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-vivid"
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

      {/* Credit balance widget */}
      <CreditBalance balance={balance} />

      {/* Transaction history */}
      <TransactionHistory transactions={transactions} orgId={orgId} />
    </div>
  );
}
