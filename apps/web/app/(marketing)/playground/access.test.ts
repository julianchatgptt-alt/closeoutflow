import { describe, expect, it } from "vitest";

import { isPlaygroundEnabled } from "./access";

describe("playground runtime access", () => {
  it.each(["local", "test"] as const)("allows %s requests", (environment) => {
    expect(isPlaygroundEnabled(environment)).toBe(true);
  });

  it.each(["preview", "staging", "production"] as const)("denies %s requests", (environment) => {
    expect(isPlaygroundEnabled(environment)).toBe(false);
  });
});
