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

  // Get the user's org — for now use the first org membership
  // TODO: Support org switcher when multi-org is implemented
  const orgId = (session.user as Record<string, unknown>).orgId as
    | string
    | undefined;

  let accounts: SocialAccountDTO[] = [];

  if (orgId) {
    accounts = await listAccountsForOrg(orgId);
  }

  // Extract status messages from URL params
  const successPlatform =
    query.success === "connected" ? (query.platform as string) : undefined;
  const errorType = query.error as string | undefined;
  const errorPlatform = query.platform as string | undefined;

  return (
    <AccountsManager
      accounts={accounts}
      orgId={orgId ?? ""}
      platformDisplay={PLATFORM_DISPLAY}
      successPlatform={successPlatform}
      errorType={errorType}
      errorPlatform={errorPlatform}
    />
  );
}
