/**
 * Dashboard overview page
 *
 * Main landing page for authenticated users. Displays a 2×2 grid
 * of dashboard widgets: Credits Summary, Quick Stats, Recent Posts,
 * and Upcoming Scheduled posts.
 *
 * Layout: 2-column on desktop (lg), single-column on mobile.
 */

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { CreditsSummary } from "@/components/dashboard/widgets/CreditsSummary";
import { QuickStats } from "@/components/dashboard/widgets/QuickStats";
import { RecentPosts } from "@/components/dashboard/widgets/RecentPosts";
import { UpcomingPosts } from "@/components/dashboard/widgets/UpcomingPosts";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardContent />;
}

/**
 * Extracted as a sync component so useTranslations works
 * (useTranslations is a hook and must be called synchronously).
 */
function DashboardContent() {
  const t = useTranslations("dashboard");

  return (
    <div className="mx-auto max-w-[1400px]" data-testid="dashboard-overview">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t("welcome")}</p>
      </div>

      {/* Widget grid — 2×2 on desktop, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top row */}
        <CreditsSummary />
        <QuickStats />

        {/* Bottom row */}
        <RecentPosts />
        <UpcomingPosts />
      </div>
    </div>
  );
}
