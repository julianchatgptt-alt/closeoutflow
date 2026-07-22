import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/e2e",
  testMatch: /logo-review\.spec\.ts/,
  timeout: 120_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_COMMAND ?? "pnpm --filter @closeoutflow/web dev",
    url: "http://127.0.0.1:3000/design",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "tablet-chromium",
      use: { ...devices["iPad Pro 11"], viewport: { width: 834, height: 1194 } }
    }
  ]
});
