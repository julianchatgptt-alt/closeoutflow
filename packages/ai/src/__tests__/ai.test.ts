import { describe, expect, it } from "vitest";

import { noopAiAdapter } from "../index";

describe("AI adapter", () => {
  it("has suggestion-only output and no approval operation", async () => {
    expect(await noopAiAdapter.suggest({})).toEqual([]);
    expect("approve" in noopAiAdapter).toBe(false);
  });
});
