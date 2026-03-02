/**
 * Email sending service (stub)
 *
 * Provides a single `sendNotificationEmail` function that will eventually
 * dispatch via an SMTP transport (Resend, SendGrid, Postmark, etc.).
 *
 * For now, every call logs the email details and returns a stub response
 * so the rest of the notification pipeline can be developed end-to-end.
 */

import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** SMTP / transactional-email provider settings */
export interface EmailConfig {
  /** e.g. "resend", "sendgrid", "postmark" */
  provider: "stub" | "resend" | "sendgrid" | "postmark";
  /** API key or SMTP credentials */
  apiKey?: string;
  /** Verified sender address */
  fromAddress: string;
  /** Human-readable sender name */
  fromName: string;
}

/**
 * Active email configuration.
 *
 * TODO: Read from environment variables / server config once a real
 * provider is wired up.
 */
export const emailConfig: EmailConfig = {
  provider: "stub",
  fromAddress: "notifications@purpleglow.social",
  fromName: "Purple Glow Social",
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  error?: string;
}

/**
 * Send an HTML notification email.
 *
 * Currently a **stub** — logs the email payload instead of delivering it.
 * Swap the implementation body once a real transport is configured in
 * `emailConfig`.
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  // TODO: Configure real SMTP transport (e.g., Resend, SendGrid, Postmark)
  logger.info("[email] Would send email", {
    to,
    subject,
    htmlLength: html.length,
    from: `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
  });

  return { success: true, messageId: `stub-${Date.now()}` };
}
