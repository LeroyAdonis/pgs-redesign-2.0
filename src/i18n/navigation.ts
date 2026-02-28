/**
 * Locale-aware navigation helpers
 *
 * Use these instead of Next.js built-in navigation (next/link, next/navigation)
 * to get automatic locale-prefix handling in links and redirects.
 *
 * @example
 * ```tsx
 * import { Link, useRouter } from '@/i18n/navigation'
 *
 * <Link href="/dashboard">Dashboard</Link>
 * // Renders as /en/dashboard or /zu/dashboard depending on current locale
 * ```
 */

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
