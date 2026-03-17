/**
 * next-intl middleware
 *
 * Handles locale detection and routing for all requests.
 * Without this middleware, locale switching via `router.replace(pathname, { locale })`
 * does nothing — the URL prefix never changes.
 *
 * @see https://next-intl.dev/docs/routing/middleware
 */

import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - Static files (.html, .ico, .css, .js, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
