/**
 * Linking Accounts — /docs/linking-accounts
 *
 * Comprehensive guide to connecting social media platforms,
 * permission explanations, and troubleshooting.
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
  const t = await getTranslations({ locale, namespace: "docs.linkingAccounts" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ─── Table of Contents ─── */

const TOC_SECTIONS: TocSection[] = [
  { id: "overview", title: "Overview" },
  { id: "supported-platforms", title: "Supported Platforms" },
  { id: "connecting-instagram", title: "Connecting Instagram" },
  { id: "connecting-facebook", title: "Connecting Facebook" },
  { id: "connecting-x", title: "Connecting X / Twitter" },
  { id: "connecting-linkedin", title: "Connecting LinkedIn" },
  { id: "connecting-tiktok", title: "Connecting TikTok" },
  { id: "permissions", title: "Permissions Explained" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "reconnecting", title: "Reconnecting Expired Tokens" },
];

/* ─── Platform Data ─── */

interface Platform {
  name: string;
  slug: string;
  gradient: string;
  description: string;
  steps: string[];
  permissions: string[];
  permissionWhy: string;
}

const PLATFORMS: Platform[] = [
  {
    name: "Instagram",
    slug: "connecting-instagram",
    gradient: "from-pink-500 to-purple-600",
    description:
      "Connect your Instagram Business or Creator account to publish posts, stories, and reels.",
    steps: [
      "Ensure your Instagram account is a Business or Creator account (personal accounts are not supported).",
      "Link your Instagram to a Facebook Page (required by Meta's API).",
      'Navigate to Settings → Social Accounts and click "Connect" next to Instagram.',
      "You'll be redirected to Meta — log in and select the Instagram account to link.",
      "Grant the requested permissions and click \"Allow\".",
      "You'll be redirected back to Purple Glow Social with your account connected.",
    ],
    permissions: [
      "Read your profile information and media",
      "Publish content on your behalf",
      "Read insights and analytics",
      "Manage comments",
    ],
    permissionWhy:
      "We need publishing access to schedule and post content, insights access for analytics, and comment access so you can manage engagement from the dashboard.",
  },
  {
    name: "Facebook",
    slug: "connecting-facebook",
    gradient: "from-blue-500 to-blue-700",
    description:
      "Connect a Facebook Page to publish posts, manage comments, and track page analytics.",
    steps: [
      "You must be an admin of the Facebook Page you want to connect.",
      'Navigate to Settings → Social Accounts and click "Connect" next to Facebook.',
      "Log into Facebook when prompted and select the Page(s) you want to manage.",
      "Grant all requested permissions for full functionality.",
      "Click \"Done\" and you'll be redirected back with your Page connected.",
    ],
    permissions: [
      "Manage and publish to your Pages",
      "Read Page insights and analytics",
      "Manage Page comments and messages",
      "Access Page follower information",
    ],
    permissionWhy:
      "Page management permissions let us publish scheduled posts and manage engagement. Insights access powers your analytics dashboard.",
  },
  {
    name: "X / Twitter",
    slug: "connecting-x",
    gradient: "from-slate-400 to-slate-600",
    description:
      "Connect your X (formerly Twitter) account to publish tweets and track engagement.",
    steps: [
      'Navigate to Settings → Social Accounts and click "Connect" next to X / Twitter.',
      "You'll be redirected to X — log in if needed.",
      "Review the permissions and click \"Authorise app\".",
      "You'll be redirected back with your account connected.",
    ],
    permissions: [
      "Read your profile and tweets",
      "Post tweets on your behalf",
      "Read tweet analytics",
    ],
    permissionWhy:
      "Write access allows us to publish scheduled tweets. Read access enables analytics and engagement tracking.",
  },
  {
    name: "LinkedIn",
    slug: "connecting-linkedin",
    gradient: "from-sky-500 to-sky-700",
    description:
      "Connect your LinkedIn profile or Company Page to share professional content.",
    steps: [
      'Navigate to Settings → Social Accounts and click "Connect" next to LinkedIn.',
      "Log into LinkedIn when redirected.",
      "Select whether to connect your personal profile, a Company Page, or both.",
      "Grant the requested permissions.",
      "You'll be redirected back with your account connected.",
    ],
    permissions: [
      "Read your profile information",
      "Share posts on your behalf",
      "Read post analytics",
      "Manage Company Page posts (if applicable)",
    ],
    permissionWhy:
      "Sharing permissions enable scheduled posting. Profile and analytics access power your content performance dashboard.",
  },
  {
    name: "TikTok",
    slug: "connecting-tiktok",
    gradient: "from-rose-500 to-cyan-500",
    description:
      "Connect your TikTok Business account to manage video content and track performance.",
    steps: [
      "Ensure you have a TikTok Business account (personal accounts have limited API access).",
      'Navigate to Settings → Social Accounts and click "Connect" next to TikTok.',
      "You'll be redirected to TikTok — log in and authorise the connection.",
      "Grant the requested permissions.",
      "You'll be redirected back with your account connected.",
    ],
    permissions: [
      "Read your profile and video information",
      "Upload and publish videos",
      "Read video analytics and insights",
    ],
    permissionWhy:
      "Upload permissions let us publish scheduled video content. Analytics access enables performance tracking in your dashboard.",
  },
];

/* ─── Page ─── */

