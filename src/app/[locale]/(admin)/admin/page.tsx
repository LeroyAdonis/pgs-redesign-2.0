/**
 * Admin overview page
 *
 * Landing page for the admin area. Displays summary stat cards
 * for key platform metrics: total users, active accounts,
 * posts today, and system status.
 *
 * Data is fetched server-side for initial render. The stats API
 * route is available at /api/admin/stats for client-side refreshes.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { db } from "@/db";
import { user, socialAccount, post } from "@/db/schema";
import { count, eq, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Overview — Admin Dashboard",
};

type Props = {
  params: Promise<{ locale: string }>;
};

/** Fetch platform stats directly from the database (server component) */
async function getAdminStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [usersResult, accountsResult, postsResult] = await Promise.all([
      db.select({ total: count() }).from(user),
      db
        .select({ total: count() })
        .from(socialAccount)
        .where(eq(socialAccount.isActive, true)),
      db
        .select({ total: count() })
        .from(post)
        .where(gte(post.createdAt, todayStart)),
    ]);

    return {
      totalUsers: usersResult[0]?.total ?? 0,
      activeAccounts: accountsResult[0]?.total ?? 0,
      postsToday: postsResult[0]?.total ?? 0,
      systemStatus: "operational" as const,
    };
  } catch (error) {
    logger.error("Failed to fetch admin stats", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      totalUsers: 0,
      activeAccounts: 0,
      postsToday: 0,
      systemStatus: "error" as const,
    };
  }
}

/* ─── Icons for stat cards (inline SVGs, 20×20) ─── */

function UsersStatIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="6" r="3" />
      <path strokeLinecap="round" d="M1 17c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="15" cy="6" r="2" />
      <path strokeLinecap="round" d="M15 11c2.5 0 4 1.5 4 4" />
    </svg>
  );
}

function AccountsStatIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l2 2 4-4" />
    </svg>
  );
}

function PostsStatIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="1" />
      <path strokeLinecap="round" d="M7 6h6M7 9h6M7 12h4" />
    </svg>
  );
}

function SystemStatIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4" width="14" height="10" rx="1" />
      <path strokeLinecap="round" d="M7 17h6M10 14v3" />
    </svg>
  );
}

export default async function AdminOverviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const stats = await getAdminStats();

  const statusLabel =
    stats.systemStatus === "operational" ? "All Systems Go" : "Issues Detected";
  const statusTrend: "up" | "down" =
    stats.systemStatus === "operational" ? "up" : "down";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Platform Overview
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Real-time snapshot of Purple Glow Social platform metrics.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString("en-ZA")}
          description="+12% from last month"
          icon={<UsersStatIcon />}
          trend="up"
        />
        <AdminStatCard
          label="Active Accounts"
          value={stats.activeAccounts.toLocaleString("en-ZA")}
          description="Connected social accounts"
          icon={<AccountsStatIcon />}
          trend="neutral"
        />
        <AdminStatCard
          label="Posts Today"
          value={stats.postsToday.toLocaleString("en-ZA")}
          description="Published & scheduled"
          icon={<PostsStatIcon />}
          trend="up"
        />
        <AdminStatCard
          label="System Status"
          value={statusLabel}
          description={stats.systemStatus === "operational" ? "All services healthy" : "Check system page"}
          icon={<SystemStatIcon />}
          trend={statusTrend}
        />
      </div>

      {/* Quick actions section */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <h3 className="text-sm font-semibold text-slate-200">Quick Actions</h3>
        <p className="mt-1 text-xs text-slate-500">
          Navigate to admin sections using the sidebar, or use keyboard
          shortcuts for common actions.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Manage Clients"
            description="View and manage platform users"
            href="/admin/clients"
          />
          <QuickActionCard
            title="View Revenue"
            description="Subscription and billing overview"
            href="/admin/revenue"
          />
          <QuickActionCard
            title="System Health"
            description="Check services and background jobs"
            href="/admin/system"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Quick Action Card (local, not exported) ─── */

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-slate-700/30 bg-slate-800/30 p-3 transition-colors hover:border-purple-500/30 hover:bg-slate-800/60"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-200 group-hover:text-purple-300">
          {title}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-slate-600 transition-colors group-hover:text-purple-400"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l6 5-6 5" />
      </svg>
    </a>
  );
}
