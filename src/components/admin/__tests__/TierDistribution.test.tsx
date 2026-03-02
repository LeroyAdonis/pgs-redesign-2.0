import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TierDistribution } from "@/components/admin/TierDistribution";
import type { TierDistributionItem } from "@/components/admin/TierDistribution";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockDistribution: TierDistributionItem[] = [
  {
    tier: "seedling",
    displayName: "Seedling",
    count: 120,
    percentage: 48,
    revenueZAR: 0,
  },
  {
    tier: "hustler",
    displayName: "Hustler",
    count: 80,
    percentage: 32,
    revenueZAR: 23920,
  },
  {
    tier: "grower",
    displayName: "Grower",
    count: 35,
    percentage: 14,
    revenueZAR: 27965,
  },
  {
    tier: "mogul",
    displayName: "Mogul",
    count: 15,
    percentage: 6,
    revenueZAR: 29985,
  },
];

const emptyDistribution: TierDistributionItem[] = [
  { tier: "seedling", displayName: "Seedling", count: 0, percentage: 0, revenueZAR: 0 },
  { tier: "hustler", displayName: "Hustler", count: 0, percentage: 0, revenueZAR: 0 },
  { tier: "grower", displayName: "Grower", count: 0, percentage: 0, revenueZAR: 0 },
  { tier: "mogul", displayName: "Mogul", count: 0, percentage: 0, revenueZAR: 0 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TierDistribution", () => {
  it("renders the tier distribution container", () => {
    render(<TierDistribution data={mockDistribution} />);

    expect(screen.getByTestId("tier-distribution")).toBeInTheDocument();
  });

  it("displays the section title", () => {
    render(<TierDistribution data={mockDistribution} />);

    expect(screen.getByText("Tier Distribution")).toBeInTheDocument();
  });

  it("shows total subscriber count", () => {
    render(<TierDistribution data={mockDistribution} />);

    // 120 + 80 + 35 + 15 = 250
    expect(screen.getByText("250 total subscribers")).toBeInTheDocument();
  });

  it("renders all four tier items", () => {
    render(<TierDistribution data={mockDistribution} />);

    expect(screen.getByTestId("tier-item-seedling")).toBeInTheDocument();
    expect(screen.getByTestId("tier-item-hustler")).toBeInTheDocument();
    expect(screen.getByTestId("tier-item-grower")).toBeInTheDocument();
    expect(screen.getByTestId("tier-item-mogul")).toBeInTheDocument();
  });

  it("displays tier display names", () => {
    render(<TierDistribution data={mockDistribution} />);

    expect(screen.getByText("Seedling")).toBeInTheDocument();
    expect(screen.getByText("Hustler")).toBeInTheDocument();
    expect(screen.getByText("Grower")).toBeInTheDocument();
    expect(screen.getByText("Mogul")).toBeInTheDocument();
  });

  it("shows subscriber count per tier", () => {
    render(<TierDistribution data={mockDistribution} />);

    const seedlingItem = screen.getByTestId("tier-item-seedling");
    expect(seedlingItem).toHaveTextContent("120");

    const hustlerItem = screen.getByTestId("tier-item-hustler");
    expect(hustlerItem).toHaveTextContent("80");

    const growerItem = screen.getByTestId("tier-item-grower");
    expect(growerItem).toHaveTextContent("35");

    const mogulItem = screen.getByTestId("tier-item-mogul");
    expect(mogulItem).toHaveTextContent("15");
  });

  it("shows percentage per tier", () => {
    render(<TierDistribution data={mockDistribution} />);

    const seedlingItem = screen.getByTestId("tier-item-seedling");
    expect(seedlingItem).toHaveTextContent("48.0%");

    const hustlerItem = screen.getByTestId("tier-item-hustler");
    expect(hustlerItem).toHaveTextContent("32.0%");
  });

  it("renders the stacked bar chart", () => {
    render(<TierDistribution data={mockDistribution} />);

    expect(screen.getByTestId("tier-stacked-bar")).toBeInTheDocument();
  });

  it("renders bar segments for tiers with subscribers", () => {
    render(<TierDistribution data={mockDistribution} />);

    expect(screen.getByTestId("tier-bar-seedling")).toBeInTheDocument();
    expect(screen.getByTestId("tier-bar-hustler")).toBeInTheDocument();
    expect(screen.getByTestId("tier-bar-grower")).toBeInTheDocument();
    expect(screen.getByTestId("tier-bar-mogul")).toBeInTheDocument();
  });

  it("sets correct width percentages on bar segments", () => {
    render(<TierDistribution data={mockDistribution} />);

    const seedlingBar = screen.getByTestId("tier-bar-seedling");
    expect(seedlingBar.style.width).toBe("48%");

    const hustlerBar = screen.getByTestId("tier-bar-hustler");
    expect(hustlerBar.style.width).toBe("32%");
  });

  it("applies tier-specific colors to items", () => {
    render(<TierDistribution data={mockDistribution} />);

    const seedlingItem = screen.getByTestId("tier-item-seedling");
    expect(seedlingItem.className).toContain("emerald");

    const hustlerItem = screen.getByTestId("tier-item-hustler");
    expect(hustlerItem.className).toContain("amber");

    const growerItem = screen.getByTestId("tier-item-grower");
    expect(growerItem.className).toContain("blue");

    const mogulItem = screen.getByTestId("tier-item-mogul");
    expect(mogulItem.className).toContain("purple");
  });

  it("displays revenue per tier in ZAR format", () => {
    render(<TierDistribution data={mockDistribution} />);

    // Hustler: R 23,920.00
    const hustlerItem = screen.getByTestId("tier-item-hustler");
    expect(hustlerItem).toHaveTextContent("R");
    expect(hustlerItem).toHaveTextContent("920");
  });

  it("shows total MRR in the header", () => {
    render(<TierDistribution data={mockDistribution} />);

    // Total = 0 + 23920 + 27965 + 29985 = 81870
    const container = screen.getByTestId("tier-distribution");
    expect(container).toHaveTextContent("R");
    expect(container).toHaveTextContent("total MRR");
  });

  it("renders with empty data without crashing", () => {
    render(<TierDistribution data={emptyDistribution} />);

    expect(screen.getByTestId("tier-distribution")).toBeInTheDocument();
    expect(screen.getByText("0 total subscribers")).toBeInTheDocument();
  });

  it("does not render bar segments for zero-percentage tiers", () => {
    render(<TierDistribution data={emptyDistribution} />);

    const stackedBar = screen.getByTestId("tier-stacked-bar");
    expect(stackedBar.children).toHaveLength(0);
  });

  it("has accessible label on stacked bar", () => {
    render(<TierDistribution data={mockDistribution} />);

    const bar = screen.getByTestId("tier-stacked-bar");
    expect(bar).toHaveAttribute("role", "img");
    expect(bar).toHaveAttribute("aria-label");
    expect(bar.getAttribute("aria-label")).toContain("Seedling");
    expect(bar.getAttribute("aria-label")).toContain("Mogul");
  });
});
