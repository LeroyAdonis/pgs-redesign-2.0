/**
 * Admin-level auth session helpers
 *
 * Extends the base auth-session helpers with role-based access control
 * for admin-only routes. Every admin page/API must call one of these.
 *
 * `requireAdminSession()` — returns session or redirects non-admins to /dashboard.
 * `isAdmin()`             — returns boolean for conditional checks.
 *
 * Usage:
 *   import { requireAdminSession } from "@/lib/admin-session";
 *   const session = await requireAdminSession();
 *   // session.user.role === "admin" guaranteed here
 */

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";

/**
 * Require an admin-level session or redirect.
 *
 * Checks two things:
 * 1. User is authenticated (has a valid session)
 * 2. User has the "admin" role
 *
 * If unauthenticated → redirects to /login
 * If authenticated but not admin → redirects to /dashboard
 *
 * @returns A guaranteed non-null session where user.role === "admin"
 */
export async function requireAdminSession() {
  const session = await getServerSession();

  if (!session) {
    logger.warn("Admin access attempted without session");
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "admin") {
    logger.warn("Non-admin user attempted admin access", {
      userId: session.user.id,
      role: session.user.role ?? "user",
    });
    redirect("/dashboard");
  }

  return session;
}

/**
 * Check if the current user is an admin without redirecting.
 *
 * Use this for conditional UI rendering or optional admin features.
 * Returns false if unauthenticated or not an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return session?.user.role === "admin";
}
