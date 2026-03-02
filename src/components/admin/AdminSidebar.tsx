"use client";

import { useState, useCallback, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ─── Nav Item Config ─── */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/* ─── Icons (inline SVGs, 20×20 — matches project convention) ─── */

function LayoutDashboardIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="6" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="11" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="11" y="9" width="6" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="12" width="6" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="6" r="3" />
      <path strokeLinecap="round" d="M1 17c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="15" cy="6" r="2" />
      <path strokeLinecap="round" d="M15 11c2.5 0 4 1.5 4 4" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M6.5 12.5c.8 1 2 1.5 3.5 1.5s2.7-.5 3.5-1.5" />
      <circle cx="7.5" cy="8" r="1" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function PostsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M7 6h6M7 9h6M7 12h4" />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l3-3 2 2 4-4 5 5" />
      <path strokeLinecap="round" d="M14 5h3v3" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 5.5H8.25a2.25 2.25 0 0 0 0 4.5h3.5a2.25 2.25 0 0 1 0 4.5H6" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4" width="14" height="10" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M7 17h6M10 14v3" />
      <circle cx="10" cy="9" r="2" />
    </svg>
  );
}

/* ─── Navigation Structure ─── */

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/admin", icon: <LayoutDashboardIcon /> },
      { label: "Clients", href: "/admin/clients", icon: <ClientsIcon /> },
      { label: "Accounts", href: "/admin/accounts", icon: <AccountsIcon /> },
      { label: "Posts", href: "/admin/posts", icon: <PostsIcon /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Jobs", href: "/admin/jobs", icon: <JobsIcon /> },
      { label: "Revenue", href: "/admin/revenue", icon: <RevenueIcon /> },
      { label: "System", href: "/admin/system", icon: <SystemIcon /> },
    ],
  },
];

/* ─── Component ─── */

interface AdminSidebarProps {
  className?: string;
}

function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
   * Active route detection.
   * Exact match for /admin (overview) to prevent matching all sub-routes.
   * Other routes use prefix matching for nested pages.
   */
  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <>
      {/* Admin Logo / Branding */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-700/50 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
          <svg
            className="h-5 w-5 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-100">
            <span className="text-purple-400">PGS</span> Admin
          </span>
          <span className="text-[0.625rem] font-medium uppercase tracking-wider text-slate-500">
            Control Panel
          </span>
        </div>
      </div>

      {/* Navigation sections */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <span className="mb-2 block px-2 text-[0.6875rem] font-medium uppercase tracking-wider text-slate-500">
              {section.label}
            </span>
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-2 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
                        active
                          ? "bg-purple-500/15 text-purple-300"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Active indicator — left purple border */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-purple-400"
                        />
                      )}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — back to dashboard link */}
      <div className="border-t border-slate-700/50 px-3 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-[0.8125rem] font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-300"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10H5M5 10l4-4M5 10l4 4" />
          </svg>
          <span>Back to Dashboard</span>
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
        aria-label="Open admin sidebar"
        data-testid="admin-sidebar-mobile-toggle"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
          data-testid="admin-sidebar-overlay"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base layout — dark admin theme
          "fixed inset-y-0 left-0 z-[200] flex w-[260px] flex-col border-r border-slate-700/50 bg-slate-950",
          // Mobile: off-canvas by default, slide in when open
          "transition-transform duration-200 ease-smooth",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "md:translate-x-0",
          className,
        )}
        data-testid="admin-sidebar"
      >
        {/* Close button for mobile */}
        <button
          type="button"
          onClick={closeMobile}
          className={cn(
            "absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-200 md:hidden",
            !mobileOpen && "hidden",
          )}
          aria-label="Close admin sidebar"
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

export { AdminSidebar };
export type { AdminSidebarProps };
