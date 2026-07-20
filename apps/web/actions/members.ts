"use server";

import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { permissions, type Permission } from "@closeoutflow/authz";
import { serverEnv } from "@closeoutflow/env/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createRequestAuthClient, getRequestUser } from "../lib/server-auth";
import { authorizeOrganizationAction } from "../lib/authorization";
import { rateLimitRequest } from "../lib/rate-limit";
import { sendIdentityEmail } from "../lib/email-delivery";

const membershipIdSchema = z.uuid();
const roleSchema = z.enum([
  "administrator",
  "project_manager",
  "closeout_coordinator",
  "internal_reviewer",
  "viewer"
]);

async function getActiveClient() {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  const organizationId = (await cookies()).get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const parsedOrganizationId = z.uuid().safeParse(organizationId);
  if (!user || !client || !parsedOrganizationId.success) {
    redirect("/select-organization");
  }

  const { data: membership } = await client
    .from("organization_memberships")
    .select("id,role")
    .eq("organization_id", parsedOrganizationId.data)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) redirect("/select-organization");

  return {
    client,
    user,
    organizationId: parsedOrganizationId.data,
    activeMembershipRole: membership.role
  };
}

function teamError(message: string): never {
  redirect(`/settings/team?error=${encodeURIComponent(message)}`);
}

export async function changeMemberRoleAction(formData: FormData): Promise<void> {
  const membershipId = membershipIdSchema.safeParse(formData.get("membershipId"));
  const role = roleSchema.safeParse(formData.get("role"));
  if (!membershipId.success || !role.success) teamError("Check the role change details");
  if (!(await rateLimitRequest("role-change", membershipId.data))) {
    teamError("Too many attempts. Try again later.");
  }
  const { client, user, organizationId } = await getActiveClient();
  const { data: target } = await client
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("id", membershipId.data)
    .maybeSingle();
  if (target?.organization_id !== organizationId) teamError("Invalid organization context");
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.membershipChangeRole,
    resource: {
      type: "organization_membership",
      id: membershipId.data,
      ownerProtected: target.role === "owner"
    }
  });
  if (!authorization.allowed) teamError("Role change permission denied");
  const { error } = await client.rpc("change_member_role", {
    target_membership_id: membershipId.data,
    target_role: role.data
  });
  if (error) teamError("The member role could not be changed");
  redirect("/settings/team?message=Member role updated");
}

export async function suspendMemberAction(formData: FormData): Promise<void> {
  await runMembershipAction(
    formData,
    "suspend_member",
    permissions.membershipSuspend,
    "Member suspended"
  );
}

export async function reactivateMemberAction(formData: FormData): Promise<void> {
  await runMembershipAction(
    formData,
    "reactivate_member",
    permissions.membershipReactivate,
    "Member reactivated"
  );
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  await runMembershipAction(
    formData,
    "remove_member",
    permissions.membershipRemove,
    "Member removed"
  );
}

async function runMembershipAction(
  formData: FormData,
  functionName: "suspend_member" | "reactivate_member" | "remove_member",
  permission: Permission,
  successMessage: string
): Promise<never> {
  const membershipId = membershipIdSchema.safeParse(formData.get("membershipId"));
  if (!membershipId.success) teamError("Invalid membership");
  const { client, user, organizationId } = await getActiveClient();
  const { data: target } = await client
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("id", membershipId.data)
    .maybeSingle();
  if (target?.organization_id !== organizationId) teamError("Invalid organization context");
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission,
    resource: {
      type: "organization_membership",
      id: membershipId.data,
      ownerProtected: target.role === "owner"
    }
  });
  if (!authorization.allowed) teamError("Membership update permission denied");
  const { error } = await client.rpc(functionName, {
    target_membership_id: membershipId.data
  });
  if (error) teamError("The membership could not be updated");
  redirect(`/settings/team?message=${encodeURIComponent(successMessage)}`);
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  await runInvitationAction(formData, "revoke_invitation", "Invitation revoked");
}

export async function resendInvitationAction(formData: FormData): Promise<void> {
  await runInvitationAction(formData, "resend_invitation", "Invitation resent");
}

