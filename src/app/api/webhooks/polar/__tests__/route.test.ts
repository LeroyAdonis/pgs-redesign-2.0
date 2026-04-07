/**
 * Tests for the Polar webhook route handler
 *
 * Mocks the @polar-sh/nextjs Webhooks helper, subscription-service functions,
 * and credit service to validate event routing and processing logic.
 *
 * The Webhooks helper from @polar-sh/nextjs handles signature verification
 * and event parsing. We mock it to directly invoke our handler callbacks.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockActivateSubscription = vi.fn();
const mockDeactivateSubscription = vi.fn();
const mockGetTierByPolarProductId = vi.fn();

vi.mock("@/lib/payments/subscription-service", () => ({
  activateSubscription: (...args: unknown[]) =>
    mockActivateSubscription(...args),
  deactivateSubscription: (...args: unknown[]) =>
    mockDeactivateSubscription(...args),
  getTierByPolarProductId: (...args: unknown[]) =>
    mockGetTierByPolarProductId(...args),
}));

const mockAddCredits = vi.fn();
vi.mock("@/lib/credits", () => ({
  addCredits: (...args: unknown[]) => mockAddCredits(...args),
}));

const mockInngestSend = vi.fn().mockResolvedValue(undefined);
vi.mock("@/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockInngestSend(...args),
  },
}));

vi.mock("@/lib/payments/tier-config", () => ({
  getTierConfig: (tier: string) => {
    const configs: Record<string, { creditAllocation: number; displayName: string }> = {
      seedling: { creditAllocation: 10, displayName: "Seedling" },
      hustler: { creditAllocation: 50, displayName: "Hustler" },
      grower: { creditAllocation: 200, displayName: "Grower" },
      mogul: { creditAllocation: 500, displayName: "Mogul" },
    };
    return configs[tier] ?? configs["seedling"];
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

vi.mock("@/db", () => {
  const createSelectChain = () => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  });
  const createUpdateChain = () => ({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
  return {
    db: {
      select: vi.fn().mockImplementation(() => createSelectChain()),
      update: vi.fn().mockImplementation(() => createUpdateChain()),
      insert: vi.fn(),
    },
  };
});

vi.mock("@/db/schema", () => ({
  subscription: {
    orgId: "subscription.orgId",
    tier: "subscription.tier",
    polarSubscriptionId: "subscription.polarSubscriptionId",
    currentPeriodEnd: "subscription.currentPeriodEnd",
    status: "subscription.status",
  },
}));

// Capture the webhook config passed to Webhooks()
let capturedWebhookConfig: Record<string, (...args: unknown[]) => Promise<void>>;

vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: (config: Record<string, unknown>) => {
    capturedWebhookConfig = config as typeof capturedWebhookConfig;
    // Return a mock handler that always returns { received: true }
    return async () => {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ received: true });
    };
  },
}));

// Import after mocks — triggers module init which calls Webhooks()
// We need a dynamic import to ensure mocks are set up first
let POST: (request: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.clearAllMocks();
  process.env.POLAR_WEBHOOK_SECRET = "test-webhook-secret";
  mockActivateSubscription.mockResolvedValue(undefined);
  mockDeactivateSubscription.mockResolvedValue(undefined);
  mockAddCredits.mockResolvedValue({ success: true, newBalance: 100 });
  mockGetTierByPolarProductId.mockReturnValue("hustler");
  mockInngestSend.mockResolvedValue(undefined);

  // Re-import the route to get fresh captured config
  const mod = await import("../route");
  POST = mod.POST;
});

// ---------------------------------------------------------------------------
// Helper — build a NextRequest with JSON body
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/polar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Polar Webhook Route", () => {
  it("returns 200 for POST requests", async () => {
    const request = makeRequest({ type: "test" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);
  });

  it("registers all required event handlers with Webhooks helper", () => {
    expect(capturedWebhookConfig).toBeDefined();
    expect(capturedWebhookConfig.onCheckoutUpdated).toBeDefined();
    expect(capturedWebhookConfig.onSubscriptionCreated).toBeDefined();
    expect(capturedWebhookConfig.onSubscriptionUpdated).toBeDefined();
    expect(capturedWebhookConfig.onSubscriptionCanceled).toBeDefined();
    expect(capturedWebhookConfig.onSubscriptionRevoked).toBeDefined();
    expect(capturedWebhookConfig.onOrderCreated).toBeDefined();
  });
});

describe("Webhook event handlers", () => {
  describe("onCheckoutUpdated", () => {
    it("processes succeeded checkout", async () => {
      const handler = capturedWebhookConfig.onCheckoutUpdated;

      await handler({
        type: "checkout.updated",
        data: {
          id: "checkout_1",
          status: "succeeded",
          productId: "prod_hustler_monthly",
          metadata: { orgId: "org_1", userId: "user_1" },
        },
      });

      // checkout.updated logs but does not activate — waits for subscription.created
      expect(mockActivateSubscription).not.toHaveBeenCalled();
    });

    it("skips non-succeeded checkouts", async () => {
      const handler = capturedWebhookConfig.onCheckoutUpdated;

      await handler({
        type: "checkout.updated",
        data: {
          id: "checkout_2",
          status: "open",
          productId: "prod_hustler_monthly",
          metadata: {},
        },
      });

      expect(mockActivateSubscription).not.toHaveBeenCalled();
    });
  });

  describe("onSubscriptionCreated", () => {
    it("calls activateSubscription with correct args", async () => {
      const handler = capturedWebhookConfig.onSubscriptionCreated;
      const periodStart = new Date("2025-01-01");
      const periodEnd = new Date("2025-02-01");

      await handler({
        type: "subscription.created",
        data: {
          id: "polar_sub_1",
          productId: "prod_hustler_monthly",
          metadata: { orgId: "org_1" },
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          status: "active",
        },
      });

      expect(mockActivateSubscription).toHaveBeenCalledWith(
        "org_1",
        "hustler",
        "polar_sub_1",
        periodStart,
        periodEnd,
      );
    });

    it("skips if orgId is missing from metadata", async () => {
      const handler = capturedWebhookConfig.onSubscriptionCreated;

      await handler({
        type: "subscription.created",
        data: {
          id: "polar_sub_2",
          productId: "prod_hustler_monthly",
          metadata: {},
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          status: "active",
        },
      });

      expect(mockActivateSubscription).not.toHaveBeenCalled();
    });
  });

  describe("onSubscriptionCanceled", () => {
    it("calls deactivateSubscription", async () => {
      const handler = capturedWebhookConfig.onSubscriptionCanceled;

      await handler({
        type: "subscription.canceled",
        data: {
          id: "polar_sub_1",
          metadata: { orgId: "org_1" },
          productId: "prod_hustler_monthly",
          status: "canceled",
        },
      });

      expect(mockDeactivateSubscription).toHaveBeenCalledWith("org_1");
    });
  });

  describe("onSubscriptionRevoked", () => {
    it("calls deactivateSubscription", async () => {
      const handler = capturedWebhookConfig.onSubscriptionRevoked;

      await handler({
        type: "subscription.revoked",
        data: {
          id: "polar_sub_1",
          metadata: { orgId: "org_1" },
          productId: "prod_hustler_monthly",
          status: "canceled",
        },
      });

      expect(mockDeactivateSubscription).toHaveBeenCalledWith("org_1");
    });
  });

  describe("onOrderCreated", () => {
    it("allocates credits for subscription_cycle renewal", async () => {
      const handler = capturedWebhookConfig.onOrderCreated;

      await handler({
        type: "order.created",
        data: {
          id: "order_1",
          billingReason: "subscription_cycle",
          productId: "prod_hustler_monthly",
          metadata: { orgId: "org_1" },
          subscriptionId: "polar_sub_1",
        },
      });

      expect(mockAddCredits).toHaveBeenCalledWith(
        "org_1",
        50,
        "allocation",
        expect.stringContaining("Hustler"),
      );
    });

    it("skips non-renewal orders", async () => {
      const handler = capturedWebhookConfig.onOrderCreated;

      await handler({
        type: "order.created",
        data: {
          id: "order_2",
          billingReason: "purchase",
          productId: "prod_hustler_monthly",
          metadata: { orgId: "org_1" },
          subscriptionId: null,
        },
      });

      expect(mockAddCredits).not.toHaveBeenCalled();
    });
  });
});
