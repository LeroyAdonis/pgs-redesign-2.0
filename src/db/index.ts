/**
 * Database connection — Drizzle ORM + Neon HTTP
 *
 * Uses the Neon serverless HTTP driver for edge/serverless-compatible
 * queries. This is the correct driver for Next.js App Router on Vercel.
 *
 * For interactive transactions, use the WebSocket driver instead
 * (not needed for most CRUD operations).
 *
 * The connection is lazy-initialized on first use to avoid errors
 * during Next.js build when DATABASE_URL is not available.
 *
 * Usage:
 *   import { db } from "@/db";
 *   const orgs = await db.query.organization.findMany();
 */

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type DbClient = NeonHttpDatabase<typeof schema>;

/**
 * Create the Neon SQL query function.
 *
 * DATABASE_URL is validated at connection time — if missing, the error
 * is actionable ("Set DATABASE_URL in .env.local").
 */
function createDbClient(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local for local dev, " +
        "or set it in your deployment environment (Vercel → Settings → Environment Variables).",
    );
  }

  const sql = neon(url);
  return drizzle({ client: sql, schema });
}

/**
 * Singleton database instance (lazy-initialized).
 *
 * In development, Next.js HMR can create multiple instances.
 * We cache on globalThis to prevent connection leaks.
 *
 * The getter pattern defers connection creation until first property
 * access, so the module can be imported during build without error.
 */
const globalForDb = globalThis as unknown as {
  _db: DbClient | undefined;
};

export function getDb(): DbClient {
  if (!globalForDb._db) {
    globalForDb._db = createDbClient();
  }
  return globalForDb._db;
}

/**
 * Convenience `db` export — a Proxy that lazily initializes the
 * database connection on first property access.
 *
 * This preserves the ergonomic `db.query...` usage while avoiding
 * eager initialization that fails during Next.js build.
 */
export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
