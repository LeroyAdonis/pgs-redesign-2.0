/**
 * Application-wide constants for Purple Glow Social 2.0
 */

/** South African timezone identifier */
export const TIMEZONE_SAST = "Africa/Johannesburg";

/** UTC offset for SAST */
export const SAST_UTC_OFFSET = 2;

/** South African Rand currency code */
export const CURRENCY_ZAR = "ZAR";

/** All 11 official South African languages */
export const SA_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "nso", name: "Northern Sotho", nativeName: "Sesotho sa Leboa" },
  { code: "tn", name: "Tswana", nativeName: "Setswana" },
  { code: "st", name: "Southern Sotho", nativeName: "Sesotho" },
  { code: "ts", name: "Tsonga", nativeName: "Xitsonga" },
  { code: "ss", name: "Swati", nativeName: "SiSwati" },
  { code: "ve", name: "Venda", nativeName: "Tshivenḓa" },
  { code: "nr", name: "Southern Ndebele", nativeName: "isiNdebele" },
] as const;

/** Supported locale codes for i18n routing */
export type SALocale = (typeof SA_LANGUAGES)[number]["code"];

/** Default locale */
export const DEFAULT_LOCALE: SALocale = "en";
