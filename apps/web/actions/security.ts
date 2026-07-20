"use server";

import { createRecoveryCodes, findMatchingRecoveryHash } from "@closeoutflow/auth/recovery-codes";
import { redirect } from "next/navigation";
import { z } from "zod";

import { rateLimitRequest } from "../lib/rate-limit";
import { getSafeRedirect } from "../lib/safe-redirect";
import {
  createRequestAuthClient,
  getRequestUser,
  getVerifiedAssuranceLevel
} from "../lib/server-auth";

export type MfaActionState = {
  error?: string;
  message?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  recoveryCodes?: string[];
};

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);

async function requireSecurityClient() {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/account/security");
  return { client, user };
}

export async function startMfaEnrollmentAction(_previous: MfaActionState): Promise<MfaActionState> {
  void _previous;
  const { client, user } = await requireSecurityClient();
  if (!(await rateLimitRequest("mfa-attempt", user.id))) {
    return { error: "Too many attempts. Try again later." };
  }
  const { data: factors } = await client.auth.mfa.listFactors();
  if (factors?.totp.some((factor) => factor.status === "verified")) {
    return { error: "Two-factor authentication is already enabled." };
  }
  const { data, error } = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Closeout authenticator"
  });
  if (error || !data.totp) return { error: "Unable to start MFA enrollment." };
  return {
    message: "Scan the QR code, then enter the six-digit code.",
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret
  };
}

export async function verifyMfaEnrollmentAction(
  _previous: MfaActionState,
  formData: FormData
): Promise<MfaActionState> {
  const factorId = z.uuid().safeParse(formData.get("factorId"));
  const code = codeSchema.safeParse(formData.get("code"));
  const { client, user } = await requireSecurityClient();
  if (!factorId.success || !code.success || !(await rateLimitRequest("mfa-attempt", user.id))) {
    return { error: "The verification code is invalid or rate limited." };
  }
  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId: factorId.data,
    code: code.data
  });
  if (error) return { error: "The verification code is invalid or expired." };

  const { codes: recoveryCodes, hashes } = createRecoveryCodes();
  const { error: hashError } = await client.rpc("replace_recovery_code_hashes", {
    target_hashes: hashes
  });
  if (hashError) return { error: "MFA was enabled, but recovery codes could not be saved." };
  const { error: auditError } = await client.rpc("record_identity_event", {
    target_action: "auth.mfa_enrolled",
    target_metadata: { factor_type: "totp" }
  });
  if (auditError) return { error: "MFA enrollment could not be recorded." };
  return {
    message: "Two-factor authentication is enabled. Save these one-time recovery codes now.",
    recoveryCodes
  };
}

export async function removeMfaFactorAction(formData: FormData): Promise<void> {
  const factorId = z.uuid().safeParse(formData.get("factorId"));
  const { client, user } = await requireSecurityClient();
  if (
    !factorId.success ||
    !(await rateLimitRequest("mfa-attempt", user.id)) ||
    (await getVerifiedAssuranceLevel(client)) !== "aal2"
  ) {
    redirect("/account/security?error=Recent MFA verification is required");
  }
  const { error } = await client.auth.mfa.unenroll({ factorId: factorId.data });
  if (error) redirect("/account/security?error=Unable to remove the MFA factor");
  await client.from("user_profiles").update({ recovery_codes_hash: [] }).eq("id", user.id);
  const { error: auditError } = await client.rpc("record_identity_event", {
    target_action: "auth.mfa_removed",
    target_metadata: {}
  });
  if (auditError) redirect("/account/security?error=MFA removal could not be recorded");
  redirect("/account/security?message=Two-factor authentication removed");
}

export async function useRecoveryCodeAction(
  _previous: MfaActionState,
  formData: FormData
): Promise<MfaActionState> {
  const code = z.string().trim().min(10).max(32).safeParse(formData.get("recoveryCode"));
  const factorId = z.uuid().safeParse(formData.get("factorId"));
  const { client, user } = await requireSecurityClient();
  if (
    !code.success ||
    !factorId.success ||
    !(await rateLimitRequest("account-recovery", user.id))
  ) {
    return { error: "The recovery code is invalid or rate limited." };
  }
  const { data: profile } = await client
    .from("user_profiles")
    .select("recovery_codes_hash")
    .eq("id", user.id)
    .single();
  const match = findMatchingRecoveryHash(code.data, profile?.recovery_codes_hash ?? []);
  if (!match) return { error: "The recovery code is invalid or already used." };
  const { data: consumed } = await client.rpc("consume_recovery_code_hash", {
    target_hash: match
  });
  if (!consumed) return { error: "The recovery code is invalid or already used." };
  const { error } = await client.auth.mfa.unenroll({ factorId: factorId.data });
  if (error) {
    return {
      error: "The code was consumed, but the factor could not be removed. Contact support."
    };
  }
  return { message: "Recovery code accepted. The unavailable factor was removed." };
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const currentPassword = z.string().min(12).max(128).safeParse(formData.get("currentPassword"));
  const newPassword = z.string().min(12).max(128).safeParse(formData.get("newPassword"));
  const confirmation = z.string().safeParse(formData.get("confirmation"));
  const { client, user } = await requireSecurityClient();
  if (
    !currentPassword.success ||
    !newPassword.success ||
    !confirmation.success ||
    newPassword.data !== confirmation.data ||
    !(await rateLimitRequest("account-recovery", user.id))
  ) {
    redirect("/account/security?error=Check the password details");
  }
  const { error: reauthError } = await client.auth.signInWithPassword({
    email: user.email ?? "",
    password: currentPassword.data
  });
  if (reauthError) redirect("/account/security?error=Current password is incorrect");
  const { error } = await client.auth.updateUser({ password: newPassword.data });
  if (error) redirect("/account/security?error=Password could not be changed");
  const { error: auditError } = await client.rpc("record_identity_event", {
    target_action: "auth.password_changed",
    target_metadata: { via: "settings" }
  });
  if (auditError) redirect("/account/security?error=Password change could not be recorded");
  await client.auth.signOut({ scope: "others" });
  redirect("/account/security?message=Password changed and other sessions revoked");
}

