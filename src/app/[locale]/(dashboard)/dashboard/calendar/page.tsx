/**
 * Calendar Page — Server Component
 *
 * Route: /[locale]/dashboard/calendar
 *
 * View and manage scheduled social media posts in
 * month, week, or day views with drag-and-drop rescheduling.
 */

import { setRequestLocale } from "next-intl/server";
import { requireServerSession } from "@/lib/auth-session";
import { CalendarView } from "./_components/CalendarView";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Calendar | Purple Glow Social",
    description: "View and manage your scheduled social media posts",
  };
}

export default async function CalendarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth guard — redirects to /login if not authenticated
  await requireServerSession();

  return (
    <div className="mx-auto max-w-7xl">
      <CalendarView />
    </div>
  );
}
