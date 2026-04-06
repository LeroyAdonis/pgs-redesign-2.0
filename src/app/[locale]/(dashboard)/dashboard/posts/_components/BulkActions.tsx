"use client";

/**
 * BulkActions — Fixed bottom toolbar shown when 1+ posts are selected.
 *
 * Provides approve, reschedule, and delete actions for selected posts.
 * Delete action requires explicit confirmation.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = selectedIds.length;

  if (count === 0) return null;

  const noun = count === 1 ? t("posts.bulkPostSingular") : t("posts.bulkPostPlural");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-border bg-surface-raised/95 backdrop-blur-sm",
        "px-4 py-3",
        "animate-in slide-in-from-bottom-4 duration-200",
      )}
      role="toolbar"
      aria-label={t("posts.bulkActionsLabel")}
      data-testid="bulk-actions"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text">
            {t("posts.bulkPostsSelected", { count, noun })}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            {t("posts.bulkClear")}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onApprove(selectedIds)}
          >
            {t("posts.bulkApproveAll")}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onReschedule(selectedIds)}
          >
            {t("posts.bulkReschedule")}
          </Button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-error">{t("posts.bulkConfirm")}</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onDelete(selectedIds);
                  setConfirmDelete(false);
                }}
              >
                {t("posts.bulkYesDelete")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                {t("posts.bulkCancel")}
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
