import { defineConfig, devices } from "@playwright/test";

const browserProfiles = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  {
    name: "tablet-portrait",
    use: { ...devices["iPad Pro 11"], viewport: { width: 834, height: 1194 } }
  },
  {
    name: "tablet-landscape",
    use: {
      ...devices["iPad Pro 11 landscape"],
      isMobile: false,
      viewport: { width: 1194, height: 834 }
    }
  },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } }
] as const;

export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: true,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // WebKit-based device profiles are memory intensive on Windows. A single
  // worker keeps the complete browser/a11y matrix deterministic instead of
  // allowing concurrent browser processes to exhaust the host.
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_COMMAND ?? "pnpm --filter @closeoutflow/web dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI && process.env.PLAYWRIGHT_MANAGED_HARNESS !== "1",
    timeout: 120000
  },
  projects: [
    ...browserProfiles.map((profile) => ({
      name: `setup-${profile.name}`,
      testMatch: /auth\.setup\.ts/,
      use: profile.use
    })),
    ...browserProfiles.map((profile) => ({
      name: profile.name,
      testIgnore: /auth\.setup\.ts/,
      dependencies: [`setup-${profile.name}`],
      use: {
        ...profile.use,
        storageState: `playwright/.auth/${profile.name}.json`
      }
    }))
  ]
});
