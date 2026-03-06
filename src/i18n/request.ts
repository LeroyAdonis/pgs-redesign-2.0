/**
 * Server-side request configuration for next-intl
 *
 * Loads the appropriate translation messages for the current request's locale.
 * Falls back to the default locale (en) if the requested locale is invalid.
 *
 * Uses a static import map so Turbopack can bundle all locale files at
 * build time. Dynamic template-string imports (e.g. `import(`./messages/${locale}.json`)`)
 * are NOT statically analyzable and cause non-default locales to fail at runtime.
 *
 * @see https://next-intl.dev/docs/usage/configuration#i18n-request
 */

import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

import en from "./messages/en.json";
import af from "./messages/af.json";
import zu from "./messages/zu.json";
import xh from "./messages/xh.json";
import nso from "./messages/nso.json";
import tn from "./messages/tn.json";
import st from "./messages/st.json";
import ts from "./messages/ts.json";
import ss from "./messages/ss.json";
import ve from "./messages/ve.json";
import nr from "./messages/nr.json";

/** Static locale → messages map. Exported for testing. */
export const localeMessages: Record<string, typeof en> = {
  en, af, zu, xh, nso, tn, st, ts, ss, ve, nr,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: localeMessages[locale] ?? localeMessages[routing.defaultLocale],
  };
});
