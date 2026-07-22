import { expect, test } from "@playwright/test";
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
  "keystone-fold-refinement"
);

test("capture the neutral Keystone Fold refinement comparison", async ({ page }) => {
  await mkdir(output, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("cof-theme", "light"));
  await page.goto("/design", { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const review = page.getByTestId("keystone-refinement-review");
  await expect(review).toBeVisible();
  await expect(review.locator("article")).toHaveCount(3);
  await page
    .locator(".cof-toast")
    .evaluateAll((nodes) =>
      nodes.forEach((node) => ((node as HTMLElement).style.display = "none"))
    );
  await review.screenshot({ path: path.join(output, "keystone-refinement-comparison.png") });
});
