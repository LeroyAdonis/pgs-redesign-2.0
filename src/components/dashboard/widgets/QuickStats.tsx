import { useTranslations } from "next-intl";
import { StatCard } from "@/components/data/StatCard";

// ─── Icons (inline SVGs, 20×20) ─────────────────────────────────

function PostsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4" width="14" height="13" rx="1" />
      <path d="M3 8h14M7 4V2M13 4V2" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="15" cy="7" r="2" />
      <path d="M15 12c2 0 3.5 1.5 3.5 3.5" />
    </svg>
  );
}

function EngagementIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-6 3 4 4-8 3 5" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Quick stats grid for the dashboard overview.
 *
 * Renders 4 KPI StatCards in a 2×2 grid: Total Posts, Scheduled Posts,
 * Connected Accounts, and Engagement Rate.
 *
 * Server component — uses StatCard which is also a server component.
 */
export function QuickStats({ className }: { className?: string }) {
  const t = useTranslations("dashboard");

  return (
    <div className={className} data-testid="quick-stats">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<PostsIcon />}
          label={t("totalPosts")}
          value="127"
          trend={{ direction: "up", value: "+12.5%" }}
        />
        <StatCard
          icon={<CalendarIcon />}
          label={t("scheduledPosts")}
          value="8"
          trend={{ direction: "up", value: "+3" }}
        />
        <StatCard
          icon={<AccountsIcon />}
          label={t("connectedAccounts")}
          value="3"
        />
        <StatCard
          icon={<EngagementIcon />}
          label={t("engagementRate")}
          value="4.2%"
          trend={{ direction: "up", value: "+0.8%" }}
        />
      </div>
    </div>
  );
}
