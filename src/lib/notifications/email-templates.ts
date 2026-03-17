/**
 * Branded HTML email templates for Purple Glow Social
 *
 * Every template uses table-based layout with inline CSS for maximum
 * email-client compatibility. Brand palette:
 *   primary  #8b5cf6
 *   purple-600 #9333ea
 *   purple-900 #4c1d95
 *
 * SA context — copy uses South African English with local flair.
 */

import type {
  PostPublishedData,
  PostFailedData,
  LowCreditsData,
  WeeklyDigestData,
} from "./types";

// ---------------------------------------------------------------------------
// Base template
// ---------------------------------------------------------------------------

/**
 * Wraps arbitrary HTML content in a fully-branded Purple Glow email shell.
 *
 * Structure:
 *  ┌─────────────────────────┐
 *  │  purple gradient header  │
 *  │  ✦ Purple Glow Social   │
 *  ├─────────────────────────┤
 *  │                         │
 *  │   {content}             │
 *  │                         │
 *  ├─────────────────────────┤
 *  │  footer / unsubscribe   │
 *  └─────────────────────────┘
 */
export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Purple Glow Social</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ff;font-family:'Sora',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!--[if mso]>
  <style>body,table,td{font-family:Helvetica,Arial,sans-serif !important;}</style>
  <![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f0ff;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <!-- Outer container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#9333ea 50%,#4c1d95 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
              <span style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;color:#ffffff;letter-spacing:0.5px;">✦ Purple Glow Social</span>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e9e5f5;border-right:1px solid #e9e5f5;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#faf8ff;padding:20px 32px;border-radius:0 0 12px 12px;border:1px solid #e9e5f5;border-top:none;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#7c3aed;">Purple Glow Social — Proudly South African 🇿🇦</p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">You received this email because you have notifications enabled.<br/>
              <a href="https://app.purpleglow.social/settings/notifications" style="color:#8b5cf6;text-decoration:underline;">Manage preferences</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Purple CTA button — table-based for Outlook compatibility */
function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0 auto;">
  <tr>
    <td style="background-color:#8b5cf6;border-radius:8px;padding:14px 32px;text-align:center;">
      <a href="${href}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;font-family:'Sora',Helvetica,Arial,sans-serif;">${label}</a>
    </td>
  </tr>
</table>`;
}

/** Section heading */
function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-family:'Instrument Serif',Georgia,serif;font-size:24px;color:#4c1d95;font-weight:700;">${text}</h1>`;
}

/** Body paragraph */
function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;
}

/** Metric row for digest emails */
function metricRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:10px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f0ff;">${label}</td>
  <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#4c1d95;text-align:right;border-bottom:1px solid #f3f0ff;">${value}</td>
