import { describe, expect, it } from "vitest";

import { assertNoPublicSecrets, parseServerEnv, publicEnvKeys, serverSecretKeys } from "../index";

describe("environment validation", () => {
  it("throws clearly when production-required values are missing", () => {
    expect(() => parseServerEnv({ APP_ENV: "production" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL is required"
    );
  });

  it("parses a valid local environment with safe defaults", () => {
    const result = parseServerEnv({ APP_ENV: "local", LOG_LEVEL: "debug" });

    expect(result.APP_ENV).toBe("local");
    expect(result.EMAIL_PROVIDER).toBe("noop");
    expect(result.LOG_LEVEL).toBe("debug");
    expect(result.SENTRY_ENABLED).toBe(false);
  });

  it("keeps every secret server-only", () => {
    expect(() => assertNoPublicSecrets()).not.toThrow();
    expect(serverSecretKeys.every((key) => !key.startsWith("NEXT_PUBLIC_"))).toBe(true);
    expect(publicEnvKeys).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
