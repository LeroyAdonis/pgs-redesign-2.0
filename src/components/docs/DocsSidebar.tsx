"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ─── Nav Item Config ─── */

interface NavItem {
  /** Translation key under "docs.sidebar" namespace */
  labelKey: string;
  /** Route path (relative to locale prefix) */
  href: string;
}

const DOCS_NAV_ITEMS: NavItem[] = [
  { labelKey: "gettingStarted", href: "/docs/getting-started" },
  { labelKey: "linkingAccounts", href: "/docs/linking-accounts" },
  { labelKey: "aiContent", href: "/docs/ai-content" },
  { labelKey: "scheduling", href: "/docs/scheduling" },
  { labelKey: "billingFaq", href: "/docs/billing-faq" },
  { labelKey: "apiReference", href: "/docs/api-reference" },
];

/* ─── Icons (inline SVGs, 20×20) ─── */

function BookIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 3h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" d="M7 3v14" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" d="M4 4l10 10M14 4L4 14" />
    </svg>
  );
}

/* ─── Component ─── */

interface DocsSidebarProps {
  className?: string;
}

function DocsSidebar({ className }: DocsSidebarProps) {
  const t = useTranslations("docs");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close sidebar on route change (set state during render — React recommended pattern)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  /**
   * Check if a nav item is active.
   * Exact match for `/docs` (landing). Other routes use prefix matching.
   */
  function isActive(href: string): boolean {
    if (href === "/docs") return pathname === "/docs";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-700/50 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
          <BookIcon />
        </div>
        <span className="text-sm font-semibold text-slate-200">
          {t("title")}
        </span>
      </div>

      {/* Navigation links */}
      <nav aria-label="Documentation navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5" role="list">
          {DOCS_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.labelKey}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] font-medium transition-colors duration-150",
                    active
                      ? "bg-purple-500/15 text-purple-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active indicator — left purple border */}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-purple-500"
                    />
                  )}
                  <span>{t(`sidebar.${item.labelKey}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer link back to main site */}
      <div className="border-t border-slate-700/50 px-5 py-3">
        <Link
          href="/"
          className="text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          ← {t("subtitle")}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[201] flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 shadow-sm transition-colors hover:text-slate-200 md:hidden"
        aria-label="Open docs navigation"
        data-testid="docs-sidebar-mobile-toggle"
      >
        <MenuIcon />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[199] bg-black/60 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
          data-testid="docs-sidebar-overlay"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base layout
          "fixed inset-y-0 left-0 z-[200] flex w-[260px] flex-col border-r border-slate-700/50 bg-slate-900",
          // Mobile: off-canvas by default, slide in when open
          "transition-transform duration-200 ease-smooth",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "md:translate-x-0",
          className,
        )}
        data-testid="docs-sidebar"
      >
        {/* Close button for mobile */}
        <button
          type="button"
          onClick={closeMobile}
          className={cn(
            "absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-200 md:hidden",
            !mobileOpen && "hidden",
          )}
          aria-label="Close docs navigation"
        >
          <CloseIcon />
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}

export { DocsSidebar };
export type { DocsSidebarProps };
