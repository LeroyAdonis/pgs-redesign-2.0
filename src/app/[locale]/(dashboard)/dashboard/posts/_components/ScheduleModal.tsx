"use client";

/**
 * ScheduleModal — Modal for scheduling or rescheduling posts.
 *
 * Provides a datetime picker, platform selector, and an
 * "optimal time" suggestion button. Used both for single
 * post scheduling and bulk reschedule.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { logger } from "@/lib/logger";
import { ALL_PLATFORM_IDS, PLATFORM_CONFIG } from "./platform-config";
import type { PlatformId } from "./types";

/* ─── Props ─── */

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (datetime: string, platforms: string[]) => void;
  existingDate?: string;
  platforms?: string[];
}

/* ─── Component ─── */

export function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  existingDate,
  platforms: initialPlatforms,
}: ScheduleModalProps) {
  const [datetime, setDatetime] = useState(existingDate ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialPlatforms ?? [],
  );
  const [loadingOptimal, setLoadingOptimal] = useState(false);

  if (!isOpen) return null;

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleOptimalTime() {
    setLoadingOptimal(true);
    try {
      const platform = selectedPlatforms[0] ?? "instagram";
      const response = await fetch(
        `/api/schedule/optimal-times?platform=${platform}`,
      );
      if (response.ok) {
        const data = (await response.json()) as { optimalTime?: string };
        if (data.optimalTime) {
          setDatetime(data.optimalTime);
        }
      }
    } catch (error) {
      logger.error("Failed to fetch optimal time", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingOptimal(false);
    }
  }

  function handleSubmit() {
    if (!datetime) return;
    onSchedule(datetime, selectedPlatforms);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Schedule post"
      data-testid="schedule-modal"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-none",
          "border border-border bg-surface-raised p-6",
          "shadow-xl",
        )}
      >
        <h2 className="text-lg font-semibold text-text">
          {existingDate ? "Reschedule Post" : "Schedule Post"}
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          {/* Date/time picker */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="schedule-datetime"
              className="text-xs font-medium text-text-muted"
            >
              Date & Time
            </label>
            <input
              id="schedule-datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className={cn(
                "rounded-none border border-border bg-surface px-3 py-2",
                "text-sm text-text",
                "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
              )}
            />
          </div>

          {/* Optimal time */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOptimalTime}
            isLoading={loadingOptimal}
          >
            ✨ Use optimal time
          </Button>

          {/* Platform selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">
              Platforms
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORM_IDS.map((id) => {
                const config = PLATFORM_CONFIG[id as PlatformId];
                const isSelected = selectedPlatforms.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePlatform(id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                      "border transition-colors",
                      isSelected
                        ? "border-brand bg-brand-surface text-brand"
                        : "border-border bg-surface text-text-muted hover:border-brand/50",
                    )}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!datetime}
          >
            {existingDate ? "Reschedule" : "Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
