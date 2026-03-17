/**
 * PostModerationTable — Interactive table for admin post moderation
 *
 * Client component that provides:
 * - Status and platform filtering
 * - Content text search
 * - Select-all / individual selection checkboxes
 * - Expandable rows to view full post content
 * - Bulk actions via BulkActionBar (approve/reject/delete)
 * - Client-side data fetching with filters via /api/admin/posts
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { BulkActionBar } from "./BulkActionBar";

/** Post row shape (serialized dates from server) */
export interface PostRow {
  id: string;
  content: string;
  contentLanguage: string;
  platform: string;
  status: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail: string;
  orgName: string;
  orgId: string;
  scheduledAt: string | null;
}

interface PostModerationTableProps {
  initialPosts: PostRow[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
] as const;

const PLATFORM_OPTIONS = [
  { value: "all", label: "All Platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "google_business", label: "Google Business" },
] as const;

const STATUS_BADGE_STYLES: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  publishing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  published: "bg-green-500/20 text-green-300 border-green-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
};

function StatusBadge({ status }: { status: string }) {
  const styles = STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.draft;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const label = platform === "google_business" ? "Google" : platform;
  return (
    <span className="inline-flex rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium capitalize text-slate-300">
      {label}
    </span>
  );
}

/** Truncate content to a maximum length */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/** Format ISO date to readable string */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostModerationTable({ initialPosts }: PostModerationTableProps) {
  // Data state
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Expanded row state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtered posts (client-side for responsiveness)
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !p.content.toLowerCase().includes(q) &&
          !p.authorName.toLowerCase().includes(q) &&
          !p.orgName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [posts, statusFilter, platformFilter, searchQuery]);

  // Selection helpers
  const allSelected = filteredPosts.length > 0 && filteredPosts.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (filteredPosts.every((p) => next.has(p.id))) {
        // Deselect all filtered
        for (const p of filteredPosts) next.delete(p.id);
      } else {
        // Select all filtered
        for (const p of filteredPosts) next.add(p.id);
      }
      return next;
    });
  }, [filteredPosts]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Fetch posts from API with current filters
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/posts?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch posts");

      const json = (await response.json()) as {
        success: boolean;
        data: { posts: PostRow[] };
      };
      if (json.success) {
        setPosts(json.data.posts);
      }
    } catch {
      // Silently fail — keep existing data
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, platformFilter, searchQuery]);

  // Bulk action handler
  const executeBulkAction = useCallback(
    async (action: "approve" | "reject" | "delete") => {
      if (selectedIds.size === 0) return;
      setIsProcessing(true);

      try {
        const response = await fetch("/api/admin/posts/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            postIds: Array.from(selectedIds),
          }),
        });

        if (!response.ok) throw new Error("Bulk action failed");

        const json = (await response.json()) as { success: boolean };
        if (json.success) {
          // Optimistically update the local state
          if (action === "delete") {
            setPosts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
          } else {
            const newStatus = action === "approve" ? "published" : "draft";
            setPosts((prev) =>
              prev.map((p) =>
                selectedIds.has(p.id) ? { ...p, status: newStatus } : p,
              ),
            );
          }
          setSelectedIds(new Set());
        }
      } catch {
        // Refresh from server on error
        await fetchPosts();
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, fetchPosts],
  );

  return (
    <>
      {/* Filters */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="5" />
              <path strokeLinecap="round" d="M11 11l3.5 3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search posts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              aria-label="Search posts"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Platform filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            aria-label="Filter by platform"
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchPosts}
            disabled={isLoading}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh posts"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={isLoading ? "animate-spin" : ""}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v4h-4M2 14v-4h4" />
              <path
                strokeLinecap="round"
                d="M13.5 6A6 6 0 0 0 3.2 3.8M2.5 10a6 6 0 0 0 10.3 2.2"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                  aria-label="Select all posts"
                />
              </th>
              <th className="px-4 py-3 font-medium text-slate-400">Content</th>
              <th className="px-4 py-3 font-medium text-slate-400">Author / Org</th>
              <th className="px-4 py-3 font-medium text-slate-400">Platform</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Scheduled</th>
              <th className="px-4 py-3 font-medium text-slate-400">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  {isLoading ? "Loading posts…" : "No posts found matching your filters."}
                </td>
              </tr>
            ) : (
              filteredPosts.map((postRow) => (
                <PostTableRow
                  key={postRow.id}
                  post={postRow}
                  isSelected={selectedIds.has(postRow.id)}
                  isExpanded={expandedId === postRow.id}
                  onToggleSelect={() => toggleSelect(postRow.id)}
                  onToggleExpand={() => toggleExpand(postRow.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar — adds bottom padding when visible */}
      {selectedIds.size > 0 && <div className="h-16" />}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onApprove={() => executeBulkAction("approve")}
        onReject={() => executeBulkAction("reject")}
        onDelete={() => executeBulkAction("delete")}
        isProcessing={isProcessing}
      />
    </>
  );
}

/* ─── Individual Row Component ─── */

interface PostTableRowProps {
  post: PostRow;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}

function PostTableRow({
  post: p,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
}: PostTableRowProps) {
  return (
    <>
      <tr
        className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
          isSelected ? "bg-purple-500/5" : ""
        }`}
      >
        {/* Checkbox */}
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
            aria-label={`Select post by ${p.authorName}`}
          />
        </td>

        {/* Content preview */}
        <td className="max-w-xs px-4 py-3">
          <button
            type="button"
            onClick={onToggleExpand}
            className="group text-left"
            aria-expanded={isExpanded}
            aria-label="Toggle full content"
          >
            <p className="text-sm text-slate-200 group-hover:text-purple-300">
              {truncate(p.content, 80)}
            </p>
            {p.aiGenerated && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-purple-400/70">
                <svg width="12" height="12" fill="currentColor" aria-hidden="true">
                  <path d="M6 1l1.5 3.5L11 6l-3.5 1.5L6 11 4.5 7.5 1 6l3.5-1.5z" />
                </svg>
                AI generated
              </span>
            )}
          </button>
        </td>

        {/* Author / Org */}
        <td className="px-4 py-3">
          <p className="text-sm text-slate-200">{p.authorName}</p>
          <p className="text-xs text-slate-500">{p.orgName}</p>
        </td>

        {/* Platform */}
        <td className="px-4 py-3">
          <PlatformBadge platform={p.platform} />
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={p.status} />
        </td>

        {/* Scheduled date */}
        <td className="px-4 py-3 text-sm text-slate-400">
          {p.scheduledAt ? formatDate(p.scheduledAt) : "—"}
        </td>

        {/* Created date */}
        <td className="px-4 py-3 text-sm text-slate-400">
          {formatDate(p.createdAt)}
        </td>
      </tr>

      {/* Expanded content row */}
      {isExpanded && (
        <tr className="border-b border-slate-800/50 bg-slate-800/20">
          <td colSpan={7} className="px-8 py-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Full Content
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {p.content}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                <span>Language: {p.contentLanguage}</span>
                <span>Post ID: {p.id}</span>
                <span>Updated: {formatDate(p.updatedAt)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
