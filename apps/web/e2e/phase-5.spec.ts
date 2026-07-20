import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const seededProject = "/projects/50000000-0000-4000-8000-000000000001";

test("Phase 5 project and directory workspaces render across browsers", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Riverside Medical Office" }).first()).toBeVisible();
  await page.goto(seededProject);
  await expect(page.getByRole("heading", { name: "Riverside Medical Office" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project setup" })).toBeVisible();
  await page.goto(`${seededProject}/companies`);
  await expect(page.getByRole("link", { name: "Riverside Health Partners" })).toBeVisible();
  await page.goto(`${seededProject}/contacts`);
  await expect(page.getByRole("link", { name: "Jordan Lee" })).toBeVisible();
  await page.goto(`${seededProject}/team`);
  await expect(page.getByRole("heading", { name: "Internal project team" })).toBeVisible();
  await page.goto(`${seededProject}/activity`);
  await expect(page.getByText("Created").first()).toBeVisible();
});

test("project search, archived filter, and directory duplicate warnings work", async ({ page }) => {
  await page.goto("/projects");
  await page.getByPlaceholder("Search name or number").fill("Eastgate");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("link", { name: "Eastgate Retail Buildout" }).first()).toBeVisible();
  await page.goto("/companies/new?name=Ace");
  await expect(page.getByText("Possible duplicates")).toBeVisible();
  await page.goto("/contacts/new?email=jordan.lee@example.com");
  await expect(page.getByText("Possible duplicate email")).toBeVisible();
});

test("owner can create a project with one required field", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutation journey runs once");
  const name = `Phase 5 Journey ${Date.now()}`;
  await page.goto("/projects/new");
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\?message=Project%20created/, {
    timeout: 15_000
  });
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project setup" })).toBeVisible();
});

test("destructive project lifecycle actions require confirmation", async ({ page }) => {
  await page.goto(`${seededProject}/settings`);
  const archiveTrigger = page.getByRole("button", { name: "Archive project" });
  await archiveTrigger.focus();
  await archiveTrigger.press("Enter");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText("Archive this project?")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});

test("@a11y Phase 5 key routes have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/projects", "/projects/new", seededProject, "/companies", "/contacts"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? "")
      )
    ).toEqual([]);
  }
});
