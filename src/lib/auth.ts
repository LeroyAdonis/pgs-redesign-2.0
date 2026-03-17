/**
 * Better-auth server instance
 *
 * Central auth configuration for Purple Glow Social 2.0.
 * Uses Drizzle adapter with the existing Neon PostgreSQL schema.
 *
 * Features:
 * - Email/password authentication
 * - Social OAuth (Google, GitHub)
 * - Database-backed sessions (not JWT)
 * - Custom `role` field on user for RBAC
 *
 * The schema tables (user, session, account, verification) are already
 * defined in `src/db/schema.ts` and match Better-auth's expected shape.
 * We pass them via the Drizzle adapter's `schema` option so Better-auth
 * uses our existing table definitions instead of generating its own.
 *
 * @see https://www.better-auth.com/docs/adapters/drizzle
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  /**
   * Drizzle adapter wired to our Neon PostgreSQL database.
   * `provider: "pg"` tells Better-auth we're on PostgreSQL.
   * `schema` passes our existing Drizzle table definitions so
   * Better-auth maps to them directly — no schema generation needed.
   */
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  /** Email + password sign-up/sign-in with password reset support */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true once email flows are tested
    sendResetPassword: async ({ user, url }) => {
      const { sendNotificationEmail } = await import("@/lib/notifications/email-service");
      await sendNotificationEmail(user.email, "Reset your password — Purple Glow Social", `<p>Hi ${user.name},</p><p>Click <a href="${url}">here</a> to reset your password.</p><p>If you didn't request this, ignore this email.</p>`);
    },
    sendVerificationEmail: async ({ user, url }) => {
      const { sendNotificationEmail } = await import("@/lib/notifications/email-service");
      await sendNotificationEmail(user.email, "Verify your email — Purple Glow Social", `<p>Hi ${user.name},</p><p>Click <a href="${url}">here</a> to verify your email address.</p>`);
    },
  },

  /**
   * Social OAuth providers.
   * Credentials are loaded from environment variables.
   * Providers are only registered when BOTH clientId and clientSecret
   * are set — this avoids Better-auth warnings about missing credentials.
   */
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },

  /**
   * Session configuration.
   * - 7-day expiry for sessions
   * - Sessions are refreshed when accessed within the last 24 hours
   *   of the updateAge window (i.e. session.updatedAt is bumped)
   */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
  },

  /**
   * Trusted origins for CORS / Origin header validation.
   * Better-auth rejects requests whose Origin header doesn't match
   * the base URL. We list all known origins here so the app is
   * resilient when developers run on a non-default port, or when
   * the production URL differs from BETTER_AUTH_URL.
   */
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : []),
  ],

  /**
   * Custom user fields.
   * The `role` field is already on our user table for RBAC.
   * We declare it here so Better-auth includes it in session data.
   */
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // not settable via sign-up
      },
    },
  },
});

/**
 * Export the auth type for use in auth-client.ts
 * This enables end-to-end type inference for the client.
 */
export type Auth = typeof auth;
