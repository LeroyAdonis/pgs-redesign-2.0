"use client";

/**
 * BulkActions — Fixed bottom toolbar shown when 1+ posts are selected.
 *
 * Provides approve, reschedule, and delete actions for selected posts.
 * Delete action requires explicit confirmation.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/* ─── Props ─── */

interface BulkActionsProps {
  selectedIds: string[];
  onApprove: (ids: string[]) => void;
  onReschedule: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onClearSelection: () => void;
}

/* ─── Component ─── */

export function BulkActions({
  selectedIds,
  onApprove,
  onReschedule,
  onDelete,
  onClearSelection,
}: BulkActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = selectedIds.length;

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-border bg-surface-raised/95 backdrop-blur-sm",
        "px-4 py-3",
        "animate-in slide-in-from-bottom-4 duration-200",
      )}
      role="toolbar"
      aria-label="Bulk actions"
      data-testid="bulk-actions"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text">
            {count} {count === 1 ? "post" : "posts"} selected
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onApprove(selectedIds)}
          >
            Approve All
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onReschedule(selectedIds)}
          >
            Reschedule
          </Button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-error">Confirm?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onDelete(selectedIds);
                  setConfirmDelete(false);
                }}
              >
                Yes, Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
