import { cn } from "@/lib/utils";

const maxWidthMap = {
  prose: "max-w-[640px]",
  standard: "max-w-[1100px]",
  wide: "max-w-[1400px]",
  full: "max-w-full",
} as const;

export interface ContainerProps {
  /** Max-width constraint for content measure */
  size?: keyof typeof maxWidthMap;
  className?: string;
  children: React.ReactNode;
  /** Semantic HTML element to render */
  as?: "div" | "section" | "main" | "article";
}

/**
 * Content container with max-width constraints.
 *
 * Matches the design system's container widths:
 * - prose (640px): Long-form text, optimal reading measure
 * - standard (1100px): Default app content — composers, settings, feeds
 * - wide (1400px): Dashboards, analytics, multi-column layouts
 * - full (100%): Edge-to-edge hero sections, full-bleed backgrounds
 */
export function Container({
  size = "standard",
  className,
  children,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-4 sm:px-6", maxWidthMap[size], className)}>
      {children}
    </Tag>
  );
}
