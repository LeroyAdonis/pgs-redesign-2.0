/**
 * i18n configuration — re-exports for convenience
 *
 * Centralizes i18n exports so consumers can import from a single location.
 * The actual routing config lives in ./routing.ts (used by next-intl).
 *
 * @example
 * ```ts
 * import { locales, defaultLocale } from '@/i18n/config'
 * ```
 */

import { SA_LANGUAGES, DEFAULT_LOCALE } from "@/lib/constants";

/** All supported locale codes */
export const locales = SA_LANGUAGES.map((lang) => lang.code);

/** Default locale */
export const defaultLocale = DEFAULT_LOCALE;

/** All SA languages with metadata (code, name, nativeName) */
export const languages = SA_LANGUAGES;

/**
 * Get language metadata for a locale code.
 * Returns the English language entry if the code is not found.
 */
export function getLanguageByCode(code: string) {
  return SA_LANGUAGES.find((lang) => lang.code === code) ?? SA_LANGUAGES[0];
}
