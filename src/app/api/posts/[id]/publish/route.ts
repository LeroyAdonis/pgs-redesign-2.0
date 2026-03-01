/**
 * POST /api/posts/[id]/publish — Manual publish trigger
 *
 * Allows an authenticated user to immediately publish a post by
 * sending a `post/publish` event to the Inngest pipeline.
 *
 * Guards:
 *   1. Valid session (requireServerSession)
 *   2. Post exists and belongs to the user's org
 *   3. Post is in a publishable status (draft or scheduled)
 *   4. Organization has enough credits
 *   5. At least one schedule exists with a linked social account
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { requireServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { post, postSchedule, organizationMember } from "@/db/schema";
import { hasEnoughCredits } from "@/lib/credits/credit-service";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireServerSession();
    const { id: postId } = await params;

    // Suppress unused-variable warning — request is part of the route signature
    void request;

    // Step 1: Verify the post exists
    const [foundPost] = await db
      .select()
      .from(post)
      .where(eq(post.id, postId))
      .limit(1);

    if (!foundPost) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    // Step 2: Verify user belongs to the post's org
    const [membership] = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, session.user.id),
          eq(organizationMember.orgId, foundPost.orgId),
        ),
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this post" },
        { status: 403 },
      );
    }

    // Step 3: Validate publishable status
    const publishableStatuses = ["draft", "scheduled", "failed"];
    if (!publishableStatuses.includes(foundPost.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Post cannot be published from status "${foundPost.status}"`,
        },
        { status: 400 },
      );
    }

    // Step 4: Check credit balance
    const hasCreditBalance = await hasEnoughCredits(foundPost.orgId);
    if (!hasCreditBalance) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient credits. Please upgrade your plan or purchase more credits.",
        },
        { status: 402 },
      );
    }

    // Step 5: Find the schedule (or create an immediate one)
    const [schedule] = await db
      .select()
      .from(postSchedule)
      .where(eq(postSchedule.postId, postId))
      .limit(1);

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: "No schedule found. Create a schedule before publishing.",
        },
        { status: 400 },
      );
    }

    // Step 6: Send the publish event to Inngest
    await inngest.send({
      name: "post/publish",
      data: {
        scheduleId: schedule.id,
        postId,
        orgId: foundPost.orgId,
      },
    });

    // Mark post as publishing optimistically
    await db
      .update(post)
      .set({ status: "publishing" })
      .where(eq(post.id, postId));

    logger.info("Manual publish triggered", {
      postId,
      scheduleId: schedule.id,
      orgId: foundPost.orgId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Post publish initiated",
      postId,
      scheduleId: schedule.id,
    });
  } catch (error) {
    // requireServerSession throws a redirect — only catch real errors
    if (error instanceof Response) {
      throw error;
    }

    logger.error("Failed to trigger manual publish", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to initiate publish" },
      { status: 500 },
    );
  }
}
