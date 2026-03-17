import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Mock next-intl — return the key as-is (or interpolate for known keys).
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

import { CreditsSummary } from "@/components/dashboard/widgets/CreditsSummary";
import { QuickStats } from "@/components/dashboard/widgets/QuickStats";
import { RecentPosts } from "@/components/dashboard/widgets/RecentPosts";
import { UpcomingPosts } from "@/components/dashboard/widgets/UpcomingPosts";

// ─── CreditsSummary ─────────────────────────────────────────────

describe("CreditsSummary", () => {
  it("renders the credits summary heading", () => {
    render(<CreditsSummary />);
    expect(screen.getByText("creditsSummaryTitle")).toBeInTheDocument();
  });

  it("displays the current credit balance", () => {
    render(<CreditsSummary />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("displays used and allocation values", () => {
    render(<CreditsSummary />);
    expect(screen.getByText("158")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders a progress bar with correct percentage", () => {
    render(<CreditsSummary />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "79");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders the 'Buy More Credits' link to billing", () => {
    render(<CreditsSummary />);
    const link = screen.getByText("buyMoreCredits");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/billing");
  });

  it("shows the usage percentage text", () => {
    render(<CreditsSummary />);
    expect(screen.getByText("79%")).toBeInTheDocument();
  });
});

// ─── QuickStats ─────────────────────────────────────────────────

describe("QuickStats", () => {
  it("renders the quick stats container", () => {
    render(<QuickStats />);
    expect(screen.getByTestId("quick-stats")).toBeInTheDocument();
  });

  it("displays all 4 stat cards with correct values", () => {
    render(<QuickStats />);
    // Values
    expect(screen.getByText("127")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4.2%")).toBeInTheDocument();
  });

  it("displays stat labels", () => {
    render(<QuickStats />);
    expect(screen.getByText("totalPosts")).toBeInTheDocument();
    expect(screen.getByText("scheduledPosts")).toBeInTheDocument();
    expect(screen.getByText("connectedAccounts")).toBeInTheDocument();
    expect(screen.getByText("engagementRate")).toBeInTheDocument();
  });

  it("displays trend indicators for stats with trends", () => {
    render(<QuickStats />);
    expect(screen.getByText("+12.5% ↑")).toBeInTheDocument();
    expect(screen.getByText("+3 ↑")).toBeInTheDocument();
    expect(screen.getByText("+0.8% ↑")).toBeInTheDocument();
  });

  it("renders a 2×2 grid layout", () => {
    render(<QuickStats />);
    const container = screen.getByTestId("quick-stats");
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-2");
  });
});

// ─── RecentPosts ────────────────────────────────────────────────

describe("RecentPosts", () => {
  it("renders the recent posts heading", () => {
    render(<RecentPosts />);
    expect(screen.getByText("recentPostsTitle")).toBeInTheDocument();
  });

  it("displays 5 mock posts", () => {
    render(<RecentPosts />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
  });

  it("displays post preview text (truncated)", () => {
    render(<RecentPosts />);
    expect(
      screen.getByText(/Eish, what a lekker day!/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Big news Mzansi!/),
    ).toBeInTheDocument();
  });

  it("displays status badges for posts", () => {
    render(<RecentPosts />);
    // 3 published, 1 scheduled, 1 draft
    const publishedBadges = screen.getAllByText("published");
    expect(publishedBadges).toHaveLength(3);
    expect(screen.getByText("scheduled")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("displays timestamps", () => {
    render(<RecentPosts />);
    expect(screen.getByText("2h ago")).toBeInTheDocument();
    expect(screen.getByText("In 4h")).toBeInTheDocument();
    expect(screen.getByText("1d ago")).toBeInTheDocument();
  });

  it("renders the 'View All' link to posts", () => {
    render(<RecentPosts />);
    const link = screen.getByText("viewAll");
    expect(link.closest("a")).toHaveAttribute("href", "/posts");
  });
});

// ─── UpcomingPosts ──────────────────────────────────────────────

describe("UpcomingPosts", () => {
  it("renders the upcoming scheduled heading", () => {
    render(<UpcomingPosts />);
    expect(screen.getByText("upcomingScheduledTitle")).toBeInTheDocument();
  });

  it("displays 3 scheduled posts", () => {
    render(<UpcomingPosts />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("displays scheduled date/time", () => {
    render(<UpcomingPosts />);
    expect(screen.getByText("Tomorrow · 08:00 SAST")).toBeInTheDocument();
    expect(screen.getByText("Fri · 12:30 SAST")).toBeInTheDocument();
    expect(screen.getByText("Sat · 18:00 SAST")).toBeInTheDocument();
  });

  it("displays post preview text", () => {
    render(<UpcomingPosts />);
    expect(
      screen.getByText(/Big news Mzansi!/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/New collection dropping/),
    ).toBeInTheDocument();
  });

  it("renders Edit and Cancel action buttons for each post", () => {
    render(<UpcomingPosts />);
    const editButtons = screen.getAllByText("editAction");
    const cancelButtons = screen.getAllByText("cancelAction");
    expect(editButtons).toHaveLength(3);
    expect(cancelButtons).toHaveLength(3);
  });

  it("renders the 'View Calendar' link", () => {
    render(<UpcomingPosts />);
    const link = screen.getByText("viewCalendar");
    expect(link.closest("a")).toHaveAttribute("href", "/calendar");
  });
});

// ─── Dashboard Overview (all widgets together) ──────────────────

describe("Dashboard Overview (integration)", () => {
  it("renders all 4 widgets", () => {
    render(
      <div data-testid="dashboard-overview">
        <CreditsSummary />
        <QuickStats />
        <RecentPosts />
        <UpcomingPosts />
      </div>,
    );

    const overview = screen.getByTestId("dashboard-overview");

    // CreditsSummary
    expect(within(overview).getByText("creditsSummaryTitle")).toBeInTheDocument();
    // QuickStats
    expect(within(overview).getByTestId("quick-stats")).toBeInTheDocument();
    // RecentPosts
    expect(within(overview).getByText("recentPostsTitle")).toBeInTheDocument();
    // UpcomingPosts
    expect(within(overview).getByText("upcomingScheduledTitle")).toBeInTheDocument();
  });
});
