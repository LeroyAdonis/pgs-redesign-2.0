/**
 * Shared utilities for analytics API routes.
 *
 * Provides auth helpers and query-param parsing so each
 * route stays small and consistent.
 */

import { getServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { DateRange } from "@/lib/analytics/types";

/** Result of the auth check — either the orgId or a ready-to-return error response. */
type AuthResult =
  | { ok: true; orgId: string }
  | { ok: false; response: NextResponse };

/**
 * Validate the session, look up org membership, and return the orgId.
 *
 * Returns a discriminated union so callers can early-return the
 * error response without duplicating auth boilerplate.
 */
export async function requireOrgMembership(): Promise<AuthResult> {
  let session;
  try {
    session = await getServerSession();
  } catch {
    session = null;
  }
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const memberships = await db
    .select()
    .from(organizationMember)
    .where(eq(organizationMember.userId, session.user.id))
    .limit(1);

  const membership = memberships[0];
  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: true, data: [], total: 0 },
        { status: 200 },
      ),
    };
  }

  return { ok: true, orgId: membership.orgId };
}

/**
 * Parse optional `from` and `to` ISO-date query params into a DateRange.
 *
 * Returns `undefined` when either param is missing, letting the
 * analytics service fall back to its own default (last 30 days).
 * Returns `null` when the dates are present but invalid.
 */
export function parseDateRange(
  searchParams: URLSearchParams,
): DateRange | null | undefined {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  if (!fromRaw || !toRaw) return undefined;

  const from = new Date(fromRaw);
  const to = new Date(toRaw);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;

  return { from, to };
}
