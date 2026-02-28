/**
 * Dashboard overview page (placeholder)
 *
 * This is the main landing page for authenticated users.
 * The full dashboard overview with stats, charts, and activity
 * will be implemented in a future task.
 */

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

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
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-text">{t("title")}</h1>
      <p className="mt-2 text-text-muted">{t("welcome")}</p>
    </div>
  );
}
