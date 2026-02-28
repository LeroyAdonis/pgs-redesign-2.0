/**
 * Language Selector — dropdown to switch between SA languages
 *
 * Client component that allows users to switch between all 11
 * South African official languages. Uses next-intl's navigation
 * helpers to maintain the current path while changing the locale prefix.
 *
 * @example
 * ```tsx
 * <LanguageSelector />
 * ```
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { languages } from "@/i18n/config";
import { useTransition, useState, useRef, useEffect } from "react";
import type { SALocale } from "@/lib/constants";

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === locale);

  function handleLocaleChange(newLocale: string) {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale as SALocale });
    });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-surface-raised/80 disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("selectLanguage")}
      >
        <GlobeIcon />
        <span>{currentLanguage?.nativeName ?? locale.toUpperCase()}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 max-h-80 w-56 overflow-y-auto rounded-lg border border-border bg-surface-raised shadow-lg"
          role="listbox"
          aria-label={t("selectLanguage")}
        >
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={lang.code === locale}
                onClick={() => handleLocaleChange(lang.code)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand-surface ${
                  lang.code === locale
                    ? "bg-brand-surface font-medium text-brand"
                    : "text-text"
                }`}
              >
                <span className="flex-1">
                  <span className="block">{lang.nativeName}</span>
                  <span className="block text-xs text-text-muted">
                    {lang.name}
                  </span>
                </span>
                {lang.code === locale && <CheckIcon />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Globe icon for the language selector button */
function GlobeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.733-3.559"
      />
    </svg>
  );
}

/** Chevron icon that rotates when dropdown is open */
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
  );
}

/** Check icon shown next to the currently selected language */
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-brand"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}
