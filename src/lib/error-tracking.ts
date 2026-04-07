/**
 * Error tracking service
 *
 * Provides a thin abstraction for error reporting.
 * Currently logs to the structured logger. To enable Sentry:
 * 1. Install @sentry/nextjs
 * 2. Run `npx @sentry/wizard@latest -i nextjs`
 * 3. Set SENTRY_DSN in environment
 * 4. Update this module to call Sentry.captureException()
 */

import { logger } from "@/lib/logger";

interface ErrorContext {
  userId?: string;
  orgId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Report an error to the tracking service.
 */
export function captureError(error: Error, context?: ErrorContext): void {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
    ...(context?.metadata ?? {}),
  });

  // When Sentry is configured:
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Report a warning-level event.
 */
export function captureWarning(message: string, context?: ErrorContext): void {
  logger.warn(message, {
    ...context,
    ...(context?.metadata ?? {}),
  });
}

/**
 * Set user context for error reports.
 */
export function setUserContext(userId: string, email?: string): void {
  logger.debug("Error tracking user context set", { userId, email });
  // When Sentry is configured:
  // Sentry.setUser({ id: userId, email });
}
