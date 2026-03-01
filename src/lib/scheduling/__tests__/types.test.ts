/**
 * Tests for scheduling types and tier limit constants
 */

import { describe, it, expect } from "vitest";
import {
  TIER_SCHEDULING_LIMITS,
  type Tier,
  type TierSchedulingLimit,
} from "../types";

describe("TIER_SCHEDULING_LIMITS", () => {
  it("defines limits for all four tiers", () => {
    const tiers: Tier[] = ["seedling", "hustler", "grower", "mogul"];
    for (const tier of tiers) {
      expect(TIER_SCHEDULING_LIMITS[tier]).toBeDefined();
    }
  });

  it("seedling has the most restrictive limits", () => {
    const limits = TIER_SCHEDULING_LIMITS.seedling;
    expect(limits.maxScheduledPosts).toBe(10);
    expect(limits.canUseAutonomous).toBe(false);
    expect(limits.canUseBulk).toBe(false);
    expect(limits.canUseOptimalTimes).toBe(false);
  });

  it("hustler allows bulk and optimal times but not autonomous", () => {
    const limits = TIER_SCHEDULING_LIMITS.hustler;
    expect(limits.maxScheduledPosts).toBe(50);
    expect(limits.canUseAutonomous).toBe(false);
    expect(limits.canUseBulk).toBe(true);
    expect(limits.canUseOptimalTimes).toBe(true);
  });

  it("grower allows all features with 200 post limit", () => {
    const limits = TIER_SCHEDULING_LIMITS.grower;
    expect(limits.maxScheduledPosts).toBe(200);
    expect(limits.canUseAutonomous).toBe(true);
    expect(limits.canUseBulk).toBe(true);
    expect(limits.canUseOptimalTimes).toBe(true);
  });

  it("mogul has unlimited posts and all features", () => {
    const limits = TIER_SCHEDULING_LIMITS.mogul;
    expect(limits.maxScheduledPosts).toBe(-1);
    expect(limits.canUseAutonomous).toBe(true);
    expect(limits.canUseBulk).toBe(true);
    expect(limits.canUseOptimalTimes).toBe(true);
  });

  it("tier limits are ordered correctly (ascending)", () => {
    const seedling = TIER_SCHEDULING_LIMITS.seedling.maxScheduledPosts;
    const hustler = TIER_SCHEDULING_LIMITS.hustler.maxScheduledPosts;
    const grower = TIER_SCHEDULING_LIMITS.grower.maxScheduledPosts;
    const mogul = TIER_SCHEDULING_LIMITS.mogul.maxScheduledPosts;

    expect(seedling).toBeLessThan(hustler);
    expect(hustler).toBeLessThan(grower);
    // mogul is -1 (unlimited), so it's less numerically but semantically unlimited
    expect(mogul).toBe(-1);
  });

  it("all limits have the correct shape", () => {
    for (const [, limits] of Object.entries(TIER_SCHEDULING_LIMITS)) {
      const l = limits as TierSchedulingLimit;
      expect(typeof l.maxScheduledPosts).toBe("number");
      expect(typeof l.canUseAutonomous).toBe("boolean");
      expect(typeof l.canUseBulk).toBe("boolean");
      expect(typeof l.canUseOptimalTimes).toBe("boolean");
    }
  });
});
