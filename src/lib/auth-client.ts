/**
 * Better-auth client for client components
 *
 * This module creates the auth client instance used in React client
 * components (sign-in forms, session hooks, sign-out buttons, etc.).
 *
 * Usage in client components:
 *   import { authClient } from "@/lib/auth-client";
 *   const { data: session } = authClient.useSession();
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */

"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Auth client instance.
 *
 * By default, better-auth's client infers the base URL from the
 * current window origin and uses `/api/auth` as the basePath.
 * This matches our API route at `src/app/api/auth/[...all]/route.ts`.
 */
export const authClient = createAuthClient();

/**
 * Convenience re-exports for common auth operations.
 * These are thin wrappers around authClient methods for ergonomic imports.
 */
export const { signIn, signUp, signOut, useSession } = authClient;
