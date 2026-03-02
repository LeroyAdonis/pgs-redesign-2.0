"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ─── Nav Item Config ─── */

interface NavItem {
  /** Translation key under "nav" namespace */
  labelKey: string;
  /** Route path (relative to locale prefix) */
  href: string;
  /** Inline SVG icon */
  icon: React.ReactNode;
}

interface NavSection {
  /** Translation key for section label under "nav" namespace */
  labelKey: string;
  items: NavItem[];
}

/* ─── Icons (inline SVGs, 20×20) ─── */

function HomeIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5L10 3l7 5.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17V10h6v7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4" width="14" height="13" rx="1" />
      <path d="M3 8h14M7 4V2M13 4V2" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-6 3 4 4-8 3 5" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="15" cy="7" r="2" />
      <path d="M15 12c2 0 3.5 1.5 3.5 3.5" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="6" r="3" />
      <circle cx="14" cy="6" r="3" />
      <path d="M1 17c0-3 2-5 6-5s6 2 6 5M10 17c0-3 2-5 4-5s4 2 4 5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="5" width="16" height="11" rx="2" />
      <path d="M2 9h16" />
      <path d="M5 13h3" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2l.6 2.4a3.5 3.5 0 0 0 2.5 2.5L15.5 7.5l-2.4.6a3.5 3.5 0 0 0-2.5 2.5L10 13l-.6-2.4a3.5 3.5 0 0 0-2.5-2.5L4.5 7.5l2.4-.6a3.5 3.5 0 0 0 2.5-2.5L10 2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12l.3 1.2a2 2 0 0 0 1.5 1.5L19 15l-1.2.3a2 2 0 0 0-1.5 1.5L16 18l-.3-1.2a2 2 0 0 0-1.5-1.5L13 15l1.2-.3a2 2 0 0 0 1.5-1.5L16 12Z" />
    </svg>
  );
}

/* ─── Navigation Structure ─── */

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "sectionMain",
    items: [
      { labelKey: "overview", href: "/dashboard", icon: <HomeIcon /> },
      { labelKey: "generate", href: "/dashboard/generate", icon: <SparklesIcon /> },
      { labelKey: "posts", href: "/dashboard/posts", icon: <EditIcon /> },
      { labelKey: "calendar", href: "/dashboard/calendar", icon: <CalendarIcon /> },
    ],
  },
  {
    labelKey: "sectionInsights",
    items: [
      { labelKey: "analytics", href: "/dashboard/analytics", icon: <ChartIcon /> },
      { labelKey: "brand", href: "/dashboard/brand", icon: <PaletteIcon /> },
    ],
  },
  {
    labelKey: "sectionManage",
    items: [
      { labelKey: "accounts", href: "/dashboard/accounts", icon: <UsersIcon /> },
      { labelKey: "team", href: "/team", icon: <PeopleIcon /> },
      { labelKey: "settings", href: "/settings", icon: <GearIcon /> },
      { labelKey: "billing", href: "/dashboard/billing", icon: <CreditCardIcon /> },
    ],
  },
];

/* ─── Component ─── */

interface SidebarProps {
  className?: string;
}

function Sidebar({ className }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
   * Exact match for `/dashboard` (overview) to prevent it matching all
   * sub-routes. Other routes use prefix matching for nested pages.
   */
  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface">
          <svg
            className="h-5 w-5 text-brand"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-text">
          <span className="text-brand">Purple Glow</span> Social
        </span>
      </div>

      {/* Navigation sections */}
      <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey} className="mb-6">
            <span className="mb-2 block px-2 text-[0.6875rem] font-medium uppercase tracking-wider text-text-muted">
              {t(section.labelKey)}
            </span>
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.labelKey}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-2 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
                        active
                          ? "bg-brand-surface text-brand"
                          : "text-text-muted hover:bg-brand-surface hover:text-text",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Active indicator — left purple border */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-brand"
                        />
                      )}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[201] flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-muted shadow-sm transition-colors hover:text-text md:hidden"
        aria-label={t("openSidebar")}
        data-testid="sidebar-mobile-toggle"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[199] bg-surface-overlay md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base layout
          "fixed inset-y-0 left-0 z-[200] flex w-[260px] flex-col border-r border-border bg-surface",
          // Mobile: off-canvas by default, slide in when open
          "transition-transform duration-200 ease-smooth",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "md:translate-x-0",
          className,
        )}
        data-testid="sidebar"
      >
        {/* Close button for mobile */}
        <button
          type="button"
          onClick={closeMobile}
          className={cn(
            "absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text md:hidden",
            !mobileOpen && "hidden",
          )}
          aria-label={t("closeSidebar")}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}

export { Sidebar };
export type { SidebarProps };