export default async function LinkingAccountsPage({ params }: Props) {
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
            { label: t("linkingAccounts.title") },
          ]}
          className="mb-8"
        />

        {/* Header */}
        <header id="overview">
          <h1 className="mb-3 text-3xl font-bold text-white">
            {t("linkingAccounts.title")}
          </h1>
          <p className="text-lg text-slate-400">
            {t("linkingAccounts.description")}. Purple Glow Social uses secure
            OAuth connections — we never see or store your social media
            passwords. All tokens are encrypted with AES-256-GCM at rest.
          </p>
        </header>

        {/* ── Supported Platforms Overview ── */}
        <section id="supported-platforms">
          <h2 className="mb-4 text-xl font-bold text-white">
            Supported Platforms
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => (
              <a
                key={p.slug}
                href={`#${p.slug}`}
                className="group rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition-all duration-200 hover:border-purple-500/40"
              >
                <div
                  className={`mb-3 h-10 w-10 rounded-lg bg-gradient-to-br ${p.gradient}`}
                />
                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-purple-400">
                  {p.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{p.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* ── Per-platform Guides ── */}
        {PLATFORMS.map((platform) => (
          <section key={platform.slug} id={platform.slug}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg bg-gradient-to-br ${platform.gradient}`}
              />
              <h2 className="text-xl font-bold text-white">
                Connecting {platform.name}
              </h2>
            </div>
            <p className="mb-4 text-slate-300">{platform.description}</p>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                Step-by-step:
              </h3>
              <ol className="space-y-2 text-sm text-slate-300">
                {platform.steps.map((step, i) => (
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
        ))}

        {/* ── Permissions Explained ── */}
        <section id="permissions">
          <h2 className="mb-4 text-xl font-bold text-white">
            Permissions Explained
          </h2>
          <p className="mb-6 text-slate-300">
            When you connect a social media account, each platform asks you to
            grant specific permissions. Here&apos;s exactly what we request and
            why:
          </p>

          <div className="space-y-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.slug}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
              >
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  {platform.name}
                </h3>
                <ul className="mb-3 space-y-1">
                  {platform.permissions.map((perm) => (
                    <li
                      key={perm}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="mt-1 text-green-400">✓</span>
                      {perm}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-400">Why?</strong>{" "}
                  {platform.permissionWhy}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">
              🔒 Security Note
            </p>
            <p className="mt-1 text-sm text-slate-400">
              We follow the principle of least privilege — we only request the
              permissions we genuinely need. All OAuth tokens are encrypted with
              AES-256-GCM and stored securely. You can revoke access at any time
              from both our dashboard and the platform&apos;s settings.
            </p>
          </div>
        </section>

        {/* ── Troubleshooting ── */}
        <section id="troubleshooting">
          <h2 className="mb-4 text-xl font-bold text-white">
            Troubleshooting
          </h2>
          <p className="mb-6 text-slate-300">
            Having trouble connecting an account? Here are solutions to the most
            common issues:
          </p>

          <div className="space-y-3">
            {[
              {
                issue: "\"Connection failed\" error",
                solution:
                  "Clear your browser cookies, ensure you're logged into the correct social media account, and try again. If using a VPN, try disabling it temporarily.",
              },
              {
                issue: "Instagram says \"Business account required\"",
                solution:
                  "Switch to a Business or Creator account in Instagram's settings (Settings → Account → Switch to Professional Account). You'll also need to link it to a Facebook Page.",
              },
              {
                issue: "Facebook Page doesn't appear in the list",
                solution:
                  "You must be an admin of the Page. Ask the current admin to grant you admin access, then try reconnecting.",
              },
              {
                issue: "\"Permissions denied\" after authorising",
                solution:
                  "Some platforms require you to grant all requested permissions. Disconnect the account and reconnect, ensuring you tick all permission checkboxes.",
              },
              {
                issue: "Account shows as \"Disconnected\" unexpectedly",
                solution:
                  "This usually means the OAuth token has expired. See the section below on reconnecting expired tokens.",
              },
              {
                issue: "Two-factor authentication (2FA) blocking the connection",
                solution:
                  "Complete the 2FA challenge during the OAuth flow. If you're having trouble, try connecting from a device where you're already logged into the social platform.",
              },
            ].map((item) => (
              <div
                key={item.issue}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
              >
                <h3 className="mb-1 text-sm font-semibold text-red-400">
                  {item.issue}
                </h3>
                <p className="text-sm text-slate-400">{item.solution}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reconnecting Expired Tokens ── */}
        <section id="reconnecting">
          <h2 className="mb-4 text-xl font-bold text-white">
            Reconnecting Expired Tokens
          </h2>
          <p className="mb-4 text-slate-300">
            Social media platforms periodically expire OAuth tokens for security
            reasons. When this happens, you&apos;ll see a warning banner on your
            dashboard and scheduled posts for that account will be paused.
          </p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              To reconnect:
            </h3>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  1
                </span>
                <span>Go to Settings → Social Accounts.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  2
                </span>
                <span>
                  Find the account showing &ldquo;Expired&rdquo; or
                  &ldquo;Disconnected&rdquo; status.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  3
                </span>
                <span>
                  Click &ldquo;Reconnect&rdquo; — you&apos;ll go through the
                  OAuth flow again.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  4
                </span>
                <span>
                  Once reconnected, any paused scheduled posts will resume
                  automatically.
                </span>
              </li>
            </ol>
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">💡 Tip</p>
            <p className="mt-1 text-sm text-slate-400">
              Enable email notifications for connection issues so you&apos;re
              alerted immediately when a token expires. You can configure this in
              Settings → Notifications.
            </p>
          </div>
        </section>
      </div>

      {/* Sidebar: Table of Contents */}
      <TableOfContents sections={TOC_SECTIONS} className="w-48 shrink-0" />
    </div>
  );
}
