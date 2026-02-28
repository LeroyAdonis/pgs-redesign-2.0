import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16 — no special config needed
  // for standard setups. Add options here as the project grows.
};

export default withNextIntl(nextConfig);
