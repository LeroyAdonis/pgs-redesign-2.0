/**
 * GET /api/brand/profile/org/[orgId] — Get brand profile(s) for an organization
 *
 * Returns all brand profiles for the specified org. Supports optional
 * `?language=` query parameter to filter by language.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getProfilesForOrg } from "@/lib/brand/profile-service";

type RouteParams = {
  params: Promise<{ orgId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify user has access to this org
    const membership = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.orgId, orgId),
          eq(organizationMember.userId, session.user.id),
        ),
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Optional language filter
    const url = new URL(request.url);
    const language = url.searchParams.get("language") ?? undefined;

    const profiles = await getProfilesForOrg(orgId, language);

    return NextResponse.json({ profiles });
  } catch (error) {
    logger.error("Failed to get brand profiles", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to get brand profiles" },
      { status: 500 },
    );
  }
}
