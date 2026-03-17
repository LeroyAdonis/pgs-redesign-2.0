/**
 * Admin Clients Table — interactive client management table
 *
 * Renders a searchable, filterable, sortable, paginated table of
 * organizations (clients) for the admin dashboard. Supports row
 * expansion to show additional details.
 *
 * Receives initial data from the server component page and handles
 * client-side filtering, sorting, and pagination via API calls.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────

/** Tier levels from the database enum */
type Tier = "seedling" | "hustler" | "grower" | "mogul";

/** Subscription status from the database enum */
type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

/** A client (organization) row returned from the API */
export interface ClientRow {
  id: string;
  name: string;
  slug: string;
  tier: Tier;
  logoUrl: string | null;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerImage: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
}

/** Pagination info from the API */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Summary stats from the API */
export interface ClientSummary {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
}

/** API response shape */
interface ClientsApiResponse {
  success: boolean;
  clients: ClientRow[];
  pagination: Pagination;
  summary: ClientSummary;
  error?: string;
}

/** Sort fields accepted by the API */
type SortField = "name" | "date" | "tier";
type SortOrder = "asc" | "desc";

/** Filter status for the UI: active means active/trialing, inactive means canceled/past_due/null */
type StatusFilter = "all" | "active" | "inactive";
type TierFilter = "all" | Tier;

// ─── Props ──────────────────────────────────────────────────────

interface ClientsTableProps {
  /** Initial client data from server-side fetch */
  initialClients: ClientRow[];
  /** Initial pagination info */
  initialPagination: Pagination;
  /** Summary stats for stat cards */
  initialSummary: ClientSummary;
}

// ─── Constants ──────────────────────────────────────────────────

const TIERS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "seedling", label: "Seedling" },
  { value: "hustler", label: "Hustler" },
  { value: "grower", label: "Grower" },
  { value: "mogul", label: "Mogul" },
];

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const TIER_COLORS: Record<Tier, string> = {
  seedling: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  hustler: "bg-blue-500/15 text-blue-400 ring-blue-500/20",
  grower: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
  mogul: "bg-purple-500/15 text-purple-400 ring-purple-500/20",
};

