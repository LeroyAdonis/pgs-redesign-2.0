/**
 * Settings Page — Coming Soon
 *
 * Route: /[locale]/dashboard/settings
 *
 * Placeholder page for the upcoming settings feature.
 * Will allow users to configure profile details, notification
 * preferences, timezone, language, and security options.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { EmptyState } from "@/components/data";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Settings | Purple Glow Social",
    description: "Manage your account and app preferences",
  };
}

function SettingsIcon() {
  return (
    <svg
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="8" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.4 9.4l4.2 4.2M34.4 34.4l4.2 4.2M9.4 38.6l4.2-4.2M34.4 13.6l4.2-4.2" />
    </svg>
  );
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireServerSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure your account and application preferences.
        </p>
      </div>

      {/* Coming soon state */}
      <div className="rounded-xl border border-border bg-surface p-8">
        <EmptyState
          icon={<SettingsIcon />}
          title="Coming Soon"
          description="Settings are being built. Soon you'll be able to customise your profile, manage notifications, adjust your timezone and language, and configure security options."
        />

        {/* Feature preview list */}
        <ul className="mx-auto mt-4 max-w-sm space-y-3 text-left text-sm text-text-muted">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Profile and display name management</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Email and push notification preferences</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Timezone (SAST) and language selection</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Two-factor authentication and security</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