async function runInvitationAction(
  formData: FormData,
  functionName: "revoke_invitation" | "resend_invitation",
  successMessage: string
): Promise<never> {
  const invitationId = z.uuid().safeParse(formData.get("invitationId"));
  if (!invitationId.success) teamError("Invalid invitation");
  if (
    functionName === "resend_invitation" &&
    !(await rateLimitRequest("invitation-resend", invitationId.data))
  ) {
    teamError("Too many attempts. Try again later.");
  }
  const { client, user, organizationId } = await getActiveClient();
  const { data: invitationContext } = await client
    .from("organization_invitations")
    .select("organization_id")
    .eq("id", invitationId.data)
    .maybeSingle();
  if (invitationContext?.organization_id !== organizationId) {
    teamError("Invalid organization context");
  }
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.membershipInvite,
    resource: { type: "organization_invitation", id: invitationId.data }
  });
  if (!authorization.allowed) teamError("Invitation permission denied");
  const invitation =
    functionName === "resend_invitation"
      ? (
          await client
            .from("organization_invitations")
            .select("email,organization_id")
            .eq("id", invitationId.data)
            .single()
        ).data
      : null;
  const result =
    functionName === "resend_invitation"
      ? await client.rpc("resend_invitation", { target_invitation_id: invitationId.data })
      : await client.rpc("revoke_invitation", { target_invitation_id: invitationId.data });
  const error = result.error;
  if (error) teamError("The invitation could not be updated");
  const rotatedToken = functionName === "resend_invitation" ? result.data : null;
  if (functionName === "resend_invitation" && invitation && typeof rotatedToken === "string") {
    const { data: organization } = await client
      .from("organizations")
      .select("display_name")
      .eq("id", invitation.organization_id)
      .single();
    const delivery = await sendIdentityEmail({
      kind: "invitation_reminder",
      to: invitation.email,
      actionUrl: new URL(
        `/invite/${rotatedToken}`,
        serverEnv.APP_URL ?? "http://127.0.0.1:3000"
      ).toString(),
      organizationName: organization?.display_name ?? "your organization",
      expiresIn: "14 days",
      idempotencyKey: `invitation-resend:${invitationId.data}:${Date.now()}`
    });
    if (delivery.status === "failed") teamError("Invitation rotated, but email delivery failed");
  }
  redirect(`/settings/team?message=${encodeURIComponent(successMessage)}`);
}

export async function leaveOrganizationAction(): Promise<void> {
  const { client, user, organizationId, activeMembershipRole } = await getActiveClient();
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.membershipLeave,
    resource: {
      type: "organization_membership",
      id: user.id,
      soleOwner: activeMembershipRole === "owner"
    }
  });
  if (!authorization.allowed) teamError("Transfer ownership before leaving this organization");
  const { error } = await client.rpc("leave_organization", {
    target_organization_id: organizationId
  });
  if (error) teamError("Transfer ownership before leaving this organization");
  (await cookies()).delete(ACTIVE_ORGANIZATION_COOKIE);
  redirect("/select-organization?message=You left the organization");
}

export async function initiateOwnershipTransferAction(formData: FormData): Promise<void> {
  const targetUserId = z.uuid().safeParse(formData.get("targetUserId"));
  if (!targetUserId.success) teamError("Select a valid member");
  if (!(await rateLimitRequest("ownership-transfer", targetUserId.data))) {
    teamError("Too many attempts. Try again later.");
  }
  const { client, user, organizationId } = await getActiveClient();
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.organizationTransferOwnership,
    resource: { type: "organization_ownership_transfer", id: targetUserId.data }
  });
  if (!authorization.allowed) teamError("Ownership transfer requires recent AAL2 verification");
  const { error } = await client.rpc("initiate_ownership_transfer", {
    target_organization_id: organizationId,
    target_user_id: targetUserId.data
  });
  if (error) teamError("Ownership transfer requires recent AAL2 verification");
  redirect("/settings/team?message=Ownership transfer requested");
}

export async function completeOwnershipTransferAction(formData: FormData): Promise<void> {
  const transferId = z.uuid().safeParse(formData.get("transferId"));
  if (!transferId.success) teamError("Invalid ownership transfer");
  const { client, user, organizationId } = await getActiveClient();
  const { data: transfer } = await client
    .from("organization_ownership_transfers")
    .select("organization_id")
    .eq("id", transferId.data)
    .maybeSingle();
  if (transfer?.organization_id !== organizationId) teamError("Invalid organization context");
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.organizationView,
    resource: { type: "organization_ownership_transfer", id: transferId.data }
  });
  if (!authorization.allowed) teamError("Ownership transfer requires recent AAL2 verification");
  const { error } = await client.rpc("complete_ownership_transfer", {
    target_transfer_id: transferId.data
  });
  if (error) teamError("Ownership transfer requires AAL2 and an active target membership");
  redirect("/settings/team?message=Ownership transferred");
}

export async function cancelOwnershipTransferAction(formData: FormData): Promise<void> {
  const transferId = z.uuid().safeParse(formData.get("transferId"));
  if (!transferId.success) teamError("Invalid ownership transfer");
  const { client, user, organizationId } = await getActiveClient();
  const { data: transfer } = await client
    .from("organization_ownership_transfers")
    .select("organization_id")
    .eq("id", transferId.data)
    .maybeSingle();
  if (transfer?.organization_id !== organizationId) teamError("Invalid organization context");
  const authorization = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.organizationTransferOwnership,
    resource: { type: "organization_ownership_transfer", id: transferId.data }
  });
  if (!authorization.allowed) teamError("Ownership transfer cancellation permission denied");
  const { error } = await client.rpc("cancel_ownership_transfer", {
    target_transfer_id: transferId.data
  });
  if (error) teamError("Ownership transfer could not be cancelled");
  redirect("/settings/team?message=Ownership transfer cancelled");
}