</tr>`;
}

// ---------------------------------------------------------------------------
// Individual templates
// ---------------------------------------------------------------------------

/** Input for post-published email */
export interface PostPublishedEmailData extends PostPublishedData {
  /** User's display name (or email) for personalisation */
  userName: string;
  /** Link back to the post within the dashboard */
  dashboardUrl?: string;
}

/**
 * "Your post was published successfully! 🎉"
 */
export function postPublishedEmail(data: PostPublishedEmailData): string {
  const dashboardLink =
    data.dashboardUrl ?? "https://app.purpleglow.social/dashboard";
  const platformLink = data.platformUrl
    ? `<p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">
        <a href="${data.platformUrl}" style="color:#8b5cf6;text-decoration:underline;">View on ${data.platform} →</a>
       </p>`
    : "";

  const content = `
    ${heading("Post Published! 🎉")}
    ${paragraph(`Lekker, ${data.userName}! Your post has been successfully published to <strong>${data.platform}</strong>.`)}
    ${paragraph("Your content is now live and reaching your audience. Keep the momentum going!")}
    ${platformLink}
    ${ctaButton("View Dashboard", dashboardLink)}
  `;

  return baseTemplate(content);
}

/** Input for post-failed email */
export interface PostFailedEmailData extends PostFailedData {
  userName: string;
  retryUrl?: string;
}

/**
 * "Your post couldn't be published ❌"
 */
export function postFailedEmail(data: PostFailedEmailData): string {
  const retryLink =
    data.retryUrl ?? `https://app.purpleglow.social/posts/${data.postId}`;
  const retrySection = data.retryable
    ? `${paragraph("Don't worry — you can retry this one.")}${ctaButton("Retry Post", retryLink)}`
    : paragraph(
        'Eish! This one can\'t be retried automatically. Please check your account connection and try creating the post again, or <a href="https://app.purpleglow.social/support" style="color:#8b5cf6;text-decoration:underline;">contact support</a>.',
      );

  const content = `
    ${heading("Post Failed ❌")}
    ${paragraph(`Hey ${data.userName}, we weren't able to publish your post to <strong>${data.platform}</strong>.`)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Error:</strong> ${data.error}</p>
        </td>
      </tr>
    </table>
    ${retrySection}
  `;

  return baseTemplate(content);
}

/** Input for low-credits email */
export interface LowCreditsEmailData extends LowCreditsData {
  userName: string;
  topUpUrl?: string;
}

/**
 * "Your credits are running low ⚠️"
 */
export function lowCreditsEmail(data: LowCreditsEmailData): string {
  const topUpLink =
    data.topUpUrl ?? "https://app.purpleglow.social/billing";

  const content = `
    ${heading("Credits Running Low ⚠️")}
    ${paragraph(`Heads up, ${data.userName}! You have <strong>${data.remaining}</strong> of <strong>${data.total}</strong> credits remaining (${data.percentage}%).`)}
    ${paragraph("Top up now so your scheduled posts keep going out without interruption.")}

    <!-- Credits bar -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#f3f0ff;border-radius:8px;padding:4px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${Math.max(data.percentage, 5)}%" style="min-width:20px;">
            <tr>
              <td style="background:linear-gradient(90deg,#8b5cf6,#9333ea);height:12px;border-radius:6px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Top Up Credits", topUpLink)}
  `;

  return baseTemplate(content);
}

/** Input for weekly-digest email */
export interface WeeklyDigestEmailData extends WeeklyDigestData {
  userName: string;
  /** Formatted date range, e.g. "12–18 Jun 2025" */
  dateRange: string;
  totalPosts?: number;
  engagementRate?: number;
  dashboardUrl?: string;
}

/**
 * Weekly performance summary with key metrics.
 */
export function weeklyDigestEmail(data: WeeklyDigestEmailData): string {
  const dashboardLink =
    data.dashboardUrl ?? "https://app.purpleglow.social/dashboard";
  const trendEmoji =
    data.trend === "up" ? "📈" : data.trend === "down" ? "📉" : "➡️";
  const trendLabel =
    data.trend === "up"
      ? "Trending up — lekker work!"
      : data.trend === "down"
        ? "Trending down — let's turn it around"
        : "Holding steady";

  const metricsRows = [
    metricRow("Impressions", data.totalImpressions.toLocaleString("en-ZA")),
    ...(data.totalPosts !== undefined
      ? [metricRow("Posts Published", String(data.totalPosts))]
      : []),
    ...(data.engagementRate !== undefined
      ? [metricRow("Engagement Rate", `${data.engagementRate.toFixed(1)}%`)]
      : []),
    metricRow("Trend", `${trendEmoji} ${trendLabel}`),
  ].join("\n");

  const content = `
    ${heading("Your Weekly Digest 📊")}
    ${paragraph(`Hey ${data.userName}, here's how your content performed for <strong>${data.dateRange}</strong>.`)}

    <!-- Metrics table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border:1px solid #e9e5f5;border-radius:8px;overflow:hidden;">
      ${metricsRows}
    </table>

    ${data.topPostId ? paragraph(`Your top performing post: <a href="https://app.purpleglow.social/posts/${data.topPostId}" style="color:#8b5cf6;text-decoration:underline;">View post →</a>`) : ""}
    ${ctaButton("View Full Report", dashboardLink)}
  `;

  return baseTemplate(content);
}
