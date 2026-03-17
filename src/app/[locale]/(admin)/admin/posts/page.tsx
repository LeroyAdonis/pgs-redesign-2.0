/**
 * Admin Post Moderation page
 *
 * Server component that fetches system-wide post statistics and
 * initial post data, then renders the PostModerationTable client
 * component for interactive filtering, searching, and bulk actions.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/db";
import { post, user, organization, postSchedule } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { PostModerationTable } from "@/components/admin/PostModerationTable";

export const metadata: Metadata = {
  title: "Post Moderation — Admin Dashboard",
};

type Props = {
  params: Promise<{ locale: string }>;
};

/** Summary statistics for the moderation page header */
interface PostStats {
  total: number;
  draft: number;
  scheduled: number;
  published: number;
  failed: number;
}

/** Post data shape passed to the client table component */
export interface AdminPostRow {
  id: string;
  content: string;
  contentLanguage: string;
  platform: string;
  status: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail: string;
  orgName: string;
  orgId: string;
  scheduledAt: string | null;
}

/** Fetch summary stats for each post status */
async function getPostStats(): Promise<PostStats> {
  try {
    const [totalResult, draftResult, scheduledResult, publishedResult, failedResult] =
      await Promise.all([
        db.select({ total: count() }).from(post),
        db.select({ total: count() }).from(post).where(eq(post.status, "draft")),
        db.select({ total: count() }).from(post).where(eq(post.status, "scheduled")),
        db.select({ total: count() }).from(post).where(eq(post.status, "published")),
        db.select({ total: count() }).from(post).where(eq(post.status, "failed")),
      ]);

    return {
      total: totalResult[0]?.total ?? 0,
      draft: draftResult[0]?.total ?? 0,
      scheduled: scheduledResult[0]?.total ?? 0,
      published: publishedResult[0]?.total ?? 0,
      failed: failedResult[0]?.total ?? 0,
    };
  } catch (error) {
    logger.error("Failed to fetch post stats", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { total: 0, draft: 0, scheduled: 0, published: 0, failed: 0 };
  }
}

/** Fetch initial page of posts for server render */
async function getInitialPosts(): Promise<AdminPostRow[]> {
  try {
    const rows = await db
      .select({
        id: post.id,
        content: post.content,
        contentLanguage: post.contentLanguage,
        platform: post.platform,
        status: post.status,
        aiGenerated: post.aiGenerated,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorName: user.name,
        authorEmail: user.email,
        orgName: organization.name,
        orgId: post.orgId,
        scheduledAt: postSchedule.scheduledAt,
      })
      .from(post)
      .innerJoin(user, eq(post.createdById, user.id))
      .innerJoin(organization, eq(post.orgId, organization.id))
      .leftJoin(postSchedule, eq(post.id, postSchedule.postId))
      .orderBy(desc(post.createdAt))
      .limit(20);

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
    }));
  } catch (error) {
    logger.error("Failed to fetch initial posts", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

/* ─── Stat icon components ─── */

function TotalIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="1" />
      <path strokeLinecap="round" d="M7 6h6M7 9h6M7 12h4" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4v14h12V9m-5-5l5 5m-5-5v5h5" />
    </svg>
  );
}

function ScheduledIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M10 6v4l3 2" />
    </svg>
  );
}

function PublishedIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l2 2 4-4" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M10 7v4M10 13.5v.5" />
    </svg>
  );
}

export default async function AdminPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, initialPosts] = await Promise.all([
    getPostStats(),
    getInitialPosts(),
  ]);

  const statCards = [
    { label: "Total Posts", value: stats.total, icon: <TotalIcon />, color: "text-slate-300" },
    { label: "Draft", value: stats.draft, icon: <DraftIcon />, color: "text-slate-400" },
    { label: "Scheduled", value: stats.scheduled, icon: <ScheduledIcon />, color: "text-blue-400" },
    { label: "Published", value: stats.published, icon: <PublishedIcon />, color: "text-green-400" },
    { label: "Failed", value: stats.failed, icon: <FailedIcon />, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Post Moderation
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Review, approve, and manage posts across the platform.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4"
          >
            <div className="flex items-center gap-2">
              <div className={`${stat.color} opacity-60`}>{stat.icon}</div>
              <span className="text-xs font-medium text-slate-400">{stat.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString("en-ZA")}
            </p>
          </div>
        ))}
      </div>

      {/* Post moderation table */}
      <PostModerationTable initialPosts={initialPosts} />
    </div>
  );
}
