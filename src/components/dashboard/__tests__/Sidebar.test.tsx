import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Mock next-intl hooks.
 * Returns the key as-is for predictable test assertions.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

/**
 * Mock i18n navigation.
 * - Link renders as a plain <a> tag
 * - usePathname returns a controllable path
 */
let mockPathname = "/dashboard";
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
  usePathname: () => mockPathname,
}));

import { Sidebar } from "@/components/dashboard/Sidebar";

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname = "/dashboard";
  });

  // ── Rendering ─────────────────────────────────────────────────

  it("renders a nav element with accessible label", () => {
    render(<Sidebar />);
    expect(
      screen.getByRole("navigation", { name: /dashboard navigation/i }),
    ).toBeInTheDocument();
  });

  it("renders the Purple Glow Social branding", () => {
    render(<Sidebar />);
    expect(screen.getByText("Purple Glow")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
  });

  it("renders all three section labels", () => {
    render(<Sidebar />);
    expect(screen.getByText("sectionMain")).toBeInTheDocument();
    expect(screen.getByText("sectionInsights")).toBeInTheDocument();
    expect(screen.getByText("sectionManage")).toBeInTheDocument();
  });

  it("renders all nav items", () => {
    render(<Sidebar />);
    const nav = screen.getByRole("navigation");

    // Main section
    expect(within(nav).getByText("overview")).toBeInTheDocument();
    expect(within(nav).getByText("posts")).toBeInTheDocument();
    expect(within(nav).getByText("calendar")).toBeInTheDocument();

    // Insights section
    expect(within(nav).getByText("analytics")).toBeInTheDocument();
    expect(within(nav).getByText("brand")).toBeInTheDocument();

    // Manage section
    expect(within(nav).getByText("accounts")).toBeInTheDocument();
    expect(within(nav).getByText("team")).toBeInTheDocument();
    expect(within(nav).getByText("settings")).toBeInTheDocument();
    expect(within(nav).getByText("billing")).toBeInTheDocument();
  });

  it("renders nav items as links with correct hrefs", () => {
    render(<Sidebar />);
    const links = screen.getAllByRole("link");

    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/posts");
    expect(hrefs).toContain("/dashboard/calendar");
    expect(hrefs).toContain("/analytics");
    expect(hrefs).toContain("/dashboard/brand");
    expect(hrefs).toContain("/dashboard/accounts");
    expect(hrefs).toContain("/team");
    expect(hrefs).toContain("/settings");
    expect(hrefs).toContain("/billing");
  });

  // ── Active state ──────────────────────────────────────────────

  it("marks the active nav item with aria-current='page'", () => {
    mockPathname = "/dashboard";
    render(<Sidebar />);

    const activeLink = screen.getByRole("link", { name: /overview/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("does not mark non-active items with aria-current", () => {
    mockPathname = "/dashboard";
    render(<Sidebar />);

    const postsLink = screen.getByRole("link", { name: /^posts$/i });
    expect(postsLink).not.toHaveAttribute("aria-current");
  });

  it("highlights the correct item when pathname changes", () => {
    mockPathname = "/analytics";
    render(<Sidebar />);

    const analyticsLink = screen.getByRole("link", { name: /analytics/i });
    expect(analyticsLink).toHaveAttribute("aria-current", "page");

    const overviewLink = screen.getByRole("link", { name: /overview/i });
    expect(overviewLink).not.toHaveAttribute("aria-current");
  });

  // ── Mobile toggle ─────────────────────────────────────────────

  it("renders the mobile hamburger toggle button", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("sidebar-mobile-toggle")).toBeInTheDocument();
  });

  it("shows the sidebar overlay when mobile toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // Initially no overlay
    expect(screen.queryByTestId("sidebar-overlay")).not.toBeInTheDocument();

    // Click hamburger
    await user.click(screen.getByTestId("sidebar-mobile-toggle"));

    // Overlay appears
    expect(screen.getByTestId("sidebar-overlay")).toBeInTheDocument();
  });

  it("closes mobile sidebar when overlay is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // Open
    await user.click(screen.getByTestId("sidebar-mobile-toggle"));
    expect(screen.getByTestId("sidebar-overlay")).toBeInTheDocument();

    // Click overlay
    await user.click(screen.getByTestId("sidebar-overlay"));
    expect(screen.queryByTestId("sidebar-overlay")).not.toBeInTheDocument();
  });

  it("closes mobile sidebar on Escape key", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // Open
    await user.click(screen.getByTestId("sidebar-mobile-toggle"));
    expect(screen.getByTestId("sidebar-overlay")).toBeInTheDocument();

    // Press Escape
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("sidebar-overlay")).not.toBeInTheDocument();
  });

  // ── Semantic HTML ─────────────────────────────────────────────

  it("uses semantic <aside> element", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("sidebar").tagName).toBe("ASIDE");
  });

  it("renders nav items within list elements", () => {
    render(<Sidebar />);
    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThanOrEqual(3); // one per section
  });
});
