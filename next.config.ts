import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Production-grade security headers applied to every route. */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for its hydration bootstrap scripts.
      // TODO: Replace with nonce-based CSP via middleware for stricter security.
      // Migration path to nonce-based CSP:
      // 1. Create middleware.ts that generates a nonce per request
      // 2. Pass nonce to Next.js via headers
      // 3. Replace 'unsafe-inline' with 'nonce-{value}' in CSP
      // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.fbcdn.net https://*.cdninstagram.com https://pbs.twimg.com https://abs.twimg.com https://*.licdn.com https://*.googleusercontent.com https://avatars.githubusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://api.polar.sh https://openrouter.ai https://*.openrouter.ai",
      "frame-ancestors 'none'",
    ].join("; ") + ";",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  /**
   * Skip Next.js's integrated TypeScript checking during build.
   * Standalone `tsc --noEmit` (which passes clean) runs in CI instead.
   * The integrated checker hangs indefinitely on this codebase (1.8GB RAM)
   * — a known Turbopack issue with large projects.
   */
  // TypeScript errors are caught by `tsc --noEmit` in CI (see .github/workflows/ci.yml).
  // Next.js built-in checker is disabled due to memory issues with Turbopack on large codebases.
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
