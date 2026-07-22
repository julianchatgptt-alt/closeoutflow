import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /(?:auth\.setup\.ts|phase-5d\.capture\.spec\.ts)/,
  timeout: 180_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "off"
  },
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_COMMAND ?? "pnpm --filter @closeoutflow/web dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    { name: "setup-owner", testMatch: /auth\.setup\.ts/ },
    {
      name: "capture",
      testMatch: /phase-5d\.capture\.spec\.ts/,
      dependencies: ["setup-owner"],
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/owner.json" }
    }
  ]
});
