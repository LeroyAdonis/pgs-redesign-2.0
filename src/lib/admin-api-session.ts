/**
 * Admin API session helper for route handlers
 *
 * Centralizes the admin auth check for all /api/admin/* routes.
 * Returns the validated session on success, or a JSON error response
 * on auth failure. Callers just need to check for the `error` property.
 *
 * Usage:
 *   import { requireAdminApiSession } from "@/lib/admin-api-session";
 *
 *   export async function GET() {
 *     const auth = await requireAdminApiSession();
 *     if ("error" in auth) return auth.error;
 *     // auth.session is guaranteed valid + admin here
 *   }
 *
 * @see admin-session.ts — page-level equivalent (redirects instead of JSON)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";

type AdminApiResult =
  | { session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>; error?: never }
  | { session?: never; error: NextResponse };

/**
 * Verify the caller has a valid admin session for API routes.
 *
 * Checks:
 * 1. User is authenticated (has a valid session)
 * 2. User has the "admin" role
 *
 * @returns `{ session }` if admin, `{ error }` (NextResponse 401/403) if not
 */
export async function requireAdminApiSession(): Promise<AdminApiResult> {
  const session = await getServerSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden — admin access required" },
        { status: 403 },
      ),
    };
  }

  return { session };
}
