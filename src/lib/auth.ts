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

  /** Email + password sign-up/sign-in */
  emailAndPassword: {
    enabled: true,
  },

  /**
   * Social OAuth providers.
   * Credentials are loaded from environment variables.
   * If a provider's env vars are missing, that provider is simply
   * unavailable — Better-auth handles this gracefully.
   */
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
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
