"use server";

import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { permissions } from "@closeoutflow/authz";
import { serverEnv } from "@closeoutflow/env/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSafeRedirect } from "../lib/safe-redirect";
import { authorizeOrganizationAction } from "../lib/authorization";
import { rateLimitRequest } from "../lib/rate-limit";
import { sendIdentityEmail } from "../lib/email-delivery";
import { createRequestAuthClient, getRequestUser } from "../lib/server-auth";
import { shouldUseSecureCookies } from "../lib/cookie-security";

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const name = z.string().trim().min(2).max(120).safeParse(formData.get("displayName"));
  if (!name.success) redirect("/onboarding?error=Enter an organization name");
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/onboarding");
  if (!(await rateLimitRequest("organization-create", user.id))) {
    redirect("/onboarding?error=Too many attempts. Try again later.");
  }

  const { data, error } = await client.rpc("create_organization_with_owner", {
    target_display_name: name.data
  });
  if (error || !data) redirect("/onboarding?error=Unable to create the organization");
  (await cookies()).set(ACTIVE_ORGANIZATION_COOKIE, data, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(serverEnv.APP_ENV),
    path: "/"
  });
  redirect("/dashboard");
}

export async function selectOrganizationAction(
  organizationId: string,
  destination = "/dashboard"
): Promise<void> {
  const parsed = z.uuid().safeParse(organizationId);
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!parsed.success) redirect("/select-organization?error=Invalid organization identifier");
  if (!user) redirect("/sign-in?next=/select-organization");
  if (!client) redirect("/select-organization?error=Organization service unavailable");

  const { data } = await client
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", parsed.data)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!data) redirect("/select-organization?error=You no longer have access to that organization");

  (await cookies()).set(ACTIVE_ORGANIZATION_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(serverEnv.APP_ENV),
    path: "/"
  });
  redirect(getSafeRedirect(destination));
}

export async function selectOrganizationFormAction(formData: FormData): Promise<void> {
  const organizationId = formData.get("organizationId");
  const destination = formData.get("destination");
  await selectOrganizationAction(
    typeof organizationId === "string" ? organizationId : "",
    typeof destination === "string" ? destination : "/dashboard"
  );
}

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const organizationId = z.uuid().safeParse(formData.get("organizationId"));
  const email = z.email().max(254).safeParse(formData.get("email"));
  const role = z
    .enum([
      "administrator",
      "project_manager",
      "closeout_coordinator",
      "internal_reviewer",
      "viewer"
    ])
    .safeParse(formData.get("role"));
  if (!organizationId.success || !email.success || !role.success) {
    redirect("/settings/team?error=Check the invitation details");
  }
  const {
    client,
    user,
    organizationId: activeOrganizationId
  } = await getValidatedActiveOrganization();
  if (organizationId.data !== activeOrganizationId) {
    redirect("/settings/team?error=Invalid organization context");
  }
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId: activeOrganizationId,
    permission: permissions.membershipInvite
  });
  if (!authorization.allowed) redirect("/settings/team?error=Invitation permission denied");
  if (!(await rateLimitRequest("invitation-create", email.data))) {
    redirect("/settings/team?error=Too many invitations. Try again later.");
  }
  const { data, error } = await client.rpc("create_invitation", {
    target_organization_id: organizationId.data,
    target_email: email.data,
    target_role: role.data
  });
  const invitation = data?.[0];
  if (error || !invitation) redirect("/settings/team?error=Unable to create the invitation");
  const { data: organization } = await client
    .from("organizations")
    .select("display_name")
    .eq("id", organizationId.data)
    .single();
  const baseUrl = serverEnv.APP_URL ?? "http://127.0.0.1:3000";
  const result = await sendIdentityEmail({
    kind: "organization_invitation",
    to: email.data,
    actionUrl: new URL(`/invite/${invitation.token}`, baseUrl).toString(),
    organizationName: organization?.display_name ?? "your organization",
    expiresIn: "14 days",
    idempotencyKey: `invitation:${invitation.invitation_id}`
  });
  if (result.status === "failed") {
    redirect("/settings/team?error=Invitation created, but email delivery failed. Resend it.");
  }
  redirect("/settings/team?message=Invitation created");
}

async function getValidatedActiveOrganization() {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  const organizationId = (await cookies()).get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const parsed = z.uuid().safeParse(organizationId);
  if (!user || !client || !parsed.success) redirect("/select-organization");
  const { data: membership } = await client
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", parsed.data)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) redirect("/select-organization");
  return { client, user, organizationId: parsed.data };
}

export async function updateOrganizationAction(formData: FormData): Promise<void> {
  const displayName = z.string().trim().min(2).max(120).safeParse(formData.get("displayName"));
  const timezone = z.string().trim().min(1).max(80).safeParse(formData.get("timezone"));
  const locale = z
    .string()
    .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/)
    .safeParse(formData.get("locale"));
  if (!displayName.success || !timezone.success || !locale.success) {
    redirect("/settings/organization?error=Check the organization settings");
  }
  const { client, user, organizationId } = await getValidatedActiveOrganization();
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.organizationUpdate
  });
  if (!authorization.allowed) {
    redirect("/settings/organization?error=Organization update permission denied");
  }
  const { error } = await client.rpc("update_organization_identity", {
    target_organization_id: organizationId,
    target_display_name: displayName.data,
    target_timezone: timezone.data,
    target_locale: locale.data
  });
  if (error) redirect("/settings/organization?error=Organization settings could not be updated");
  redirect("/settings/organization?message=Organization settings updated");
}

export async function archiveOrganizationAction(): Promise<void> {
  const { client, user, organizationId } = await getValidatedActiveOrganization();
  if (!(await rateLimitRequest("organization-sensitive", organizationId))) {
    redirect("/settings/organization?error=Too many attempts. Try again later.");
  }
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.organizationArchive
  });
  if (!authorization.allowed) {
    redirect("/settings/organization?error=Recent sign-in and MFA are required");
  }
  const { error } = await client.rpc("archive_organization", {
    target_organization_id: organizationId
  });
  if (error) redirect("/settings/organization?error=The organization could not be archived");
  (await cookies()).delete(ACTIVE_ORGANIZATION_COOKIE);
  redirect("/select-organization?message=Organization archived");
}

export async function requestOrganizationDeletionAction(formData: FormData): Promise<void> {
  const confirmation = z.string().max(120).safeParse(formData.get("confirmation"));
  if (!confirmation.success)
    redirect("/settings/organization?error=Enter the organization name exactly");
  const { client, user, organizationId } = await getValidatedActiveOrganization();
  if (!(await rateLimitRequest("organization-sensitive", organizationId))) {
    redirect("/settings/organization?error=Too many attempts. Try again later.");
  }
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.organizationDelete
  });
  if (!authorization.allowed) {
    redirect("/settings/organization?error=Recent sign-in and MFA are required");
  }
  const { error } = await client.rpc("request_organization_deletion", {
    target_organization_id: organizationId,
    confirmation: confirmation.data
  });
  if (error) {
    redirect(
      "/settings/organization?error=Deletion requires the exact name, recent sign-in, and MFA"
    );
  }
  (await cookies()).delete(ACTIVE_ORGANIZATION_COOKIE);
  redirect("/select-organization?message=Organization deletion requested");
}
