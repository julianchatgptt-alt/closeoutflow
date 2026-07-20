import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import type { Database } from "@closeoutflow/db";

export type AuthCookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

export type AuthCookie = { name: string; value: string; options?: AuthCookieOptions };

export type ServerCookieAdapter = {
  getAll(): AuthCookie[];
  setAll(cookies: AuthCookie[]): void;
};

export type ServerAuthConfig = {
  url: string;
  anonKey: string;
  cookies: ServerCookieAdapter;
};

export function createServerAuthClient(config: ServerAuthConfig) {
  return createSupabaseServerClient<Database>(config.url, config.anonKey, {
    cookies: config.cookies
  });
}

export type VerifiedUserClient = {
  auth: {
    getUser(): Promise<{ data: { user: User | null }; error: unknown }>;
  };
};

export async function getVerifiedUser(client: VerifiedUserClient): Promise<User | null> {
  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requireVerifiedUser(client: VerifiedUserClient): Promise<User> {
  const user = await getVerifiedUser(client);
  if (!user) throw new Error("AUTHENTICATION_REQUIRED");
  return user;
}

export type EnsureProfileClient<TProfile = unknown> = {
  rpc(
    functionName: "ensure_profile",
    arguments_: Record<string, never>
  ): PromiseLike<{ data: TProfile | null; error: { message?: string } | null }>;
};

/**
 * Idempotent fallback for the auth.users provisioning trigger. The database
 * function uses INSERT ... ON CONFLICT so concurrent first requests are safe.
 */
export async function ensureProfile<TProfile>(
  client: EnsureProfileClient<TProfile>
): Promise<TProfile> {
  const { data, error } = await client.rpc("ensure_profile", {});
  if (error || !data) throw new Error("PROFILE_PROVISIONING_FAILED");
  return data;
}

export type VerifiedClaimsClient = {
  auth: {
    getClaims(): Promise<{
      data: { claims: { aal?: unknown } } | null;
      error: unknown;
    }>;
  };
};

export async function getVerifiedAssuranceLevel(
  client: VerifiedClaimsClient
): Promise<"aal1" | "aal2" | null> {
  const { data, error } = await client.auth.getClaims();
  if (error || !data) return null;
  return data.claims.aal === "aal2" ? "aal2" : data.claims.aal === "aal1" ? "aal1" : null;
}
