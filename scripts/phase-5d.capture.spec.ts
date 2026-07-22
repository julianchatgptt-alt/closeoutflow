import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outputRoot = process.env.PHASE5D_CAPTURE_DIR;
const seededProject = "/projects/50000000-0000-4000-8000-000000000001";

if (!outputRoot) throw new Error("PHASE5D_CAPTURE_DIR is required");

async function prepare(
  page: Page,
  route: string,
  viewport: { width: number; height: number },
  theme: "light" | "dark" = "light"
) {
  await page.setViewportSize(viewport);
  await page.addInitScript((selectedTheme: string) => {
    localStorage.setItem("cof-theme", selectedTheme);
    localStorage.setItem("cof-sidebar", "expanded");
  }, theme);
  await page.goto(route, { waitUntil: "networkidle" });
  await page.evaluate((selectedTheme: string) => {
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
    document.documentElement.dataset.theme = selectedTheme;
    document.querySelectorAll("nextjs-portal").forEach((portal) => {
      (portal as HTMLElement).style.display = "none";
    });
  }, theme);
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function capture(page: Page, id: string, fullPage = true) {
  await mkdir(outputRoot!, { recursive: true });
  await page.screenshot({
    path: path.join(outputRoot!, `${id}.png`),
    fullPage,
    animations: "disabled"
  });
}

test("capture the deterministic Phase 5D visual evidence manifest", async ({ page }) => {
  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 390, height: 844 };

  await prepare(page, "/projects", desktop);
  await capture(page, "projects--desktop--light");
  await prepare(page, "/projects", desktop, "dark");
  await capture(page, "projects--desktop--dark");
  await prepare(page, "/projects", mobile);
  await capture(page, "projects--mobile--light");

  await prepare(page, "/projects/new", desktop);
  await capture(page, "project-create--desktop--light");
  const longName =
    "West Campus Central Utility Plant Modernization and Commissioning Closeout Program";
  await page.getByLabel("Project name").fill(longName);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: longName })).toBeVisible();
  const longProjectUrl = new URL(page.url()).pathname;
  await capture(page, "project-overview--long-name--desktop--light");

  await prepare(page, seededProject, desktop);
  await capture(page, "project-overview--desktop--light");
  await capture(page, "setup-checklist--desktop--light", false);
  await prepare(page, seededProject, mobile);
  await capture(page, "project-overview--mobile--light");
  await prepare(page, `${seededProject}/settings`, desktop);
  await capture(page, "project-settings--desktop--light");

  const archive = page.getByRole("button", { name: "Archive project" });
  await archive.click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await capture(page, "project-archive-confirmation--desktop--light", false);
  await page.keyboard.press("Escape");

  for (const [id, route] of [
    ["companies--desktop--light", "/companies"],
    ["company-detail--desktop--light", "/companies/60000000-0000-4000-8000-000000000002"],
    ["contacts--desktop--light", "/contacts"],
    ["contact-detail--desktop--light", "/contacts/70000000-0000-4000-8000-000000000001"],
    ["project-companies--desktop--light", `${seededProject}/companies`],
    ["project-contacts--desktop--light", `${seededProject}/contacts`],
    ["project-team--desktop--light", `${seededProject}/team`],
    ["friendly-dates--desktop--light", seededProject]
  ] as const) {
    await prepare(page, route, desktop);
    await capture(page, id);
  }

  await prepare(page, "/companies/new?name=Ace", desktop);
  await expect(page.getByText("Possible duplicates")).toBeVisible();
  await capture(page, "company-duplicate-warning--desktop--light");

  for (const [id, route] of [
    ["project-companies--mobile--light", `${seededProject}/companies`],
    ["project-contacts--mobile--light", `${seededProject}/contacts`],
    ["project-team--mobile--light", `${seededProject}/team`]
  ] as const) {
    await prepare(page, route, mobile);
    await capture(page, id);
  }

  await page.context().clearCookies();
  await prepare(page, "/sign-in", desktop);
  await page.getByLabel("Email").fill("viewer@example.com");
  await page.getByLabel("Password").fill("Closeout-Test-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);
  await page.goto(seededProject);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await capture(page, "project-permission-denied--desktop--light");

  await prepare(page, "/design", desktop);
  await capture(page, "loading-and-error-states--desktop--light");

  console.log(`Long-name project capture route: ${longProjectUrl}`);
});
