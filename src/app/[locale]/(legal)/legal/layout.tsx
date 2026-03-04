/**
 * Legal route group layout
 *
 * Public layout for all legal pages (e.g. /legal, /legal/privacy, /legal/terms).
 * Simple centered prose layout optimised for readability — no sidebar needed.
 *
 * No auth required — legal pages are publicly accessible.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: {
    default: "Legal",
    template: "%s | Legal — Purple Glow Social",
  },
  description:
    "Legal information, privacy policy, and terms of service for Purple Glow Social.",
  robots: { index: true, follow: true },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LegalLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-200">
      {/* Header bar with back link */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 md:px-8">
          <a
            href="/"
            className="text-sm text-slate-400 transition-colors hover:text-purple-400"
          >
            ← Purple Glow Social
          </a>
          <span className="text-slate-700">/</span>
          <span className="text-sm font-medium text-slate-300">
            {t("title")}
          </span>
        </div>
      </header>

      {/* Centered prose container */}
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8 md:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-6 md:px-8">
        <p className="text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Purple Glow Technologies. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
