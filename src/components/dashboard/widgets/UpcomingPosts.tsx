import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

// ─── Types ──────────────────────────────────────────────────────

type Platform = "instagram" | "twitter" | "facebook";

interface ScheduledPost {
  id: string;
  preview: string;
  platform: Platform;
  scheduledAt: string;
}

// ─── Mock Data ──────────────────────────────────────────────────

const UPCOMING_POSTS: ScheduledPost[] = [
  {
    id: "sched-1",
    preview: "Big news Mzansi! We're expanding to Cape Town and Durban this December 🎉",
    platform: "twitter",
    scheduledAt: "Tomorrow · 08:00 SAST",
  },
  {
    id: "sched-2",
    preview: "New collection dropping Friday! Stay tuned for something special 🔥",
    platform: "instagram",
    scheduledAt: "Fri · 12:30 SAST",
  },
  {
    id: "sched-3",
    preview: "Weekend special: 20% off for our loyal customers. Use code MZANSI20 at checkout",
    platform: "facebook",
    scheduledAt: "Sat · 18:00 SAST",
  },
];

// ─── Platform Icons (16×16) ─────────────────────────────────────

function InstagramIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="3" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="12" cy="4" r="0.5" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 13.5c1.5 1 3.5 1 5-.5 3 0 5-2 6-5 .5-1.5.5-3 0-4-.5.5-1.5 1-2.5.5-.5-1-2-1.5-3-.5-1 1-1 2.5-.5 4-2.5-.5-5-2-6.5-4-.5 1-.5 2.5.5 3.5-1 0-1.5-.5-1.5-.5s0 1.5 1.5 2.5c-.5 0-1.5 0-1.5 0s.5 1.5 2 2" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M9 14V9h2l.5-2H9V6c0-.5.5-1 1-1h1.5V3H10c-1.5 0-2.5 1-2.5 2.5V7H6v2h1.5v5" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <InstagramIcon />,
  twitter: <TwitterIcon />,
  facebook: <FacebookIcon />,
};

// ─── Component ──────────────────────────────────────────────────

/**
 * Upcoming scheduled posts for the dashboard overview.
 *
 * Displays the next 3 scheduled posts with platform, date/time,
 * and Edit/Cancel action buttons.
 *
 * Server component — buttons are rendered without handlers (mock).
 */
export function UpcomingPosts({ className }: { className?: string }) {
  const t = useTranslations("dashboard");

  return (
    <Card as="section" padding="none" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          {t("upcomingScheduledTitle")}
        </h2>
        <Link
          href="/calendar"
          className="text-xs font-medium text-brand transition-colors hover:text-brand-vivid"
        >
          {t("viewCalendar")}
        </Link>
      </div>

      {/* Scheduled post list */}
      <ul className="divide-y divide-border" role="list">
        {UPCOMING_POSTS.map((post) => (
          <li
            key={post.id}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-inset/50"
          >
            {/* Platform icon */}
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center",
                "rounded-none bg-brand-surface text-brand",
              )}
              aria-label={post.platform}
            >
              {PLATFORM_ICONS[post.platform]}
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">{post.preview}</p>
              <div className="mt-1 flex items-center gap-2">
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0 text-text-muted"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="6" r="5" />
                  <path d="M6 3v3l2 1" />
                </svg>
                <span className="text-[0.6875rem] text-text-muted">
                  {post.scheduledAt}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <Button variant="ghost" size="sm">
                {t("editAction")}
              </Button>
              <Button variant="ghost" size="sm" className="text-error hover:text-error hover:bg-error-surface">
                {t("cancelAction")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
