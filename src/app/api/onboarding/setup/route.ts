import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { organization, organizationMember } from "@/db/schema";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

/**
 * POST /api/onboarding/setup
 * Creates an organization and adds the current user as owner.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { orgName, tier } = body;

    if (!orgName || typeof orgName !== "string" || orgName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Organization name must be at least 2 characters" },
        { status: 400 },
      );
    }

    // Check if user already has an org
    const existingMembership = await db
      .select({ orgId: organizationMember.orgId })
      .from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id))
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json(
        { success: true, message: "Organization already exists", orgId: existingMembership[0].orgId },
      );
    }

    // Generate slug from org name
    const slug = orgName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36);

    // Create organization
    const [org] = await db
      .insert(organization)
      .values({
        name: orgName.trim(),
        slug,
        ownerId: session.user.id,
        tier: (tier as "seedling" | "hustler" | "grower" | "mogul") || "seedling",
      })
      .returning({ id: organization.id });

    // Add user as owner
    await db.insert(organizationMember).values({
      orgId: org.id,
      userId: session.user.id,
      role: "owner",
    });

    logger.info("Organization created during onboarding", {
      orgId: org.id,
      orgName: orgName.trim(),
      userId: session.user.id,
      tier,
    });

    return NextResponse.json({ success: true, orgId: org.id });
  } catch (error) {
    logger.error("Onboarding setup failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to create organization" },
      { status: 500 },
    );
  }
}
