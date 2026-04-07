/**
 * Email sending service via Resend
 */

import { logger } from "@/lib/logger";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const emailConfig = {
  provider: (process.env.RESEND_API_KEY ? "resend" : "stub") as "resend" | "stub",
  fromAddress: process.env.EMAIL_FROM || "noreply@purpleglow.co.za",
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

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  if (!resend) {
    logger.warn("Resend not configured, skipping email", { to, subject });
    return { success: false, messageId: "stub", error: "No API key" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      logger.error("Resend error", { error, to, subject });
      return { success: false, messageId: "error", error: error.message };
    }

    logger.info("Email sent", { messageId: data?.id, to, subject });
    return { success: true, messageId: data?.id || "sent" };
  } catch (err) {
    logger.error("Email send failed", { err, to, subject });
    return { success: false, messageId: "error", error: String(err) };
  }
}
