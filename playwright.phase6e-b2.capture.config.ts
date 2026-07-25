import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 6E-B2 authenticated visual-acceptance capture. Signs in as the seeded
 * owner, then captures the priority production surfaces. Requires a seeded local
 * database (pnpm db:reset) and PHASE6E_B2_CAPTURE_DIR.
 */
export default defineConfig({
  testDir: ".",
  testMatch: /(?:auth\.setup\.ts|phase-6e-b2\.capture\.spec\.ts)/,
  timeout: 600_000,
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
      testMatch: /phase-6e-b2\.capture\.spec\.ts/,
      dependencies: ["setup-owner"],
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/owner.json" }
    }
  ]
});
