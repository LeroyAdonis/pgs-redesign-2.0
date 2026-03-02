/**
 * PATCH /api/notifications/[id]/read — Mark a single notification as read
 *
 * The notification service verifies ownership (userId match).
 *
 * Returns `{ success: boolean }` (or `{ success: false, error }` on failure)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { markAsRead } from "@/lib/notifications/notification-service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing notification id" },
        { status: 400 },
      );
    }

    const result = await markAsRead(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("PATCH /api/notifications/[id]/read failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}
