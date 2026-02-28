import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card } from "@/components/layout/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import type { BadgeVariant } from "@/components/ui/Badge";

// ─── Types ──────────────────────────────────────────────────────

type PostStatus = "published" | "scheduled" | "draft";
type Platform = "instagram" | "twitter" | "facebook";

interface MockPost {
  id: string;
  preview: string;
  platform: Platform;
  status: PostStatus;
  timestamp: string;
}

// ─── Mock Data ──────────────────────────────────────────────────

const RECENT_POSTS: MockPost[] = [
  {
    id: "post-1",
    preview: "Eish, what a lekker day! Our new range of locally crafted products is now available...",
    platform: "instagram",
    status: "published",
    timestamp: "2h ago",
  },
  {
    id: "post-2",
    preview: "Big news Mzansi! We're expanding to Cape Town and Durban this December...",
    platform: "twitter",
    status: "scheduled",
    timestamp: "In 4h",
  },
  {
    id: "post-3",
    preview: "Weekend vibes at our Joburg store 🇿🇦 Come check out our Heritage Month specials...",
    platform: "facebook",
    status: "published",
    timestamp: "1d ago",
  },
  {
    id: "post-4",
    preview: "Check out our latest behind-the-scenes look at how we source from local suppliers...",
    platform: "instagram",
    status: "draft",
    timestamp: "—",
  },
  {
    id: "post-5",
    preview: "Happy Heritage Day! Celebrating the rich diversity that makes Mzansi great 🌍",
    platform: "twitter",
    status: "published",
    timestamp: "2d ago",
  },
];

// ─── Helpers ────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<PostStatus, BadgeVariant> = {
  published: "success",
  scheduled: "info",
  draft: "default",
};

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
 * Recent posts list for the dashboard overview.
 *
 * Displays the 5 most recent posts with platform icon, status badge,
 * and timestamp. Links to the full posts view.
 *
 * Server component — no interactivity needed.
 */
export function RecentPosts({ className }: { className?: string }) {
  const t = useTranslations("dashboard");

  return (
    <Card as="section" padding="none" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          {t("recentPostsTitle")}
        </h2>
        <Link
          href="/posts"
          className="text-xs font-medium text-brand transition-colors hover:text-brand-vivid"
        >
          {t("viewAll")}
        </Link>
      </div>

      {/* Post list */}
      <ul className="divide-y divide-border" role="list">
        {RECENT_POSTS.map((post) => (
          <li
            key={post.id}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-inset/50"
          >
            {/* Platform icon */}
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center",
                "rounded-md bg-brand-surface text-brand",
              )}
              aria-label={post.platform}
            >
              {PLATFORM_ICONS[post.platform]}
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">{post.preview}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge
                  variant={STATUS_BADGE_VARIANT[post.status]}
                  size="sm"
                  dot
                >
                  {t(post.status)}
                </Badge>
                <span className="text-[0.6875rem] text-text-muted">
                  {post.timestamp}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
