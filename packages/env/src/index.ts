import { z } from "zod";

export const publicEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST"
] as const;

export const serverSecretKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OAUTH_GOOGLE_CLIENT_SECRET",
  "OAUTH_MICROSOFT_CLIENT_SECRET",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN"
] as const;

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);
const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.url().optional());
const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

export const serverEnvSchema = z
  .object({
    APP_ENV: z.enum(["local", "test", "preview", "staging", "production"]).default("local"),
    BUILD_VERSION: z.string().default("development"),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    APP_URL: optionalUrl,
    OAUTH_GOOGLE_CLIENT_ID: optionalString,
    OAUTH_GOOGLE_CLIENT_SECRET: optionalString,
    OAUTH_MICROSOFT_CLIENT_ID: optionalString,
    OAUTH_MICROSOFT_CLIENT_SECRET: optionalString,
    INNGEST_EVENT_KEY: optionalString,
    INNGEST_SIGNING_KEY: optionalString,
    EMAIL_PROVIDER: z.enum(["noop", "mailpit", "resend"]).default("noop"),
    MAILPIT_URL: optionalUrl,
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    LOG_LEVEL: logLevelSchema.optional(),
    SENTRY_DSN: optionalUrl,
    SENTRY_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    NEXT_PUBLIC_POSTHOG_KEY: optionalString,
    NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString
  })
  .superRefine((value, context) => {
    if (!["staging", "production"].includes(value.APP_ENV)) return;

    const required = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY"
    ] as const;

    for (const key of required) {
      if (!value[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: key + " is required when APP_ENV is " + value.APP_ENV
        });
      }
    }

    for (const pair of [
      ["OAUTH_GOOGLE_CLIENT_ID", "OAUTH_GOOGLE_CLIENT_SECRET"],
      ["OAUTH_MICROSOFT_CLIENT_ID", "OAUTH_MICROSOFT_CLIENT_SECRET"]
    ] as const) {
      if (Boolean(value[pair[0]]) !== Boolean(value[pair[1]])) {
        context.addIssue({
          code: "custom",
          path: [pair[0]],
          message: pair.join(" and ") + " must be configured together"
        });
      }
    }
    if (!value.UPSTASH_REDIS_REST_URL || !value.UPSTASH_REDIS_REST_TOKEN) {
      context.addIssue({
        code: "custom",
        path: ["UPSTASH_REDIS_REST_URL"],
        message: "Upstash REST URL and token are required in staging and production"
      });
    }
    if (value.EMAIL_PROVIDER === "noop") {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_PROVIDER"],
        message: "A real email provider is required in staging and production"
      });
    }
    if (value.EMAIL_PROVIDER === "resend" && !value.RESEND_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required when EMAIL_PROVIDER is resend"
      });
    }
  })
  .transform((value) => ({
    ...value,
    LOG_LEVEL: value.LOG_LEVEL ?? (["local", "test"].includes(value.APP_ENV) ? "debug" : "info")
  }));

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function assertNoPublicSecrets(): void {
  for (const key of serverSecretKeys) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      throw new Error("Server secret may not be browser-exposed: " + key);
    }
  }
}
