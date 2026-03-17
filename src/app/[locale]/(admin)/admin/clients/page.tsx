/**
 * Admin clients page — client (organization) management
 *
 * Server component that fetches all organizations with their
 * owner info and subscription data. Renders the interactive
 * ClientsTable component for search, filter, sort, and pagination.
 *
 * Data is fetched server-side for initial render. Subsequent
 * interactions are handled client-side via the API route.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/db";
import { organization, user, subscription } from "@/db/schema";
import { count, eq, or, sql, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ClientsTable } from "@/components/admin/ClientsTable";
import type { ClientRow, ClientSummary } from "@/components/admin/ClientsTable";

export const metadata: Metadata = {
  title: "Clients — Admin Dashboard",
};

type Props = {
  params: Promise<{ locale: string }>;
};

const PAGE_SIZE = 20;

/** Fetch initial client data server-side */
async function getClientsData(): Promise<{
  clients: ClientRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: ClientSummary;
}> {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [clients, totalResult, activeResult, newResult] = await Promise.all([
      db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          tier: organization.tier,
          logoUrl: organization.logoUrl,
          createdAt: organization.createdAt,
          ownerName: user.name,
          ownerEmail: user.email,
          ownerImage: user.image,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        })
        .from(organization)
        .leftJoin(user, eq(organization.ownerId, user.id))
        .leftJoin(subscription, eq(organization.id, subscription.orgId))
        .orderBy(desc(organization.createdAt))
        .limit(PAGE_SIZE)
        .offset(0),
      db.select({ total: count() }).from(organization),
      db
        .select({ total: count() })
        .from(organization)
        .leftJoin(subscription, eq(organization.id, subscription.orgId))
        .where(
          or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
          ),
        ),
      db
        .select({ total: count() })
        .from(organization)
        .where(sql`${organization.createdAt} >= ${monthStart}`),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        tier: c.tier,
        logoUrl: c.logoUrl,
        createdAt: c.createdAt.toISOString(),
        ownerName: c.ownerName ?? "",
        ownerEmail: c.ownerEmail ?? "",
        ownerImage: c.ownerImage ?? null,
        subscriptionStatus: c.subscriptionStatus ?? null,
        currentPeriodEnd: c.currentPeriodEnd?.toISOString() ?? null,
      })),
      pagination: {
        page: 1,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      summary: {
        totalClients: total,
        activeClients: activeResult[0]?.total ?? 0,
        newThisMonth: newResult[0]?.total ?? 0,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch clients data", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      clients: [],
      pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 },
      summary: { totalClients: 0, activeClients: 0, newThisMonth: 0 },
    };
  }
}

export default async function AdminClientsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { clients, pagination, summary } = await getClientsData();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Client Management
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          View and manage all platform organizations and their subscriptions.
        </p>
      </div>

      {/* Interactive table with filters */}
      <ClientsTable
        initialClients={clients}
        initialPagination={pagination}
        initialSummary={summary}
      />
    </div>
  );
}
