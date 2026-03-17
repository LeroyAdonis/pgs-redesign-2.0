/**
 * API Reference — /docs/api-reference
 *
 * Technical documentation for the Purple Glow Social REST API.
 * Mogul-tier only. Covers authentication, endpoints, rate limits,
 * code examples, error codes, and webhook events.
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
  const t = await getTranslations({ locale, namespace: "docs.apiReference" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ─── Table of Contents ─── */

const TOC_SECTIONS: TocSection[] = [
  { id: "overview", title: "Overview" },
  { id: "authentication", title: "Authentication" },
  { id: "base-url", title: "Base URL & Versioning" },
  { id: "endpoints", title: "Endpoints Overview" },
  { id: "posts", title: "Posts API" },
  { id: "accounts", title: "Accounts API" },
  { id: "analytics", title: "Analytics API" },
  { id: "scheduling", title: "Scheduling API" },
  { id: "rate-limits", title: "Rate Limits" },
  { id: "errors", title: "Error Codes" },
  { id: "webhooks", title: "Webhook Events" },
];

/* ─── Code Block Component ─── */

function CodeBlock({
  title,
  language,
  code,
}: {
  title: string;
  language: string;
  code: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-400">
          {language}
        </span>
      </div>
      <div className="bg-slate-900 p-4 font-mono text-sm text-green-400 overflow-x-auto">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default async function ApiReferencePage({ params }: Props) {
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
            { label: t("apiReference.title") },
          ]}
          className="mb-8"
        />

        {/* Header */}
        <header id="overview">
          <h1 className="mb-3 text-3xl font-bold text-white">
            {t("apiReference.title")}
          </h1>
          <p className="text-lg text-slate-400">
            {t("apiReference.description")}. Build custom integrations,
            automate workflows, and extend Purple Glow Social with our REST API.
          </p>

          {/* Mogul-only notice */}
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75L1.5 15.75h15L9 3.75z" />
                <path strokeLinecap="round" d="M9 9v2.25M9 13.5h.008" />
              </svg>
              {t("apiReference.mogulOnly")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Upgrade to the Mogul plan to access the API. Contact our sales
              team for enterprise pricing and custom rate limits.
            </p>
          </div>
        </header>

        {/* ── Authentication ── */}
        <section id="authentication">
          <h2 className="mb-4 text-xl font-bold text-white">
            Authentication
          </h2>
          <p className="mb-4 text-slate-300">
            All API requests must include your API key in the{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-purple-300">
              Authorization
            </code>{" "}
            header using the Bearer token scheme.
          </p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Getting Your API Key
            </h3>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  1
                </span>
                <span>Go to Settings → API → API Keys.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  2
                </span>
                <span>
                  Click &ldquo;Generate New Key&rdquo; and give it a descriptive
                  name.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  3
                </span>
                <span>
                  Copy the key immediately — it won&apos;t be shown again.
                </span>
              </li>
            </ol>
          </div>

          <div className="mt-4">
            <CodeBlock
              title="Authentication Header"
              language="bash"
              code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.purpleglow.co.za/v1/posts`}
            />
          </div>

          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-slate-800/50 p-4">
            <p className="text-sm font-semibold text-purple-300">
              🔒 Security
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Keep your API key secret. Never expose it in client-side code,
              public repositories, or browser requests. Use environment
              variables or a secrets manager. If a key is compromised, revoke
              it immediately from the API settings.
            </p>
          </div>
        </section>

        {/* ── Base URL & Versioning ── */}
        <section id="base-url">
          <h2 className="mb-4 text-xl font-bold text-white">
            Base URL &amp; Versioning
          </h2>

          <div className="rounded-lg bg-slate-800 p-4 font-mono text-sm text-green-400">
            https://api.purpleglow.co.za/v1
          </div>

          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  The API is versioned via the URL path. The current version is{" "}
                  <code className="rounded bg-slate-800 px-1 text-purple-300">
                    v1
                  </code>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  All requests and responses use JSON. Set{" "}
                  <code className="rounded bg-slate-800 px-1 text-purple-300">
                    Content-Type: application/json
                  </code>{" "}
                  for request bodies.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  Dates and times are returned in ISO 8601 format with SAST
                  (UTC+2) offset unless otherwise specified.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>
                  Pagination uses cursor-based pagination with{" "}
                  <code className="rounded bg-slate-800 px-1 text-purple-300">
                    cursor
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-slate-800 px-1 text-purple-300">
                    limit
                  </code>{" "}
                  query parameters.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Endpoints Overview ── */}
        <section id="endpoints">
          <h2 className="mb-4 text-xl font-bold text-white">
            Endpoints Overview
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Base Path
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  {
                    resource: "Posts",
                    path: "/v1/posts",
                    desc: "Create, read, update, and delete social media posts",
                  },
                  {
                    resource: "Accounts",
                    path: "/v1/accounts",
                    desc: "List and manage connected social media accounts",
                  },
                  {
                    resource: "Analytics",
                    path: "/v1/analytics",
                    desc: "Retrieve engagement metrics and performance data",
                  },
                  {
                    resource: "Scheduling",
                    path: "/v1/schedule",
                    desc: "Manage scheduled posts and posting queues",
                  },
                  {
                    resource: "Brand Profile",
                    path: "/v1/brand",
                    desc: "Access and update your brand voice profile",
                  },
                  {
                    resource: "Webhooks",
                    path: "/v1/webhooks",
                    desc: "Register and manage webhook endpoints",
                  },
                ].map((row) => (
                  <tr
                    key={row.resource}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {row.resource}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.path}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Posts API ── */}
        <section id="posts">
          <h2 className="mb-4 text-xl font-bold text-white">Posts API</h2>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { method: "GET", endpoint: "/v1/posts", desc: "List all posts" },
                  { method: "GET", endpoint: "/v1/posts/:id", desc: "Get a single post" },
                  { method: "POST", endpoint: "/v1/posts", desc: "Create a new post" },
                  { method: "PATCH", endpoint: "/v1/posts/:id", desc: "Update a post" },
                  { method: "DELETE", endpoint: "/v1/posts/:id", desc: "Delete a post" },
                  { method: "POST", endpoint: "/v1/posts/generate", desc: "AI-generate a post (uses credits)" },
                ].map((row) => (
                  <tr
                    key={`${row.method}-${row.endpoint}`}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          row.method === "GET"
                            ? "bg-green-500/15 text-green-400"
                            : row.method === "POST"
                              ? "bg-blue-500/15 text-blue-400"
                              : row.method === "PATCH"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.endpoint}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <CodeBlock
              title="Create a post"
              language="curl"
              code={`curl -X POST https://api.purpleglow.co.za/v1/posts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Lekker day in Cape Town! 🌊 #CapeTown #Mzansi",
    "platforms": ["instagram", "facebook"],
    "schedule_at": "2025-09-24T10:00:00+02:00"
  }'`}
            />
            <CodeBlock
              title="Create a post"
              language="javascript"
              code={`const response = await fetch('https://api.purpleglow.co.za/v1/posts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Lekker day in Cape Town! 🌊 #CapeTown #Mzansi',
    platforms: ['instagram', 'facebook'],
    schedule_at: '2025-09-24T10:00:00+02:00',
  }),
});

const post = await response.json();
console.log(post.id); // "post_abc123"`}
            />
          </div>
        </section>

        {/* ── Accounts API ── */}
        <section id="accounts">
          <h2 className="mb-4 text-xl font-bold text-white">Accounts API</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { method: "GET", endpoint: "/v1/accounts", desc: "List connected accounts" },
                  { method: "GET", endpoint: "/v1/accounts/:id", desc: "Get account details" },
                  { method: "DELETE", endpoint: "/v1/accounts/:id", desc: "Disconnect an account" },
                  { method: "POST", endpoint: "/v1/accounts/:id/refresh", desc: "Refresh OAuth token" },
                ].map((row) => (
                  <tr
                    key={`${row.method}-${row.endpoint}`}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          row.method === "GET"
                            ? "bg-green-500/15 text-green-400"
                            : row.method === "POST"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.endpoint}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Analytics API ── */}
        <section id="analytics">
          <h2 className="mb-4 text-xl font-bold text-white">Analytics API</h2>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { method: "GET", endpoint: "/v1/analytics/overview", desc: "Aggregated metrics across all accounts" },
                  { method: "GET", endpoint: "/v1/analytics/posts/:id", desc: "Metrics for a specific post" },
                  { method: "GET", endpoint: "/v1/analytics/accounts/:id", desc: "Metrics for a specific account" },
                  { method: "GET", endpoint: "/v1/analytics/top-posts", desc: "Best performing posts by engagement" },
                ].map((row) => (
                  <tr
                    key={row.endpoint}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-400">
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.endpoint}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="Get analytics overview"
            language="curl"
            code={`curl "https://api.purpleglow.co.za/v1/analytics/overview?from=2025-09-01&to=2025-09-30" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </section>

        {/* ── Scheduling API ── */}
        <section id="scheduling">
          <h2 className="mb-4 text-xl font-bold text-white">
            Scheduling API
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { method: "GET", endpoint: "/v1/schedule", desc: "List scheduled posts" },
                  { method: "POST", endpoint: "/v1/schedule", desc: "Schedule a post" },
                  { method: "PATCH", endpoint: "/v1/schedule/:id", desc: "Reschedule a post" },
                  { method: "DELETE", endpoint: "/v1/schedule/:id", desc: "Cancel a scheduled post" },
                  { method: "GET", endpoint: "/v1/schedule/optimal-times", desc: "Get optimal posting times" },
                ].map((row) => (
                  <tr
                    key={`${row.method}-${row.endpoint}`}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          row.method === "GET"
                            ? "bg-green-500/15 text-green-400"
                            : row.method === "POST"
                              ? "bg-blue-500/15 text-blue-400"
                              : row.method === "PATCH"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.endpoint}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Rate Limits ── */}
        <section id="rate-limits">
          <h2 className="mb-4 text-xl font-bold text-white">Rate Limits</h2>
          <p className="mb-4 text-slate-300">
            API requests are rate-limited to ensure fair usage and platform
            stability. Limits are applied per API key.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Endpoint Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Limit
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Window
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { category: "Read endpoints (GET)", limit: "1 000", window: "Per minute" },
                  { category: "Write endpoints (POST/PATCH/DELETE)", limit: "100", window: "Per minute" },
                  { category: "AI generation", limit: "30", window: "Per minute" },
                  { category: "Analytics queries", limit: "300", window: "Per minute" },
                  { category: "Webhook management", limit: "30", window: "Per minute" },
                ].map((row) => (
                  <tr
                    key={row.category}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-slate-200">{row.category}</td>
                    <td className="px-4 py-3 font-medium text-purple-400">
                      {row.limit} requests
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.window}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Rate Limit Headers
            </h3>
            <p className="mb-3 text-sm text-slate-400">
              Every API response includes rate limit information in the headers:
            </p>
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-green-400">
              <pre className="whitespace-pre">{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1695571200`}</pre>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              When rate limited, you&apos;ll receive a{" "}
              <code className="text-red-400">429 Too Many Requests</code>{" "}
              response. Wait until the reset time before retrying.
            </p>
          </div>
        </section>

        {/* ── Error Codes ── */}
        <section id="errors">
          <h2 className="mb-4 text-xl font-bold text-white">Error Codes</h2>
          <p className="mb-4 text-slate-300">
            The API uses standard HTTP status codes and returns structured error
            responses:
          </p>

          <CodeBlock
            title="Error response format"
            language="json"
            code={`{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The 'content' field is required.",
    "details": {
      "field": "content",
      "reason": "missing_required_field"
    }
  }
}`}
          />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { status: "400", code: "INVALID_REQUEST", desc: "Malformed request body or missing required fields" },
                  { status: "401", code: "UNAUTHORIZED", desc: "Missing or invalid API key" },
                  { status: "403", code: "FORBIDDEN", desc: "Valid key but insufficient permissions for this action" },
                  { status: "404", code: "NOT_FOUND", desc: "The requested resource does not exist" },
                  { status: "409", code: "CONFLICT", desc: "Resource conflict (e.g., duplicate post)" },
                  { status: "422", code: "VALIDATION_ERROR", desc: "Request body failed validation rules" },
                  { status: "429", code: "RATE_LIMITED", desc: "Too many requests — slow down and retry" },
                  { status: "500", code: "INTERNAL_ERROR", desc: "Unexpected server error — contact support if persistent" },
                  { status: "503", code: "SERVICE_UNAVAILABLE", desc: "Temporary outage — retry with exponential backoff" },
                ].map((row) => (
                  <tr
                    key={row.code}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          row.status.startsWith("4")
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Webhook Events ── */}
        <section id="webhooks">
          <h2 className="mb-4 text-xl font-bold text-white">
            Webhook Events
          </h2>
          <p className="mb-4 text-slate-300">
            Register webhook endpoints to receive real-time notifications when
            events occur in your account. Webhooks are sent as HTTP POST
            requests with a JSON payload.
          </p>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { event: "post.published", desc: "A scheduled post was successfully published" },
                  { event: "post.failed", desc: "A scheduled post failed to publish" },
                  { event: "post.scheduled", desc: "A new post was added to the schedule" },
                  { event: "post.cancelled", desc: "A scheduled post was cancelled" },
                  { event: "account.connected", desc: "A social media account was connected" },
                  { event: "account.disconnected", desc: "A social media account was disconnected" },
                  { event: "account.token_expired", desc: "An account's OAuth token has expired" },
                  { event: "credits.low", desc: "AI credits are below 10% of monthly allowance" },
                  { event: "credits.exhausted", desc: "All AI credits for the current period used" },
                ].map((row) => (
                  <tr
                    key={row.event}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">
                      {row.event}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="Webhook payload example"
            language="json"
            code={`{
  "event": "post.published",
  "timestamp": "2025-09-24T10:00:05+02:00",
  "data": {
    "post_id": "post_abc123",
    "platform": "instagram",
    "content": "Lekker day in Cape Town! 🌊 #CapeTown #Mzansi",
    "published_at": "2025-09-24T10:00:03+02:00",
    "url": "https://instagram.com/p/abc123"
  }
}`}
          />

          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Webhook Security
            </h3>
            <p className="text-sm text-slate-400">
              All webhook payloads include an{" "}
              <code className="rounded bg-slate-800 px-1 text-purple-300">
                X-PGS-Signature
              </code>{" "}
              header containing an HMAC-SHA256 signature. Verify this signature
              using your webhook secret to ensure the payload is authentic and
              hasn&apos;t been tampered with.
            </p>
          </div>
        </section>
      </div>

      {/* Sidebar: Table of Contents */}
      <TableOfContents sections={TOC_SECTIONS} className="w-48 shrink-0" />
    </div>
  );
}
