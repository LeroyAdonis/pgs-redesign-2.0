/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for the social accounts management page.
 *
 * Mocks the Modal component (avoids createPortal cleanup hangs)
 * and uses fake timers (prevents notification setTimeout hangs).
 * All tests are synchronous renders — no userEvent interactions.
 * Interactive flows (connect modal, disconnect, refresh) are
 * validated via E2E tests.
 */

import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock Modal to inline render (no createPortal, no focus trap timers).
vi.mock("@/components/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
    footer,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: string;
    className?: string;
  }) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title} aria-modal="true">
        {title && <h2>{title}</h2>}
        <div>{children}</div>
        {footer && <div>{footer}</div>}
      </div>
    );
  },
}));

import { PLATFORM_DISPLAY } from "@/lib/social/providers";
import type { SocialAccountDTO } from "@/lib/social/types";
import { AccountsManager } from "../accounts-manager";

// ─── Mocks ───────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// ─── Test Data ───────────────────────────────────────────────

const connectedAccount: SocialAccountDTO = {
  id: "acc-1",
  platform: "facebook",
  displayName: "My Business Page",
  platformUserId: "12345",
  isActive: true,
  connectedAt: "2024-01-15T10:00:00.000Z",
  tokenExpiresAt: "2025-06-01T10:00:00.000Z",
  status: "connected",
};

const expiringAccount: SocialAccountDTO = {
  id: "acc-2",
  platform: "instagram",
  displayName: "My Insta",
  platformUserId: "67890",
  isActive: true,
  connectedAt: "2024-01-15T10:00:00.000Z",
  tokenExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  status: "expiring",
};

const expiredAccount: SocialAccountDTO = {
  id: "acc-3",
  platform: "twitter",
  displayName: "@mybiz",
  platformUserId: "111",
  isActive: true,
  connectedAt: "2024-01-15T10:00:00.000Z",
  tokenExpiresAt: "2024-01-01T00:00:00.000Z",
  status: "expired",
};

// ─── Helpers ─────────────────────────────────────────────────

function renderManager(
  accounts: SocialAccountDTO[] = [],
  overrides: Partial<React.ComponentProps<typeof AccountsManager>> = {},
) {
  return render(
    <AccountsManager
      accounts={accounts}
      orgId="org-test-123"
      platformDisplay={PLATFORM_DISPLAY}
      {...overrides}
    />,
  );
}

// ─── Tests ───────────────────────────────────────────────────

describe("AccountsManager", () => {
  afterEach(() => {
    cleanup();
  });

  describe("empty state", () => {
    it("shows empty state message when no accounts are linked", () => {
      renderManager([]);
      expect(screen.getByText("No accounts connected")).toBeInTheDocument();
      expect(
        screen.getByText(/Connect your social media accounts/),
      ).toBeInTheDocument();
    });

    it("shows connect button in the empty state", () => {
      renderManager([]);
      expect(
        screen.getByRole("button", { name: /Connect Your First Account/i }),
      ).toBeInTheDocument();
    });

    it("does not render any account cards when empty", () => {
      renderManager([]);
      expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
      expect(screen.queryByText("Instagram")).not.toBeInTheDocument();
    });
  });

  describe("account grid rendering", () => {
    it("renders connected accounts with platform name and display name", () => {
      renderManager([connectedAccount]);
      expect(screen.getByText("Facebook")).toBeInTheDocument();
      expect(screen.getByText("My Business Page")).toBeInTheDocument();
    });

    it("shows Connected status badge for healthy accounts", () => {
      renderManager([connectedAccount]);
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("shows Expiring Soon badge when token expires within 7 days", () => {
      renderManager([expiringAccount]);
      expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
    });

    it("shows Expired badge for expired tokens", () => {
      renderManager([expiredAccount]);
      expect(screen.getByText("Expired")).toBeInTheDocument();
    });

    it("shows refresh button for expired accounts", () => {
      renderManager([expiredAccount]);
      expect(
        screen.getByRole("button", { name: /Refresh Token/i }),
      ).toBeInTheDocument();
    });

    it("shows refresh button for expiring accounts", () => {
      renderManager([expiringAccount]);
      expect(
        screen.getByRole("button", { name: /Refresh Token/i }),
      ).toBeInTheDocument();
    });

    it("does not show refresh button for healthy connected accounts", () => {
      renderManager([connectedAccount]);
      expect(
        screen.queryByRole("button", { name: /Refresh Token/i }),
      ).not.toBeInTheDocument();
    });

    it("renders multiple accounts in the grid", () => {
      renderManager([connectedAccount, expiringAccount, expiredAccount]);
      expect(screen.getByText("Facebook")).toBeInTheDocument();
      expect(screen.getByText("Instagram")).toBeInTheDocument();
      expect(screen.getByText("X (Twitter)")).toBeInTheDocument();
    });

    it("shows token expiry date for each account", () => {
      renderManager([connectedAccount]);
      expect(screen.getByText(/Token expires:/)).toBeInTheDocument();
    });

    it("displays disconnect button for each account", () => {
      renderManager([connectedAccount]);
      expect(
        screen.getByRole("button", { name: /Disconnect/i }),
      ).toBeInTheDocument();
    });

    it("shows header Connect Account button when accounts exist", () => {
      renderManager([connectedAccount]);
      expect(
        screen.getByRole("button", { name: /^Connect Account$/i }),
      ).toBeInTheDocument();
    });
  });

  describe("notifications", () => {
    it("shows success notification when successPlatform is set", () => {
      renderManager([], { successPlatform: "facebook" });
      expect(
        screen.getByText("Facebook connected successfully!"),
      ).toBeInTheDocument();
    });

    it("shows oauth_denied error notification", () => {
      renderManager([], {
        errorType: "oauth_denied",
        errorPlatform: "twitter",
      });
      expect(
        screen.getByText("X (Twitter) authorization was denied."),
      ).toBeInTheDocument();
    });

    it("renders notification with alert role for accessibility", () => {
      renderManager([], { successPlatform: "instagram" });
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("shows generic error message for unknown error type", () => {
      renderManager([], { errorType: "unknown_error" });
      expect(screen.getByText("An error occurred.")).toBeInTheDocument();
    });

    it("auto-dismisses notification after timeout", () => {
      vi.useFakeTimers();
      renderManager([], { successPlatform: "facebook" });
      expect(screen.getByRole("alert")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      cleanup();
      vi.useRealTimers();
    });
  });

  describe("page structure", () => {
    it("displays the page title", () => {
      renderManager([]);
      expect(screen.getByText("Social Accounts")).toBeInTheDocument();
    });

    it("displays the page description", () => {
      renderManager([]);
      expect(
        screen.getByText(/Connect and manage your social media accounts/),
      ).toBeInTheDocument();
    });
  });
});
