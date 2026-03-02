/**
 * Tests for the tier enforcement service
 *
 * Mocks the Drizzle DB to validate tier limit checking,
 * platform access, scheduling mode, and tier recommendation logic.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import {
  checkTierLimit,
  checkPlatformAccess,
  checkSchedulingMode,
  getRequiredTierForLimit,
} from "../tier-enforcement";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let db: { select: Mock };

// ---------------------------------------------------------------------------
// Helpers — Drizzle fluent chain mocks
// ---------------------------------------------------------------------------

function selectChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.where = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.then = (resolve: (v: T[]) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const ORG_ID = "org_test_123";

beforeEach(async () => {
  vi.clearAllMocks();
  const dbMod = await import("@/db");
  db = dbMod.db as unknown as typeof db;
});

// ---------------------------------------------------------------------------
// checkTierLimit
// ---------------------------------------------------------------------------

describe("checkTierLimit", () => {
  it("denies seedling org at social account limit (2/2)", async () => {
    // 1st select: getOrgTier
    db.select.mockReturnValueOnce(selectChain([{ tier: "seedling" }]));
    // 2nd select: countCurrentUsage (social_accounts)
    db.select.mockReturnValueOnce(selectChain([{ value: 2 }]));

    const result = await checkTierLimit(ORG_ID, "social_accounts");

    expect(result.allowed).toBe(false);
    expect(result.current).toBe(2);
    expect(result.limit).toBe(2);
    expect(result.tier).toBe("seedling");
  });

  it("allows mogul with unlimited social accounts (limit = -1)", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "mogul" }]));
    db.select.mockReturnValueOnce(selectChain([{ value: 100 }]));

    const result = await checkTierLimit(ORG_ID, "social_accounts");

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(100);
    expect(result.limit).toBe(-1);
    expect(result.tier).toBe("mogul");
  });

  it("returns correct current and limit counts for hustler", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "hustler" }]));
    db.select.mockReturnValueOnce(selectChain([{ value: 3 }]));

    const result = await checkTierLimit(ORG_ID, "social_accounts");

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(3);
    expect(result.limit).toBe(5); // hustler socialAccounts limit
    expect(result.tier).toBe("hustler");
  });

  it("denies seedling org for image generation (limit = 0)", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "seedling" }]));
    db.select.mockReturnValueOnce(selectChain([{ value: 0 }]));

    const result = await checkTierLimit(ORG_ID, "image_gen");

    expect(result.allowed).toBe(false);
    expect(result.current).toBe(0);
    expect(result.limit).toBe(0);
  });

  it("allows grower for ai_posts within limit", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "grower" }]));
    db.select.mockReturnValueOnce(selectChain([{ value: 150 }]));

    const result = await checkTierLimit(ORG_ID, "ai_posts");

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(150);
    expect(result.limit).toBe(200); // grower aiPostsPerMonth
  });

  it("throws when organisation is not found", async () => {
    db.select.mockReturnValueOnce(selectChain([]));

    await expect(checkTierLimit(ORG_ID, "social_accounts")).rejects.toThrow(
      "Organization not found",
    );
  });
});

// ---------------------------------------------------------------------------
// checkPlatformAccess
// ---------------------------------------------------------------------------

describe("checkPlatformAccess", () => {
  it("denies seedling access to twitter", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "seedling" }]));

    const result = await checkPlatformAccess(ORG_ID, "twitter");

    expect(result.allowed).toBe(false);
    expect(result.tier).toBe("seedling");
  });

  it("denies seedling access to linkedin", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "seedling" }]));

    const result = await checkPlatformAccess(ORG_ID, "linkedin");

    expect(result.allowed).toBe(false);
  });

  it("allows seedling access to instagram and facebook", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "seedling" }]));
    const instagram = await checkPlatformAccess(ORG_ID, "instagram");
    expect(instagram.allowed).toBe(true);

    db.select.mockReturnValueOnce(selectChain([{ tier: "seedling" }]));
    const facebook = await checkPlatformAccess(ORG_ID, "facebook");
    expect(facebook.allowed).toBe(true);
  });

  it("allows hustler access to all standard platforms", async () => {
    const platforms = [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
    ];

    for (const platform of platforms) {
      db.select.mockReturnValueOnce(selectChain([{ tier: "hustler" }]));
      const result = await checkPlatformAccess(ORG_ID, platform);
      expect(result.allowed).toBe(true);
    }
  });

  it("denies hustler access to whatsapp business", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "hustler" }]));

    const result = await checkPlatformAccess(ORG_ID, "whatsapp");

    expect(result.allowed).toBe(false);
  });

  it("denies grower access to whatsapp business", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "grower" }]));

    const result = await checkPlatformAccess(ORG_ID, "whatsapp");

    expect(result.allowed).toBe(false);
  });

  it("allows only mogul access to whatsapp business", async () => {
    db.select.mockReturnValueOnce(selectChain([{ tier: "mogul" }]));

    const result = await checkPlatformAccess(ORG_ID, "whatsapp");

    expect(result.allowed).toBe(true);
    expect(result.tier).toBe("mogul");
  });
});

// ---------------------------------------------------------------------------
// checkSchedulingMode
// ---------------------------------------------------------------------------

describe("checkSchedulingMode", () => {
  it("returns correct scheduling mode for each tier", async () => {
    const expectations: [string, string][] = [
      ["seedling", "manual"],
      ["hustler", "manual_ai_weekly"],
      ["grower", "ai_daily_weekly"],
      ["mogul", "full_autonomous"],
    ];

    for (const [tier, expectedMode] of expectations) {
      db.select.mockReturnValueOnce(selectChain([{ tier }]));
      const result = await checkSchedulingMode(ORG_ID);
      expect(result.mode).toBe(expectedMode);
      expect(result.tier).toBe(tier);
    }
  });
});

// ---------------------------------------------------------------------------
// getRequiredTierForLimit (pure function — no DB mocking needed)
// ---------------------------------------------------------------------------

describe("getRequiredTierForLimit", () => {
  it("returns seedling for 1 social account", () => {
    expect(getRequiredTierForLimit("social_accounts", 1)).toBe("seedling");
  });

  it("returns seedling for 2 social accounts (at limit)", () => {
    expect(getRequiredTierForLimit("social_accounts", 2)).toBe("seedling");
  });

  it("returns hustler for 3 social accounts", () => {
    expect(getRequiredTierForLimit("social_accounts", 3)).toBe("hustler");
  });

  it("returns grower for 10 social accounts", () => {
    expect(getRequiredTierForLimit("social_accounts", 10)).toBe("grower");
  });

  it("returns mogul for counts above grower limits", () => {
    // grower socialAccounts = 15, mogul = -1 (unlimited)
    expect(getRequiredTierForLimit("social_accounts", 20)).toBe("mogul");
    expect(getRequiredTierForLimit("social_accounts", 100)).toBe("mogul");
  });

  it("returns hustler as minimum tier for image generation (seedling has 0)", () => {
    // seedling imageGenPerMonth = 0, hustler = 10
    expect(getRequiredTierForLimit("image_gen", 1)).toBe("hustler");
  });

  it("returns grower for 30 image generations per month", () => {
    // hustler = 10, grower = 50
    expect(getRequiredTierForLimit("image_gen", 30)).toBe("grower");
  });

  it("returns mogul for ai_posts above grower limit", () => {
    // grower aiPostsPerMonth = 200, mogul = 500
    expect(getRequiredTierForLimit("ai_posts", 300)).toBe("mogul");
  });

  it("returns mogul for counts beyond all tier limits", () => {
    // mogul aiPostsPerMonth = 500 (not unlimited)
    // 600 > 500, so no tier qualifies — fallback to mogul
    expect(getRequiredTierForLimit("ai_posts", 600)).toBe("mogul");
  });
});
