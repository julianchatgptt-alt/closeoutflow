import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: true,
  timeout: 60_000,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm --filter @closeoutflow/web dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI && process.env.PLAYWRIGHT_MANAGED_HARNESS !== "1",
    timeout: 120000
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/owner.json" }
    },
    {
      name: "mobile-chrome",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: "playwright/.auth/owner.json" }
    },
    {
      name: "mobile-safari",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["iPhone 15"], storageState: "playwright/.auth/owner.json" }
    },
    {
      name: "firefox",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Firefox"], storageState: "playwright/.auth/owner.json" }
    },
    {
      name: "webkit",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Safari"], storageState: "playwright/.auth/owner.json" }
    }
  ]
});
