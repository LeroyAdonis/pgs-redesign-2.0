/**
 * Tests for publisher fetchMetrics
 *
 * Tests the base adapter's fetchMetrics wrapper (try/catch, null on error)
 * and each platform adapter's doFetchMetrics (deterministic mock output).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPublisher,
  TwitterPublisher,
  FacebookPublisher,
  InstagramPublisher,
  LinkedInPublisher,
  TikTokPublisher,
  WhatsAppPublisher,
  GoogleBusinessPublisher,
} from "@/lib/publishers";
import { PLATFORMS } from "@/lib/social/types";
import type { Platform } from "@/lib/social/types";

// ---------------------------------------------------------------------------
// Mock logger to suppress output during tests
// ---------------------------------------------------------------------------

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Clear cached publisher instances between tests so each test is isolated
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ==========================================================================
// Base adapter fetchMetrics wrapper
// ==========================================================================

describe("BasePublisherAdapter.fetchMetrics", () => {
  it("returns metrics on success", async () => {
    const adapter = new TwitterPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "tweet-123",
      accessToken: "test-token",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBeGreaterThanOrEqual(0);
    expect(result!.reach).toBeGreaterThanOrEqual(0);
    expect(result!.likes).toBeGreaterThanOrEqual(0);
    expect(result!.shares).toBeGreaterThanOrEqual(0);
    expect(result!.comments).toBeGreaterThanOrEqual(0);
    expect(result!.clicks).toBeGreaterThanOrEqual(0);
  });

  it("returns null on error (doFetchMetrics throws)", async () => {
    const adapter = new TwitterPublisher();

    // Override doFetchMetrics to throw
    const original = Object.getPrototypeOf(adapter);
    const spy = vi
      .spyOn(original, "doFetchMetrics")
      .mockRejectedValue(new Error("API down"));

    const result = await adapter.fetchMetrics({
      platformPostId: "tweet-fail",
      accessToken: "bad-token",
    });

    expect(result).toBeNull();
    spy.mockRestore();
  });
});

// ==========================================================================
// Per-platform adapter metrics — deterministic output
// ==========================================================================

describe("Platform adapter doFetchMetrics", () => {
  const adapterMap: Record<string, { adapter: InstanceType<typeof TwitterPublisher>; minImp: number; maxImp: number }> = {
    twitter: { adapter: new TwitterPublisher(), minImp: 2000, maxImp: 20000 },
    facebook: { adapter: new FacebookPublisher(), minImp: 1000, maxImp: 10000 },
    instagram: { adapter: new InstagramPublisher(), minImp: 1500, maxImp: 15000 },
    linkedin: { adapter: new LinkedInPublisher(), minImp: 800, maxImp: 8000 },
    tiktok: { adapter: new TikTokPublisher(), minImp: 5000, maxImp: 50000 },
    whatsapp: { adapter: new WhatsAppPublisher(), minImp: 100, maxImp: 1000 },
    google_business: { adapter: new GoogleBusinessPublisher(), minImp: 200, maxImp: 2000 },
  };

  it.each(PLATFORMS)(
    "%s returns metrics with all required fields",
    async (platform: Platform) => {
      const adapter = getPublisher(platform);
      const result = await adapter.fetchMetrics({
        platformPostId: `${platform}-post-123`,
        accessToken: "test-token",
      });

      expect(result).not.toBeNull();
      expect(typeof result!.impressions).toBe("number");
      expect(typeof result!.reach).toBe("number");
      expect(typeof result!.likes).toBe("number");
      expect(typeof result!.shares).toBe("number");
      expect(typeof result!.comments).toBe("number");
      expect(typeof result!.clicks).toBe("number");
    },
  );

  it.each(PLATFORMS)(
    "%s returns non-negative metrics",
    async (platform: Platform) => {
      const adapter = getPublisher(platform);
      const result = await adapter.fetchMetrics({
        platformPostId: `${platform}-post-456`,
        accessToken: "test-token",
      });

      expect(result).not.toBeNull();
      expect(result!.impressions).toBeGreaterThanOrEqual(0);
      expect(result!.reach).toBeGreaterThanOrEqual(0);
      expect(result!.likes).toBeGreaterThanOrEqual(0);
      expect(result!.shares).toBeGreaterThanOrEqual(0);
      expect(result!.comments).toBeGreaterThanOrEqual(0);
      expect(result!.clicks).toBeGreaterThanOrEqual(0);
    },
  );

  it("produces deterministic output for the same platformPostId", async () => {
    const adapter = new TwitterPublisher();
    const options = { platformPostId: "tweet-stable-42", accessToken: "tok" };

    const result1 = await adapter.fetchMetrics(options);
    const result2 = await adapter.fetchMetrics(options);

    expect(result1).toEqual(result2);
  });

  it("produces different output for different platformPostIds", async () => {
    const adapter = new FacebookPublisher();

    const result1 = await adapter.fetchMetrics({
      platformPostId: "fb-post-aaa",
      accessToken: "tok",
    });

    const result2 = await adapter.fetchMetrics({
      platformPostId: "fb-post-zzz",
      accessToken: "tok",
    });

    // Very unlikely to be identical with different seeds
    const sameValues =
      result1!.impressions === result2!.impressions &&
      result1!.likes === result2!.likes &&
      result1!.shares === result2!.shares;

    expect(sameValues).toBe(false);
  });
});
