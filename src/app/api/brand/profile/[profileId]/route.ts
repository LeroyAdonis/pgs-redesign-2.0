/**
 * PATCH /api/brand/profile/[profileId] — Update a brand profile
 *
 * Allows users to manually adjust their brand profile after analysis.
 * Validates ownership through org membership.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { brandProfile, organizationMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateProfile } from "@/lib/brand/profile-service";
import type { BrandProfileUpdate } from "@/lib/brand/types";

type RouteParams = {
  params: Promise<{ profileId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileId } = await params;

    // Look up the profile to verify ownership
    const profiles = await db
      .select()
      .from(brandProfile)
      .where(eq(brandProfile.id, profileId))
      .limit(1);

    const profile = profiles[0];
    if (!profile) {
      return NextResponse.json(
        { error: "Brand profile not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this org
    const membership = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.orgId, profile.orgId),
          eq(organizationMember.userId, session.user.id),
        ),
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as BrandProfileUpdate;

    const updated = await updateProfile(profileId, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    logger.info("Brand profile updated via API", { profileId });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    logger.error("Failed to update brand profile", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to update brand profile" },
      { status: 500 },
    );
  }
}
