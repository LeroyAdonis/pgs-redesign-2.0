import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RevenueMetrics,
  formatZAR,
  formatChange,
} from "@/components/admin/RevenueMetrics";
import type { RevenueMetricsData } from "@/components/admin/RevenueMetrics";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockData: RevenueMetricsData = {
  mrr: 15897.0,
  mrrChange: 12.5,
  totalActiveSubs: 42,
  subsChange: 8.3,
  churnRate: 3.2,
  churnChange: -1.5,
  creditRevenue: 2450.0,
  creditRevenueChange: 25.0,
};

const zeroData: RevenueMetricsData = {
  mrr: 0,
  mrrChange: 0,
  totalActiveSubs: 0,
  subsChange: 0,
  churnRate: 0,
  churnChange: 0,
  creditRevenue: 0,
  creditRevenueChange: 0,
};

// ---------------------------------------------------------------------------
// formatZAR tests
// ---------------------------------------------------------------------------

describe("formatZAR", () => {
  it("formats zero as R 0.00", () => {
    expect(formatZAR(0)).toBe("R 0.00");
  });

  it("formats whole number with decimals", () => {
    expect(formatZAR(1000)).toBe("R 1,000.00");
  });

  it("formats large number with thousands separator", () => {
    const result = formatZAR(15897);
    expect(result).toBe("R 15,897.00");
  });

  it("formats decimal amounts correctly", () => {
    const result = formatZAR(1234.56);
    expect(result).toBe("R 1,234.56");
  });
});

// ---------------------------------------------------------------------------
// formatChange tests
// ---------------------------------------------------------------------------

describe("formatChange", () => {
  it("formats positive change with + sign", () => {
    expect(formatChange(12.5)).toBe("+12.5%");
  });

  it("formats negative change with - sign", () => {
    expect(formatChange(-5.1)).toBe("-5.1%");
  });

  it("formats zero change with + sign", () => {
    expect(formatChange(0)).toBe("+0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatChange(12.567)).toBe("+12.6%");
  });
});

// ---------------------------------------------------------------------------
// RevenueMetrics component tests
// ---------------------------------------------------------------------------

describe("RevenueMetrics", () => {
  it("renders all four metric cards when data is provided", () => {
    render(<RevenueMetrics initialData={mockData} />);

    expect(screen.getByTestId("metric-mrr")).toBeInTheDocument();
    expect(screen.getByTestId("metric-subs")).toBeInTheDocument();
    expect(screen.getByTestId("metric-churn")).toBeInTheDocument();
    expect(screen.getByTestId("metric-credit")).toBeInTheDocument();
  });

  it("displays MRR formatted in ZAR", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const mrrCard = screen.getByTestId("metric-mrr");
    expect(mrrCard).toHaveTextContent("Monthly Recurring Revenue");
    expect(mrrCard).toHaveTextContent("R 15,897.00");
  });

  it("displays active subscription count", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const subsCard = screen.getByTestId("metric-subs");
    expect(subsCard).toHaveTextContent("Active Subscriptions");
    expect(subsCard).toHaveTextContent("42");
  });

  it("displays churn rate as percentage", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const churnCard = screen.getByTestId("metric-churn");
    expect(churnCard).toHaveTextContent("Churn Rate");
    expect(churnCard).toHaveTextContent("3.2%");
  });

  it("displays credit revenue in ZAR", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const creditCard = screen.getByTestId("metric-credit");
    expect(creditCard).toHaveTextContent("Credit Revenue");
    expect(creditCard).toHaveTextContent("R 2,450.00");
  });

  it("shows upward trend arrow for positive MRR change", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const mrrTrend = screen.getByTestId("metric-mrr-trend");
    expect(mrrTrend).toHaveTextContent("+12.5%");
    expect(mrrTrend.querySelector('[data-testid="trend-arrow-up"]')).toBeInTheDocument();
  });

  it("shows trend text with change percentage", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const subsTrend = screen.getByTestId("metric-subs-trend");
    expect(subsTrend).toHaveTextContent("+8.3%");
    expect(subsTrend).toHaveTextContent("from last month");
  });

  it("inverts trend color for churn rate (lower is better)", () => {
    render(<RevenueMetrics initialData={mockData} />);

    const churnTrend = screen.getByTestId("metric-churn-trend");
    // Churn change is -1.5%, which is good (inverted), so should be green
    expect(churnTrend.className).toContain("text-emerald-400");
  });

  it("renders loading skeleton when no initial data", () => {
    render(<RevenueMetrics />);

    expect(screen.getByTestId("revenue-metrics-loading")).toBeInTheDocument();
  });

  it("renders zero values without errors", () => {
    render(<RevenueMetrics initialData={zeroData} />);

    const mrrCard = screen.getByTestId("metric-mrr");
    expect(mrrCard).toHaveTextContent("R 0.00");
  });

  it("renders the metrics grid container", () => {
    render(<RevenueMetrics initialData={mockData} />);

    expect(screen.getByTestId("revenue-metrics")).toBeInTheDocument();
  });
});
