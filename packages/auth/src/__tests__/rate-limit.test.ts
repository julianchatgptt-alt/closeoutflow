import { describe, expect, it } from "vitest";

import { enforceRateLimit, hashRateLimitIdentifier, LocalRateLimitStore } from "../rate-limit";

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
});
