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
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
