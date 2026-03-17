/**
 * Tests for i18n request config — locale message loading
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the message-loading logic by importing the locale map directly
// since getRequestConfig is a next-intl internal that needs server context.

describe("locale message map", () => {
  it("exports a record containing all 11 SA locales", async () => {
    const { localeMessages } = await import("../request");

    const expected = [
      "en", "af", "zu", "xh", "nso",
      "tn", "st", "ts", "ss", "ve", "nr",
    ];

    for (const locale of expected) {
      expect(localeMessages).toHaveProperty(locale);
      expect(localeMessages[locale]).toBeDefined();
    }
  });

  it("each locale has a non-empty messages object", async () => {
    const { localeMessages } = await import("../request");

    for (const [locale, messages] of Object.entries(localeMessages)) {
      expect(typeof messages).toBe("object");
      expect(Object.keys(messages as Record<string, unknown>).length).toBeGreaterThan(0);
    }
  });
});
