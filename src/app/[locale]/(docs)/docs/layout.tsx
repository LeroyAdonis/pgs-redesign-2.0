/**
 * Docs route group layout
 *
 * Public layout for all documentation pages (e.g. /docs, /docs/getting-started).
 * Renders a sidebar navigation on desktop and a hamburger/drawer on mobile,
 * with a max-width content area and breadcrumb support.
 *
 * Includes TutorialProvider so the ReplayTutorialButton on getting-started
 * can show the interactive tutorial overlay.
 *
 * No auth required — docs are publicly accessible.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { TutorialProvider, TutorialOverlay } from "@/components/tutorial";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s | Docs — Purple Glow Social",
  },
  description:
    "Learn how to use Purple Glow Social — AI-powered social media management for South African businesses.",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DocsLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <TutorialProvider autoShow={false}>
      <div className="min-h-dvh bg-slate-950 text-slate-200">
        {/* Sidebar (fixed left on desktop, off-canvas on mobile) */}
        <DocsSidebar />

        {/* Main content area — offset by sidebar width on desktop */}
        <div className="flex flex-col md:ml-[260px]">
          <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8 md:py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 px-4 py-6 md:px-8">
            <p className="text-center text-xs text-slate-600">
              © {new Date().getFullYear()} Purple Glow Technologies. All rights reserved.
            </p>
          </footer>
        </div>
      </div>

      {/* Tutorial overlay — triggered by ReplayTutorialButton on /docs/getting-started */}
      <TutorialOverlay />
    </TutorialProvider>
  );
}
