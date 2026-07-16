// @vitest-environment node

import { access } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("PWA manifest", () => {
  it("references valid any and maskable icon assets with an aligned theme", async () => {
    const value = manifest();
    const icons = value.icons ?? [];

    expect(value.theme_color).toBe("#f8fafc");
    expect(icons).toHaveLength(2);
    expect(icons.map((icon) => icon.purpose)).toEqual(["any", "maskable"]);

    for (const icon of icons) {
      expect(icon.type).toBe("image/svg+xml");
      expect(icon.sizes).toBe("any");
      await expect(
        access(path.join(process.cwd(), "apps", "web", "public", icon.src))
      ).resolves.toBeUndefined();
    }
  });
});
