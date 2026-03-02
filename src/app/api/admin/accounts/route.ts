/**
 * GET /api/admin/accounts — Social accounts with organisation info
 *
 * Returns all social accounts across all organisations, joined with
 * organisation data. Supports server-side filtering via query params.
 *
 * Query params:
 * - platform: filter by platform (instagram, facebook, etc.)
 * - status: "connected" | "disconnected"
 * - search: search in displayName, platformUserId, or org name
 * - page: page number (1-based, default 1)
 * - limit: results per page (default 50, max 100)
 *
 * Requires admin role. Returns 401/403 for unauthorized requests.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { socialAccount, organization } from "@/db/schema";
import { eq, and, ilike, or, count, type SQL } from "drizzle-orm";

const VALID_PLATFORMS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "whatsapp",
  "google_business",
] as const;

type Platform = (typeof VALID_PLATFORMS)[number];

function isValidPlatform(value: string): value is Platform {
  return (VALID_PLATFORMS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden — admin access required" },
        { status: 403 },
      );
    }

    // Parse query params
    const url = request.nextUrl;
    const platform = url.searchParams.get("platform");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)),
    );

    // Build WHERE conditions
    const conditions: SQL[] = [];

    if (platform && isValidPlatform(platform)) {
      conditions.push(eq(socialAccount.platform, platform));
    }

    if (status === "connected") {
      conditions.push(eq(socialAccount.isActive, true));
    } else if (status === "disconnected") {
      conditions.push(eq(socialAccount.isActive, false));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(socialAccount.displayName, searchPattern),
          ilike(socialAccount.platformUserId, searchPattern),
          ilike(organization.name, searchPattern),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    // Parallel: fetch rows + total count
    const [rows, totalResult] = await Promise.all([
      db
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
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(socialAccount.connectedAt),
      db
        .select({ total: count() })
        .from(socialAccount)
        .leftJoin(organization, eq(socialAccount.orgId, organization.id))
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        platform: r.platform,
        platformUserId: r.platformUserId,
        displayName: r.displayName,
        isActive: r.isActive,
        connectedAt: r.connectedAt.toISOString(),
        tokenExpiresAt: r.tokenExpiresAt?.toISOString() ?? null,
        orgName: r.orgName ?? "Unknown",
        orgSlug: r.orgSlug ?? "",
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch admin accounts", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}
