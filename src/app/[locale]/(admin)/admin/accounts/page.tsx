/**
 * Admin accounts overview page
 *
 * Displays all social accounts across all organisations with summary
 * stats, a filterable accounts table, and platform distribution chart.
 *
 * Data is fetched server-side for the initial render. The accounts API
 * route at /api/admin/accounts is available for client-side refreshes.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AccountsTable } from "@/components/admin/AccountsTable";
import type { AccountRow } from "@/components/admin/AccountsTable";
import { PlatformDistribution } from "@/components/admin/PlatformDistribution";
import type { PlatformCount } from "@/components/admin/PlatformDistribution";
import { db } from "@/db";
import { socialAccount, organization } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Accounts — Admin Dashboard",
};

type Props = {
  params: Promise<{ locale: string }>;
};

// ─── Data fetching ───

interface AccountStats {
  total: number;
  connected: number;
  disconnected: number;
  platformCounts: PlatformCount[];
}

async function getAccountStats(): Promise<AccountStats> {
  try {
    const [totalResult, connectedResult, platformResults] = await Promise.all([
      db.select({ total: count() }).from(socialAccount),
      db
        .select({ total: count() })
        .from(socialAccount)
        .where(eq(socialAccount.isActive, true)),
      db
        .select({
          platform: socialAccount.platform,
          total: count(),
        })
        .from(socialAccount)
        .groupBy(socialAccount.platform),
    ]);

    const total = totalResult[0]?.total ?? 0;
    const connected = connectedResult[0]?.total ?? 0;

    return {
      total,
      connected,
      disconnected: total - connected,
      platformCounts: platformResults.map((r) => ({
        platform: r.platform,
        count: r.total,
      })),
    };
  } catch (error) {
    logger.error("Failed to fetch account stats", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { total: 0, connected: 0, disconnected: 0, platformCounts: [] };
  }
}

async function getAllAccounts(): Promise<AccountRow[]> {
  try {
    const rows = await db
      .select({
        id: socialAccount.id,
        platform: socialAccount.platform,
        platformUserId: socialAccount.platformUserId,
        displayName: socialAccount.displayName,
        isActive: socialAccount.isActive,
        connectedAt: socialAccount.connectedAt,
        tokenExpiresAt: socialAccount.tokenExpiresAt,
        orgName: organization.name,
        orgSlug: organization.slug,
      })
      .from(socialAccount)
      .leftJoin(organization, eq(socialAccount.orgId, organization.id))
      .orderBy(socialAccount.connectedAt);

    return rows.map((r) => ({
      id: r.id,
      platform: r.platform,
      platformUserId: r.platformUserId,
      displayName: r.displayName,
      isActive: r.isActive,
      connectedAt: r.connectedAt.toISOString(),
      tokenExpiresAt: r.tokenExpiresAt?.toISOString() ?? null,
      orgName: r.orgName ?? "Unknown",
      orgSlug: r.orgSlug ?? "",
    }));
  } catch (error) {
    logger.error("Failed to fetch social accounts", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

// ─── Inline stat icons (20×20) ───

function TotalAccountsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M10 7v3l2 2" />
    </svg>
  );
}

function ConnectedIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l2 2 4-4" />
    </svg>
  );
}

function DisconnectedIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M7 7l6 6M13 7l-6 6" />
    </svg>
  );
}

function PlatformsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

// ─── Page component ───

export default async function AdminAccountsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, accounts] = await Promise.all([
    getAccountStats(),
    getAllAccounts(),
  ]);

  const connectionRate =
    stats.total > 0
      ? `${((stats.connected / stats.total) * 100).toFixed(0)}% healthy`
      : "No accounts";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Social Accounts
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage and monitor all connected social accounts across organisations.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Accounts"
          value={stats.total.toLocaleString("en-ZA")}
          description="Across all organisations"
          icon={<TotalAccountsIcon />}
          trend="neutral"
        />
        <AdminStatCard
          label="Connected"
          value={stats.connected.toLocaleString("en-ZA")}
          description={connectionRate}
          icon={<ConnectedIcon />}
          trend="up"
        />
        <AdminStatCard
          label="Disconnected"
          value={stats.disconnected.toLocaleString("en-ZA")}
          description="Require reconnection"
          icon={<DisconnectedIcon />}
          trend={stats.disconnected > 0 ? "down" : "neutral"}
        />
        <AdminStatCard
          label="Platforms"
          value={stats.platformCounts.length.toLocaleString("en-ZA")}
          description="Active platform types"
          icon={<PlatformsIcon />}
          trend="neutral"
        />
      </div>

      {/* Platform distribution + Accounts table */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Distribution chart — 1/3 width on large screens */}
        <div className="xl:col-span-1">
          <PlatformDistribution data={stats.platformCounts} />
        </div>

        {/* Accounts table — 2/3 width on large screens */}
        <div className="xl:col-span-2">
          <AccountsTable accounts={accounts} />
        </div>
      </div>
    </div>
  );
}
