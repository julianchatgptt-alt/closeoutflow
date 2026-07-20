import { describe, expect, it } from "vitest";

import { assertNoPublicSecrets, parseServerEnv, publicEnvKeys, serverSecretKeys } from "../index";

describe("environment validation", () => {
  it("throws clearly when production-required values are missing", () => {
    expect(() => parseServerEnv({ APP_ENV: "production" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL is required"
    );
  });

  it("parses a valid local environment with safe defaults", () => {
    const result = parseServerEnv({ APP_ENV: "local" });

    expect(result.APP_ENV).toBe("local");
    expect(result.EMAIL_PROVIDER).toBe("noop");
    expect(result.LOG_LEVEL).toBe("debug");
    expect(result.SENTRY_ENABLED).toBe(false);
  });

  it("uses a safe production log default and rejects invalid levels", () => {
    const production = parseServerEnv({
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "server-only-key",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "resend-key",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "upstash-token",
      RECOVERY_CODE_PEPPER: "production-recovery-pepper-at-least-32-characters"
    });

    expect(production.LOG_LEVEL).toBe("info");
    expect(() => parseServerEnv({ APP_ENV: "local", LOG_LEVEL: "verbose" })).toThrow();
  });

  it("keeps every secret server-only", () => {
    expect(() => assertNoPublicSecrets()).not.toThrow();
    expect(serverSecretKeys.every((key) => !key.startsWith("NEXT_PUBLIC_"))).toBe(true);
    expect(publicEnvKeys).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("requires each OAuth client id and secret as a pair", () => {
    expect(() =>
      parseServerEnv({
        APP_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "server-only-key",
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "resend-key",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "upstash-token",
        RECOVERY_CODE_PEPPER: "production-recovery-pepper-at-least-32-characters",
        OAUTH_GOOGLE_CLIENT_ID: "client-id"
      })
    ).toThrow("must be configured together");
  });
});
