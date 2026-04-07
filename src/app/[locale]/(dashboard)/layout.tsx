/**
 * Dashboard route group layout
 *
 * Shared layout for all dashboard pages (e.g. /overview, /posts, /analytics).
 * Renders the sidebar navigation, top header bar, and tutorial overlay.
 *
 * This is a server component that:
 * - Validates the user session via `requireServerSession()`
 * - Passes user data to client-side header component
 * - Provides the sidebar + header + main content structure
 * - Wraps children with TutorialProvider for first-time user guidance
 */

import { setRequestLocale } from "next-intl/server";
import { eq } from "drizzle-orm";
import { requireServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { credit, organizationMember } from "@/db/schema";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TutorialProvider, TutorialOverlay } from "@/components/tutorial";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth guard — redirects to /login if not authenticated
  const session = await requireServerSession();

  // Fetch the user's org membership to look up real credit balance
  const membership = await db
    .select({ orgId: organizationMember.orgId })
    .from(organizationMember)
    .where(eq(organizationMember.userId, session.user.id))
    .limit(1);

  let creditBalance = 0;
  if (membership[0]?.orgId) {
    const creditRow = await db
      .select({ balance: credit.balance })
      .from(credit)
      .where(eq(credit.orgId, membership[0].orgId))
      .limit(1);
    creditBalance = creditRow[0]?.balance ?? 0;
  }

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
          credits={creditBalance}
        />

        <main id="main-content" className="flex-1 p-4 md:p-6">
          <TutorialProvider>
            {children}
            <TutorialOverlay />
          </TutorialProvider>
        </main>
      </div>
    </div>
  );
}
