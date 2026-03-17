"use client";

/**
 * PostsManager — Main client component for the posts management dashboard.
 *
 * Manages:
 * - Post list fetching via `/api/posts`
 * - Filter state (platform, status, date range)
 * - Bulk selection and actions
 * - Modal states (schedule, bulk generator)
 * - Autonomous/manual mode toggle
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { logger } from "@/lib/logger";
import { PostCard } from "./PostCard";
import { PostFilters } from "./PostFilters";
import { BulkActions } from "./BulkActions";
import { BulkGenerator } from "./BulkGenerator";
import { AutonomousToggle } from "./AutonomousToggle";
import { ScheduleModal } from "./ScheduleModal";
import type {
  PostWithSchedule,
  PostFiltersState,
  SchedulingMode,
} from "./types";

/* ─── Constants ─── */

const POSTS_PER_PAGE = 12;

/* ─── Component ─── */

export function PostsManager() {
  // Data
  const [posts, setPosts] = useState<PostWithSchedule[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & pagination
  const [filters, setFilters] = useState<PostFiltersState>({
    platform: null,
    status: null,
    dateFrom: null,
    dateTo: null,
  });
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [scheduleModalState, setScheduleModalState] = useState<{
    isOpen: boolean;
    postIds: string[];
    existingDate?: string;
  }>({ isOpen: false, postIds: [] });

  // Mode
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>("manual");

  /* ─── Data fetching ─── */

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(POSTS_PER_PAGE));
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.status) params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      const data = (await response.json()) as {
        posts: PostWithSchedule[];
        totalPages: number;
      };
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (error) {
      logger.error("Failed to fetch posts", {
        error: error instanceof Error ? error.message : String(error),
      });
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  /* ─── Filter handling ─── */

  function handleFilterChange(newFilters: PostFiltersState) {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
    setSelectedIds([]); // Clear selection on filter change
  }

  /* ─── Selection ─── */

  function handleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((s) => s !== id),
    );
  }

  function handleSelectAll() {
    if (selectedIds.length === posts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map((p) => p.id));
    }
  }

  /* ─── Bulk actions ─── */

  async function handleBulkApprove(ids: string[]) {
    try {
      await fetch("/api/posts/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "approve" }),
      });
      setSelectedIds([]);
      void fetchPosts();
    } catch (error) {
      logger.error("Bulk approve failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function handleBulkReschedule(ids: string[]) {
    setScheduleModalState({ isOpen: true, postIds: ids });
  }

  async function handleBulkDelete(ids: string[]) {
    try {
      await fetch("/api/posts/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setSelectedIds([]);
      void fetchPosts();
    } catch (error) {
      logger.error("Bulk delete failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /* ─── Single-post actions ─── */

  function handleEdit(id: string) {
    logger.info("Edit post", { postId: id });
    // Future: navigate to edit page or open edit modal
  }

  function handleSchedulePost(id: string) {
    const post = posts.find((p) => p.id === id);
    const existingSchedule = post?.schedules.find(
      (s) => !s.publishedAt && !s.failedAt,
    );
    setScheduleModalState({
      isOpen: true,
      postIds: [id],
      existingDate: existingSchedule?.scheduledAt,
    });
  }

  async function handleDeletePost(id: string) {
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
      void fetchPosts();
    } catch (error) {
      logger.error("Delete post failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /* ─── Schedule modal ─── */

  async function handleScheduleSubmit(datetime: string, platforms: string[]) {
    try {
      await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds: scheduleModalState.postIds,
          scheduledAt: datetime,
          platforms,
        }),
      });
      setScheduleModalState({ isOpen: false, postIds: [] });
      setSelectedIds([]);
      void fetchPosts();
    } catch (error) {
      logger.error("Schedule failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /* ─── Pagination ─── */

  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Posts</h1>
          <p className="text-sm text-text-muted">
            Manage and schedule your social media posts
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowBulkGenerator(true)}
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          Generate Batch
        </Button>
      </div>

      {/* Autonomous toggle */}
      <AutonomousToggle
        currentMode={schedulingMode}
        onModeChange={setSchedulingMode}
        tier="grower"
      />

      {/* Filters */}
      <PostFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Select all */}
      {posts.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            aria-label="Select all posts"
            className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
          />
          <span className="text-xs text-text-muted">
            {allSelected ? "Deselect all" : "Select all"}
          </span>
        </div>
      )}

      {/* Posts list */}
      {isLoading ? (
        <div
          className="flex flex-col items-center justify-center py-16"
          data-testid="loading-state"
        >
          <div
            className={cn(
              "h-8 w-8 rounded-full border-2 border-transparent border-t-brand",
              "animate-spin",
            )}
            role="status"
            aria-label="Loading posts"
          />
          <p className="mt-3 text-sm text-text-muted">Loading posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-none border border-dashed border-border py-16"
          data-testid="empty-state"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
          <p className="mt-3 text-sm font-medium text-text-muted">
            No posts found
          </p>
          <p className="text-xs text-text-muted">
            Generate your first batch or adjust your filters
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isSelected={selectedIds.includes(post.id)}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onSchedule={handleSchedulePost}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Bulk actions bar */}
      <BulkActions
        selectedIds={selectedIds}
        onApprove={handleBulkApprove}
        onReschedule={handleBulkReschedule}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Bulk generator modal */}
      <BulkGenerator
        isOpen={showBulkGenerator}
        onClose={() => setShowBulkGenerator(false)}
        onComplete={(result) => {
          logger.info("Bulk generation complete", {
            postCount: result.posts.length,
          });
          void fetchPosts();
        }}
      />

      {/* Schedule modal */}
      <ScheduleModal
        isOpen={scheduleModalState.isOpen}
        onClose={() =>
          setScheduleModalState({ isOpen: false, postIds: [] })
        }
        onSchedule={handleScheduleSubmit}
        existingDate={scheduleModalState.existingDate}
      />
    </div>
  );
}
