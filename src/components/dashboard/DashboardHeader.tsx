"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { LanguageSelector } from "@/components/ui/language-selector";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/* ─── Types ─── */

interface DashboardHeaderProps {
  /** User display name */
  userName: string;
  /** User email */
  userEmail: string;
  /** User avatar URL */
  userImage?: string;
  /** Credit balance to display */
  credits?: number;
  className?: string;
}

/* ─── Component ─── */

function DashboardHeader({
  userName,
  userEmail,
  userImage,
  credits = 0,
  className,
}: DashboardHeaderProps) {
  const t = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  /** Get initials from user name for avatar fallback */
  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6",
        className,
      )}
      data-testid="dashboard-header"
    >
      {/* Left side: spacer for mobile hamburger + page area */}
      <div className="flex items-center gap-3">
        {/* Spacer for mobile hamburger button (40px + 16px left) */}
        <div className="h-10 w-10 md:hidden" aria-hidden="true" />
      </div>

      {/* Right side: credits, notifications, language, user */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Credit balance */}
        <div
          className="hidden items-center gap-1.5 sm:flex"
          data-testid="credit-display"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-brand"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v6M6 8h4" />
          </svg>
          <span className="text-sm font-medium text-text">
            {t("creditsCount", { count: credits })}
          </span>
        </div>

        {/* Notification bell */}
        <NotificationBell />

        {/* Language selector */}
        <div className="hidden sm:block">
          <LanguageSelector />
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-none p-1.5 transition-colors hover:bg-brand-surface"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label={t("userMenu")}
            data-testid="user-menu-trigger"
          >
            <Avatar
              src={userImage}
              alt={userName}
              fallback={getInitials(userName)}
              size="sm"
            />
            <span className="hidden text-sm font-medium text-text md:block">
              {userName}
            </span>
            <svg
              className={cn(
                "hidden h-4 w-4 text-text-muted transition-transform md:block",
                userMenuOpen && "rotate-180",
              )}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-56 rounded-none border border-border bg-surface-raised py-1 shadow-lg"
              role="menu"
              data-testid="user-menu-dropdown"
            >
              {/* User info */}
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text">{userName}</p>
                <p className="text-xs text-text-muted">{userEmail}</p>
              </div>

              {/* Menu items */}
              <Link
                href="/profile"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text transition-colors hover:bg-brand-surface"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="5" r="3" />
                  <path d="M2 15c0-3 2.5-5 6-5s6 2 6 5" />
                </svg>
                {t("profile")}
              </Link>

              <Link
                href="/settings"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text transition-colors hover:bg-brand-surface"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="2.5" />
                  <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M4 4l1 1M11 11l1 1M4 12l1-1M11 5l1-1" />
                </svg>
                {tNav("settings")}
              </Link>

              <div className="my-1 border-t border-border" role="separator" />

              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error transition-colors hover:bg-error-surface"
                role="menuitem"
                data-testid="sign-out-button"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10 11l3-3-3-3M6 8h7"
                  />
                </svg>
                {tAuth("signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { DashboardHeader };
export type { DashboardHeaderProps };
