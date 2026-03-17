import { cn } from "@/lib/utils";

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
} as const;

export interface CardProps {
  /** Enable hover lift + glow effect for clickable cards */
  interactive?: boolean;
  /** Internal padding */
  padding?: keyof typeof paddingMap;
  className?: string;
  children: React.ReactNode;
  /** Semantic HTML element to render */
  as?: "div" | "article" | "section";
}

/**
 * Surface card matching the design system's elevated card pattern.
 *
 * Uses bg-surface-raised with a subtle border. When `interactive` is true,
 * the card lifts on hover with a purple glow shadow — matching the
 * kpi-card and bento-card hover treatment from the HTML design system.
 */
export function Card({
  interactive = false,
  padding = "md",
  className,
  children,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "overflow-hidden rounded-none border border-border bg-surface-raised",
        paddingMap[padding],
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-200 ease-smooth hover:-translate-y-1 hover:border-[rgba(139,92,246,0.2)] hover:shadow-glow",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
