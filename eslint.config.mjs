import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  globalIgnores([".next/**", "out/**", "node_modules/**", "coverage/**"]),
  ...nextConfig,
  eslintConfigPrettier,
]);