const PAGE_SIZE = 20;

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusDisplay(status: SubscriptionStatus | null): {
  label: string;
  className: string;
} {
  if (status === "active" || status === "trialing") {
    return {
      label: status === "trialing" ? "Trialing" : "Active",
      className: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
    };
  }
  return {
    label: status === "past_due" ? "Past Due" : status === "canceled" ? "Canceled" : "Inactive",
    className: "bg-red-500/15 text-red-400 ring-red-500/20",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Component ──────────────────────────────────────────────────

function ClientsTable({
  initialClients,
  initialPagination,
  initialSummary,
}: ClientsTableProps) {
  // State
  const [clients, setClients] = useState<ClientRow[]>(initialClients);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [summary] = useState<ClientSummary>(initialSummary);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded rows
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data when filters change
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tierFilter !== "all") params.set("tier", tierFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(PAGE_SIZE));
      params.set("sort", sortField);
      params.set("order", sortOrder);

      const res = await fetch(`/api/admin/clients?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch clients");

      const data: ClientsApiResponse = await res.json();
      if (data.success) {
        setClients(data.clients);
        setPagination(data.pagination);
      }
    } catch {
      // Keep existing data on error — don't blank out the table
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, tierFilter, statusFilter, currentPage, sortField, sortOrder]);

  // Re-fetch when filters/page change (skip initial render — we have server data)
  const hasRendered = useRef(false);
  useEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true;
      return;
    }
    fetchClients();
  }, [fetchClients]);

  // Sort handler
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  }

  // Row expansion toggle
  function toggleRow(id: string) {
    setExpandedRowId((prev) => (prev === id ? null : id));
  }

  // Sort indicator
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return (
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="ml-1 inline-block text-slate-600"
          aria-hidden="true"
        >
          <path strokeLinecap="round" d="M4 5l3-3 3 3M4 9l3 3 3-3" />
        </svg>
      );
    }
    return (
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="ml-1 inline-block text-purple-400"
        aria-hidden="true"
      >
        {sortOrder === "asc" ? (
          <path strokeLinecap="round" d="M4 9l3-3 3 3" />
        ) : (
          <path strokeLinecap="round" d="M4 5l3 3 3-3" />
        )}
      </svg>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Summary stat cards ─── */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        data-testid="client-summary-stats"
      >
        <SummaryCard
          label="Total Clients"
          value={summary.totalClients.toLocaleString("en-ZA")}
        />
        <SummaryCard
          label="Active Clients"
          value={summary.activeClients.toLocaleString("en-ZA")}
        />
        <SummaryCard
          label="New This Month"
          value={summary.newThisMonth.toLocaleString("en-ZA")}
        />
      </div>

      {/* ─── Toolbar: Search + Filters ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <label htmlFor="client-search" className="sr-only">
            Search clients
          </label>
          <input
            id="client-search"
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Search clients by name or email"
          />
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" />
            <path strokeLinecap="round" d="M11 11l3.5 3.5" />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <label htmlFor="tier-filter" className="sr-only">
            Filter by tier
          </label>
          <select
            id="tier-filter"
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value as TierFilter);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Filter by tier"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div
        className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50"
        role="region"
        aria-label="Clients table"
      >
        <table className="w-full text-left text-sm" aria-label="Clients">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-3 font-medium text-slate-400 transition-colors hover:text-slate-200"
                onClick={() => handleSort("name")}
                aria-sort={
                  sortField === "name"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                Name
                <SortIcon field="name" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                Owner
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-3 font-medium text-slate-400 transition-colors hover:text-slate-200"
                onClick={() => handleSort("tier")}
                aria-sort={
                  sortField === "tier"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                Tier
                <SortIcon field="tier" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                Status
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-3 font-medium text-slate-400 transition-colors hover:text-slate-200"
                onClick={() => handleSort("date")}
                aria-sort={
                  sortField === "date"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                Created
                <SortIcon field="date" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {isLoading
                    ? "Loading clients…"
                    : "No clients found matching your filters."}
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const status = getStatusDisplay(client.subscriptionStatus);
                const isExpanded = expandedRowId === client.id;

                return (
                  <ClientRowItem
                    key={client.id}
                    client={client}
                    status={status}
                    isExpanded={isExpanded}
                    onToggle={() => toggleRow(client.id)}
                  />
                );
              })
            )}
          </tbody>
        </table>

        {/* Loading overlay */}
        {isLoading && clients.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {pagination.totalPages > 1 && (
        <div
          className="flex items-center justify-between"
          aria-label="Pagination"
          role="navigation"
        >
          <p className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-medium text-slate-200">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>
            –
            <span className="font-medium text-slate-200">
              {Math.min(currentPage * PAGE_SIZE, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-200">
              {pagination.total}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={currentPage >= pagination.totalPages}
              className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
      <p className="text-[0.8125rem] font-medium text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-100">
        {value}
      </p>
    </div>
  );
}

function ClientRowItem({
  client,
  status,
  isExpanded,
  onToggle,
}: {
  client: ClientRow;
  status: { label: string; className: string };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-700/30 transition-colors hover:bg-slate-800/50"
        onClick={onToggle}
        data-testid={`client-row-${client.id}`}
        aria-expanded={isExpanded}
      >
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex items-center gap-3">
            {client.logoUrl ? (
              <img
                src={client.logoUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-400">
                {client.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-200">{client.name}</p>
              <p className="text-xs text-slate-500">/{client.slug}</p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <p className="text-slate-300">{client.ownerName}</p>
          <p className="text-xs text-slate-500">{client.ownerEmail}</p>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TIER_COLORS[client.tier]}`}
          >
            {capitalize(client.tier)}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
          >
            {status.label}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-400">
          {formatDate(client.createdAt)}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
            aria-label={`${isExpanded ? "Collapse" : "Expand"} details for ${client.name}`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
            </svg>
          </button>
        </td>
      </tr>

      {/* Expanded details row */}
      {isExpanded && (
        <tr
          className="border-b border-slate-700/30 bg-slate-800/20"
          data-testid={`client-details-${client.id}`}
        >
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DetailItem label="Organization ID" value={client.id} />
              <DetailItem label="Slug" value={`/${client.slug}`} />
              <DetailItem
                label="Subscription Period End"
                value={
                  client.currentPeriodEnd
                    ? formatDate(client.currentPeriodEnd)
                    : "N/A"
                }
              />
              <DetailItem label="Owner Email" value={client.ownerEmail} />
              <DetailItem
                label="Subscription Status"
                value={capitalize(client.subscriptionStatus ?? "none")}
              />
              <DetailItem
                label="Signup Date"
                value={formatDate(client.createdAt)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-300">{value}</p>
    </div>
  );
}

export { ClientsTable };
export type { ClientsTableProps, ClientRow as ClientRowData, Tier, SubscriptionStatus };
