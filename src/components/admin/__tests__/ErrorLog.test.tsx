/**
 * Tests for ErrorLog component
 *
 * Validates that:
 * - Error entries are rendered in a table
 * - Severity filter works correctly
 * - Source filter works correctly
 * - Clicking a row expands the stack trace
 * - Empty state shows when no entries match filters
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorLog } from "../ErrorLog";
import type { ErrorEntry } from "@/types/admin-system";

// ─── Mock data ───

function makeErrorData(): ErrorEntry[] {
  const now = Date.now();
  return [
    {
      id: "err-1",
      timestamp: new Date(now).toISOString(),
      source: "Twitter/X OAuth",
      message: "Rate limit exceeded",
      severity: "warning",
      stackTrace: "Error: Rate limit exceeded\n    at refreshToken (twitter.ts:42)",
    },
    {
      id: "err-2",
      timestamp: new Date(now - 3_600_000).toISOString(),
      source: "Image Processor",
      message: "Unsupported format WebP",
      severity: "error",
      stackTrace: "TypeError: Unsupported image format\n    at resize (image.ts:87)",
    },
    {
      id: "err-3",
      timestamp: new Date(now - 7_200_000).toISOString(),
      source: "Database",
      message: "Connection pool exhausted",
      severity: "critical",
    },
    {
      id: "err-4",
      timestamp: new Date(now - 10_800_000).toISOString(),
      source: "Queue Worker",
      message: "Job retry scheduled",
      severity: "info",
    },
    {
      id: "err-5",
      timestamp: new Date(now - 14_400_000).toISOString(),
      source: "Twitter/X OAuth",
      message: "Token refresh successful",
      severity: "info",
    },
  ];
}

// ─── Tests ───

describe("ErrorLog", () => {
  const user = userEvent.setup();

  it("renders the error log container", () => {
    render(<ErrorLog initialData={makeErrorData()} />);
    expect(screen.getByTestId("error-log")).toBeInTheDocument();
  });

  it("shows all error entries", () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    expect(screen.getByText("Unsupported format WebP")).toBeInTheDocument();
    expect(screen.getByText("Connection pool exhausted")).toBeInTheDocument();
    expect(screen.getByText("Job retry scheduled")).toBeInTheDocument();
    expect(screen.getByText("Token refresh successful")).toBeInTheDocument();
  });

  it("shows severity badges with correct labels", () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    // Query within the table (not the filter dropdowns) to avoid matching <option> text
    const table = screen.getByTestId("error-table");

    expect(within(table).getByText("Warning")).toBeInTheDocument();
    expect(within(table).getByText("Error")).toBeInTheDocument();
    expect(within(table).getByText("Critical")).toBeInTheDocument();
    // "Info" appears twice in the data
    expect(within(table).getAllByText("Info")).toHaveLength(2);
  });

  it("shows entry count", () => {
    render(<ErrorLog initialData={makeErrorData()} />);
    expect(screen.getByText("5 entries")).toBeInTheDocument();
  });

  it("filters by severity", async () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    const severitySelect = screen.getByLabelText("Filter by severity");
    await user.selectOptions(severitySelect, "error");

    // Only "error" severity entry should remain
    expect(screen.getByText("Unsupported format WebP")).toBeInTheDocument();
    expect(screen.queryByText("Rate limit exceeded")).not.toBeInTheDocument();
    expect(screen.queryByText("Connection pool exhausted")).not.toBeInTheDocument();
    expect(screen.queryByText("Job retry scheduled")).not.toBeInTheDocument();

    // Should show "(filtered)" indicator
    expect(screen.getByText(/filtered/)).toBeInTheDocument();
  });

  it("filters by source", async () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    const sourceSelect = screen.getByLabelText("Filter by source");
    await user.selectOptions(sourceSelect, "Twitter/X OAuth");

    // Only Twitter/X OAuth entries should remain
    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    expect(screen.getByText("Token refresh successful")).toBeInTheDocument();
    expect(screen.queryByText("Unsupported format WebP")).not.toBeInTheDocument();
    expect(screen.queryByText("Connection pool exhausted")).not.toBeInTheDocument();
  });

  it("combines severity and source filters", async () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    const severitySelect = screen.getByLabelText("Filter by severity");
    const sourceSelect = screen.getByLabelText("Filter by source");

    await user.selectOptions(severitySelect, "info");
    await user.selectOptions(sourceSelect, "Twitter/X OAuth");

    // Only the info + Twitter/X OAuth entry should remain
    expect(screen.getByText("Token refresh successful")).toBeInTheDocument();
    expect(screen.queryByText("Rate limit exceeded")).not.toBeInTheDocument();
    expect(screen.queryByText("Job retry scheduled")).not.toBeInTheDocument();
  });

  it("shows empty state when no entries match filters", async () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    const severitySelect = screen.getByLabelText("Filter by severity");
    const sourceSelect = screen.getByLabelText("Filter by source");

    await user.selectOptions(severitySelect, "critical");
    await user.selectOptions(sourceSelect, "Twitter/X OAuth");

    expect(
      screen.getByText("No errors match the current filters"),
    ).toBeInTheDocument();
  });

  it("expands stack trace when row is clicked", async () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    // The first row has a stack trace
    const row = screen.getByTestId("error-row-err-1");
    const expandButton = within(row).getByRole("button");

    // Stack trace not visible initially
    expect(screen.queryByTestId("stack-trace-err-1")).not.toBeInTheDocument();

    // Click to expand
    await user.click(expandButton);
    expect(screen.getByTestId("stack-trace-err-1")).toBeInTheDocument();
    expect(screen.getByText(/refreshToken/)).toBeInTheDocument();

    // Click again to collapse
    await user.click(expandButton);
    expect(screen.queryByTestId("stack-trace-err-1")).not.toBeInTheDocument();
  });

  it("only one row can be expanded at a time", async () => {
    render(<ErrorLog initialData={makeErrorData()} />);

    // Expand first row
    const row1 = screen.getByTestId("error-row-err-1");
    await user.click(within(row1).getByRole("button"));
    expect(screen.getByTestId("stack-trace-err-1")).toBeInTheDocument();

    // Expand second row — first should collapse
    const row2 = screen.getByTestId("error-row-err-2");
    await user.click(within(row2).getByRole("button"));
    expect(screen.queryByTestId("stack-trace-err-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("stack-trace-err-2")).toBeInTheDocument();
  });

  it("handles empty initial data", () => {
    render(<ErrorLog initialData={[]} />);

    expect(screen.getByText("0 entries")).toBeInTheDocument();
    expect(
      screen.getByText("No errors match the current filters"),
    ).toBeInTheDocument();
  });
});
