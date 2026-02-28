/**
 * Dashboard route group layout
 *
 * Shared layout for all dashboard pages (e.g. /overview, /posts, /analytics).
 * Renders the sidebar navigation and top header bar.
 *
 * This is a server component that:
 * - Validates the user session via `requireServerSession()`
 * - Passes user data to client-side header component
 * - Provides the sidebar + header + main content structure
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth guard — redirects to /login if not authenticated
  const session = await requireServerSession();

  return (
    <div className="min-h-dvh bg-surface">
      {/* Sidebar (fixed left on desktop, off-canvas on mobile) */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex flex-col md:ml-[260px]">
        <DashboardHeader
          userName={session.user.name ?? "User"}
          userEmail={session.user.email}
          userImage={session.user.image ?? undefined}
          credits={42}
          notificationCount={3}
        />

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
