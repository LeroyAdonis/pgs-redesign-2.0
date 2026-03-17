/**
 * Auth session provider for client component tree
 *
 * Wraps children with auth session context so any descendant
 * client component can use `useSession()` from auth-client.
 *
 * This provider doesn't add its own React context — it relies on
 * Better-auth's built-in session management which uses SWR-style
 * fetching internally. The component exists as a composition
 * boundary so we can add auth-related providers in one place.
 *
 * Usage in layouts:
 *   <AuthProvider>
 *     {children}
 *   </AuthProvider>
 */

"use client";

import { type ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth provider component.
 *
 * Currently a pass-through wrapper. Better-auth's `useSession()`
 * hook works without a wrapping provider — it manages its own
 * internal state via the authClient singleton.
 *
 * This component exists as a stable integration point so we can:
 * 1. Add session prefetching/SSR hydration later
 * 2. Compose with other providers (theme, i18n) cleanly
 * 3. Add auth event listeners (session expired, etc.)
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
