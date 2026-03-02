/**
 * Tests for PlatformDistribution component
 *
 * Verifies rendering with data, empty state, percentage calculations,
 * sorting behaviour, and accessibility attributes.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PlatformDistribution } from "../PlatformDistribution";
import type { PlatformCount } from "../PlatformDistribution";

// ─── Test data ───

const MOCK_DATA: PlatformCount[] = [
  { platform: "instagram", count: 45 },
  { platform: "facebook", count: 30 },
  { platform: "twitter", count: 15 },
  { platform: "linkedin", count: 8 },
  { platform: "tiktok", count: 2 },
];

// ─── Tests ───

describe("PlatformDistribution", () => {
  it("renders the component with data-testid", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    expect(screen.getByTestId("platform-distribution")).toBeInTheDocument();
  });

  it("renders all platforms in the data", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("Twitter / X")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();
  });

  it("shows correct counts for each platform", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    // Total is 100, so percentages are easy to verify
    expect(screen.getByTestId("platform-instagram")).toHaveTextContent("45");
    expect(screen.getByTestId("platform-facebook")).toHaveTextContent("30");
    expect(screen.getByTestId("platform-twitter")).toHaveTextContent("15");
    expect(screen.getByTestId("platform-linkedin")).toHaveTextContent("8");
    expect(screen.getByTestId("platform-tiktok")).toHaveTextContent("2");
  });

  it("shows correct percentages", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    // Total = 100, so percentages match counts
    expect(screen.getByTestId("platform-instagram")).toHaveTextContent("45.0%");
    expect(screen.getByTestId("platform-facebook")).toHaveTextContent("30.0%");
    expect(screen.getByTestId("platform-twitter")).toHaveTextContent("15.0%");
    expect(screen.getByTestId("platform-linkedin")).toHaveTextContent("8.0%");
    expect(screen.getByTestId("platform-tiktok")).toHaveTextContent("2.0%");
  });

  it("displays total account count in header", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    expect(screen.getByText("100 total accounts")).toBeInTheDocument();
  });

  it("sorts platforms by count in descending order", () => {
    const unsorted: PlatformCount[] = [
      { platform: "tiktok", count: 5 },
      { platform: "instagram", count: 50 },
      { platform: "facebook", count: 20 },
    ];

    render(<PlatformDistribution data={unsorted} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    // First should be Instagram (highest count)
    expect(within(items[0]).getByText("Instagram")).toBeInTheDocument();
    // Second should be Facebook
    expect(within(items[1]).getByText("Facebook")).toBeInTheDocument();
    // Third should be TikTok (lowest count)
    expect(within(items[2]).getByText("TikTok")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<PlatformDistribution data={[]} />);

    expect(
      screen.getByText("No social accounts connected yet."),
    ).toBeInTheDocument();
  });

  it("handles single platform correctly", () => {
    const singlePlatform: PlatformCount[] = [
      { platform: "linkedin", count: 10 },
    ];

    render(<PlatformDistribution data={singlePlatform} />);

    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("10 total accounts")).toBeInTheDocument();
    expect(screen.getByTestId("platform-linkedin")).toHaveTextContent("100.0%");
  });

  it("uses singular 'account' for single total", () => {
    const single: PlatformCount[] = [{ platform: "instagram", count: 1 }];

    render(<PlatformDistribution data={single} />);

    expect(screen.getByText("1 total account")).toBeInTheDocument();
  });

  // ─── Accessibility ───

  it("has an accessible list role", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    expect(
      screen.getByRole("list", { name: "Platform distribution" }),
    ).toBeInTheDocument();
  });

  it("has progressbar roles with correct aria attributes", () => {
    render(<PlatformDistribution data={MOCK_DATA} />);

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBe(5);

    // Check that each progress bar has aria-label
    progressBars.forEach((bar) => {
      expect(bar).toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-label");
    });
  });

  it("renders WhatsApp and Google Business platforms", () => {
    const allPlatforms: PlatformCount[] = [
      { platform: "whatsapp", count: 12 },
      { platform: "google_business", count: 8 },
    ];

    render(<PlatformDistribution data={allPlatforms} />);

    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Google Business")).toBeInTheDocument();
  });
});
