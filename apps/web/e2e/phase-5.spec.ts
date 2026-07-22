import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const seededProject = "/projects/50000000-0000-4000-8000-000000000001";

test("Phase 5 project and directory workspaces render across browsers", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Riverside Medical Office" }).first()).toBeVisible();
  await page.goto(seededProject);
  await expect(page.getByRole("heading", { name: "Riverside Medical Office" })).toBeVisible();
  await expect(page.getByLabel("Breadcrumbs")).toContainText("Riverside Medical Office");
  await expect(page.getByLabel("Breadcrumbs")).not.toContainText("50000000");
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

test("project surfaces do not expose route UUIDs or raw date-only values", async ({ page }) => {
  for (const route of ["/projects", seededProject, `${seededProject}/activity`]) {
    await page.goto(route);
    const visibleText = await page.locator("main").innerText();
    expect(visibleText).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
    );
    expect(visibleText).not.toMatch(/\b20\d{2}-\d{2}-\d{2}\b/);
  }
});

test("project navigation stays inside the desktop viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Exact desktop breakpoint runs once");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(seededProject);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);
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

test("missing and inaccessible projects fail closed without leaking project identity", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Identity switching runs once");
  const missingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  await page.goto(`/projects/${missingId}`);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(missingId);

  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("viewer@example.com");
  await page.getByLabel("Password").fill("Closeout-Test-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);
  await page.goto(seededProject);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Riverside Medical Office");
  await expect(page.locator("body")).not.toContainText("50000000");
});

test("relationship and internal-team language stays distinct on responsive surfaces", async ({
  page
}) => {
  await page.goto(`${seededProject}/companies`);
  await expect(
    page.getByText(
      "Reuse organization companies and give each one a project-specific role on Riverside Medical Office."
    )
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add an existing company" })).toBeVisible();

  await page.goto(`${seededProject}/contacts`);
  await expect(
    page.getByText(
      "Reuse people from the organization directory without creating user accounts for Riverside Medical Office."
    )
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add an existing contact" })).toBeVisible();

  await page.goto(`${seededProject}/team`);
  await expect(
    page.getByText(
      "Project assignments control access and responsibility for Riverside Medical Office. Organization membership remains separate."
    )
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assign teammate" })).toBeVisible();
});

test("stale project edits explain reconciliation and provide a reload path", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutation journey runs once");
  await page.goto(`${seededProject}/settings`);
  await page.getByLabel("Description").fill("Pending stale client edit");
  const concurrencyToken = page.locator('input[name="updatedAt"]');
  await concurrencyToken.evaluate((input: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "2020-01-01T00:00:00.000Z");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(concurrencyToken).toHaveValue("2020-01-01T00:00:00.000Z");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page).toHaveURL(/\?error=/, { timeout: 15_000 });
  await expect(page.locator('main [role="alert"]')).toContainText(
    "This project changed while you were editing. Reload and try again."
  );
  await expect(page.getByRole("link", { name: "Reload current project" })).toHaveAttribute(
    "href",
    `${seededProject}/settings`
  );
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
  test.setTimeout(180_000);
  const routes = [
    "/projects",
    "/projects/new",
    seededProject,
    `${seededProject}/settings`,
    `${seededProject}/companies`,
    `${seededProject}/contacts`,
    `${seededProject}/team`,
    "/companies",
    "/companies/new?name=Ace",
    "/contacts",
    "/contacts/new?email=jordan.lee@example.com"
  ];
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (selectedTheme) => localStorage.setItem("cof-theme", selectedTheme),
      theme
    );
    for (const route of routes) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter((violation) =>
          ["critical", "serious"].includes(violation.impact ?? "")
        ),
        `${theme}: ${route}`
      ).toEqual([]);
    }
  }
});
