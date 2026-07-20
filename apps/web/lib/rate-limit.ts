import "server-only";

import {
  enforceRateLimit,
  hashRateLimitIdentifier,
  LocalRateLimitStore,
  type RateLimitRule,
  type RateLimitStore,
  UpstashRateLimitStore
} from "@closeoutflow/auth/rate-limit";
import { serverEnv } from "@closeoutflow/env/server";
import { headers } from "next/headers";

export type LimitedOperation =
  | "sign-up"
  | "sign-in"
  | "verification-resend"
  | "password-reset"
  | "oauth-callback"
  | "invitation-create"
  | "invitation-resend"
  | "invitation-accept"
  | "mfa-attempt"
  | "organization-create"
  | "role-change"
  | "ownership-transfer"
  | "account-recovery";

const rules: Record<LimitedOperation, RateLimitRule> = {
  "sign-up": { limit: 5, windowSeconds: 900 },
  "sign-in": { limit: 10, windowSeconds: 900 },
  "verification-resend": { limit: 3, windowSeconds: 900 },
  "password-reset": { limit: 3, windowSeconds: 900 },
  "oauth-callback": { limit: 20, windowSeconds: 300 },
  "invitation-create": { limit: 20, windowSeconds: 3600 },
  "invitation-resend": { limit: 10, windowSeconds: 3600 },
  "invitation-accept": { limit: 10, windowSeconds: 900 },
  "mfa-attempt": { limit: 10, windowSeconds: 900 },
  "organization-create": { limit: 5, windowSeconds: 3600 },
  "role-change": { limit: 30, windowSeconds: 3600 },
  "ownership-transfer": { limit: 5, windowSeconds: 3600 },
  "account-recovery": { limit: 5, windowSeconds: 900 }
};

const localStore = new LocalRateLimitStore();

function getStore(): RateLimitStore {
  if (serverEnv.UPSTASH_REDIS_REST_URL && serverEnv.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimitStore(
      serverEnv.UPSTASH_REDIS_REST_URL,
      serverEnv.UPSTASH_REDIS_REST_TOKEN
    );
  }
  return localStore;
}

export async function rateLimitRequest(
  operation: LimitedOperation,
  identifier = "anonymous"
): Promise<boolean> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = await hashRateLimitIdentifier(operation, `${ip}:${identifier}`);
  try {
    return (await enforceRateLimit(getStore(), `cof:rl:${operation}:${key}`, rules[operation]))
      .allowed;
  } catch {
    return serverEnv.APP_ENV === "local" || serverEnv.APP_ENV === "test";
  }
}
