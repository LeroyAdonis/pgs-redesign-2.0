/**
 * Better-auth API route handler (catch-all)
 *
 * All auth endpoints (sign-in, sign-up, sign-out, OAuth callbacks,
 * session checks, etc.) are handled by Better-auth under /api/auth/*.
 *
 * The proxy.ts middleware skips /api/* routes so these bypass i18n
 * locale processing entirely — this is intentional.
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */

import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  AUTH_RATE_LIMIT,
  PASSWORD_RESET_RATE_LIMIT,
} from "@/lib/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

/**
 * Extract client IP from request headers.
 * Falls back to "unknown" if IP can't be determined.
 */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Determine which rate limit config to use based on the auth action.
 * Login, signup, and forgot-password get specific limits.
 */
function getRateLimitForPath(pathname: string) {
  if (pathname.includes("/sign-in") || pathname.includes("/sign-up")) {
    return AUTH_RATE_LIMIT;
  }
  if (pathname.includes("/forget-password") || pathname.includes("/reset-password")) {
    return PASSWORD_RESET_RATE_LIMIT;
  }
  // Other auth endpoints (session check, OAuth callbacks, etc.) — no limit
  return null;
}

function wrapWithRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getClientIp(req);
    const pathname = new URL(req.url).pathname;
    const limit = getRateLimitForPath(pathname);

    if (limit) {
      const result = checkRateLimit(`auth:${ip}:${pathname}`, limit);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
            retryAfter: Math.ceil(result.retryAfterMs / 1000),
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
            },
          },
        );
      }
    }

    return handler(req);
  };
}

export const GET = wrapWithRateLimit(authGET);
export const POST = wrapWithRateLimit(authPOST);
