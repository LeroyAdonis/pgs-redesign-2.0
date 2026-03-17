import { cn } from "@/lib/utils";

const gapMap = {
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
  "10": "gap-10",
  "12": "gap-12",
} as const;

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

export interface StackProps {
  /** Layout direction */
  direction?: "vertical" | "horizontal";
  /** Spacing between children using Tailwind gap scale */
  gap?: keyof typeof gapMap;
  /** Cross-axis alignment */
  align?: keyof typeof alignMap;
  /** Main-axis distribution */
  justify?: keyof typeof justifyMap;
  /** Allow children to wrap to next line */
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
  /** Semantic HTML element to render */
  as?: "div" | "section" | "nav" | "ul";
}

/**
 * Flexible stack layout for vertical or horizontal arrangements.
 *
 * Wraps flexbox with semantic props for direction, gap, alignment,
 * and justification. Renders as a server component with no JS overhead.
 */
export function Stack({
  direction = "vertical",
  gap = "4",
  align,
  justify,
  wrap = false,
  className,
  children,
  as: Tag = "div",
}: StackProps) {
  return (
    <Tag
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