export async function revokeOtherSessionsAction(): Promise<void> {
  const { client } = await requireSecurityClient();
  await client.auth.signOut({ scope: "others" });
  await client.rpc("record_identity_event", {
    target_action: "auth.session_revoked",
    target_metadata: { scope: "others" }
  });
  redirect("/account/sessions?message=Other sessions signed out");
}

export async function challengeMfaAction(formData: FormData): Promise<void> {
  const factorId = z.uuid().safeParse(formData.get("factorId"));
  const code = codeSchema.safeParse(formData.get("code"));
  const next = getSafeRedirect(String(formData.get("next") ?? ""), "/dashboard");
  const { client, user } = await requireSecurityClient();
  if (!factorId.success || !code.success || !(await rateLimitRequest("mfa-attempt", user.id))) {
    redirect(`/mfa/challenge?error=Invalid or rate-limited code&next=${encodeURIComponent(next)}`);
  }
  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId: factorId.data,
    code: code.data
  });
  if (error) {
    redirect(`/mfa/challenge?error=Invalid or expired code&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function requestReauthenticationAction(formData: FormData): Promise<void> {
  const next = getSafeRedirect(String(formData.get("next") ?? ""), "/account/security");
  const { client, user } = await requireSecurityClient();
  if (!(await rateLimitRequest("account-recovery", user.id))) {
    redirect(`/reauthenticate?error=Too many attempts&next=${encodeURIComponent(next)}`);
  }
  const { error } = await client.auth.reauthenticate();
  if (error) {
    redirect(
      `/reauthenticate?error=Unable to send a verification code&next=${encodeURIComponent(next)}`
    );
  }
  redirect(`/reauthenticate?sent=1&next=${encodeURIComponent(next)}`);
}

export async function verifyReauthenticationAction(formData: FormData): Promise<void> {
  const token = codeSchema.safeParse(formData.get("token"));
  const next = getSafeRedirect(String(formData.get("next") ?? ""), "/account/security");
  const { client, user } = await requireSecurityClient();
  if (!token.success || !user.email || !(await rateLimitRequest("account-recovery", user.id))) {
    redirect(`/reauthenticate?error=Invalid or rate-limited code&next=${encodeURIComponent(next)}`);
  }
  const { error } = await client.auth.verifyOtp({
    email: user.email,
    token: token.data,
    type: "reauthentication"
  });
  if (error) {
    redirect(`/reauthenticate?error=Invalid or expired code&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function requestEmailChangeAction(formData: FormData): Promise<void> {
  const newEmail = z.email().max(254).safeParse(formData.get("newEmail"));
  const currentPassword = z.string().min(12).max(128).safeParse(formData.get("currentPassword"));
  const { client, user } = await requireSecurityClient();
  if (
    !newEmail.success ||
    !currentPassword.success ||
    !user.email ||
    !(await rateLimitRequest("account-recovery", user.id))
  ) {
    redirect("/account/security?error=Check the email-change details");
  }
  const { error: reauthError } = await client.auth.signInWithPassword({
    email: user.email,
    password: currentPassword.data
  });
  if (reauthError) redirect("/account/security?error=Current password is incorrect");
  const { error } = await client.auth.updateUser({ email: newEmail.data });
  if (error) redirect("/account/security?error=Email change could not be started");
  redirect("/account/security?message=Confirm the change from the email messages sent to you");
}

export async function requestAccountDeletionAction(formData: FormData): Promise<void> {
  const confirmation = z.literal("DELETE").safeParse(formData.get("confirmation"));
  const { client, user } = await requireSecurityClient();
  if (!confirmation.success || !(await rateLimitRequest("account-recovery", user.id))) {
    redirect("/account/security?error=Type DELETE exactly");
  }
  const { error } = await client.rpc("request_account_deletion", {
    confirmation: confirmation.data
  });
  if (error) {
    redirect(
      "/account/security?error=Transfer owned organizations and complete recent MFA verification first"
    );
  }
  await client.auth.signOut({ scope: "global" });
  redirect("/sign-in?message=Account deletion requested");
}
