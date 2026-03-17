/**
 * Tests for billing components: CurrentPlan, PricingCards, TopUpWidget.
 *
 * Uses @testing-library/react with vitest + happy-dom.
 * Mocks fetch for API calls (top-up checkout, cancel subscription).
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

/* ─── Mocks ─── */

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/dashboard/billing",
}));

/* ─── Imports (after mocks) ─── */

import { CurrentPlan } from "@/components/billing/CurrentPlan";
import { PricingCards } from "@/components/billing/PricingCards";
import { TopUpWidget } from "@/components/billing/TopUpWidget";
import { TIER_CONFIGS, TOP_UP_PACKAGES } from "@/lib/payments/tier-config";
import type { Tier } from "@/lib/payments/tier-config";
import type { SubscriptionInfo } from "@/lib/payments/types";

/* ─── Fixtures ─── */

const baseSubscription: SubscriptionInfo = {
  tier: "hustler",
  status: "active",
  currentPeriodStart: new Date("2025-06-01T00:00:00Z"),
  currentPeriodEnd: new Date("2025-07-01T00:00:00Z"),
  canceledAt: null,
  polarSubscriptionId: "polar_sub_123",
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CurrentPlan                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

describe("CurrentPlan", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders tier name and icon for each tier", () => {
    const tiers: { tier: Tier; icon: string; name: string }[] = [
      { tier: "seedling", icon: "🌱", name: "Seedling" },
      { tier: "hustler", icon: "🔥", name: "Hustler" },
      { tier: "grower", icon: "🚀", name: "Grower" },
      { tier: "mogul", icon: "👑", name: "Mogul" },
    ];

    for (const { tier, icon, name } of tiers) {
      const sub: SubscriptionInfo = { ...baseSubscription, tier };
      const config = TIER_CONFIGS[tier];

      const { unmount } = render(
        <CurrentPlan subscription={sub} tierConfig={config} locale="en" />,
      );

      expect(screen.getByTestId("tier-icon")).toHaveTextContent(icon);
      expect(screen.getByTestId("tier-name")).toHaveTextContent(name);

      unmount();
    }
  });

  it("shows active status badge", () => {
    render(
      <CurrentPlan
        subscription={baseSubscription}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    const badge = screen.getByTestId("status-badge");
    expect(badge).toHaveTextContent("status.active");
  });

  it("shows canceled status badge", () => {
    const sub: SubscriptionInfo = { ...baseSubscription, status: "canceled" };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    expect(screen.getByTestId("status-badge")).toHaveTextContent("status.canceled");
  });

  it("shows past_due status badge", () => {
    const sub: SubscriptionInfo = { ...baseSubscription, status: "past_due" };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    expect(screen.getByTestId("status-badge")).toHaveTextContent("status.pastDue");
  });

  it("shows trialing status badge", () => {
    const sub: SubscriptionInfo = { ...baseSubscription, status: "trialing" };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    expect(screen.getByTestId("status-badge")).toHaveTextContent("status.trialing");
  });

  it("displays price in ZAR format", () => {
    render(
      <CurrentPlan
        subscription={baseSubscription}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    const priceEl = screen.getByTestId("plan-price");
    // Hustler is R299.00 — check for presence of "R" and "299"
    expect(priceEl.textContent).toContain("R");
    expect(priceEl.textContent).toContain("299");
  });

  it("shows next billing date for active subscriptions", () => {
    render(
      <CurrentPlan
        subscription={baseSubscription}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    const dateEl = screen.getByTestId("next-billing-date");
    expect(dateEl).toBeInTheDocument();
    // Should contain "July" or "2025" depending on locale formatting
    expect(dateEl.textContent).toContain("2025");
  });

  it("shows cancel button only for active paid plans", () => {
    render(
      <CurrentPlan
        subscription={baseSubscription}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    expect(screen.getByTestId("cancel-subscription-button")).toBeInTheDocument();
  });

  it("does NOT show cancel button for seedling (free) tier", () => {
    const sub: SubscriptionInfo = {
      ...baseSubscription,
      tier: "seedling",
      status: "active",
    };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.seedling}
        locale="en"
      />,
    );

    expect(
      screen.queryByTestId("cancel-subscription-button"),
    ).not.toBeInTheDocument();
  });

  it("does NOT show cancel button for canceled plans", () => {
    const sub: SubscriptionInfo = {
      ...baseSubscription,
      status: "canceled",
    };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    expect(
      screen.queryByTestId("cancel-subscription-button"),
    ).not.toBeInTheDocument();
  });

  it("shows cancellation notice when canceledAt is set", () => {
    const sub: SubscriptionInfo = {
      ...baseSubscription,
      status: "canceled",
      canceledAt: new Date("2025-06-15T00:00:00Z"),
    };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    const notice = screen.getByTestId("cancellation-notice");
    expect(notice).toBeInTheDocument();
    expect(notice.textContent).toContain("activeUntil");
  });

  it("does NOT show next billing date when canceledAt is set", () => {
    const sub: SubscriptionInfo = {
      ...baseSubscription,
      canceledAt: new Date("2025-06-15T00:00:00Z"),
    };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    expect(screen.queryByTestId("next-billing-date")).not.toBeInTheDocument();
  });

  it("handles null subscription (free plan state)", () => {
    render(
      <CurrentPlan
        subscription={null}
        tierConfig={TIER_CONFIGS.seedling}
        locale="en"
      />,
    );

    expect(screen.getByTestId("free-plan-notice")).toBeInTheDocument();
    expect(screen.getByTestId("tier-name")).toHaveTextContent("Seedling");
    expect(screen.getByTestId("tier-icon")).toHaveTextContent("🌱");
    expect(
      screen.queryByTestId("cancel-subscription-button"),
    ).not.toBeInTheDocument();
  });

  it("shows key limits summary", () => {
    render(
      <CurrentPlan
        subscription={baseSubscription}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    const limits = screen.getByTestId("plan-limits");
    expect(limits.textContent).toContain("5");          // socialAccounts
    expect(limits.textContent).toContain("50");         // aiPostsPerMonth
    expect(limits.textContent).toContain("moSuffix");   // /mo suffix key
    expect(limits.textContent).toContain("2");          // teamSeats
  });

  it('shows "Unlimited" for mogul tier unlimited limits', () => {
    const sub: SubscriptionInfo = { ...baseSubscription, tier: "mogul" };
    render(
      <CurrentPlan
        subscription={sub}
        tierConfig={TIER_CONFIGS.mogul}
        locale="en"
      />,
    );

    const limits = screen.getByTestId("plan-limits");
    // Mogul has unlimited social accounts and team seats
    const unlimitedCount = (limits.textContent ?? "").split("features.unlimited").length - 1;
    expect(unlimitedCount).toBe(2);
  });

  it("renders Change Plan link pointing to #pricing", () => {
    render(
      <CurrentPlan
        subscription={baseSubscription}
        tierConfig={TIER_CONFIGS.hustler}
        locale="en"
      />,
    );

    const link = screen.getByTestId("change-plan-button");
    expect(link).toHaveAttribute("href", "#pricing");
    expect(link).toHaveTextContent("changePlan");
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PricingCards                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

describe("PricingCards", () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all 4 tier cards", () => {
    render(<PricingCards onSelectTier={noop} />);

    expect(screen.getByTestId("tier-card-seedling")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-hustler")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-grower")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-mogul")).toBeInTheDocument();
  });

  it("highlights current tier with Current Plan badge", () => {
    render(<PricingCards currentTier="grower" onSelectTier={noop} />);

    expect(screen.getByTestId("current-plan-badge")).toBeInTheDocument();
    expect(screen.getByTestId("current-plan-badge")).toHaveTextContent(
      "currentPlanBadge",
    );
  });

  it("shows correct monthly prices from TIER_CONFIGS", () => {
    render(<PricingCards onSelectTier={noop} />);

    // Check that the seedling price element contains "R" and "0"
    const seedlingPrice = screen.getByTestId("price-seedling");
    expect(seedlingPrice.textContent).toContain("R");
    expect(seedlingPrice.textContent).toContain("0");

    // Hustler should show 299
    const hustlerPrice = screen.getByTestId("price-hustler");
    expect(hustlerPrice.textContent).toContain("299");
  });

  it("shows Most Popular badge on hustler tier", () => {
    render(<PricingCards onSelectTier={noop} />);

    expect(screen.getByTestId("most-popular-badge")).toBeInTheDocument();
    expect(screen.getByTestId("most-popular-badge")).toHaveTextContent(
      "mostPopular",
    );
  });

  it("toggle switches between monthly and annual pricing", async () => {
    const user = userEvent.setup();
    render(<PricingCards onSelectTier={noop} />);

    // Monthly by default
    const toggle = screen.getByTestId("billing-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    // Switch to annual
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    // Annual prices should show savings badges for paid tiers
    expect(screen.getByTestId("savings-badge-hustler")).toBeInTheDocument();
  });

  it("shows annual savings percentage", async () => {
    const user = userEvent.setup();
    render(<PricingCards onSelectTier={noop} />);

    await user.click(screen.getByTestId("billing-toggle"));

    // Hustler: monthly R299 × 12 = R3588, annual R2990 → save ~17%
    const savingsBadge = screen.getByTestId("savings-badge-hustler");
    expect(savingsBadge.textContent).toContain("savePercent");
  });

  it("calls onSelectTier with correct tier and monthly interval", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<PricingCards onSelectTier={handler} />);

    await user.click(screen.getByTestId("cta-hustler"));

    expect(handler).toHaveBeenCalledWith("hustler", "monthly");
  });

  it("calls onSelectTier with correct tier and annual interval", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<PricingCards onSelectTier={handler} />);

    // Switch to annual
    await user.click(screen.getByTestId("billing-toggle"));

    await user.click(screen.getByTestId("cta-grower"));

    expect(handler).toHaveBeenCalledWith("grower", "annual");
  });

  it("disables button for current tier", () => {
    render(<PricingCards currentTier="hustler" onSelectTier={noop} />);

    const btn = screen.getByTestId("cta-hustler");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("currentPlanBadge");
  });

  it('shows "Upgrade" for tiers above current', () => {
    render(<PricingCards currentTier="hustler" onSelectTier={noop} />);

    expect(screen.getByTestId("cta-grower")).toHaveTextContent("upgrade");
    expect(screen.getByTestId("cta-mogul")).toHaveTextContent("upgrade");
  });

  it('shows "Downgrade" for tiers below current', () => {
    render(<PricingCards currentTier="grower" onSelectTier={noop} />);

    expect(screen.getByTestId("cta-seedling")).toHaveTextContent("downgrade");
    expect(screen.getByTestId("cta-hustler")).toHaveTextContent("downgrade");
  });

  it('shows "Get Started" for seedling when no current tier', () => {
    render(<PricingCards onSelectTier={noop} />);

    expect(screen.getByTestId("cta-seedling")).toHaveTextContent("getStarted");
  });

  it("shows feature list items with availability indicators", () => {
    render(<PricingCards onSelectTier={noop} />);

    // Seedling has 0 image generations → should show ✗
    const seedlingCard = screen.getByTestId("tier-card-seedling");
    expect(seedlingCard.textContent).toContain("✗");
    expect(seedlingCard.textContent).toContain("features.imageGenCount");

    // Mogul has WhatsApp Business → should show ✓
    const mogulCard = screen.getByTestId("tier-card-mogul");
    expect(mogulCard.textContent).toContain("features.whatsappBusiness");
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  TopUpWidget                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

describe("TopUpWidget", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all top-up packages", () => {
    render(<TopUpWidget currentBalance={50} />);

    for (const pkg of TOP_UP_PACKAGES) {
      expect(
        screen.getByTestId(`topup-package-${pkg.creditAmount}`),
      ).toBeInTheDocument();
    }
  });

  it("shows correct credit amounts", () => {
    render(<TopUpWidget currentBalance={50} />);

    expect(screen.getByTestId("topup-package-10")).toHaveTextContent("10");
    expect(screen.getByTestId("topup-package-25")).toHaveTextContent("25");
    expect(screen.getByTestId("topup-package-50")).toHaveTextContent("50");
    expect(screen.getByTestId("topup-package-100")).toHaveTextContent("100");
  });

  it("shows prices in ZAR format", () => {
    render(<TopUpWidget currentBalance={50} />);

    for (const pkg of TOP_UP_PACKAGES) {
      const priceEl = screen.getByTestId(`topup-price-${pkg.creditAmount}`);
      expect(priceEl.textContent).toContain("R");
    }
  });

  it("shows current balance", () => {
    render(<TopUpWidget currentBalance={42} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("calls POST /api/credits/topup on buy click", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          checkoutUrl: "https://checkout.example.com",
        }),
    });
    globalThis.fetch = fetchSpy;

    // Mock window.location to prevent navigation error
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
      assign: vi.fn(),
    } as unknown as Location);

    render(<TopUpWidget currentBalance={50} />);

    await user.click(screen.getByTestId("topup-buy-25"));

    expect(fetchSpy).toHaveBeenCalledWith("/api/credits/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditAmount: 25 }),
    });

    locationSpy.mockRestore();
  });

  it("shows error message when checkout fails", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: "No organization membership found",
        }),
    });

    render(<TopUpWidget currentBalance={50} />);

    await user.click(screen.getByTestId("topup-buy-10"));

    // Wait for error to appear
    const errorEl = await screen.findByTestId("topup-error");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveTextContent("No organization membership found");
  });

  it("renders buy buttons for each package", () => {
    render(<TopUpWidget currentBalance={50} />);

    for (const pkg of TOP_UP_PACKAGES) {
      const buyBtn = screen.getByTestId(`topup-buy-${pkg.creditAmount}`);
      expect(buyBtn).toBeInTheDocument();
      expect(buyBtn).toHaveTextContent("buy");
    }
  });
});
