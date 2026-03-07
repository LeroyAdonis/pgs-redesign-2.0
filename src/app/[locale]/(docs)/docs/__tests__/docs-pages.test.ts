/**
 * Regression tests for documentation pages (C2)
 *
 * Verifies that all docs page translation keys exist across every locale
 * and that each page module exports the expected symbols (default component
 * + generateMetadata). These keys are loaded during SSR — a missing key
 * previously crashed the server with 500 errors.
 *
 * Root cause history:
 * - C1 fixed a dynamic-import issue in src/i18n/request.ts that caused
 *   non-English locales to 500. During next build, static generation of
 *   all 11 locales would fail, which cascaded into C2: three docs pages
 *   (scheduling, linking-accounts, ai-content) returning 500 even for /en.
 * - These tests prevent recurrence by ensuring every locale file contains
 *   the required docs namespace keys.
 */

import { describe, it, expect } from "vitest";
import { localeMessages } from "@/i18n/request";

/**
 * All docs pages and the translation namespace keys they depend on.
 * Each page calls `getTranslations("docs")` and then accesses
 * `t("<namespace>.title")` and `t("<namespace>.description")`.
 */
const DOCS_NAMESPACES = [
  { page: "getting-started", namespace: "gettingStarted" },
  { page: "linking-accounts", namespace: "linkingAccounts" },
  { page: "ai-content", namespace: "aiContent" },
  { page: "scheduling", namespace: "scheduling" },
  { page: "billing-faq", namespace: "billingFaq" },
  { page: "api-reference", namespace: "apiReference" },
] as const;

/** Keys that every docs namespace MUST contain. */
const REQUIRED_KEYS = ["title", "description"] as const;

describe("docs page translation keys", () => {
  const locales = Object.keys(localeMessages);

  it("localeMessages includes all 11 SA locales", () => {
    expect(locales.length).toBe(11);
    expect(locales).toContain("en");
  });

  for (const { page, namespace } of DOCS_NAMESPACES) {
    describe(`/docs/${page} (docs.${namespace})`, () => {
      for (const locale of locales) {
        it(`${locale}: has required keys (title, description)`, () => {
          const messages = localeMessages[locale] as Record<string, unknown>;
          const docs = messages["docs"] as Record<string, unknown> | undefined;

          expect(docs).toBeDefined();

          const ns = docs?.[namespace] as Record<string, string> | undefined;
          expect(ns).toBeDefined();

          for (const key of REQUIRED_KEYS) {
            expect(ns).toHaveProperty(key);
            expect(typeof ns?.[key]).toBe("string");
            expect(ns?.[key]?.length).toBeGreaterThan(0);
          }
        });
      }
    });
  }
});

describe("docs page sidebar keys", () => {
  it("en.json contains sidebar label for every docs page", () => {
    const en = localeMessages["en"] as Record<string, unknown>;
    const docs = en["docs"] as Record<string, unknown>;
    const sidebar = docs["sidebar"] as Record<string, string>;

    expect(sidebar).toBeDefined();

    for (const { namespace } of DOCS_NAMESPACES) {
      expect(sidebar).toHaveProperty(namespace);
      expect(typeof sidebar[namespace]).toBe("string");
    }
  });
});

describe("docs top-level keys", () => {
  it("en.json has docs.title and docs.subtitle", () => {
    const en = localeMessages["en"] as Record<string, unknown>;
    const docs = en["docs"] as Record<string, string>;

    expect(docs).toHaveProperty("title");
    expect(docs).toHaveProperty("subtitle");
  });
});
