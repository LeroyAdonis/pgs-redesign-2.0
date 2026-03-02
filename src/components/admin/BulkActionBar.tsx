/**
 * BulkActionBar — Sticky bottom bar for bulk post actions
 *
 * Shows when posts are selected. Displays selection count and
 * action buttons (Approve, Reject, Delete). Delete triggers a
 * confirmation dialog before executing.
 */

"use client";

import { useState, useCallback } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  isProcessing: boolean;
}

export function BulkActionBar({
  selectedCount,
  onApprove,
  onReject,
  onDelete,
  isProcessing,
}: BulkActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    onDelete();
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Sticky bottom bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm md:left-[260px]"
        role="toolbar"
        aria-label="Bulk actions"
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-purple-400">{selectedCount}</span>
            {" "}post{selectedCount !== 1 ? "s" : ""} selected
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onApprove}
              disabled={isProcessing}
              className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={isProcessing}
              className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-sm font-medium text-yellow-300 transition-colors hover:bg-yellow-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isProcessing}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-xl border border-red-500/20 bg-slate-900 p-6 shadow-2xl">
            {/* Warning icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-red-400"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h3
              id="delete-confirm-title"
              className="text-center text-lg font-semibold text-slate-100"
            >
              Delete {selectedCount} post{selectedCount !== 1 ? "s" : ""}?
            </h3>
            <p className="mt-2 text-center text-sm text-slate-400">
              This action cannot be undone. The selected posts and their
              associated media will be permanently removed.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
