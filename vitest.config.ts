import { defineConfig } from "vitest/config";

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@sukara/astro-schema": new URL(
        "./packages/astro-schema/src/index.ts",
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    include: [
      "tests/**/*.test.ts",
      "packages/**/__tests__/**/*.test.ts",
      "apps/web/src/server/**/__tests__/**/*.test.ts",
      "apps/web/src/lib/**/__tests__/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
});
