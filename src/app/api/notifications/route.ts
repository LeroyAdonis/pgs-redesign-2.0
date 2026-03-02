/**
 * GET /api/notifications — Paginated notifications for the authenticated user
 *
 * Query params:
 *   read   (optional) — "true" | "false" to filter by read status
 *   limit  (optional) — page size, 1–50 (default 20)
 *   offset (optional) — number of rows to skip (default 0)
 *
 * Returns `{ notifications: [...], total: number }`
 */

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and, isNull, isNotNull, count } from "drizzle-orm";
import { getUserNotifications } from "@/lib/notifications/notification-service";
import type { NotificationFilters } from "@/lib/notifications/types";

const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;

    // --- Parse & validate query params ---
    const filters: NotificationFilters = {};

    const readParam = searchParams.get("read");
    if (readParam === "true") filters.read = true;
    else if (readParam === "false") filters.read = false;

    const limitParam = searchParams.get("limit");
    if (limitParam !== null) {
      const parsed = Number(limitParam);
      if (Number.isNaN(parsed) || parsed < 1) {
        return NextResponse.json(
          { error: "Invalid limit — must be a positive integer" },
          { status: 400 },
        );
      }
      filters.limit = Math.min(parsed, MAX_LIMIT);
    }

    const offsetParam = searchParams.get("offset");
    if (offsetParam !== null) {
      const parsed = Number(offsetParam);
      if (Number.isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "Invalid offset — must be a non-negative integer" },
          { status: 400 },
        );
      }
      filters.offset = parsed;
    }

    // --- Fetch notifications + total count in parallel ---
    const countConditions = [eq(notification.userId, userId)];
    if (filters.read === true) countConditions.push(isNotNull(notification.readAt));
    else if (filters.read === false) countConditions.push(isNull(notification.readAt));

    const [notifications, [countResult]] = await Promise.all([
      getUserNotifications(userId, filters),
      db
        .select({ value: count() })
        .from(notification)
        .where(and(...countConditions)),
    ]);

    return NextResponse.json({
      notifications,
      total: countResult?.value ?? 0,
    });
  } catch (error) {
    logger.error("GET /api/notifications failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
