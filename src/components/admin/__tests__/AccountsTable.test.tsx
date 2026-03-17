/**
 * Tests for AccountsTable component
 *
 * Verifies filtering by platform, status, and text search,
 * plus pagination behaviour and empty state rendering.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountsTable } from "../AccountsTable";
import type { AccountRow } from "../AccountsTable";

// ─── Test data ───

const MOCK_ACCOUNTS: AccountRow[] = [
  {
    id: "acc-1",
    platform: "instagram",
    platformUserId: "coolbrand",
    displayName: "Cool Brand SA",
    isActive: true,
    connectedAt: "2024-06-15T10:00:00Z",
    tokenExpiresAt: "2024-12-15T10:00:00Z",
    orgName: "Brand Corp",
    orgSlug: "brand-corp",
  },
  {
    id: "acc-2",
    platform: "facebook",
    platformUserId: "brandpage",
    displayName: "Brand Page",
    isActive: false,
    connectedAt: "2024-05-10T08:00:00Z",
    tokenExpiresAt: null,
    orgName: "Brand Corp",
    orgSlug: "brand-corp",
  },
  {
    id: "acc-3",
    platform: "twitter",
    platformUserId: "mzansi_vibes",
    displayName: "Mzansi Vibes",
    isActive: true,
    connectedAt: "2024-07-01T12:00:00Z",
    tokenExpiresAt: "2025-01-01T12:00:00Z",
    orgName: "Vibe Agency",
    orgSlug: "vibe-agency",
  },
  {
    id: "acc-4",
    platform: "linkedin",
    platformUserId: "joburg_biz",
    displayName: "Joburg Business",
    isActive: true,
    connectedAt: "2024-04-20T09:00:00Z",
    tokenExpiresAt: "2024-10-20T09:00:00Z",
    orgName: "Vibe Agency",
    orgSlug: "vibe-agency",
  },
  {
    id: "acc-5",
    platform: "tiktok",
    platformUserId: "dancesa",
    displayName: null,
    isActive: false,
    connectedAt: "2024-03-01T07:00:00Z",
    tokenExpiresAt: null,
    orgName: "Dance Studios",
    orgSlug: "dance-studios",
  },
];

// ─── Tests ───

describe("AccountsTable", () => {
  it("renders all accounts when no filters are active", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(5);
  });

  it("displays account display name and falls back to platformUserId", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    // Account with displayName
    expect(screen.getByText("Cool Brand SA")).toBeInTheDocument();
    // Account without displayName shows platformUserId
    expect(screen.getByText("dancesa")).toBeInTheDocument();
  });

  it("shows connected and disconnected status badges", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const badges = screen.getAllByTestId("status-badge");
    const connectedBadges = badges.filter(
      (b) => b.textContent === "Connected",
    );
    const disconnectedBadges = badges.filter(
      (b) => b.textContent === "Disconnected",
    );

    expect(connectedBadges).toHaveLength(3);
    expect(disconnectedBadges).toHaveLength(2);
  });

  it("displays organisation names", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    expect(screen.getAllByText("Brand Corp")).toHaveLength(2);
    expect(screen.getAllByText("Vibe Agency")).toHaveLength(2);
    expect(screen.getByText("Dance Studios")).toBeInTheDocument();
  });

  // ─── Platform filter ───

  it("filters accounts by platform", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const platformSelect = screen.getByLabelText("Filter by platform");
    await user.selectOptions(platformSelect, "instagram");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(1);
    expect(screen.getByText("Cool Brand SA")).toBeInTheDocument();
  });

  it("shows all accounts when platform filter is reset to 'all'", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const platformSelect = screen.getByLabelText("Filter by platform");
    await user.selectOptions(platformSelect, "twitter");
    expect(screen.getAllByTestId("account-row")).toHaveLength(1);

    await user.selectOptions(platformSelect, "all");
    expect(screen.getAllByTestId("account-row")).toHaveLength(5);
  });

  // ─── Status filter ───

  it("filters by connected status", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const statusSelect = screen.getByLabelText("Filter by status");
    await user.selectOptions(statusSelect, "connected");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(3);
  });

  it("filters by disconnected status", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const statusSelect = screen.getByLabelText("Filter by status");
    await user.selectOptions(statusSelect, "disconnected");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(2);
  });

  // ─── Text search ───

  it("searches by account display name", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const searchInput = screen.getByLabelText("Search accounts");
    await user.type(searchInput, "mzansi");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(1);
    expect(screen.getByText("Mzansi Vibes")).toBeInTheDocument();
  });

  it("searches by organisation name", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const searchInput = screen.getByLabelText("Search accounts");
    await user.type(searchInput, "dance");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(1);
  });

  it("searches by platformUserId", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const searchInput = screen.getByLabelText("Search accounts");
    await user.type(searchInput, "joburg");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(1);
    expect(screen.getByText("Joburg Business")).toBeInTheDocument();
  });

  it("shows empty state when search has no matches", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const searchInput = screen.getByLabelText("Search accounts");
    await user.type(searchInput, "nonexistent-account-xyz");

    expect(screen.queryAllByTestId("account-row")).toHaveLength(0);
    expect(
      screen.getByText("No accounts match the current filters."),
    ).toBeInTheDocument();
  });

  // ─── Combined filters ───

  it("combines platform and status filters", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const platformSelect = screen.getByLabelText("Filter by platform");
    const statusSelect = screen.getByLabelText("Filter by status");

    await user.selectOptions(platformSelect, "facebook");
    await user.selectOptions(statusSelect, "disconnected");

    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(1);
    expect(screen.getByText("Brand Page")).toBeInTheDocument();
  });

  // ─── Pagination ───

  it("paginates when more accounts than pageSize", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} pageSize={2} />);

    // Should show first 2 rows
    const rows = screen.getAllByTestId("account-row");
    expect(rows).toHaveLength(2);

    // Should show pagination info
    expect(screen.getByText(/Showing 1–2 of 5/)).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("navigates to next and previous pages", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} pageSize={2} />);

    // Go to page 2
    const nextButton = screen.getByLabelText("Next page");
    await user.click(nextButton);

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText(/Showing 3–4 of 5/)).toBeInTheDocument();

    // Go back to page 1
    const prevButton = screen.getByLabelText("Previous page");
    await user.click(prevButton);

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("resets to page 1 when filters change", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={MOCK_ACCOUNTS} pageSize={2} />);

    // Go to page 2
    const nextButton = screen.getByLabelText("Next page");
    await user.click(nextButton);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    // Change filter — should reset to page 1
    const statusSelect = screen.getByLabelText("Filter by status");
    await user.selectOptions(statusSelect, "connected");

    // 3 connected accounts with pageSize 2 = 2 pages, starting at page 1
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  // ─── Empty state ───

  it("shows empty state when no accounts exist", () => {
    render(<AccountsTable accounts={[]} />);

    expect(screen.getByText("No social accounts found.")).toBeInTheDocument();
    expect(screen.queryAllByTestId("account-row")).toHaveLength(0);
  });

  // ─── Accessibility ───

  it("has accessible filter labels", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    expect(screen.getByLabelText("Search accounts")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by platform")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
  });

  it("has table column headers", () => {
    render(<AccountsTable accounts={MOCK_ACCOUNTS} />);

    const thead = screen.getAllByRole("columnheader");
    const headerTexts = thead.map((th) => th.textContent?.trim());

    expect(headerTexts).toContain("Platform");
    expect(headerTexts).toContain("Account");
    expect(headerTexts).toContain("Organisation");
    expect(headerTexts).toContain("Status");
    expect(headerTexts).toContain("Connected");
  });
});
