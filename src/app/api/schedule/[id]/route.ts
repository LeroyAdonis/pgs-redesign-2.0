/**
 * PATCH /api/schedule/[id] — Update a schedule (reschedule)
 * DELETE /api/schedule/[id] — Delete a schedule
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { updateSchedule, deleteSchedule } from "@/lib/scheduling";
import type { ScheduleStatus } from "@/lib/scheduling";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── PATCH — update schedule ─────────────────────────────────────

interface UpdateScheduleRequest {
  scheduledAt?: string;
  status?: ScheduleStatus;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateScheduleRequest;

    const updates: { id: string; scheduledAt?: Date; status?: ScheduleStatus } =
      { id };

    if (body.scheduledAt) {
      const scheduledAt = new Date(body.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid scheduledAt date" },
          { status: 400 },
        );
      }
      updates.scheduledAt = scheduledAt;
    }

    if (body.status) {
      const validStatuses: ScheduleStatus[] = [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    const schedule = await updateSchedule(updates);
    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to update schedule", { error: message });

    if (message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update schedule" },
      { status: 500 },
    );
  }
}

// ── DELETE — delete schedule ────────────────────────────────────

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    await deleteSchedule(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to delete schedule", { error: message });

    if (message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete schedule" },
      { status: 500 },
    );
  }
}
