import { describe, expect, it } from "vitest";

import { localStorageAdapter, privateStorageKey } from "../index";

describe("storage adapter", () => {
  it("only returns private, expiring local URLs", async () => {
    const result = await localStorageAdapter.createUploadUrl(
      privateStorageKey("org/o/project/p/document/d/version/v/file.pdf"),
      60
    );

    expect(result.visibility).toBe("private");
    expect(result.url).toContain("private-storage.local.invalid");
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects unscoped or traversing keys", () => {
    expect(() => privateStorageKey("public/file.pdf")).toThrow();
    expect(() => privateStorageKey("org/o/../secret")).toThrow();
  });
});
