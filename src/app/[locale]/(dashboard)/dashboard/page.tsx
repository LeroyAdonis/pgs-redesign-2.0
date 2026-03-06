/**
 * Dashboard overview page
 *
 * Route: /[locale]/dashboard
 *
 * Main landing page for authenticated users. Renders a clean,
 * focused overview with KPI stats, upcoming/recent posts, and
 * credit usage at a glance.
 */

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getServerSession } from "@/lib/auth-session";
import { Link } from "@/i18n/navigation";
import {
  QuickStats,
  CreditsSummary,
  RecentPosts,
  UpcomingPosts,
} from "@/components/dashboard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Layout already guards with requireServerSession(), so session
  // is guaranteed here. Use getServerSession() to read cached result.
  const session = await getServerSession();
  const userName = session?.user?.name ?? null;

  return <DashboardContent userName={userName} />;
}

// ─── Inline SVG icon for the CTA button ─────────────────────────

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M10 4v12M4 10h12" />
    </svg>
  );
}

// ─── Inner sync component (useTranslations requires sync call) ──

/**
 * Extracted as a sync component so `useTranslations` hook works.
 * Receives pre-fetched data as props from the async parent.
 */
function DashboardContent({ userName }: { userName: string | null }) {
  const t = useTranslations("dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Welcome header + Create Post CTA ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
            {userName ? t("welcomeBack", { name: userName }) : t("title")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t("overviewSubtitle")}
          </p>
        </div>

        <Link
          href="/dashboard/generate"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-5 h-10 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-vivid hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <PlusIcon />
          {t("createPost")}
        </Link>
      </div>

      {/* ── Quick stats — 4 KPI cards (2×2 mobile, 4 cols desktop) ── */}
      <QuickStats />

      {/* ── Middle row: Upcoming posts + Credit summary ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <UpcomingPosts className="lg:col-span-2" />
        <CreditsSummary />
      </div>

      {/* ── Recent posts — full width ── */}
      <RecentPosts />
    </div>
  );
}
