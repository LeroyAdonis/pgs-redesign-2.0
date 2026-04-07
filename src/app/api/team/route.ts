import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { organizationMember, user, organization } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get org membership
    const membership = await db.select().from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id)).limit(1);
    
    if (!membership[0]) return NextResponse.json({ members: [], org: null });

    const orgId = membership[0].orgId;

    // Get all members
    const members = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: organizationMember.role,
        joinedAt: organizationMember.joinedAt,
      })
      .from(organizationMember)
      .innerJoin(user, eq(user.id, organizationMember.userId))
      .where(eq(organizationMember.orgId, orgId));

    // Get org info
    const org = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);

    return NextResponse.json({ members, org: org[0] ?? null });
  } catch (err) {
    console.error("[/api/team] Error:", err);
    return NextResponse.json({ members: [], org: null });
  }
}
