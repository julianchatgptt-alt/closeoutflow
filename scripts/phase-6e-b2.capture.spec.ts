import { test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Phase 6E-B2 authenticated visual-acceptance capture.
 *
 * Signs in as the seeded organization owner (via the shared auth.setup) and
 * captures the priority production surfaces from the acceptance matrix across
 * the required viewports and both themes. Read-only navigation only — it never
 * mutates data.
 */

const outputRoot = process.env.PHASE6E_B2_CAPTURE_DIR;
if (!outputRoot) throw new Error("PHASE6E_B2_CAPTURE_DIR is required");

const seededProject = "/projects/50000000-0000-4000-8000-000000000001"; // Riverside Medical Office (active)
const emptyProject = "/projects/50000000-0000-4000-8000-000000000002"; // Eastgate Retail Buildout (draft)
const register = `${seededProject}/requirements`;
const publishedTemplate = "/templates/b0000000-0000-4000-8000-000000000001";

const desktopXL = { width: 1920, height: 1080 };
const desktop = { width: 1440, height: 900 };
const laptop = { width: 1366, height: 768 };
const tabletLandscape = { width: 1112, height: 834 };
const tabletPortrait = { width: 834, height: 1112 };
const pixel = { width: 412, height: 915 };
const iphone = { width: 393, height: 852 };

async function prepare(
  page: Page,
  route: string,
  viewport: { width: number; height: number },
  theme: "light" | "dark" = "light",
  sidebar: "expanded" | "collapsed" = "expanded"
) {
  await page.setViewportSize(viewport);
  await page.addInitScript(
    ([selectedTheme, selectedSidebar]: [string, string]) => {
      localStorage.setItem("cof-theme", selectedTheme);
      localStorage.setItem("cof-sidebar", selectedSidebar);
    },
    [theme, sidebar]
  );
  await page.goto(route, { waitUntil: "networkidle" });
  await page.evaluate(
    ([selectedTheme, selectedSidebar]: [string, string]) => {
      document.documentElement.classList.toggle("dark", selectedTheme === "dark");
      document.documentElement.dataset.theme = selectedTheme;
      document.documentElement.dataset.sidebar = selectedSidebar;
      document.querySelectorAll("nextjs-portal").forEach((portal) => {
        (portal as HTMLElement).style.display = "none";
      });
    },
    [theme, sidebar]
  );
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

test("capture the Phase 6E-B2 authenticated acceptance matrix", async ({ page }) => {
  test.setTimeout(600_000);

  // ---- Dashboard (the rebuilt flagship) ----
  await prepare(page, "/dashboard", desktopXL);
  await capture(page, "dashboard--1920--light");
  await prepare(page, "/dashboard", desktop, "dark");
  await capture(page, "dashboard--desktop--dark");
  await prepare(page, "/dashboard", laptop);
  await capture(page, "dashboard--laptop--light");
  await prepare(page, "/dashboard", tabletPortrait);
  await capture(page, "dashboard--tablet-portrait--light");
  await prepare(page, "/dashboard", pixel);
  await capture(page, "dashboard--pixel--light");
  await prepare(page, "/dashboard", iphone, "dark");
  await capture(page, "dashboard--iphone--dark");
  // Collapsed shell on the dashboard.
  await prepare(page, "/dashboard", desktop, "light", "collapsed");
  await capture(page, "shell--collapsed--desktop--light", false);
  await prepare(page, "/dashboard", desktop, "dark", "collapsed");
  await capture(page, "shell--collapsed--desktop--dark", false);

  // ---- Projects list ----
  await prepare(page, "/projects", desktop);
  await capture(page, "projects--desktop--light");
  await prepare(page, "/projects", desktop, "dark");
  await capture(page, "projects--desktop--dark");
  await prepare(page, "/projects", pixel);
  await capture(page, "projects--pixel--light");

  // ---- Project overview + setup checklist ----
  await prepare(page, seededProject, desktop);
  await capture(page, "project-overview--desktop--light");
  await prepare(page, emptyProject, desktop);
  await capture(page, "project-overview--setup-focal--desktop--light");

  // ---- Requirement register (flagship) ----
  await prepare(page, register, desktopXL);
  await capture(page, "register--1920--light", false);
  await prepare(page, register, desktop, "dark");
  await capture(page, "register--desktop--dark", false);
  await prepare(page, `${register}?attention=1`, desktop);
  await capture(page, "register--attention--desktop--light", false);
  await prepare(page, register, tabletLandscape);
  await capture(page, "register--tablet-landscape--light", false);
  await prepare(page, register, iphone);
  await capture(page, "register--iphone--light");
  // Bulk-selection bar.
  await prepare(page, register, desktop);
  const checkboxes = page.getByRole("checkbox", { name: /^Select / });
  if (await checkboxes.count()) {
    await checkboxes.nth(0).check();
    if ((await checkboxes.count()) > 1) await checkboxes.nth(1).check();
    await capture(page, "register--bulk--desktop--light", false);
  }

  // ---- Template library (rebuilt as cards) ----
  await prepare(page, "/templates", desktop);
  await capture(page, "templates--desktop--light");
  await prepare(page, "/templates", desktop, "dark");
  await capture(page, "templates--desktop--dark");
  await prepare(page, "/templates", pixel);
  await capture(page, "templates--pixel--light");
  await prepare(page, publishedTemplate, desktop);
  await capture(page, "template-detail--desktop--light");

  // ---- Directories ----
  await prepare(page, "/companies", desktop);
  await capture(page, "companies--desktop--light");
  await prepare(page, "/companies", desktop, "dark");
  await capture(page, "companies--desktop--dark");
  await prepare(page, "/contacts", desktop);
  await capture(page, "contacts--desktop--light");
  await prepare(page, "/contacts", pixel);
  await capture(page, "contacts--pixel--light");

  // ---- Team & settings ----
  await prepare(page, "/settings/team", desktop);
  await capture(page, "settings-team--desktop--light");
  await prepare(page, "/settings/team", desktop, "dark");
  await capture(page, "settings-team--desktop--dark");
  await prepare(page, "/settings/organization", desktop);
  await capture(page, "settings-organization--desktop--light");
  await prepare(page, "/settings/organization", pixel);
  await capture(page, "settings--pixel--light");

  // ---- Sign in (signed-out surface; clear storage first) ----
  await page.context().clearCookies();
  await prepare(page, "/sign-in", desktop);
  await capture(page, "sign-in--desktop--light");
  await prepare(page, "/sign-in", iphone);
  await capture(page, "sign-in--iphone--light");
});
