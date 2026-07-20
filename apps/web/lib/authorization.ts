import "server-only";

import { isFreshAuthentication } from "@closeoutflow/auth";
import { can, type AuthorizationResource, type Permission } from "@closeoutflow/authz";

import type { RequestAuthClient } from "./server-auth";

type OrganizationAuthorizationInput = {
  client: RequestAuthClient;
  userId: string;
  organizationId: string;
  permission: Permission;
  resource?: Partial<AuthorizationResource>;
};

function accountStatus(value: string | undefined) {
  return value === "active" || value === "suspended" || value === "deleted" ? value : "deleted";
}

function organizationStatus(value: string | undefined) {
  return value === "active" ||
    value === "suspended" ||
    value === "archived" ||
    value === "pending_deletion"
    ? value
    : "archived";
}

export async function authorizeOrganizationAction({
  client,
  userId,
  organizationId,
  permission,
  resource
}: OrganizationAuthorizationInput) {
  const [membershipResult, profileResult, organizationResult, claimsResult] = await Promise.all([
    client
      .from("organization_memberships")
      .select("role,status")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
    client.from("user_profiles").select("account_status").eq("id", userId).maybeSingle(),
    client.from("organizations").select("status").eq("id", organizationId).maybeSingle(),
    client.auth.getClaims()
  ]);
  const membership = membershipResult.data;
  const profile = profileResult.data;
  const organization = organizationResult.data;
  const claims = claimsResult.data?.claims;
  const authenticationTime =
    typeof claims?.auth_time === "number" ? new Date(claims.auth_time * 1000) : null;
  const assuranceLevel = claims?.aal === "aal2" ? "aal2" : "aal1";

  return can(
    {
      type: "internal_user",
      id: userId,
      ...(membership
        ? {
            membership: {
              organizationId,
              role: membership.role,
              status: membership.status
            }
          }
        : {}),
      accountStatus: accountStatus(profile?.account_status),
      organizationStatus: organizationStatus(organization?.status),
      assuranceLevel,
      reauthenticated: isFreshAuthentication(authenticationTime)
    },
    permission,
    {
      type: resource?.type ?? "organization",
      id: resource?.id ?? organizationId,
      organizationId,
      ...(resource?.ownerProtected === undefined
        ? {}
        : { ownerProtected: resource.ownerProtected }),
      ...(resource?.soleOwner === undefined ? {} : { soleOwner: resource.soleOwner }),
      ...(resource?.projectId === undefined ? {} : { projectId: resource.projectId }),
      ...(resource?.projectStatus === undefined ? {} : { projectStatus: resource.projectStatus })
    }
  );
}

export async function authorizeProjectAction({
  client,
  userId,
  organizationId,
  projectId,
  permission
}: {
  client: RequestAuthClient;
  userId: string;
  organizationId: string;
  projectId: string;
  permission: Permission;
}) {
  const [projectResult, membershipResult, profileResult, organizationResult, claimsResult] =
    await Promise.all([
      client.from("projects").select("organization_id,status").eq("id", projectId).maybeSingle(),
      client
        .from("organization_memberships")
        .select("id,role,status")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle(),
      client.from("user_profiles").select("account_status").eq("id", userId).maybeSingle(),
      client.from("organizations").select("status").eq("id", organizationId).maybeSingle(),
      client.auth.getClaims()
    ]);
  const project = projectResult.data;
  const membership = membershipResult.data;
  const assignmentResult =
    project?.organization_id === organizationId && membership
      ? await client
          .from("project_members")
          .select("project_role,status")
          .eq("project_id", projectId)
          .eq("membership_id", membership.id)
          .eq("status", "active")
          .maybeSingle()
      : { data: null };
  const claims = claimsResult.data?.claims;
  const authenticationTime =
    typeof claims?.auth_time === "number" ? new Date(claims.auth_time * 1000) : null;

  return can(
    {
      type: "internal_user",
      id: userId,
      ...(membership
        ? {
            membership: {
              organizationId,
              role: membership.role,
              status: membership.status
            }
          }
        : {}),
      accountStatus: accountStatus(profileResult.data?.account_status),
      organizationStatus: organizationStatus(organizationResult.data?.status),
      assuranceLevel: claims?.aal === "aal2" ? "aal2" : "aal1",
      reauthenticated: isFreshAuthentication(authenticationTime),
      projectAccess: project?.organization_id === organizationId,
      ...(assignmentResult.data?.project_role
        ? { projectRole: assignmentResult.data.project_role }
        : {})
    },
    permission,
    {
      type: "project",
      id: projectId,
      organizationId,
      projectId,
      projectStatus: project?.organization_id === organizationId ? project.status : "inaccessible"
    }
  );
}

export async function authorizePlatformAction({
  client,
  userId,
  permission,
  resource
}: {
  client: RequestAuthClient;
  userId: string;
  permission: Permission;
  resource: AuthorizationResource;
}) {
  const [roleResult, profileResult, claimsResult] = await Promise.all([
    client.from("platform_roles").select("role").eq("user_id", userId).maybeSingle(),
    client.from("user_profiles").select("account_status").eq("id", userId).maybeSingle(),
    client.auth.getClaims()
  ]);
  const claims = claimsResult.data?.claims;
  const platformRole =
    roleResult.data?.role === "platform_admin" || roleResult.data?.role === "platform_support"
      ? roleResult.data.role
      : undefined;

  return can(
    {
      type: "platform_admin",
      id: userId,
      accountStatus: accountStatus(profileResult.data?.account_status),
      ...(platformRole ? { platformRole } : {}),
      assuranceLevel: claims?.aal === "aal2" ? "aal2" : "aal1"
    },
    permission,
    resource
  );
}
