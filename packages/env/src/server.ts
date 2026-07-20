import "server-only";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { parseServerEnv } from "./index";

const validated = parseServerEnv(process.env);

export const serverEnv = createEnv({
  server: {
    APP_ENV: z.enum(["local", "test", "preview", "staging", "production"]),
    BUILD_VERSION: z.string(),
    APP_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
    OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
    OAUTH_MICROSOFT_CLIENT_ID: z.string().optional(),
    OAUTH_MICROSOFT_CLIENT_SECRET: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),
    EMAIL_PROVIDER: z.enum(["noop", "mailpit", "resend"]),
    MAILPIT_URL: z.url().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),
    SENTRY_DSN: z.url().optional(),
    SENTRY_ENABLED: z.boolean(),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    RECOVERY_CODE_PEPPER: z.string().min(32).optional()
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().optional()
  },
  runtimeEnv: {
    APP_ENV: validated.APP_ENV,
    BUILD_VERSION: validated.BUILD_VERSION,
    APP_URL: validated.APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: validated.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: validated.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: validated.SUPABASE_SERVICE_ROLE_KEY,
    OAUTH_GOOGLE_CLIENT_ID: validated.OAUTH_GOOGLE_CLIENT_ID,
    OAUTH_GOOGLE_CLIENT_SECRET: validated.OAUTH_GOOGLE_CLIENT_SECRET,
    OAUTH_MICROSOFT_CLIENT_ID: validated.OAUTH_MICROSOFT_CLIENT_ID,
    OAUTH_MICROSOFT_CLIENT_SECRET: validated.OAUTH_MICROSOFT_CLIENT_SECRET,
    INNGEST_EVENT_KEY: validated.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: validated.INNGEST_SIGNING_KEY,
    EMAIL_PROVIDER: validated.EMAIL_PROVIDER,
    MAILPIT_URL: validated.MAILPIT_URL,
    RESEND_API_KEY: validated.RESEND_API_KEY,
    EMAIL_FROM: validated.EMAIL_FROM,
    LOG_LEVEL: validated.LOG_LEVEL,
    SENTRY_DSN: validated.SENTRY_DSN,
    SENTRY_ENABLED: validated.SENTRY_ENABLED,
    NEXT_PUBLIC_POSTHOG_KEY: validated.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: validated.NEXT_PUBLIC_POSTHOG_HOST,
    UPSTASH_REDIS_REST_URL: validated.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: validated.UPSTASH_REDIS_REST_TOKEN,
    RECOVERY_CODE_PEPPER: validated.RECOVERY_CODE_PEPPER
  },
  skipValidation: false,
  emptyStringAsUndefined: true
});
