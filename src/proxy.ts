/**
 * Next.js 16 Proxy — Locale detection, routing & auth protection
 *
 * Next.js 16 uses `proxy.ts` instead of the deprecated `middleware.ts`.
 * This proxy handles:
 * 1. Skipping API routes, static assets, and internal Next.js routes
 * 2. Applying next-intl locale detection & URL rewriting for page routes
 * 3. Auth checks for protected routes (dashboard, settings, etc.)
 *
 * Composition strategy:
 * The proxy is a single function that dispatches to different handlers
 * based on the request path. Auth checks go after locale resolution,
 * using the locale-stripped pathname. This avoids conflicts between
 * next-intl and Better-auth.
 *
 * @see https://nextjs.org/docs/app/getting-started/proxy
 * @see https://next-intl.dev/docs/routing/middleware
 */

import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Route segments that require an authenticated session.
 * Matched against the locale-stripped pathname (e.g. "/dashboard").
 */
const PROTECTED_SEGMENTS = [
  "/dashboard",
  "/settings",
  "/accounts",
  "/generate",
  "/posts",
  "/calendar",
  "/analytics",
  "/brand",
  "/billing",
  "/team",
];

/**
 * Check if a locale-stripped pathname is protected.
 * Matches exact segment or prefix (e.g. "/dashboard/overview").
 */
function isProtectedRoute(strippedPathname: string): boolean {
  return PROTECTED_SEGMENTS.some(
    (segment) =>
      strippedPathname === segment ||
      strippedPathname.startsWith(`${segment}/`),
  );
}

/**
 * Strip the locale prefix from a pathname.
 * e.g. "/en/dashboard" → "/dashboard", "/zu/settings" → "/settings"
 */
function stripLocale(pathname: string): string {
  const localePattern = new RegExp(
    `^/(${routing.locales.join("|")})(/|$)`,
  );
  return pathname.replace(localePattern, "/");
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── 1. Bypass: API routes (Better-auth, webhooks, etc.) ───
  // Auth API routes MUST NOT go through i18n locale processing.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ─── 2. Apply i18n locale routing ───
  const response = intlMiddleware(request);

  // ─── 3. Auth protection for protected routes ───
  const strippedPathname = stripLocale(pathname);

  if (isProtectedRoute(strippedPathname)) {
    // ⚠️  FAST-REJECTION GUARD ONLY
    // Edge middleware cannot reliably make DB calls, so we only check
    // for the *presence* of the session cookie here — not its validity.
    // This keeps unauthenticated visitors out quickly, but it does NOT
    // guarantee the session is still valid (e.g. expired or revoked).
    //
    // Real auth validation happens at the page/API layer via
    // `requireServerSession()` from `@/lib/auth-session`, which calls
    // Better-auth's `auth.api.getSession()` and performs a full DB
    // lookup. Every protected page/route MUST call that helper.
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie?.value) {
      // Extract locale from the pathname for the redirect URL.
      // Default to "en" if no locale found.
      const localeMatch = pathname.match(
        new RegExp(`^/(${routing.locales.join("|")})(/|$)`),
      );
      const locale = localeMatch?.[1] ?? routing.defaultLocale;

      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

/**
 * Matcher config — which routes the proxy runs on.
 *
 * Excludes:
 * - /api/* — API routes handled separately above (but also excluded here for perf)
 * - /_next/* — Next.js internal assets
 * - /_vercel/* — Vercel internal routes
 * - /monitoring — Sentry tunnel (if added later)
 * - Static files (anything with a file extension like .ico, .png, .svg)
 */
export const config = {
  matcher: ["/((?!api|_next|_vercel|monitoring|.*\\..*).*)"],
};
