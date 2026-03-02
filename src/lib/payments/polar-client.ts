/**
 * Polar.sh API client — lazy-initialized singleton.
 *
 * Uses the same globalThis caching pattern as src/db/index.ts
 * to prevent duplicate instances during Next.js HMR in development.
 *
 * Server-side only — never import this in client components.
 *
 * Usage:
 *   import { getPolar } from "@/lib/payments/polar-client";
 *   const polar = getPolar();
 *   const products = await polar.products.list({ organizationId: "..." });
 */

import { Polar } from "@polar-sh/sdk";

/**
 * Create a new Polar SDK instance.
 *
 * Fails fast with an actionable error if POLAR_ACCESS_TOKEN is missing.
 */
function createPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "POLAR_ACCESS_TOKEN is not set. Add it to .env.local for local dev, " +
        "or set it in your deployment environment (Vercel → Settings → Environment Variables). " +
        "Generate a token at https://polar.sh/settings",
    );
  }

  const server = (process.env.POLAR_ENVIRONMENT ?? "sandbox") as
    | "sandbox"
    | "production";

  return new Polar({ accessToken, server });
}

/**
 * Singleton Polar instance (lazy-initialized).
 *
 * In development, Next.js HMR can re-execute modules.
 * Caching on globalThis prevents creating duplicate clients.
 */
const globalForPolar = globalThis as unknown as {
  _polar: Polar | undefined;
};

/**
 * Get the Polar SDK client instance.
 *
 * Creates the instance on first call and reuses it for subsequent calls.
 * Throws immediately if POLAR_ACCESS_TOKEN is not configured.
 */
export function getPolar(): Polar {
  if (!globalForPolar._polar) {
    globalForPolar._polar = createPolarClient();
  }
  return globalForPolar._polar;
}
