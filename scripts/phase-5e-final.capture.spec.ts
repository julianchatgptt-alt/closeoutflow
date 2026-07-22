import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const output = path.join(
  os.homedir(),
  ".codex",
  "visualizations",
  "2026",
  "07",
  "22",
  "phase-5e-final"
);

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((value) => localStorage.setItem("cof-theme", value), theme);
  await page.reload({ waitUntil: "networkidle" });
}

async function capturePage(
  page: Page,
  file: string,
  route: string,
  options: { theme?: "light" | "dark"; viewport?: { width: number; height: number } } = {}
) {
  await page.setViewportSize(options.viewport ?? { width: 1440, height: 1000 });
  await page.goto(route, { waitUntil: "networkidle" });
  await setTheme(page, options.theme ?? "light");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: path.join(output, `${file}.png`), fullPage: true });
}

test("capture Phase 5E final visual review", async ({ page }) => {
  await mkdir(output, { recursive: true });

  await capturePage(page, "sign-in--desktop--light", "/sign-in");
  await capturePage(page, "sign-in--desktop--dark", "/sign-in", { theme: "dark" });
  await capturePage(page, "sign-in--mobile", "/sign-in", {
    viewport: { width: 390, height: 844 }
  });
  await capturePage(page, "sign-up--desktop", "/sign-up");
  await capturePage(page, "sign-up--mobile", "/sign-up", {
    viewport: { width: 390, height: 844 }
  });
  await capturePage(page, "forgot-password", "/forgot-password");
  await capturePage(
    page,
    "reset-password--expired",
    "/reset-password?error=This%20link%20has%20expired%20%E2%80%94%20request%20a%20new%20one."
  );
  await capturePage(page, "verify-email--pending", "/verify-email");
  await capturePage(page, "invitation--invalid", "/invite/phase-5e-invalid-token");
  await capturePage(
    page,
    "sign-in--error-state",
    "/sign-in?error=Email%20or%20password%20is%20incorrect"
  );

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/design", { waitUntil: "networkidle" });
  await setTheme(page, "light");
  await expect(page.getByTestId("final-logo-system")).toBeVisible();
  for (const [testId, file] of [
    ["final-logo-system", "final-logo-system"],
    ["final-shell-branding", "shell-expanded-collapsed-mobile"],
    ["final-auth-experience", "auth-experience-comparison"],
    ["final-invitation-onboarding", "invitation-onboarding-org-selection"],
    ["final-mfa-recovery", "mfa-recovery-codes"],
    ["final-system-states", "loading-success-error-permission"],
    ["final-email-social", "email-open-graph-assets"]
  ] as const) {
    await page
      .locator(".cof-toast")
      .evaluateAll((nodes) =>
        nodes.forEach((node) => ((node as HTMLElement).style.display = "none"))
      );
    await page.getByTestId(testId).screenshot({ path: path.join(output, `${file}.png`) });
  }

  const files = await import("node:fs/promises").then(({ readdir }) => readdir(output));
  expect(files.filter((file) => file.endsWith(".png"))).toHaveLength(17);
});
