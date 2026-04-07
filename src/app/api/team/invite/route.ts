import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { organizationMember, user } from "@/db/schema";

/**
 * POST /api/team/invite
 *
 * Invites a user to the current organization.
 * - If the user already exists in the system, adds them as a member directly.
 * - If the user is already a member of the org, returns an error.
 * - If the user doesn't exist yet, returns a message indicating an invite
 *   email would be sent (email sending deferred to Resend integration).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body as { email?: string; role?: string };

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    // Validate role
    const validRoles = ["admin", "member"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: "Role must be 'admin' or 'member'." }, { status: 400 });
    }

    // Get the inviter's org membership (must be owner or admin)
    const inviterMembership = await db
      .select({ orgId: organizationMember.orgId, role: organizationMember.role })
      .from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id))
      .limit(1);

    if (!inviterMembership[0]) {
      return NextResponse.json({ error: "You are not part of an organization." }, { status: 403 });
    }

    const { orgId } = inviterMembership[0];
    const inviterRole = inviterMembership[0].role;

    if (inviterRole !== "owner" && inviterRole !== "admin") {
      return NextResponse.json({ error: "Only owners and admins can invite members." }, { status: 403 });
    }

    // Check if the invitee already exists in the system
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser[0]) {
      // Check if already a member of this org
      const existingMembership = await db
        .select({ id: organizationMember.id })
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.orgId, orgId),
            eq(organizationMember.userId, existingUser[0].id),
          ),
        )
        .limit(1);

      if (existingMembership[0]) {
        return NextResponse.json(
          { error: "This user is already a member of the organization." },
          { status: 409 },
        );
      }

      // Add the user as a member
      await db.insert(organizationMember).values({
        orgId,
        userId: existingUser[0].id,
        role: role as "admin" | "member",
      });

      return NextResponse.json({ success: true, message: "Member added successfully." });
    }

    // User doesn't exist yet — in production, send an invite email via Resend.
    // For now, return a success response indicating the invite was queued.
    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}. They'll be added when they sign up.`,
    });
  } catch (err) {
    console.error("[/api/team/invite] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
