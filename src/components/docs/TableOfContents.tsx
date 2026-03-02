import { cn } from "@/lib/utils";

/* ─── Types ─── */

export interface TocSection {
  /** Anchor id (without #) */
  id: string;
  /** Visible label */
  title: string;
}

export interface TableOfContentsProps {
  sections: TocSection[];
  className?: string;
}

/* ─── Component ─── */

/**
 * Table of Contents — renders a list of section anchors.
 *
 * Designed for the docs layout right sidebar. Uses sticky positioning
 * on desktop so it scrolls with the page but stays visible.
 *
 * Server component — no client-side interactivity needed for a static list.
 */
export function TableOfContents({ sections, className }: TableOfContentsProps) {
  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "sticky top-6 hidden xl:block",
        className,
      )}
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        On this page
      </h2>
      <ul className="space-y-1.5 border-l border-slate-700/50 pl-4" role="list">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "block text-[0.8125rem] leading-relaxed text-slate-400",
                "transition-colors duration-150",
                "hover:text-purple-400",
              )}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
