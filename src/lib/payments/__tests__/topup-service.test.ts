/**
 * Tests for the credit top-up service
 *
 * Mocks the Polar client and credit-service to validate:
 * - checkout creation with valid/invalid amounts
 * - correct metadata passed to Polar
 * - processTopUpPayment delegates to addCredits
 * - error handling for both functions
 *
 * Uses vi.resetModules() + dynamic imports so that tier-config.ts
 * captures the stubbed env vars (product IDs are baked in at module
 * evaluation time).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — declared before any dynamic import of the module under test
// ---------------------------------------------------------------------------

const mockCheckoutCreate = vi.fn();

vi.mock("@/lib/payments/polar-client", () => ({
  getPolar: () => ({
    checkouts: {
      create: mockCheckoutCreate,
    },
  }),
}));

const mockAddCredits = vi.fn();

vi.mock("@/lib/credits/credit-service", () => ({
  addCredits: (...args: unknown[]) => mockAddCredits(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "org_topup_test";
const USER_ID = "user_123";
const EMAIL = "buyer@example.co.za";

/** Dynamic import so tier-config picks up stubbed env vars */
async function importFresh() {
  vi.resetModules();
  return import("../topup-service");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.purpleglow.co.za");
  vi.stubEnv("POLAR_PRODUCT_TOPUP_10", "prod_topup_10");
  vi.stubEnv("POLAR_PRODUCT_TOPUP_25", "prod_topup_25");
  vi.stubEnv("POLAR_PRODUCT_TOPUP_50", "prod_topup_50");
  vi.stubEnv("POLAR_PRODUCT_TOPUP_100", "prod_topup_100");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// createTopUpCheckout
// ---------------------------------------------------------------------------

describe("createTopUpCheckout", () => {
  it("returns checkout URL for valid 10-credit package", async () => {
    mockCheckoutCreate.mockResolvedValue({
      url: "https://polar.sh/checkout/abc123",
    });

    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 10);

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe("https://polar.sh/checkout/abc123");
  });

  it("returns checkout URL for valid 25-credit package", async () => {
    mockCheckoutCreate.mockResolvedValue({
      url: "https://polar.sh/checkout/def456",
    });

    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 25);

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe("https://polar.sh/checkout/def456");
  });

  it("returns checkout URL for valid 50-credit package", async () => {
    mockCheckoutCreate.mockResolvedValue({
      url: "https://polar.sh/checkout/ghi789",
    });

    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 50);

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe("https://polar.sh/checkout/ghi789");
  });

  it("returns checkout URL for valid 100-credit package", async () => {
    mockCheckoutCreate.mockResolvedValue({
      url: "https://polar.sh/checkout/jkl012",
    });

    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 100);

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe("https://polar.sh/checkout/jkl012");
  });

  it("returns error for invalid credit amount (7)", async () => {
    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 7);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credit amount");
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns error for invalid credit amount (0)", async () => {
    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 0);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credit amount");
  });

  it("returns error for invalid credit amount (200)", async () => {
    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 200);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credit amount");
  });

  it("passes correct metadata to Polar checkout", async () => {
    mockCheckoutCreate.mockResolvedValue({
      url: "https://polar.sh/checkout/meta_test",
    });

    const { createTopUpCheckout } = await importFresh();
    await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 50);

    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1);
    const callArg = mockCheckoutCreate.mock.calls[0][0];

    expect(callArg.metadata).toEqual({
      orgId: ORG_ID,
      userId: USER_ID,
      creditAmount: "50",
      type: "topup",
    });
    expect(callArg.customerEmail).toBe(EMAIL);
    expect(callArg.successUrl).toBe(
      "https://app.purpleglow.co.za/dashboard/billing?topup=success",
    );
  });

  it("passes correct product ID to Polar checkout", async () => {
    mockCheckoutCreate.mockResolvedValue({
      url: "https://polar.sh/checkout/prod_test",
    });

    const { createTopUpCheckout } = await importFresh();
    await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 25);

    const callArg = mockCheckoutCreate.mock.calls[0][0];
    expect(callArg.products).toEqual(["prod_topup_25"]);
  });

  it("handles Polar SDK errors gracefully", async () => {
    mockCheckoutCreate.mockRejectedValue(
      new Error("Polar API unavailable"),
    );

    const { createTopUpCheckout } = await importFresh();
    const result = await createTopUpCheckout(ORG_ID, USER_ID, EMAIL, 10);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Polar API unavailable");
  });
});

// ---------------------------------------------------------------------------
// processTopUpPayment
// ---------------------------------------------------------------------------

describe("processTopUpPayment", () => {
  it("calls addCredits with correct params", async () => {
    mockAddCredits.mockResolvedValue({ success: true, newBalance: 150 });

    const { processTopUpPayment } = await importFresh();
    const result = await processTopUpPayment(ORG_ID, 50);

    expect(result.success).toBe(true);
    expect(mockAddCredits).toHaveBeenCalledWith(
      ORG_ID,
      50,
      "purchase",
      "Credit top-up: 50 credits",
    );
  });

  it("uses 'purchase' type for all top-ups", async () => {
    mockAddCredits.mockResolvedValue({ success: true, newBalance: 110 });

    const { processTopUpPayment } = await importFresh();
    await processTopUpPayment(ORG_ID, 10);

    expect(mockAddCredits).toHaveBeenCalledWith(
      ORG_ID,
      10,
      "purchase",
      "Credit top-up: 10 credits",
    );
  });

  it("returns error when addCredits fails (org not found)", async () => {
    mockAddCredits.mockResolvedValue({
      success: false,
      newBalance: 0,
      error: "Organization credit record not found",
    });

    const { processTopUpPayment } = await importFresh();
    const result = await processTopUpPayment(ORG_ID, 50);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Organization credit record not found");
  });

  it("handles addCredits throwing an exception", async () => {
    mockAddCredits.mockRejectedValue(new Error("Database connection lost"));

    const { processTopUpPayment } = await importFresh();
    const result = await processTopUpPayment(ORG_ID, 25);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database connection lost");
  });

  it("includes credit amount in description", async () => {
    mockAddCredits.mockResolvedValue({ success: true, newBalance: 200 });

    const { processTopUpPayment } = await importFresh();
    await processTopUpPayment(ORG_ID, 100);

    const description = mockAddCredits.mock.calls[0][3];
    expect(description).toBe("Credit top-up: 100 credits");
  });
});
