/**
 * Scheduling Guide — /docs/scheduling
 *
 * Comprehensive guide to the scheduling system: calendar interface,
 * optimal times, bulk scheduling, queue management, and SAST context.
 */

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import {
  TableOfContents,
  type TocSection,
} from "@/components/docs/TableOfContents";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs.scheduling" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ─── Table of Contents ─── */

const TOC_SECTIONS: TocSection[] = [
  { id: "overview", title: "Overview" },
  { id: "calendar", title: "Calendar Interface" },
  { id: "creating-scheduled-post", title: "Creating a Scheduled Post" },
  { id: "optimal-times", title: "Optimal Posting Times" },
  { id: "bulk-scheduling", title: "Bulk Scheduling" },
  { id: "queue", title: "Queue Management" },
  { id: "timezones", title: "Time Zones & SAST" },
  { id: "editing-cancelling", title: "Editing & Cancelling Posts" },
];

/* ─── Page ─── */

export default async function SchedulingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("docs");

  return (
    <div className="flex gap-10">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: t("title"), href: `/${locale}/docs` },
            { label: t("scheduling.title") },
          ]}
          className="mb-8"
        />

        {/* Header */}
        <header id="overview">
          <h1 className="mb-3 text-3xl font-bold text-white">
            {t("scheduling.title")}
          </h1>
          <p className="text-lg text-slate-400">
            {t("scheduling.description")}. Schedule posts across all your
            connected platforms with our intuitive calendar interface, optimised
            for South African Standard Time (SAST / UTC+2).
          </p>
        </header>

        {/* ── Calendar Interface ── */}
        <section id="calendar">
          <h2 className="mb-4 text-xl font-bold text-white">
            Calendar Interface
          </h2>
          <p className="mb-4 text-slate-300">
            The scheduling calendar is your command centre for all upcoming
            posts. It offers three views to suit different planning needs:
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                view: "Month View",
                desc: "See the big picture — all scheduled posts laid out across the month. Perfect for spotting gaps in your content calendar.",
                icon: "📅",
              },
              {
                view: "Week View",
                desc: "A detailed day-by-day breakdown with hourly time slots. Ideal for fine-tuning your daily posting schedule.",
                icon: "📆",
              },
              {
                view: "List View",
                desc: "A chronological list of all upcoming posts with platform icons and status indicators. Best for quick reviewing.",
                icon: "📋",
              },
            ].map((item) => (
              <div
                key={item.view}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
              >
                <div className="mb-2 text-xl">{item.icon}</div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {item.view}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Calendar Features
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                Colour-coded posts by platform (Instagram pink, Facebook blue,
                etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                Drag and drop to reschedule posts to different dates/times
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                Click any time slot to create a new scheduled post
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                Filter by platform, status (scheduled, published, failed), or
                content type
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                South African public holidays highlighted automatically
              </li>
            </ul>
          </div>
        </section>

        {/* ── Creating a Scheduled Post ── */}
        <section id="creating-scheduled-post">
          <h2 className="mb-4 text-xl font-bold text-white">
            Creating a Scheduled Post
          </h2>
          <p className="mb-4 text-slate-300">
            There are multiple ways to schedule a post. Here&apos;s the most
            common workflow:
          </p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <ol className="space-y-3 text-sm text-slate-300">
              {[
                'Navigate to the Content Calendar or click "New Post" from the dashboard.',
                "Select one or more target platforms (e.g., Instagram + Facebook).",
                "Create your content — write it manually or use the AI Content Studio.",
                "Attach any media (images, videos) if applicable.",
                "Click \"Schedule\" and pick your date and time. We show SAST by default.",
                "Optionally, check \"Use optimal time\" to let our AI pick the best posting time.",
                'Review the preview for each platform, then click "Confirm Schedule".',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Optimal Posting Times ── */}
        <section id="optimal-times">
          <h2 className="mb-4 text-xl font-bold text-white">
            Optimal Posting Times
          </h2>
          <p className="mb-4 text-slate-300">
            Our AI analyses your audience engagement patterns to suggest the
            best times to post. Here are general guidelines for South African
            audiences (all times in SAST / UTC+2):
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Best Days
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Peak Times (SAST)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Avoid
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  {
                    platform: "Instagram",
                    days: "Tue, Wed, Thu",
                    times: "11:00 – 13:00, 19:00 – 21:00",
                    avoid: "Early mornings (before 07:00)",
                  },
                  {
                    platform: "Facebook",
                    days: "Wed, Thu, Fri",
                    times: "09:00 – 11:00, 13:00 – 15:00",
                    avoid: "Late nights (after 22:00)",
                  },
                  {
                    platform: "X / Twitter",
                    days: "Mon, Tue, Wed",
                    times: "08:00 – 10:00, 12:00 – 13:00",
                    avoid: "Weekends (lower engagement)",
                  },
                  {
                    platform: "LinkedIn",
                    days: "Tue, Wed, Thu",
                    times: "07:30 – 08:30, 12:00 – 13:00",
                    avoid: "Weekends and after 17:00",
                  },
                  {
                    platform: "TikTok",
                    days: "Tue, Thu, Fri",
                    times: "19:00 – 22:00, 12:00 – 14:00",
                    avoid: "Early mornings (before 09:00)",
                  },
                ].map((row) => (
                  <tr
                    key={row.platform}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {row.platform}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.days}</td>
                    <td className="px-4 py-3 text-green-400">{row.times}</td>
                    <td className="px-4 py-3 text-red-400/70">{row.avoid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
            <p className="mt-1 text-sm text-slate-400">
              These are general guidelines. Your actual optimal times may differ
              based on your specific audience. After a few weeks of posting, check
              your Analytics dashboard for personalised recommendations based on
              your followers&apos; activity patterns.
            </p>
          </div>
        </section>

        {/* ── Bulk Scheduling ── */}
        <section id="bulk-scheduling">
          <h2 className="mb-4 text-xl font-bold text-white">
            Bulk Scheduling
          </h2>
          <p className="mb-4 text-slate-300">
            Need to schedule multiple posts at once? Bulk scheduling lets you
            plan an entire week or month of content in one session.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                📤 CSV Upload
              </h3>
              <p className="text-sm text-slate-400">
                Prepare your content in a CSV file with columns for platform,
                content, date, time, and media URLs. Upload the file and
                we&apos;ll create all scheduled posts at once.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                🤖 AI Batch Generation
              </h3>
              <p className="text-sm text-slate-400">
                Tell the AI your content themes for the week and let it generate
                a full batch of posts. Review them all, then schedule with one
                click. Available on Growler and Mogul plans.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              CSV Format Example
            </h3>
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-400">
              <pre className="overflow-x-auto">
{`platform,content,date,time,media_url
instagram,"Lekker vibes this Heritage Day! 🇿🇦 #Mzansi",2025-09-24,10:00,
facebook,"Check out our latest collection — proudly SA! 🔥",2025-09-24,11:00,
x,"Big announcement coming tomorrow! Stay tuned 👀",2025-09-25,08:00,`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Queue Management ── */}
        <section id="queue">
          <h2 className="mb-4 text-xl font-bold text-white">
            Queue Management
          </h2>
          <p className="mb-4 text-slate-300">
            The posting queue shows all your scheduled posts in chronological
            order. From here you can manage, reorder, and monitor your content
            pipeline.
          </p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Queue Features
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Status indicators</strong>{" "}
                  — Scheduled (blue), Publishing (amber), Published (green),
                  Failed (red)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Drag to reorder</strong> —
                  Change the order of queued posts without editing individual
                  times
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Quick actions</strong> —
                  Edit, duplicate, reschedule, or cancel posts directly from the
                  queue
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Retry failed posts</strong>{" "}
                  — If a post fails to publish (e.g., token expired), retry with
                  one click after resolving the issue
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">✦</span>
                <span>
                  <strong className="text-slate-200">Pause queue</strong> — Pause
                  all scheduled posts for an account or platform while you make
                  changes
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Time Zones & SAST ── */}
        <section id="timezones">
          <h2 className="mb-4 text-xl font-bold text-white">
            Time Zones &amp; SAST
          </h2>
          <p className="mb-4 text-slate-300">
            Purple Glow Social defaults to South African Standard Time (SAST /
            UTC+2) for all scheduling. South Africa does not observe daylight
            saving time, so SAST remains consistent year-round.
          </p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Key Points
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  All times displayed in the calendar and queue are in SAST
                  unless you change your timezone preference.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  You can change your display timezone in Settings → Preferences,
                  but posts will still be published at the correct absolute time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  SAST is UTC+2, the same as Central Africa Time (CAT). No
                  daylight saving adjustments are needed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  If you have international audiences, consider scheduling
                  duplicate posts at different times to cover multiple time
                  zones.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">
              🌍 International Note
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Scheduling for audiences in different time zones? Our optimal time
              suggestions adapt based on your audience&apos;s location data. A
              post targeting London followers will suggest different times than
              one targeting Johannesburg.
            </p>
          </div>
        </section>

        {/* ── Editing & Cancelling Posts ── */}
        <section id="editing-cancelling">
          <h2 className="mb-4 text-xl font-bold text-white">
            Editing &amp; Cancelling Scheduled Posts
          </h2>
          <p className="mb-4 text-slate-300">
            You can modify or cancel any scheduled post up until the moment
            it&apos;s published. Here&apos;s how:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                ✏️ Editing a Post
              </h3>
              <ol className="space-y-1.5 text-sm text-slate-400">
                <li>1. Find the post in the Calendar or Queue.</li>
                <li>2. Click the post to open the detail view.</li>
                <li>3. Click &ldquo;Edit&rdquo; to modify content, time, or platforms.</li>
                <li>4. Save your changes — the scheduled time updates automatically.</li>
              </ol>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                🗑️ Cancelling a Post
              </h3>
              <ol className="space-y-1.5 text-sm text-slate-400">
                <li>1. Find the post in the Calendar or Queue.</li>
                <li>2. Click the post to open the detail view.</li>
                <li>3. Click &ldquo;Cancel&rdquo; and confirm the cancellation.</li>
                <li>4. The post is removed from the queue. Any credits used for AI content are not refunded.</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">
              ⚠️ Important
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Posts cannot be edited or cancelled after they have been published.
              We begin the publishing process 30 seconds before the scheduled
              time, so make any last-minute changes with time to spare.
            </p>
          </div>
        </section>
      </div>

      {/* Sidebar: Table of Contents */}
      <TableOfContents sections={TOC_SECTIONS} className="w-48 shrink-0" />
    </div>
  );
}
