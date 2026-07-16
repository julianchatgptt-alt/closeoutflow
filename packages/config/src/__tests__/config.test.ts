// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("shared configuration", () => {
  it("loads the ESLint flat config with boundary rules", async () => {
    const { default: config } = await import("../../eslint.config.mjs");
    expect(Array.isArray(config)).toBe(true);
    expect(
      config.some((entry) => {
        const rules = "rules" in entry ? entry.rules : undefined;
        return Boolean(rules?.["no-restricted-imports"]);
      })
    ).toBe(true);
    expect(
      config.some((entry) => {
        const files = "files" in entry ? entry.files : undefined;
        return Array.isArray(files) && files.includes("packages/ui/**/*.{ts,tsx}");
      })
    ).toBe(true);
  }, 15_000);
});
