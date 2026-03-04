import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import eslintConfigPrettier from "eslint-config-prettier";
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
  globalIgnores([".next/**", "out/**", "node_modules/**", "coverage/**"]),
  ...nextConfig,
  {
    // jsx-a11y recommended rules — plugin already registered by eslint-config-next
    name: "jsx-a11y/recommended-rules",
    rules: a11yRulesAsWarnings,
  },
  eslintConfigPrettier,
]);
