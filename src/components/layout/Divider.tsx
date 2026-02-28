import { cn } from "@/lib/utils";

export interface DividerProps {
  /** Direction of the divider line */
  orientation?: "horizontal" | "vertical";
  /** Optional centered label text (horizontal only) */
  label?: string;
  /** Use stronger border color for visual emphasis */
  strong?: boolean;
  className?: string;
}

/**
 * Divider matching the design system's hr-thin and vdiv patterns.
 *
 * - Horizontal (default): 1px line spanning full width, with optional centered label
 * - Vertical: 1px line that stretches to fill parent height (use inside flex rows)
 * - Strong variant uses border-strong for higher contrast separation
 */
export function Divider({
  orientation = "horizontal",
  label,
  strong = false,
  className,
}: DividerProps) {
  const color = strong ? "bg-border-strong" : "bg-border";

  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("w-px shrink-0 self-stretch", color, className)}
      />
    );
  }

  // Horizontal with label — lines on either side of centered text
  if (label) {
    return (
      <div
        role="separator"
        className={cn("flex items-center gap-3", className)}
      >
        <div className={cn("h-px flex-1", color)} />
        <span className="shrink-0 text-xs text-text-muted">{label}</span>
        <div className={cn("h-px flex-1", color)} />
      </div>
    );
  }

  // Horizontal without label — simple 1px line
  return (
    <div
      role="separator"
      className={cn("h-px w-full", color, className)}
    />
  );
}
