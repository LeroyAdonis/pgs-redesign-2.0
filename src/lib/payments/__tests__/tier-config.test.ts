import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to re-import the module after stubbing env vars,
// so we use dynamic imports in the relevant tests.
// For tests that don't depend on env vars, we import statically.
import type { Tier, TierConfig, TopUpPackage } from "../tier-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dynamically import tier-config with a fresh module evaluation */
async function importFresh() {
  // vitest caches modules — resetModules() clears that cache
  vi.resetModules();
  return import("../tier-config");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("tier-config", () => {
  // ---- Static import for tests that don't depend on env vars ----
  // For these tests, product IDs will be null/empty because env vars aren't set.

  describe("TIER_CONFIGS", () => {
    it("has configs for all 4 tiers", async () => {
      const { TIER_CONFIGS } = await importFresh();
      const tiers: Tier[] = ["seedling", "hustler", "grower", "mogul"];
      for (const tier of tiers) {
        expect(TIER_CONFIGS[tier]).toBeDefined();
        expect(TIER_CONFIGS[tier].tier).toBe(tier);
      }
    });

    it("each tier has expected credit allocations", async () => {
      const { TIER_CONFIGS } = await importFresh();
      expect(TIER_CONFIGS.seedling.creditAllocation).toBe(10);
      expect(TIER_CONFIGS.hustler.creditAllocation).toBe(50);
      expect(TIER_CONFIGS.grower.creditAllocation).toBe(200);
      expect(TIER_CONFIGS.mogul.creditAllocation).toBe(500);
    });

    it("seedling is free with null product IDs", async () => {
      const { TIER_CONFIGS } = await importFresh();
      const seedling = TIER_CONFIGS.seedling;
      expect(seedling.monthlyPriceZAR).toBe(0);
      expect(seedling.annualPriceZAR).toBe(0);
      expect(seedling.polarProductIdMonthly).toBeNull();
      expect(seedling.polarProductIdAnnual).toBeNull();
    });

    it("mogul has unlimited (-1) for accounts and seats", async () => {
      const { TIER_CONFIGS } = await importFresh();
      const mogul = TIER_CONFIGS.mogul;
      expect(mogul.limits.socialAccounts).toBe(-1);
      expect(mogul.limits.teamSeats).toBe(-1);
    });

    it("mogul includes whatsapp in platforms and has whatsappBusiness enabled", async () => {
      const { TIER_CONFIGS } = await importFresh();
      const mogul = TIER_CONFIGS.mogul;
      expect(mogul.features.platforms).toContain("whatsapp");
      expect(mogul.features.whatsappBusiness).toBe(true);
    });

    it("grower and mogul have credit rollover enabled", async () => {
      const { TIER_CONFIGS } = await importFresh();
      expect(TIER_CONFIGS.grower.features.creditRollover).toBe(true);
      expect(TIER_CONFIGS.mogul.features.creditRollover).toBe(true);
    });

    it("seedling and hustler have credit rollover disabled", async () => {
      const { TIER_CONFIGS } = await importFresh();
      expect(TIER_CONFIGS.seedling.features.creditRollover).toBe(false);
      expect(TIER_CONFIGS.hustler.features.creditRollover).toBe(false);
    });

    it("each tier has correct scheduling mode", async () => {
      const { TIER_CONFIGS } = await importFresh();
      expect(TIER_CONFIGS.seedling.features.schedulingMode).toBe("manual");
      expect(TIER_CONFIGS.hustler.features.schedulingMode).toBe(
        "manual_ai_weekly",
      );
      expect(TIER_CONFIGS.grower.features.schedulingMode).toBe(
        "ai_daily_weekly",
      );
      expect(TIER_CONFIGS.mogul.features.schedulingMode).toBe(
        "full_autonomous",
      );
    });

    it("paid tiers have correct ZAR pricing", async () => {
      const { TIER_CONFIGS } = await importFresh();
      expect(TIER_CONFIGS.hustler.monthlyPriceZAR).toBe(299);
      expect(TIER_CONFIGS.hustler.annualPriceZAR).toBe(2990);
      expect(TIER_CONFIGS.grower.monthlyPriceZAR).toBe(799);
      expect(TIER_CONFIGS.grower.annualPriceZAR).toBe(7990);
      expect(TIER_CONFIGS.mogul.monthlyPriceZAR).toBe(1999);
      expect(TIER_CONFIGS.mogul.annualPriceZAR).toBe(19990);
    });
  });

  // ---- getTierConfig ----

  describe("getTierConfig", () => {
    it("returns correct config for each tier", async () => {
      const { getTierConfig } = await importFresh();
      const tiers: Tier[] = ["seedling", "hustler", "grower", "mogul"];
      for (const tier of tiers) {
        const config = getTierConfig(tier);
        expect(config.tier).toBe(tier);
        expect(config.displayName).toBeTruthy();
        expect(config.limits).toBeDefined();
        expect(config.features).toBeDefined();
      }
    });

    it("throws for unknown tier", async () => {
      const { getTierConfig } = await importFresh();
      expect(() => getTierConfig("diamond" as Tier)).toThrow("Unknown tier");
    });
  });

  // ---- getTierByPolarProductId (with env var mocking) ----

  describe("getTierByPolarProductId", () => {
    beforeEach(() => {
      vi.stubEnv("POLAR_PRODUCT_HUSTLER_MONTHLY", "prod_hustler_m");
      vi.stubEnv("POLAR_PRODUCT_HUSTLER_ANNUAL", "prod_hustler_a");
      vi.stubEnv("POLAR_PRODUCT_GROWER_MONTHLY", "prod_grower_m");
      vi.stubEnv("POLAR_PRODUCT_GROWER_ANNUAL", "prod_grower_a");
      vi.stubEnv("POLAR_PRODUCT_MOGUL_MONTHLY", "prod_mogul_m");
      vi.stubEnv("POLAR_PRODUCT_MOGUL_ANNUAL", "prod_mogul_a");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns correct tier for monthly product ID", async () => {
      const { getTierByPolarProductId } = await importFresh();
      expect(getTierByPolarProductId("prod_hustler_m")).toBe("hustler");
      expect(getTierByPolarProductId("prod_grower_m")).toBe("grower");
      expect(getTierByPolarProductId("prod_mogul_m")).toBe("mogul");
    });

    it("returns correct tier for annual product ID", async () => {
      const { getTierByPolarProductId } = await importFresh();
      expect(getTierByPolarProductId("prod_hustler_a")).toBe("hustler");
      expect(getTierByPolarProductId("prod_grower_a")).toBe("grower");
      expect(getTierByPolarProductId("prod_mogul_a")).toBe("mogul");
    });

    it("returns null for unknown product ID", async () => {
      const { getTierByPolarProductId } = await importFresh();
      expect(getTierByPolarProductId("prod_unknown_123")).toBeNull();
    });

    it("returns null for empty string product ID", async () => {
      const { getTierByPolarProductId } = await importFresh();
      expect(getTierByPolarProductId("")).toBeNull();
    });
  });

  // ---- TOP_UP_PACKAGES ----

  describe("TOP_UP_PACKAGES", () => {
    it("has exactly 4 packages", async () => {
      const { TOP_UP_PACKAGES } = await importFresh();
      expect(TOP_UP_PACKAGES).toHaveLength(4);
    });

    it("has correct credit amounts", async () => {
      const { TOP_UP_PACKAGES } = await importFresh();
      const amounts = TOP_UP_PACKAGES.map(
        (pkg: TopUpPackage) => pkg.creditAmount,
      );
      expect(amounts).toEqual([10, 25, 50, 100]);
    });

    it("has correct ZAR prices", async () => {
      const { TOP_UP_PACKAGES } = await importFresh();
      const prices = TOP_UP_PACKAGES.map((pkg: TopUpPackage) => pkg.priceZAR);
      expect(prices).toEqual([49, 99, 179, 299]);
    });

    it("each package has a label", async () => {
      const { TOP_UP_PACKAGES } = await importFresh();
      for (const pkg of TOP_UP_PACKAGES) {
        expect(pkg.label).toBeTruthy();
      }
    });
  });

  // ---- getTopUpPackageByCreditAmount ----

  describe("getTopUpPackageByCreditAmount", () => {
    it("returns correct package for each valid amount", async () => {
      const { getTopUpPackageByCreditAmount } = await importFresh();
      expect(getTopUpPackageByCreditAmount(10)?.priceZAR).toBe(49);
      expect(getTopUpPackageByCreditAmount(25)?.priceZAR).toBe(99);
      expect(getTopUpPackageByCreditAmount(50)?.priceZAR).toBe(179);
      expect(getTopUpPackageByCreditAmount(100)?.priceZAR).toBe(299);
    });

    it("returns null for non-existent credit amount", async () => {
      const { getTopUpPackageByCreditAmount } = await importFresh();
      expect(getTopUpPackageByCreditAmount(15)).toBeNull();
      expect(getTopUpPackageByCreditAmount(0)).toBeNull();
      expect(getTopUpPackageByCreditAmount(200)).toBeNull();
    });
  });

  // ---- getTopUpPackageByProductId ----

  describe("getTopUpPackageByProductId", () => {
    beforeEach(() => {
      vi.stubEnv("POLAR_PRODUCT_TOPUP_10", "prod_topup_10");
      vi.stubEnv("POLAR_PRODUCT_TOPUP_25", "prod_topup_25");
      vi.stubEnv("POLAR_PRODUCT_TOPUP_50", "prod_topup_50");
      vi.stubEnv("POLAR_PRODUCT_TOPUP_100", "prod_topup_100");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns correct package for valid product ID", async () => {
      const { getTopUpPackageByProductId } = await importFresh();
      expect(getTopUpPackageByProductId("prod_topup_10")?.creditAmount).toBe(
        10,
      );
      expect(getTopUpPackageByProductId("prod_topup_25")?.creditAmount).toBe(
        25,
      );
      expect(getTopUpPackageByProductId("prod_topup_50")?.creditAmount).toBe(
        50,
      );
      expect(getTopUpPackageByProductId("prod_topup_100")?.creditAmount).toBe(
        100,
      );
    });

    it("returns null for unknown product ID", async () => {
      const { getTopUpPackageByProductId } = await importFresh();
      expect(getTopUpPackageByProductId("prod_unknown")).toBeNull();
    });
  });
});
