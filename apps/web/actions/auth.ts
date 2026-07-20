"use server";

import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { serverEnv } from "@closeoutflow/env/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createRequestAuthClient } from "../lib/server-auth";
import { getSafeRedirect } from "../lib/safe-redirect";
import { rateLimitRequest } from "../lib/rate-limit";

const emailSchema = z.email().max(254);
const passwordSchema = z.string().min(12).max(128);

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function authError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function initializeOrganizationPreference(
  client: NonNullable<Awaited<ReturnType<typeof createRequestAuthClient>>>,
  userId: string
) {
  const { data: membership } = await client
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) return;
  (await cookies()).set(ACTIVE_ORGANIZATION_COOKIE, membership.organization_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(value(formData, "email").toLowerCase());
  const password = passwordSchema.safeParse(value(formData, "password"));
  const next = getSafeRedirect(value(formData, "next"));
  if (!email.success || !password.success) {
    authError("/sign-in", "Email or password is incorrect");
  }
  if (!(await rateLimitRequest("sign-in", email.data))) {
    authError("/sign-in", "Too many attempts. Try again later.");
  }

  const client = await createRequestAuthClient();
  if (!client) authError("/sign-in", "Authentication is temporarily unavailable");
  const { data: signIn, error } = await client.auth.signInWithPassword({
    email: email.data,
    password: password.data
  });
  if (error) authError("/sign-in", "Email or password is incorrect");
  await client.rpc("record_identity_event", {
    target_action: "auth.signed_in",
    target_metadata: { method: "password" }
  });
  await initializeOrganizationPreference(client, signIn.user.id);
  redirect(next);
}

export async function signUpAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(value(formData, "email").toLowerCase());
  const password = passwordSchema.safeParse(value(formData, "password"));
  const displayName = z.string().trim().min(2).max(100).safeParse(value(formData, "displayName"));
  const next = getSafeRedirect(value(formData, "next"), "/onboarding");
  if (!email.success || !password.success || !displayName.success) {
    authError("/sign-up", "Check the highlighted account details and try again");
  }
  if (!(await rateLimitRequest("sign-up", email.data))) {
    authError("/sign-up", "Too many attempts. Try again later.");
  }
  const client = await createRequestAuthClient();
  if (!client) authError("/sign-up", "Authentication is temporarily unavailable");
  const callback = new URL(
    `/auth/callback?next=${encodeURIComponent(next)}`,
    serverEnv.APP_URL ?? "http://127.0.0.1:3000"
  );
  const { error } = await client.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      emailRedirectTo: callback.toString(),
      data: { display_name: displayName.data }
    }
  });
  if (error) {
    authError("/sign-up", "If this email is available, check your inbox to continue");
  }
  redirect(`/verify-email?email=${encodeURIComponent(email.data)}`);
}

export async function requestPasswordResetAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(value(formData, "email").toLowerCase());
  if (email.success) {
    if (!(await rateLimitRequest("password-reset", email.data))) {
      redirect("/forgot-password?sent=1");
    }
    const client = await createRequestAuthClient();
    if (client) {
      const callback = new URL(
        "/auth/callback?next=/reset-password",
        serverEnv.APP_URL ?? "http://127.0.0.1:3000"
      );
      await client.auth.resetPasswordForEmail(email.data, { redirectTo: callback.toString() });
    }
  }
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const password = passwordSchema.safeParse(value(formData, "password"));
  const confirmation = value(formData, "confirmation");
  if (!password.success || password.data !== confirmation) {
    authError("/reset-password", "Passwords must match and contain at least 12 characters");
  }
  const client = await createRequestAuthClient();
  if (!client) authError("/reset-password", "This reset session is no longer valid");
  const {
    data: { user }
  } = await client.auth.getUser();
  if (!user) authError("/reset-password", "This reset session is no longer valid");
  if (!(await rateLimitRequest("password-reset-complete", user.id))) {
    authError("/reset-password", "Too many attempts. Try again later.");
  }
  const { error } = await client.auth.updateUser({ password: password.data });
  if (error) authError("/reset-password", "This reset session is no longer valid");
  const { error: auditError } = await client.rpc("record_identity_event", {
    target_action: "auth.password_changed",
    target_metadata: { via: "reset" }
  });
  if (auditError) authError("/reset-password", "Password change could not be recorded");
  await client.auth.signOut({ scope: "others" });
  redirect("/sign-in?message=Password updated. Sign in with your new password.");
}

export async function resendVerificationAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(value(formData, "email").toLowerCase());
  if (email.success) {
    if (!(await rateLimitRequest("verification-resend", email.data))) {
      redirect("/verify-email?sent=1");
    }
    const client = await createRequestAuthClient();
    if (client) await client.auth.resend({ type: "signup", email: email.data });
  }
  redirect("/verify-email?sent=1");
}

export async function signOutAction(): Promise<void> {
  const client = await createRequestAuthClient();
  if (client) {
    await client.rpc("record_identity_event", {
      target_action: "auth.signed_out",
      target_metadata: { scope: "current" }
    });
    await client.auth.signOut({ scope: "local" });
  }
  redirect("/sign-in");
}

export async function signOutEverywhereAction(): Promise<void> {
  const client = await createRequestAuthClient();
  if (client) {
    await client.rpc("record_identity_event", {
      target_action: "auth.signed_out",
      target_metadata: { scope: "global" }
    });
    await client.auth.signOut({ scope: "global" });
  }
  redirect("/sign-in?message=All sessions have been signed out.");
}

export async function oauthSignInAction(formData: FormData): Promise<void> {
  const provider = z.enum(["google", "azure"]).safeParse(value(formData, "provider"));
  const next = getSafeRedirect(value(formData, "next"), "/onboarding");
  if (!provider.success) authError("/sign-in", "OAuth provider is unavailable");
  const enabled =
    provider.data === "google"
      ? Boolean(serverEnv.OAUTH_GOOGLE_CLIENT_ID && serverEnv.OAUTH_GOOGLE_CLIENT_SECRET)
      : Boolean(serverEnv.OAUTH_MICROSOFT_CLIENT_ID && serverEnv.OAUTH_MICROSOFT_CLIENT_SECRET);
  if (!enabled) authError("/sign-in", "This sign-in provider is not configured");
  if (!(await rateLimitRequest("oauth-callback", provider.data))) {
    authError("/sign-in", "Too many attempts. Try again later.");
  }
  const client = await createRequestAuthClient();
  if (!client) authError("/sign-in", "Authentication is temporarily unavailable");
  const callback = new URL("/auth/callback", serverEnv.APP_URL ?? "http://127.0.0.1:3000");
  callback.searchParams.set("next", next);
  const { data, error } = await client.auth.signInWithOAuth({
    provider: provider.data,
    options: {
      redirectTo: callback.toString(),
      ...(provider.data === "azure" ? { scopes: "email openid profile" } : {})
    }
  });
  if (error || !data.url) authError("/sign-in", "Unable to start OAuth sign-in");
  redirect(data.url);
}
