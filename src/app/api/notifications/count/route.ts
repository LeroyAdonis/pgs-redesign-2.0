/**
 * GET /api/notifications/count — Unread notification count
 *
 * No query params required.
 *
 * Returns `{ count: number }`
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { getUnreadCount } from "@/lib/notifications/notification-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const unreadCount = await getUnreadCount(session.user.id);

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    logger.error("GET /api/notifications/count failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch unread count" },
      { status: 500 },
    );
  }
}
