import { defineConfig, devices } from "@playwright/test";

// Phase 6E-B1 — capture the dev-only /design review board against an already-running
// local dev server (the static gallery needs no database or auth).
export default defineConfig({
  testDir: "./scripts",
  testMatch: /phase-6e-b1\.capture\.spec\.ts/,
  timeout: 240_000,
  reporter: "list",
  use: {
    baseURL: process.env.PHASE6E_B1_BASE_URL ?? "http://localhost:3000",
    trace: "off"
  },
  projects: [{ name: "capture", use: { ...devices["Desktop Chrome"] } }]
});
