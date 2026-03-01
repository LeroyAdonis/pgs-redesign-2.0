"use client";

/**
 * PostCard — Individual post display card with selection, status, and actions.
 *
 * Shows a post's content preview, platform badge, status badge,
 * schedule information, and action buttons. Supports bulk selection
 * via checkbox.
 */

import { cn } from "@/lib/utils";
import { formatDateSAST } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PLATFORM_CONFIG } from "./platform-config";
import type { PostWithSchedule, PostStatus, PlatformId } from "./types";

/* ─── Status → Badge variant mapping ─── */

const STATUS_VARIANT: Record<PostStatus, "default" | "success" | "info" | "warning" | "error"> = {
  draft: "default",
  scheduled: "info",
  publishing: "warning",
  published: "success",
  failed: "error",
};

const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
};

/* ─── Props ─── */

interface PostCardProps {
  post: PostWithSchedule;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (id: string) => void;
  onSchedule: (id: string) => void;
  onDelete: (id: string) => void;
}

/* ─── Component ─── */

export function PostCard({
  post,
  isSelected,
  onSelect,
  onEdit,
  onSchedule,
  onDelete,
}: PostCardProps) {
  const platform = PLATFORM_CONFIG[post.platform as PlatformId];
  const status = post.status as PostStatus;
  const statusVariant = STATUS_VARIANT[status] ?? "default";
  const statusLabel = STATUS_LABEL[status] ?? post.status;

  // Content preview: first 140 chars
  const preview =
    post.content.length > 140
      ? `${post.content.slice(0, 140)}…`
      : post.content;

  // Next scheduled time
  const nextSchedule = post.schedules.find(
    (s) => !s.publishedAt && !s.failedAt,
  );

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg border p-4",
        "transition-all duration-150",
        isSelected
          ? "border-brand bg-brand-surface/50"
          : "border-border bg-surface hover:border-brand/30 hover:bg-surface-raised",
      )}
      data-testid={`post-card-${post.id}`}
    >
      {/* Selection checkbox */}
      <div className="flex shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(post.id, e.target.checked)}
          aria-label={`Select post ${post.id}`}
          className={cn(
            "h-4 w-4 rounded border-border text-brand",
            "focus:ring-brand focus:ring-offset-0",
            "cursor-pointer",
          )}
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Top row: platform + status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {platform && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: platform.color }}
            >
              {platform.icon}
              {platform.label}
            </span>
          )}

          <Badge variant={statusVariant} size="sm" dot>
            {statusLabel}
          </Badge>

          {post.aiGenerated && (
            <Badge variant="brand" size="sm">
              AI
            </Badge>
          )}
        </div>

        {/* Content preview */}
        <p className="text-sm text-text leading-relaxed">{preview}</p>

        {/* Meta row: dates */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>
            Created{" "}
            {formatDateSAST(new Date(post.createdAt), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>

          {nextSchedule && (
            <span className="text-info">
              Scheduled{" "}
              {formatDateSAST(new Date(nextSchedule.scheduledAt), {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "flex shrink-0 items-start gap-1",
          "opacity-0 transition-opacity group-hover:opacity-100",
          "focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          onClick={() => onEdit(post.id)}
          aria-label="Edit post"
          className={cn(
            "rounded-md p-1.5 text-text-muted",
            "hover:bg-brand-surface hover:text-brand",
            "transition-colors",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onSchedule(post.id)}
          aria-label="Schedule post"
          className={cn(
            "rounded-md p-1.5 text-text-muted",
            "hover:bg-info-surface hover:text-info",
            "transition-colors",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onDelete(post.id)}
          aria-label="Delete post"
          className={cn(
            "rounded-md p-1.5 text-text-muted",
            "hover:bg-error-surface hover:text-error",
            "transition-colors",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
