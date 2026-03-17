/**
 * POST /api/notifications/read-all — Mark all unread notifications as read
 *
 * No request body required.
 *
 * Returns `{ success: boolean, count: number }`
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { markAllAsRead } from "@/lib/notifications/notification-service";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { updatedCount } = await markAllAsRead(session.user.id);

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    logger.error("POST /api/notifications/read-all failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 },
    );
  }
}
