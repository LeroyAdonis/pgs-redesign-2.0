import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Build a warnings-only version of jsx-a11y recommended rules.
 * The recommended config sets these to "error" — we downgrade to "warn"
 * so the team can incrementally fix a11y issues without blocking CI.
 */
const a11yRulesAsWarnings = Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.recommended.rules).map(
    ([rule, config]) => [rule, Array.isArray(config) ? ["warn", ...config.slice(1)] : "warn"],
  ),
);

export default defineConfig([
  globalIgnores([
    // Build & dependency artifacts
    ".next/**",
    "out/**",
    "node_modules/**",
    "coverage/**",
    // Test runner output
    "test-results/**",
    "playwright-report/**",
    // E2E / integration test scripts (not source)
    "e2e/**",
    // Static assets, screenshots, docs
    "screenshots/**",
    "docs/**",
    "public/**",
    "creds/**",
    // Root-level test & helper scripts
    "*.cjs",
    "*.py",
    "*.yaml",
    "*.html",
    "*.log",
    "*.txt",
    "*.png",
  ]),
  ...nextConfig,
  {
    // jsx-a11y recommended rules — plugin already registered by eslint-config-next
    name: "jsx-a11y/recommended-rules",
    rules: a11yRulesAsWarnings,
  },
  // Note: eslint-config-prettier removed — Prettier enforced via `npm run format:check`.
]);
