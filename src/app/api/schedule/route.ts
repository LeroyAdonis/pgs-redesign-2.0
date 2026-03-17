/**
 * POST /api/schedule — Create a new schedule
 * GET  /api/schedule — List schedules with filters
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createSchedule,
  getSchedulesByOrg,
  checkTierLimits,
} from "@/lib/scheduling";
import type { Platform, ScheduleStatus } from "@/lib/scheduling";

// ── POST — create schedule ──────────────────────────────────────

interface CreateScheduleRequest {
  postId: string;
  socialAccountId: string;
  scheduledAt: string; // ISO 8601
}

export async function POST(request: Request) {
  try {
    let session;
    try {
      session = await getServerSession();
    } catch {
      session = null;
    }
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CreateScheduleRequest;

    if (!body.postId || !body.socialAccountId || !body.scheduledAt) {
      return NextResponse.json(
        {
          success: false,
          error: "postId, socialAccountId, and scheduledAt are required",
        },
        { status: 400 },
      );
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid scheduledAt date" },
        { status: 400 },
      );
    }

    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: "scheduledAt must be in the future" },
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
    const limitCheck = await checkTierLimits(membership.orgId, 1);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: limitCheck.reason },
        { status: 403 },
      );
    }

    const schedule = await createSchedule({
      postId: body.postId,
      socialAccountId: body.socialAccountId,
      scheduledAt,
    });

    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create schedule", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to create schedule" },
      { status: 500 },
    );
  }
}

// ── GET — list schedules ────────────────────────────────────────

export async function GET(request: Request) {
  try {
    let session;
    try {
      session = await getServerSession();
    } catch {
      session = null;
    }
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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

    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") as Platform | null;
    const status = url.searchParams.get("status") as ScheduleStatus | null;
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

    const result = await getSchedulesByOrg({
      orgId: membership.orgId,
      ...(platform && { platform }),
      ...(status && { status }),
      ...(dateFrom && { dateFrom: new Date(dateFrom) }),
      ...(dateTo && { dateTo: new Date(dateTo) }),
      page,
      limit: Math.min(limit, 100),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("Failed to list schedules", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to list schedules" },
      { status: 500 },
    );
  }
}
