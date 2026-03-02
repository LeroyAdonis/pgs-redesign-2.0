/**
 * ClientsTable component tests
 *
 * Tests search, filter, pagination, sort, and row expansion
 * behaviors of the admin clients table.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

import { ClientsTable } from "@/components/admin/ClientsTable";
import type { ClientRow, ClientSummary } from "@/components/admin/ClientsTable";

// ─── Fixtures ────────────────────────────────────────────────────

function makeClient(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    id: "org-1",
    name: "Mzansi Digital",
    slug: "mzansi-digital",
    tier: "hustler",
    logoUrl: null,
    createdAt: "2025-01-15T10:00:00.000Z",
    ownerName: "Thabo Mbeki",
    ownerEmail: "thabo@mzansi.co.za",
    ownerImage: null,
    subscriptionStatus: "active",
    currentPeriodEnd: "2025-02-15T10:00:00.000Z",
    ...overrides,
  };
}

const sampleClients: ClientRow[] = [
  makeClient({ id: "org-1", name: "Mzansi Digital", ownerEmail: "thabo@mzansi.co.za", tier: "hustler" }),
  makeClient({ id: "org-2", name: "Cape Town Creatives", ownerName: "Lerato Khumalo", ownerEmail: "lerato@ctc.co.za", tier: "grower", subscriptionStatus: "trialing" }),
  makeClient({ id: "org-3", name: "Joburg Media", ownerName: "Sipho Dlamini", ownerEmail: "sipho@jm.co.za", tier: "seedling", subscriptionStatus: "canceled" }),
  makeClient({ id: "org-4", name: "Durban Studios", ownerName: "Naledi Molefe", ownerEmail: "naledi@ds.co.za", tier: "mogul", subscriptionStatus: null }),
];

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 4,
  totalPages: 1,
};

const defaultSummary: ClientSummary = {
  totalClients: 4,
  activeClients: 2,
  newThisMonth: 1,
};

// ─── Mock fetch ──────────────────────────────────────────────────

const mockFetch = vi.fn() as Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = mockFetch;
  mockFetch.mockResolvedValue(
    new Response(
      JSON.stringify({
        success: true,
        clients: sampleClients,
        pagination: defaultPagination,
        summary: defaultSummary,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
});

function renderTable(overrides: {
  clients?: ClientRow[];
  pagination?: typeof defaultPagination;
  summary?: ClientSummary;
} = {}) {
  return render(
    <ClientsTable
      initialClients={overrides.clients ?? sampleClients}
      initialPagination={overrides.pagination ?? defaultPagination}
      initialSummary={overrides.summary ?? defaultSummary}
    />,
  );
}

// ─── Tests ───────────────────────────────────────────────────────

describe("ClientsTable", () => {
  // ─── Rendering ─────────────────────────────────────────────

  it("renders summary stat cards", () => {
    renderTable();

    expect(screen.getByText("Total Clients")).toBeInTheDocument();
    expect(screen.getByText("Active Clients")).toBeInTheDocument();
    expect(screen.getByText("New This Month")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders table column headers", () => {
    renderTable();

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Tier")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders all client rows", () => {
    renderTable();

    expect(screen.getByText("Mzansi Digital")).toBeInTheDocument();
    expect(screen.getByText("Cape Town Creatives")).toBeInTheDocument();
    expect(screen.getByText("Joburg Media")).toBeInTheDocument();
    expect(screen.getByText("Durban Studios")).toBeInTheDocument();
  });

  it("renders tier badges with correct labels", () => {
    renderTable();

    // Use getAllByText since tier labels also appear in the filter dropdown
    const hustlerBadges = screen.getAllByText("Hustler");
    expect(hustlerBadges.length).toBeGreaterThanOrEqual(1);
    const growerBadges = screen.getAllByText("Grower");
    expect(growerBadges.length).toBeGreaterThanOrEqual(1);
    const seedlingBadges = screen.getAllByText("Seedling");
    expect(seedlingBadges.length).toBeGreaterThanOrEqual(1);
    const mogulBadges = screen.getAllByText("Mogul");
    expect(mogulBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders status badges correctly", () => {
    renderTable();

    // "Active" and "Inactive" appear in both badges and filter dropdown,
    // so use getAllByText to verify presence
    const activeTexts = screen.getAllByText("Active");
    expect(activeTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Trialing")).toBeInTheDocument();
    expect(screen.getByText("Canceled")).toBeInTheDocument();
    const inactiveTexts = screen.getAllByText("Inactive");
    expect(inactiveTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("shows owner name and email in rows", () => {
    renderTable();

    expect(screen.getByText("Thabo Mbeki")).toBeInTheDocument();
    expect(screen.getByText("thabo@mzansi.co.za")).toBeInTheDocument();
    expect(screen.getByText("Lerato Khumalo")).toBeInTheDocument();
    expect(screen.getByText("lerato@ctc.co.za")).toBeInTheDocument();
  });

  it("shows empty state when no clients", () => {
    renderTable({ clients: [] });

    expect(
      screen.getByText(/No clients found/),
    ).toBeInTheDocument();
  });

  // ─── Search ────────────────────────────────────────────────

  it("renders search input with correct placeholder", () => {
    renderTable();

    const searchInput = screen.getByLabelText("Search clients by name or email");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "Search by name or email…",
    );
  });

  it("calls API with search param after debounce", async () => {
    const user = userEvent.setup();
    renderTable();

    const searchInput = screen.getByLabelText("Search clients by name or email");
    await user.type(searchInput, "mzansi");

    // Wait for debounce (300ms) + fetch
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url = new URL(lastCall[0] as string, "http://localhost");
    expect(url.searchParams.get("search")).toBe("mzansi");
  });

  // ─── Filters ───────────────────────────────────────────────

  it("renders tier filter dropdown", () => {
    renderTable();

    const tierSelect = screen.getByLabelText("Filter by tier");
    expect(tierSelect).toBeInTheDocument();

    // Check options
    const options = within(tierSelect).getAllByRole("option");
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent("All Tiers");
    expect(options[1]).toHaveTextContent("Seedling");
  });

  it("renders status filter dropdown", () => {
    renderTable();

    const statusSelect = screen.getByLabelText("Filter by status");
    expect(statusSelect).toBeInTheDocument();

    const options = within(statusSelect).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("All Status");
  });

  it("calls API with tier filter when changed", async () => {
    const user = userEvent.setup();
    renderTable();

    const tierSelect = screen.getByLabelText("Filter by tier");
    await user.selectOptions(tierSelect, "mogul");

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url = new URL(lastCall[0] as string, "http://localhost");
    expect(url.searchParams.get("tier")).toBe("mogul");
  });

  it("calls API with status filter when changed", async () => {
    const user = userEvent.setup();
    renderTable();

    const statusSelect = screen.getByLabelText("Filter by status");
    await user.selectOptions(statusSelect, "active");

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url = new URL(lastCall[0] as string, "http://localhost");
    expect(url.searchParams.get("status")).toBe("active");
  });

  // ─── Sorting ───────────────────────────────────────────────

  it("toggles sort order when clicking sorted column header", async () => {
    const user = userEvent.setup();
    renderTable();

    // "Created" is the default sort field (date), currently desc
    const createdHeader = screen.getByText("Created");

    // Click to change order
    await user.click(createdHeader);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url = new URL(lastCall[0] as string, "http://localhost");
    expect(url.searchParams.get("sort")).toBe("date");
    expect(url.searchParams.get("order")).toBe("asc");
  });

  it("changes sort field when clicking a different column header", async () => {
    const user = userEvent.setup();
    renderTable();

    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url = new URL(lastCall[0] as string, "http://localhost");
    expect(url.searchParams.get("sort")).toBe("name");
    expect(url.searchParams.get("order")).toBe("asc");
  });

  it("sets aria-sort on sortable column headers", () => {
    renderTable();

    const headers = screen.getAllByRole("columnheader");

    // Name: not currently sorted → "none"
    const nameHeader = headers.find((h) => h.textContent?.includes("Name"));
    expect(nameHeader).toHaveAttribute("aria-sort", "none");

    // Created: default sort → "descending"
    const dateHeader = headers.find((h) => h.textContent?.includes("Created"));
    expect(dateHeader).toHaveAttribute("aria-sort", "descending");
  });

  // ─── Row Expansion ────────────────────────────────────────

  it("expands row on click to show details", async () => {
    const user = userEvent.setup();
    renderTable();

    const row = screen.getByTestId("client-row-org-1");
    expect(screen.queryByTestId("client-details-org-1")).not.toBeInTheDocument();

    await user.click(row);

    expect(screen.getByTestId("client-details-org-1")).toBeInTheDocument();
    expect(screen.getByText("Organization ID")).toBeInTheDocument();
  });

  it("collapses expanded row when clicked again", async () => {
    const user = userEvent.setup();
    renderTable();

    const row = screen.getByTestId("client-row-org-1");

    // Expand
    await user.click(row);
    expect(screen.getByTestId("client-details-org-1")).toBeInTheDocument();

    // Collapse
    await user.click(row);
    expect(screen.queryByTestId("client-details-org-1")).not.toBeInTheDocument();
  });

  it("sets aria-expanded on rows", async () => {
    const user = userEvent.setup();
    renderTable();

    const row = screen.getByTestId("client-row-org-1");
    expect(row).toHaveAttribute("aria-expanded", "false");

    await user.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
  });

  it("only one row can be expanded at a time", async () => {
    const user = userEvent.setup();
    renderTable();

    // Expand first row
    await user.click(screen.getByTestId("client-row-org-1"));
    expect(screen.getByTestId("client-details-org-1")).toBeInTheDocument();

    // Expand second row — first should collapse
    await user.click(screen.getByTestId("client-row-org-2"));
    expect(screen.queryByTestId("client-details-org-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("client-details-org-2")).toBeInTheDocument();
  });

  // ─── Pagination ────────────────────────────────────────────

  it("shows pagination when multiple pages exist", () => {
    renderTable({
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    });

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeEnabled();
  });

  it("does not show pagination for single page", () => {
    renderTable({
      pagination: { page: 1, limit: 20, total: 4, totalPages: 1 },
    });

    expect(screen.queryByLabelText("Previous page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();
  });

  it("calls API with incremented page on Next click", async () => {
    const user = userEvent.setup();
    renderTable({
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    });

    const nextBtn = screen.getByLabelText("Next page");
    await user.click(nextBtn);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url = new URL(lastCall[0] as string, "http://localhost");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("shows correct range text for pagination", () => {
    renderTable({
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    });

    // Check the range text within the pagination nav
    const paginationNav = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(paginationNav).getByText("50")).toBeInTheDocument();
    // "Showing 1–20 of 50" - check the range within context
    expect(paginationNav).toHaveTextContent("Showing");
    expect(paginationNav).toHaveTextContent("20");
    expect(paginationNav).toHaveTextContent("50");
  });

  // ─── ARIA / Accessibility ─────────────────────────────────

  it("has proper ARIA labels on the table", () => {
    renderTable();

    expect(screen.getByRole("table", { name: "Clients" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Clients table" })).toBeInTheDocument();
  });

  it("has accessible search and filter controls", () => {
    renderTable();

    expect(screen.getByLabelText("Search clients by name or email")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by tier")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
  });

  it("has accessible expand/collapse buttons with client name", () => {
    renderTable();

    expect(
      screen.getByLabelText("Expand details for Mzansi Digital"),
    ).toBeInTheDocument();
  });

  // ─── Avatar Fallback ──────────────────────────────────────

  it("shows initial letter avatar when no logoUrl", () => {
    renderTable();

    // Mzansi Digital should show "M"
    expect(screen.getByText("M")).toBeInTheDocument();
  });
});
