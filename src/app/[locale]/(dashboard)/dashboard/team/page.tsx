/**
 * Team Management Page — Coming Soon
 *
 * Route: /[locale]/dashboard/team
 *
 * Placeholder page for the upcoming team management feature.
 * Will allow users to invite members, assign roles, and
 * manage organisation-level access controls.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { EmptyState } from "@/components/data";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Team | Purple Glow Social",
    description: "Manage your team members and roles",
  };
}

function TeamIcon() {
  return (
    <svg
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="16" cy="14" r="6" />
      <circle cx="34" cy="14" r="6" />
      <path d="M4 40c0-6 4-10 12-10s12 4 12 10M24 40c0-6 4-10 10-10s10 4 10 10" />
    </svg>
  );
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireServerSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
          Team Management
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Invite members, assign roles, and manage access.
        </p>
      </div>

      {/* Coming soon state */}
      <div className="rounded-xl border border-border bg-surface p-8">
        <EmptyState
          icon={<TeamIcon />}
          title="Coming Soon"
          description="Team management is on its way. You'll be able to invite team members, assign roles like Editor and Viewer, and control who can publish, schedule, and review content across your connected accounts."
        />

        {/* Feature preview list */}
        <ul className="mx-auto mt-4 max-w-sm space-y-3 text-left text-sm text-text-muted">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Invite team members by email</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Role-based access control (Admin, Editor, Viewer)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Approval workflows for scheduled posts</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand" aria-hidden="true">✦</span>
            <span>Activity log and audit trail</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
