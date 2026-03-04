/**
 * Reusable in-memory rate limiter (sliding window)
 *
 * Creates an independent rate limiter instance per use-case.
 * Each limiter tracks request timestamps per identifier (typically userId)
 * and enforces a max-request-per-window policy.
 *
 * Storage: in-memory Map — acceptable for MVP / single-process deployments.
 * For multi-instance production, swap to Redis (same interface).
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
 * const result = limiter.check(userId);
 * if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Requests remaining in the current window (0 when blocked) */
  remaining: number;
  /** When the oldest tracked request expires (window resets) */
  resetAt: Date;
}

export interface RateLimiter {
  /** Check (and record) a request for the given identifier */
  check(identifier: string): RateLimitResult;
  /** Remove all tracked state — primarily for testing */
  reset(): void;
}

// ---------------------------------------------------------------------------
// Cleanup interval — prevents unbounded Map growth
// ---------------------------------------------------------------------------

const CLEANUP_INTERVAL_MS = 60_000;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { maxRequests, windowMs } = options;

  /** identifier → array of request timestamps within the current window */
  const store = new Map<string, number[]>();

  // Periodic cleanup of fully-expired entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const recent = timestamps.filter((ts) => now - ts < windowMs);
      if (recent.length === 0) {
        store.delete(key);
      } else {
        store.set(key, recent);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow Node to exit even if the timer is still running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }

  function check(identifier: string): RateLimitResult {
    const now = Date.now();
    const timestamps = store.get(identifier) ?? [];

    // Keep only timestamps inside the current window
    const recent = timestamps.filter((ts) => now - ts < windowMs);

    // Compute resetAt from the oldest tracked timestamp
    const oldestTs = recent[0] ?? now;
    const resetAt = new Date(oldestTs + windowMs);

    if (recent.length >= maxRequests) {
      // Over limit — save the filtered list but do NOT record a new hit
      store.set(identifier, recent);
      return { allowed: false, remaining: 0, resetAt };
    }

    // Under limit — record this request
    recent.push(now);
    store.set(identifier, recent);

    return {
      allowed: true,
      remaining: maxRequests - recent.length,
      resetAt,
    };
  }

  function reset(): void {
    store.clear();
  }

  return { check, reset };
}
