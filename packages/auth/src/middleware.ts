import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

import type { Database } from "@closeoutflow/db";

import type { AuthCookie, ServerCookieAdapter } from "./server";

export type MiddlewareAuthConfig = {
  url: string;
  anonKey: string;
  cookies: ServerCookieAdapter;
};

export function createMiddlewareAuthClient(config: MiddlewareAuthConfig) {
  return createSupabaseServerClient<Database>(config.url, config.anonKey, {
    cookies: config.cookies
  });
}

export type { AuthCookie };
