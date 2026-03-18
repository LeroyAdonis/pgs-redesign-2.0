/**
 * Social accounts management page.
 *
 * Route: /[locale]/dashboard/accounts
 *
 * Server component that fetches linked social accounts and renders
 * the interactive client component for managing them.
 */

import { setRequestLocale } from "next-intl/server";

import { requireServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listAccountsForOrg } from "@/lib/social/account-service";
import { PLATFORM_DISPLAY } from "@/lib/social/providers";
import type { SocialAccountDTO } from "@/lib/social/types";

import { AccountsManager } from "./accounts-manager";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireServerSession();
  const query = await searchParams;

  // Resolve orgId from the user's org membership (single-org for now).
  // When multi-org is implemented, this should use an org switcher
  // to let the user pick which org's accounts to manage.
  const memberships = await db
    .select({ orgId: organizationMember.orgId })
    .from(organizationMember)
    .where(eq(organizationMember.userId, session.user.id))
    .limit(1);

  const orgId = memberships[0]?.orgId;

  // If user has no organization, redirect to onboarding
  if (!orgId) {
    const { redirect } = await import("next/navigation");
    redirect(`/${locale}/onboarding`);
  }

  let accounts: SocialAccountDTO[] = [];

  accounts = await listAccountsForOrg(orgId);

  // Extract status messages from URL params
  const successPlatform =
    query.success === "connected" ? (query.platform as string) : undefined;
  const errorType = query.error as string | undefined;
  const errorPlatform = query.platform as string | undefined;

  return (
    <AccountsManager
      accounts={accounts}
      orgId={orgId}
      platformDisplay={PLATFORM_DISPLAY}
      successPlatform={successPlatform}
      errorType={errorType}
      errorPlatform={errorPlatform}
    />
  );
}
