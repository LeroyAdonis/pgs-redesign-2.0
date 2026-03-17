import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Mock next-intl hooks.
 * For "creditsCount" key, return a formatted string to verify interpolation.
 * For other keys, return the key as-is.
 */
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, params?: Record<string, unknown>) => {
      if (key === "creditsCount" && params?.count !== undefined) {
        return `${params.count} credits`;
      }
      return key;
    },
}));

/**
 * Mock i18n navigation — Link renders as a plain <a> tag.
 */
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
  usePathname: () => "/dashboard",
}));

/**
 * Mock LanguageSelector — renders a simple placeholder.
 */
vi.mock("@/components/ui/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector">Lang</div>,
}));

/**
 * Mock NotificationBell — renders a simple placeholder.
 * The real component fetches data via network; we test it separately.
 */
vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => (
    <button type="button" data-testid="notification-bell">Bell</button>
  ),
}));

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const defaultProps = {
  userName: "Thabo Mbeki",
  userEmail: "thabo@example.co.za",
  userImage: "https://example.com/thabo.jpg",
  credits: 42,
};

describe("DashboardHeader", () => {
  // ── Rendering ─────────────────────────────────────────────────

  it("renders the header element", () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
  });

  it("displays the credit count", () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(screen.getByTestId("credit-display")).toBeInTheDocument();
    expect(screen.getByText("42 credits")).toBeInTheDocument();
  });

  it("displays zero credits when not provided", () => {
    render(
      <DashboardHeader
        userName="User"
        userEmail="user@test.com"
      />,
    );
    expect(screen.getByText("0 credits")).toBeInTheDocument();
  });

  // ── Notification bell ─────────────────────────────────────────

  it("renders the notification bell", () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
  });

  // ── Language selector ─────────────────────────────────────────

  it("renders the language selector", () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
  });

  // ── User menu ─────────────────────────────────────────────────

  it("renders the user menu trigger with user name", () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(screen.getByTestId("user-menu-trigger")).toBeInTheDocument();
    expect(screen.getByText("Thabo Mbeki")).toBeInTheDocument();
  });

  it("opens user dropdown when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader {...defaultProps} />);

    // Initially closed
    expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();

    // Click trigger
    await user.click(screen.getByTestId("user-menu-trigger"));

    // Dropdown appears
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
  });

  it("shows user info in dropdown", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader {...defaultProps} />);

    await user.click(screen.getByTestId("user-menu-trigger"));

    const dropdown = screen.getByTestId("user-menu-dropdown");
    expect(within(dropdown).getByText("Thabo Mbeki")).toBeInTheDocument();
    expect(within(dropdown).getByText("thabo@example.co.za")).toBeInTheDocument();
  });

  it("shows Profile, Settings, and Sign Out menu items", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader {...defaultProps} />);

    await user.click(screen.getByTestId("user-menu-trigger"));

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems.length).toBe(3);
  });

  it("shows Sign Out button in dropdown", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader {...defaultProps} />);

    await user.click(screen.getByTestId("user-menu-trigger"));
    expect(screen.getByTestId("sign-out-button")).toBeInTheDocument();
  });

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader {...defaultProps} />);

    // Open
    await user.click(screen.getByTestId("user-menu-trigger"));
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();

    // Press Escape
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();
  });

  // ── Avatar fallback ───────────────────────────────────────────

  it("shows avatar with user image", () => {
    render(<DashboardHeader {...defaultProps} />);
    const img = screen.getByRole("img", { hidden: true });
    expect(img).toHaveAttribute("src", "https://example.com/thabo.jpg");
  });

  it("shows initials when no image is provided", () => {
    render(
      <DashboardHeader
        userName="Sipho Dlamini"
        userEmail="sipho@test.com"
      />,
    );
    expect(screen.getByText("SD")).toBeInTheDocument();
  });
});

// Need to import within for scoped queries
import { within } from "@testing-library/react";
