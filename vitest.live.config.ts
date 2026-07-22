import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/**/*.live.test.ts"],
    testTimeout: 30_000
  }
});
