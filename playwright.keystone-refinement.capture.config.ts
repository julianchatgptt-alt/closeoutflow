import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /keystone-refinement\.capture\.spec\.ts/,
  timeout: 240_000,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3000",
    trace: "off"
  },
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_COMMAND ?? "pnpm --filter @closeoutflow/web dev",
    url: "http://127.0.0.1:3000/design",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
