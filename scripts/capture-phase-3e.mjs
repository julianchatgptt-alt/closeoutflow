import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PHASE3E_BASE_URL ?? "http://127.0.0.1:3000";
const outputRoot = process.env.PHASE3E_CAPTURE_DIR;

if (!outputRoot) {
  throw new Error("PHASE3E_CAPTURE_DIR is required");
}

const routes = [
  ["dashboard", "/dashboard"],
  ["projects", "/projects"],
  ["requirements", "/projects/harbor-medical/requirements"],
  ["team", "/team"],
  ["settings", "/settings/general"]
];

const viewports = [
  ["desktop", { width: 1440, height: 900 }],
  ["tablet-portrait", { width: 834, height: 1112 }],
  ["mobile", { width: 390, height: 844 }]
];

const themes = ["light", "dark"];
const browser = await chromium.launch();

async function prepare(page, route, theme) {
  await page.addInitScript(
    ({ selectedTheme }) => {
      localStorage.setItem("cof-theme", selectedTheme);
      localStorage.setItem("cof-sidebar", "expanded");
    },
    { selectedTheme: theme }
  );
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.evaluate((selectedTheme) => {
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
    document.documentElement.dataset.theme = selectedTheme;
    document.querySelectorAll("nextjs-portal").forEach((portal) => {
      portal.style.display = "none";
    });
  }, theme);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
}

async function capture(page, name, options = {}) {
  const file = path.join(outputRoot, `${name}.png`);
  await mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, animations: "disabled", ...options });
  console.log(file);
}

async function captureLocator(locator, name) {
  const file = path.join(outputRoot, `${name}.png`);
  await mkdir(path.dirname(file), { recursive: true });
  await locator.screenshot({ path: file, animations: "disabled" });
  console.log(file);
}

try {
  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const theme of themes) {
      for (const [routeName, route] of routes) {
        await prepare(page, route, theme);
        await capture(page, `${routeName}--${viewportName}--${theme}`, { fullPage: true });
      }
    }
    await context.close();
  }

  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();
  for (const theme of themes) {
    await prepare(page, "/dashboard", theme);
    await capture(page, `dashboard--desktop-wide--${theme}`, { fullPage: true });

    await prepare(page, "/design", theme);
    await capture(page, `design-gallery--desktop-wide--${theme}`, { fullPage: true });
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await prepare(page, "/dashboard", "light");
  await capture(page, "dashboard--desktop-compact--light", { fullPage: true });

  await page.setViewportSize({ width: 1112, height: 834 });
  await prepare(page, "/dashboard", "light");
  await capture(page, "dashboard--tablet-landscape--light", { fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page, "/companies", "light");
  await capture(page, "companies--desktop--light", { fullPage: true });

  await prepare(page, "/dashboard", "light");
  await capture(page, "sidebar--expanded--light");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await capture(page, "sidebar--collapsed--light");

  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, "/dashboard", "light");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await capture(page, "navigation-drawer--mobile--light");

  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page, "/design", "light");
  const stateSection = page
    .getByRole("heading", {
      name: "Empty, error, and permission states"
    })
    .locator("..");
  await captureLocator(
    stateSection.getByText("No requirements yet").locator(".."),
    "empty-state--component--light"
  );
  await captureLocator(
    stateSection.getByText("Something went wrong").locator(".."),
    "error-state--component--light"
  );
  await captureLocator(
    page.locator('[data-capture="dashboard-empty"]'),
    "dashboard-empty--component--light"
  );
  await captureLocator(
    page.locator('[data-capture="dashboard-loading"]'),
    "dashboard-loading--component--light"
  );
  await captureLocator(
    page.locator('[data-capture="dashboard-error"]'),
    "dashboard-error--component--light"
  );
  await desktop.close();

  for (const [deviceName, device] of [
    ["pixel-7", devices["Pixel 7"]],
    ["iphone-15", devices["iPhone 15"]]
  ]) {
    const context = await browser.newContext({ ...device });
    const devicePage = await context.newPage();
    for (const theme of themes) {
      await prepare(devicePage, "/dashboard", theme);
      await capture(devicePage, `dashboard--${deviceName}--${theme}`, { fullPage: true });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
