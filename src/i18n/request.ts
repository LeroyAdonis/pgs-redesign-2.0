/**
 * Server-side request configuration for next-intl
 *
 * Loads the appropriate translation messages for the current request's locale.
 * Falls back to the default locale (en) if the requested locale is invalid.
 *
 * @see https://next-intl.dev/docs/usage/configuration#i18n-request
 */

import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale comes from the [locale] segment in the URL
  const requested = await requestLocale;

  // Validate the locale against our supported list
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
