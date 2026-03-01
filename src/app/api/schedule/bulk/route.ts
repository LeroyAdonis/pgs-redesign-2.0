/**
 * POST   /api/schedule/bulk — Bulk create schedules
 * PATCH  /api/schedule/bulk — Bulk update schedule status
 * DELETE /api/schedule/bulk — Bulk delete schedules
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  bulkCreateSchedules,
  bulkUpdateStatus,
  bulkDeleteSchedules,
  checkTierLimits,
} from "@/lib/scheduling";
import type { ScheduleStatus } from "@/lib/scheduling";

// ── POST — bulk create ──────────────────────────────────────────

interface BulkCreateRequest {
  postIds: string[];
  socialAccountId: string;
  startDate: string; // ISO 8601
  intervalMinutes: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as BulkCreateRequest;

    if (
      !body.postIds?.length ||
      !body.socialAccountId ||
      !body.startDate ||
      !body.intervalMinutes
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "postIds, socialAccountId, startDate, and intervalMinutes are required",
        },
        { status: 400 },
      );
    }

    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid startDate" },
        { status: 400 },
      );
    }

    // Get org membership
    const memberships = await db
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id))
      .limit(1);

    const membership = memberships[0];
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No organization found" },
        { status: 404 },
      );
    }

    // Check tier limits
    const limitCheck = await checkTierLimits(
      membership.orgId,
      body.postIds.length,
    );
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: limitCheck.reason },
        { status: 403 },
      );
    }

    const schedules = await bulkCreateSchedules({
      postIds: body.postIds,
      socialAccountId: body.socialAccountId,
      startDate,
      intervalMinutes: body.intervalMinutes,
    });

    return NextResponse.json(
      { success: true, schedules, count: schedules.length },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to bulk create schedules", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to bulk create schedules" },
      { status: 500 },
    );
  }
}

// ── PATCH — bulk update status ──────────────────────────────────

interface BulkUpdateRequest {
  ids: string[];
  status: ScheduleStatus;
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as BulkUpdateRequest;

    if (!body.ids?.length || !body.status) {
      return NextResponse.json(
        { success: false, error: "ids and status are required" },
        { status: 400 },
      );
    }

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

    await bulkUpdateStatus(body.ids, body.status);

    return NextResponse.json({ success: true, count: body.ids.length });
  } catch (error) {
    logger.error("Failed to bulk update schedules", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to bulk update schedules" },
      { status: 500 },
    );
  }
}

// ── DELETE — bulk delete ────────────────────────────────────────

interface BulkDeleteRequest {
  ids: string[];
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as BulkDeleteRequest;

    if (!body.ids?.length) {
      return NextResponse.json(
        { success: false, error: "ids array is required" },
        { status: 400 },
      );
    }

    await bulkDeleteSchedules(body.ids);

    return NextResponse.json({ success: true, count: body.ids.length });
  } catch (error) {
    logger.error("Failed to bulk delete schedules", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to bulk delete schedules" },
      { status: 500 },
    );
  }
}
