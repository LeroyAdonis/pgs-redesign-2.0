/**
 * Tests for branded email templates
 *
 * Validates that each template function generates valid HTML
 * with correct data interpolation and Purple Glow branding.
 */

import { describe, it, expect } from "vitest";
import {
  baseTemplate,
  postPublishedEmail,
  postFailedEmail,
  lowCreditsEmail,
  weeklyDigestEmail,
} from "../email-templates";
import type {
  PostPublishedEmailData,
  PostFailedEmailData,
  LowCreditsEmailData,
  WeeklyDigestEmailData,
} from "../email-templates";

// ---------------------------------------------------------------------------
// baseTemplate
// ---------------------------------------------------------------------------

describe("baseTemplate", () => {
  it("wraps content in Purple Glow branded HTML", () => {
    const html = baseTemplate("<p>Hello World</p>");

    // Structural checks
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=\"en\">");
    expect(html).toContain("</html>");

    // Brand elements
    expect(html).toContain("Purple Glow Social");
    expect(html).toContain("#8b5cf6"); // primary purple
    expect(html).toContain("Proudly South African");
    expect(html).toContain("🇿🇦");

    // Injected content
    expect(html).toContain("<p>Hello World</p>");
  });

  it("includes unsubscribe/manage link", () => {
    const html = baseTemplate("<p>Test</p>");

    expect(html).toContain("Manage preferences");
    expect(html).toContain("settings/notifications");
  });
});

// ---------------------------------------------------------------------------
// postPublishedEmail
// ---------------------------------------------------------------------------

describe("postPublishedEmail", () => {
  const baseData: PostPublishedEmailData = {
    postId: "post_1",
    platform: "twitter",
    userName: "Sipho",
  };

  it("generates valid HTML with platform and user name", () => {
    const html = postPublishedEmail(baseData);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("twitter");
    expect(html).toContain("Sipho");
  });

  it("includes 'Lekker' SA flair", () => {
    const html = postPublishedEmail(baseData);

    expect(html).toContain("Lekker");
  });

  it("includes View Dashboard CTA", () => {
    const html = postPublishedEmail(baseData);

    expect(html).toContain("View Dashboard");
  });

  it("includes platform link when platformUrl is provided", () => {
    const html = postPublishedEmail({
      ...baseData,
      platformUrl: "https://twitter.com/i/status/123",
    });

    expect(html).toContain("https://twitter.com/i/status/123");
    expect(html).toContain("View on twitter");
  });

  it("uses custom dashboardUrl when provided", () => {
    const html = postPublishedEmail({
      ...baseData,
      dashboardUrl: "https://custom.app/dash",
    });

    expect(html).toContain("https://custom.app/dash");
  });
});

// ---------------------------------------------------------------------------
// postFailedEmail
// ---------------------------------------------------------------------------

describe("postFailedEmail", () => {
  const baseData: PostFailedEmailData = {
    postId: "post_2",
    platform: "instagram",
    error: "API rate limit exceeded",
    retryable: true,
    userName: "Thandi",
  };

  it("includes error message in the email", () => {
    const html = postFailedEmail(baseData);

    expect(html).toContain("API rate limit exceeded");
    expect(html).toContain("instagram");
    expect(html).toContain("Thandi");
  });

  it("shows retry button when retryable", () => {
    const html = postFailedEmail(baseData);

    expect(html).toContain("Retry Post");
  });

  it("does not show retry button when not retryable", () => {
    const html = postFailedEmail({ ...baseData, retryable: false });

    expect(html).not.toContain("Retry Post");
    expect(html).toContain("Eish!");
  });

  it("uses custom retryUrl when provided", () => {
    const html = postFailedEmail({
      ...baseData,
      retryUrl: "https://custom.app/retry/post_2",
    });

    expect(html).toContain("https://custom.app/retry/post_2");
  });
});

// ---------------------------------------------------------------------------
// lowCreditsEmail
// ---------------------------------------------------------------------------

describe("lowCreditsEmail", () => {
  const baseData: LowCreditsEmailData = {
    remaining: 8,
    total: 100,
    percentage: 8,
    userName: "Lerato",
  };

  it("includes remaining and total credits", () => {
    const html = lowCreditsEmail(baseData);

    expect(html).toContain("8");   // remaining
    expect(html).toContain("100"); // total
    expect(html).toContain("8%");  // percentage
    expect(html).toContain("Lerato");
  });

  it("includes top-up CTA", () => {
    const html = lowCreditsEmail(baseData);

    expect(html).toContain("Top Up Credits");
  });

  it("includes credits progress bar", () => {
    const html = lowCreditsEmail(baseData);

    // The progress bar uses the percentage in width
    expect(html).toContain("linear-gradient");
    expect(html).toContain("#8b5cf6");
  });

  it("uses custom topUpUrl when provided", () => {
    const html = lowCreditsEmail({
      ...baseData,
      topUpUrl: "https://custom.app/topup",
    });

    expect(html).toContain("https://custom.app/topup");
  });
});

// ---------------------------------------------------------------------------
// weeklyDigestEmail
// ---------------------------------------------------------------------------

describe("weeklyDigestEmail", () => {
  const baseData: WeeklyDigestEmailData = {
    totalImpressions: 25_000,
    topPostId: "top_post_1",
    trend: "up",
    userName: "Pieter",
    dateRange: "12–18 Jun 2025",
  };

  it("includes metrics and date range", () => {
    const html = weeklyDigestEmail(baseData);

    // Impressions formatted with locale separators
    expect(html).toContain("Impressions");
    expect(html).toContain("12–18 Jun 2025");
    expect(html).toContain("Pieter");
  });

  it("shows trend up emoji and label", () => {
    const html = weeklyDigestEmail(baseData);

    expect(html).toContain("📈");
    expect(html).toContain("lekker work");
  });

  it("shows trend down emoji and label", () => {
    const html = weeklyDigestEmail({ ...baseData, trend: "down" });

    expect(html).toContain("📉");
    expect(html).toContain("turn it around");
  });

  it("shows flat trend emoji and label", () => {
    const html = weeklyDigestEmail({ ...baseData, trend: "flat" });

    expect(html).toContain("➡️");
    expect(html).toContain("Holding steady");
  });

  it("includes optional metrics when provided", () => {
    const html = weeklyDigestEmail({
      ...baseData,
      totalPosts: 12,
      engagementRate: 4.7,
    });

    expect(html).toContain("Posts Published");
    expect(html).toContain("12");
    expect(html).toContain("Engagement Rate");
    expect(html).toContain("4.7%");
  });

  it("includes top post link when topPostId provided", () => {
    const html = weeklyDigestEmail(baseData);

    expect(html).toContain("top_post_1");
    expect(html).toContain("View post");
  });

  it("includes View Full Report CTA", () => {
    const html = weeklyDigestEmail(baseData);

    expect(html).toContain("View Full Report");
  });
});
