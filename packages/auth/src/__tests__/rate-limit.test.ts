import { describe, expect, it } from "vitest";

import {
  allowRateLimitStoreFailure,
  enforceRateLimit,
  hashRateLimitIdentifier,
  LocalRateLimitStore,
  UpstashRateLimitStore
} from "../rate-limit";

describe("authentication rate limits", () => {
  it("enforces a fixed-window threshold", async () => {
    const store = new LocalRateLimitStore();
    expect((await enforceRateLimit(store, "key", { limit: 2, windowSeconds: 60 })).allowed).toBe(
      true
    );
    expect((await enforceRateLimit(store, "key", { limit: 2, windowSeconds: 60 })).allowed).toBe(
      true
    );
    expect((await enforceRateLimit(store, "key", { limit: 2, windowSeconds: 60 })).allowed).toBe(
      false
    );
  });

  it("hashes normalized identifiers without retaining raw email or tokens", async () => {
    const key = await hashRateLimitIdentifier("sign-in", " Person@Example.com ");
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain("person@example.com");
    expect(key).toBe(await hashRateLimitIdentifier("sign-in", "person@example.com"));
    expect(key).not.toBe(await hashRateLimitIdentifier("reset", "person@example.com"));
  });

  it("fails closed outside local and test when the distributed store is unavailable", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("store offline");
    };
    try {
      const store = new UpstashRateLimitStore("https://rate-limit.invalid", "test-token");
      await expect(store.increment("key", 60)).rejects.toThrow("store offline");
      expect(allowRateLimitStoreFailure("local")).toBe(true);
      expect(allowRateLimitStoreFailure("test")).toBe(true);
      expect(allowRateLimitStoreFailure("preview")).toBe(false);
      expect(allowRateLimitStoreFailure("staging")).toBe(false);
      expect(allowRateLimitStoreFailure("production")).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
