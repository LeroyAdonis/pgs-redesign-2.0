import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "../rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within the limit", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    const r1 = limiter.check("user-1");
    const r2 = limiter.check("user-1");
    const r3 = limiter.check("user-1");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check("user-1");
    limiter.check("user-1");
    const r3 = limiter.check("user-1");

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check("user-1");
    limiter.check("user-1");

    // Should be blocked now
    expect(limiter.check("user-1").allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(60_001);

    // Should be allowed again
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("tracks different identifiers independently", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    const r1 = limiter.check("user-a");
    const r2 = limiter.check("user-b");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);

    // user-a is now blocked
    expect(limiter.check("user-a").allowed).toBe(false);
    // user-b is also blocked (each had 1 max)
    expect(limiter.check("user-b").allowed).toBe(false);
  });

  it("returns correct remaining count", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

    expect(limiter.check("user-1").remaining).toBe(4);
    expect(limiter.check("user-1").remaining).toBe(3);
    expect(limiter.check("user-1").remaining).toBe(2);
    expect(limiter.check("user-1").remaining).toBe(1);
    expect(limiter.check("user-1").remaining).toBe(0);

    // Over limit — still 0
    expect(limiter.check("user-1").remaining).toBe(0);
  });

  it("returns a resetAt date in the future", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);

    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    const result = limiter.check("user-1");

    expect(result.resetAt).toBeInstanceOf(Date);
    expect(result.resetAt.getTime()).toBe(now.getTime() + 60_000);
  });

  it("uses a sliding window — partial expiry frees up slots", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    // Make 2 requests at t=0
    limiter.check("user-1");
    limiter.check("user-1");

    // Advance 30 seconds (within window, still blocked)
    vi.advanceTimersByTime(30_000);
    expect(limiter.check("user-1").allowed).toBe(false);

    // Advance another 31 seconds (first request expired, second still valid)
    vi.advanceTimersByTime(31_000);

    // The two original requests from t=0 have now expired (61s ago)
    // But the blocked check at t=30s was NOT recorded (blocked requests don't count)
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(true);
  });

  it("reset() clears all tracked state", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    limiter.check("user-1");
    expect(limiter.check("user-1").allowed).toBe(false);

    limiter.reset();
    expect(limiter.check("user-1").allowed).toBe(true);
  });
});
