"use client";

import { createContext, useContext, useCallback, useState } from "react";

/* ─── Types ─── */

interface DragDropState {
  /** The schedule ID currently being dragged */
  draggingId: string | null;
  /** Start a drag */
  onDragStart: (scheduleId: string) => void;
  /** End / cancel a drag */
  onDragEnd: () => void;
  /** Handle a drop on a target date/time */
  onDrop: (targetDate: string) => void;
}

interface DragDropProviderProps {
  children: React.ReactNode;
  /** Called when a schedule is dropped on a new date/time */
  onReschedule: (scheduleId: string, newDate: string) => void;
}

/* ─── Context ─── */

const DragDropCtx = createContext<DragDropState | null>(null);

function useDragDrop(): DragDropState {
  const ctx = useContext(DragDropCtx);
  if (!ctx) {
    throw new Error("useDragDrop must be used within a DragDropProvider");
  }
  return ctx;
}

/* ─── Provider ─── */

function DragDropProvider({ children, onReschedule }: DragDropProviderProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onDragStart = useCallback((scheduleId: string) => {
    setDraggingId(scheduleId);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const onDrop = useCallback(
    (targetDate: string) => {
      if (draggingId) {
        onReschedule(draggingId, targetDate);
      }
      setDraggingId(null);
    },
    [draggingId, onReschedule],
  );

  return (
    <DragDropCtx.Provider value={{ draggingId, onDragStart, onDragEnd, onDrop }}>
      {children}
    </DragDropCtx.Provider>
  );
}

export { DragDropProvider, useDragDrop };
export type { DragDropProviderProps, DragDropState };
