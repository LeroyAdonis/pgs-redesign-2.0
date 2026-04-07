/**
 * Analytics & Insights dashboard page
 *
 * Route: /[locale]/dashboard/analytics
 *
 * Server component wrapper that renders the analytics dashboard
 * with rich data visualisation widgets. Each widget is a client
 * component that fetches its own data from the analytics API.
 */

import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  AnalyticsOverview,
  EngagementChart,
  PlatformComparison,
  BestTimesHeatmap,
  TopPosts,
  ContentPerformance,
} from "@/components/dashboard/analytics";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AnalyticsDashboard />;
}

/**
 * Sync component wrapper so hooks can be used in child components.
 * Layout matches the dashboard overview page pattern.
 */
function AnalyticsDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
          Analytics & Insights
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Track your social media performance across all platforms
        </p>
      </div>

      {/* KPI overview cards */}
      <AnalyticsOverview />

      {/* Engagement trends chart — full width */}
      <EngagementChart />

      {/* Platform comparison + Heatmap — side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlatformComparison />
        <BestTimesHeatmap />
      </div>

      {/* Content performance + Top posts — side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ContentPerformance />
        <TopPosts />
      </div>
    </div>
  );
}
