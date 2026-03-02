/**
 * Admin accounts table
 *
 * Interactive table displaying all social accounts across organizations.
 * Supports filtering by platform, connection status, text search, and pagination.
 *
 * Client component for interactive filtering and pagination.
 */

"use client";

import { useMemo, useState, useCallback } from "react";

// ─── Types ───

/** Row shape for the accounts table (no encrypted tokens) */
interface AccountRow {
  id: string;
  platform: string;
  platformUserId: string;
  displayName: string | null;
  isActive: boolean;
  connectedAt: string;
  tokenExpiresAt: string | null;
  orgName: string;
  orgSlug: string;
}

interface AccountsTableProps {
  /** Full list of social account rows */
  accounts: AccountRow[];
  /** Number of rows per page */
  pageSize?: number;
}

// ─── Platform display config ───

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "text-fuchsia-400" },
  facebook: { label: "Facebook", color: "text-blue-400" },
  twitter: { label: "Twitter / X", color: "text-sky-400" },
  linkedin: { label: "LinkedIn", color: "text-blue-300" },
  tiktok: { label: "TikTok", color: "text-pink-400" },
  whatsapp: { label: "WhatsApp", color: "text-emerald-400" },
  google_business: { label: "Google Business", color: "text-amber-400" },
};

const PLATFORMS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "whatsapp",
  "google_business",
] as const;

// ─── Helpers ───

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
      data-testid="status-badge"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-red-400"}`}
        aria-hidden="true"
      />
      {active ? "Connected" : "Disconnected"}
    </span>
  );
}

// ─── Component ───

function AccountsTable({ accounts, pageSize = 10 }: AccountsTableProps) {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handlePlatformChange = useCallback((value: string) => {
    setPlatformFilter(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  // Filter and search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return accounts.filter((account) => {
      // Platform filter
      if (platformFilter !== "all" && account.platform !== platformFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "connected" && !account.isActive) return false;
      if (statusFilter === "disconnected" && account.isActive) return false;

      // Text search — match account name, platform user ID, or org name
      if (q) {
        const name = (account.displayName ?? "").toLowerCase();
        const userId = account.platformUserId.toLowerCase();
        const org = account.orgName.toLowerCase();
        if (!name.includes(q) && !userId.includes(q) && !org.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, search, platformFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50"
      data-testid="accounts-table"
    >
      {/* ─── Filters bar ─── */}
      <div className="flex flex-col gap-3 border-b border-slate-700/50 p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" />
            <path strokeLinecap="round" d="M11 11l3 3" />
          </svg>
          <input
            type="search"
            placeholder="Search accounts or organisations…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
            aria-label="Search accounts"
          />
        </div>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => handlePlatformChange(e.target.value)}
          className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-purple-500/50"
          aria-label="Filter by platform"
        >
          <option value="all">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]?.label ?? p}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-purple-500/50"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
        </select>
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-4 py-3 font-medium">
                Platform
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Account
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Organisation
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Connected
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {accounts.length === 0
                    ? "No social accounts found."
                    : "No accounts match the current filters."}
                </td>
              </tr>
            ) : (
              pageRows.map((account) => {
                const platformInfo = PLATFORM_LABELS[account.platform];
                return (
                  <tr
                    key={account.id}
                    className="transition-colors hover:bg-slate-800/30"
                    data-testid="account-row"
                  >
                    {/* Platform */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`font-medium ${platformInfo?.color ?? "text-slate-300"}`}>
                        {platformInfo?.label ?? account.platform}
                      </span>
                    </td>

                    {/* Account name/handle */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">
                          {account.displayName ?? account.platformUserId}
                        </span>
                        {account.displayName && (
                          <span className="text-xs text-slate-500">
                            @{account.platformUserId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Organisation */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {account.orgName}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge active={account.isActive} />
                    </td>

                    {/* Connected date */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {formatDate(account.connectedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-700/50 px-4 py-3">
          <span className="text-xs text-slate-500">
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filtered.length)}{" "}
            of {filtered.length} accounts
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              ← Prev
            </button>

            <span className="px-2 text-xs tabular-nums text-slate-400">
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { AccountsTable };
export type { AccountRow, AccountsTableProps };
