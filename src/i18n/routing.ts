/**
 * next-intl routing configuration
 *
 * Defines all supported locales (11 South African official languages)
 * and the default locale for prefix-based routing.
 *
 * @see https://next-intl.dev/docs/routing/configuration
 */

import { defineRouting } from "next-intl/routing";
import { SA_LANGUAGES, DEFAULT_LOCALE } from "@/lib/constants";

/** All supported locale codes derived from SA_LANGUAGES constant */
const locales = SA_LANGUAGES.map((lang) => lang.code);

export const routing = defineRouting({
  locales,
  defaultLocale: DEFAULT_LOCALE,
  /**
   * When the default locale is matched, the URL prefix is still shown.
   * e.g. /en/dashboard not /dashboard.
   * This keeps URLs consistent across all locales.
   */
  localePrefix: "always",
});
