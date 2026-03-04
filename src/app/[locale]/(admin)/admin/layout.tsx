/**
 * Admin route group layout
 *
 * Shared layout for all admin pages (e.g. /admin, /admin/clients, /admin/system).
 * Renders the admin sidebar navigation and header bar.
 *
 * This is a server component that:
 * - Validates the user session via `requireAdminSession()`
 * - Checks that the user has the "admin" role
 * - Passes user data to the admin header component
 * - Provides the sidebar + header + main content structure
 *
 * Non-admin users are automatically redirected to /dashboard.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Admin Dashboard — Purple Glow Social",
  description: "Admin control panel for Purple Glow Social 2.0",
  robots: { index: false, follow: false },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth + role guard — redirects if not authenticated or not admin
  const session = await requireAdminSession();

  return (
    <div className="min-h-dvh bg-slate-950">
      {/* Admin Sidebar (fixed left on desktop, off-canvas on mobile) */}
      <AdminSidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex flex-col md:ml-[260px]">
        <AdminHeader
          userName={session.user.name ?? "Admin"}
          userEmail={session.user.email}
          userImage={session.user.image ?? undefined}
        />

        <main id="main-content" className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
