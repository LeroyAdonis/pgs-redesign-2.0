/**
 * GET /api/admin/clients — Paginated client (organization) list
 *
 * Returns organizations with owner info and subscription data for the
 * admin client management dashboard.
 *
 * Query params:
 *   search  (optional) — filter by org name or owner email
 *   tier    (optional) — filter by tier: seedling | hustler | grower | mogul
 *   status  (optional) — filter by subscription status: active | inactive
 *   page    (optional, default 1)
 *   limit   (optional, default 20, max 100)
 *   sort    (optional) — sort field: name | date | tier (default: date)
 *   order   (optional) — sort direction: asc | desc (default: desc)
 *
 * Requires admin role. Returns 401/403 for auth failures.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organization, user, subscription } from "@/db/schema";
import { count, eq, or, ilike, sql, asc, desc } from "drizzle-orm";

/** Tier values we accept for filtering */
const VALID_TIERS = ["seedling", "hustler", "grower", "mogul"] as const;
type Tier = (typeof VALID_TIERS)[number];

/** Status values: "active" maps to subscription active/trialing, "inactive" to rest */
const VALID_STATUSES = ["active", "inactive"] as const;
type Status = (typeof VALID_STATUSES)[number];

const VALID_SORT_FIELDS = ["name", "date", "tier"] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

function isValidTier(value: string): value is Tier {
  return VALID_TIERS.includes(value as Tier);
}

function isValidStatus(value: string): value is Status {
  return VALID_STATUSES.includes(value as Status);
}

function isValidSortField(value: string): value is SortField {
  return VALID_SORT_FIELDS.includes(value as SortField);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;
    const { session } = auth;

    // Parse query params
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const tierParam = searchParams.get("tier") ?? "";
    const statusParam = searchParams.get("status") ?? "";
    const sortParam = searchParams.get("sort") ?? "date";
    const orderParam = searchParams.get("order") ?? "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
      100,
    );
    const offset = (page - 1) * limit;

    // Validate enum params
    const tierFilter = tierParam && isValidTier(tierParam) ? tierParam : null;
    const statusFilter =
      statusParam && isValidStatus(statusParam) ? statusParam : null;
    const sortField = isValidSortField(sortParam) ? sortParam : "date";
    const sortOrder = orderParam === "asc" ? "asc" : "desc";

    // Build the base query with left joins for owner and subscription
    // We use a raw SQL approach for the complex filtering
    const conditions = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(organization.name, searchPattern),
          ilike(user.email, searchPattern),
        ),
      );
    }

    if (tierFilter) {
      conditions.push(eq(organization.tier, tierFilter));
    }

    if (statusFilter === "active") {
      conditions.push(
        or(
          eq(subscription.status, "active"),
          eq(subscription.status, "trialing"),
        ),
      );
    } else if (statusFilter === "inactive") {
      conditions.push(
        or(
          eq(subscription.status, "canceled"),
          eq(subscription.status, "past_due"),
          sql`${subscription.status} IS NULL`,
        ),
      );
    }

    const whereClause =
      conditions.length > 0
        ? sql`${conditions.reduce((acc, cond, i) => (i === 0 ? cond! : sql`${acc} AND ${cond}`), conditions[0]!)}`
        : undefined;

    // Sort mapping
    const sortColumn =
      sortField === "name"
        ? organization.name
        : sortField === "tier"
          ? organization.tier
          : organization.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    // Parallel: count + paginated data
    const baseSelect = db
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
      .leftJoin(subscription, eq(organization.id, subscription.orgId));

    const countSelect = db
      .select({ total: count() })
      .from(organization)
      .leftJoin(user, eq(organization.ownerId, user.id))
      .leftJoin(subscription, eq(organization.id, subscription.orgId));

    // Apply where clause
    const dataQuery = whereClause
      ? baseSelect
          .where(whereClause)
          .orderBy(orderFn(sortColumn))
          .limit(limit)
          .offset(offset)
      : baseSelect.orderBy(orderFn(sortColumn)).limit(limit).offset(offset);

    const countQuery = whereClause
      ? countSelect.where(whereClause)
      : countSelect;

    // Also get summary stats (total, active, new this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [clients, totalResult, totalOrgs, activeOrgs, newOrgs] =
      await Promise.all([
        dataQuery,
        countQuery,
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

    return NextResponse.json({
      success: true,
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        tier: c.tier,
        logoUrl: c.logoUrl,
        createdAt: c.createdAt.toISOString(),
        ownerName: c.ownerName,
        ownerEmail: c.ownerEmail,
        ownerImage: c.ownerImage,
        subscriptionStatus: c.subscriptionStatus ?? null,
        currentPeriodEnd: c.currentPeriodEnd?.toISOString() ?? null,
      })),
      pagination: {
        page,
        limit,
        total: totalResult[0]?.total ?? 0,
        totalPages: Math.ceil((totalResult[0]?.total ?? 0) / limit),
      },
      summary: {
        totalClients: totalOrgs[0]?.total ?? 0,
        activeClients: activeOrgs[0]?.total ?? 0,
        newThisMonth: newOrgs[0]?.total ?? 0,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch admin clients", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin clients" },
      { status: 500 },
    );
  }
}
