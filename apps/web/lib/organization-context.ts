import "server-only";

import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { cookies } from "next/headers";

import { createRequestAuthClient } from "./server-auth";

export type OrganizationOption = {
  id: string;
  displayName: string;
  role: string;
  membershipId: string;
};

export type OrganizationContext = {
  active: OrganizationOption | null;
  organizations: OrganizationOption[];
};

export async function resolveOrganizationContext(userId: string): Promise<OrganizationContext> {
  const client = await createRequestAuthClient();
  if (!client) return { active: null, organizations: [] };

  const { data: memberships } = await client
    .from("organization_memberships")
    .select("id, organization_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active");

  const organizationIds = (memberships ?? []).map((membership) => membership.organization_id);
  if (organizationIds.length === 0) return { active: null, organizations: [] };

  const { data: organizations } = await client
    .from("organizations")
    .select("id, display_name, status")
    .in("id", organizationIds)
    .eq("status", "active");

  const options = (memberships ?? []).flatMap((membership) => {
    const organization = organizations?.find(
      (candidate) => candidate.id === membership.organization_id
    );
    return organization
      ? [
          {
            id: organization.id,
            displayName: organization.display_name,
            role: membership.role,
            membershipId: membership.id
          }
        ]
      : [];
  });

  const preferredId = (await cookies()).get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const active =
    options.find((organization) => organization.id === preferredId) ?? options[0] ?? null;
  return { active, organizations: options };
}
