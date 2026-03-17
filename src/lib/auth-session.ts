/**
 * Server-side auth session helpers
 *
 * Provides `getServerSession()` and `requireServerSession()` for use in
 * server components, server actions, and route handlers.
 *
 * `getServerSession()`      — returns session or null (caller decides).
 * `requireServerSession()`  — returns session or redirects to /login.
 *
 * The edge proxy (`src/proxy.ts`) only checks for cookie *presence* as a
 * fast-rejection guard. These helpers perform the real DB-backed session
 * validation via Better-auth's `auth.api.getSession()`. Every protected
 * page and API route MUST call one of these helpers.
 *
 * Usage:
 *   import { requireServerSession } from "@/lib/auth-session";
 *   const session = await requireServerSession();
 *   // session is guaranteed to be valid here
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Get the current auth session from a server context.
 *
 * Uses Better-auth's `auth.api.getSession()` with the incoming
 * request headers (cookie-based session token). This performs a full
 * DB lookup — the session token is validated, not just checked for
 * presence.
 *
 * Returns the session object with user data, or null if not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require a valid server session or redirect to login.
 *
 * Use this in protected server components, pages, and server actions.
 * If the session is missing or invalid (expired / revoked), the user
 * is redirected to `/login` with a `callbackUrl` so they return to
 * the current page after signing in.
 *
 * @returns A guaranteed non-null session with user data.
 */
export async function requireServerSession() {
  const session = await getServerSession();

  if (!session) {
    const headerList = await headers();
    // x-next-pathname is set by Next.js; fall back to "/" if absent.
    const pathname = headerList.get("x-next-pathname") ?? "/";
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return session;
}
