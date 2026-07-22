// @vitest-environment node

import { access } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("PWA manifest", () => {
  it("references valid any and maskable icon assets with an aligned theme", async () => {
    const value = manifest();
    const icons = value.icons ?? [];

    expect(value.theme_color).toBe("#102238");
    expect(value.background_color).toBe("#f1f3f6");
    expect(icons).toHaveLength(3);
    expect(icons.map((icon) => icon.purpose)).toEqual(["any", "any", "maskable"]);

    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.sizes).toMatch(/^\d+x\d+$/);
      await expect(
        access(path.join(process.cwd(), "apps", "web", "public", icon.src))
      ).resolves.toBeUndefined();
    }
  });

  it("uses the permanent public product brand", () => {
    const value = manifest();

    expect(value.name).toBe("Closeout");
    expect(value.short_name).toBe("Closeout");
    expect(value.description).toMatch(/construction closeout software/i);
    expect(JSON.stringify(value)).not.toContain("CloseoutFlow");
  });
});
