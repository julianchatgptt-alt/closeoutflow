"use server";

import { permissions } from "@closeoutflow/authz";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActiveContext } from "../lib/active-context";
import { authorizeProjectAction } from "../lib/authorization";
import { projectRoles } from "../lib/phase-5-schemas";

function fail(projectId: string, message: string): never {
  redirect(`/projects/${projectId}/team?error=${encodeURIComponent(message)}`);
}
async function context(fd: FormData) {
  const projectId = z.uuid().safeParse(fd.get("projectId"));
  if (!projectId.success) fail("invalid", "Invalid project");
  const active = await getActiveContext();
  const auth = await authorizeProjectAction({
    client: active.client,
    userId: active.user.id,
    organizationId: active.organizationId,
    projectId: projectId.data,
    permission: permissions.projectManageTeam
  });
  if (!auth.allowed) fail(projectId.data, "Project team permission denied");
  return { ...active, projectId: projectId.data };
}
export async function assignProjectMemberAction(fd: FormData): Promise<void> {
  const membershipId = z.uuid().safeParse(fd.get("membershipId"));
  const role = z.enum(projectRoles).safeParse(fd.get("projectRole"));
  const { client, projectId } = await context(fd);
  if (!membershipId.success || !role.success)
    fail(projectId, "Select an active member and responsibility");
  const { error } = await client.rpc("assign_project_member", {
    target_project_id: projectId,
    target_membership_id: membershipId.data,
    target_project_role: role.data,
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The member could not be assigned");
  redirect(`/projects/${projectId}/team?message=Project teammate assigned`);
}
export async function changeProjectMemberRoleAction(fd: FormData): Promise<void> {
  const assignment = z.uuid().safeParse(fd.get("assignmentId"));
  const role = z.enum(projectRoles).safeParse(fd.get("projectRole"));
  const { client, projectId } = await context(fd);
  if (!assignment.success || !role.success) fail(projectId, "Select a valid responsibility");
  const { error } = await client.rpc("change_project_member_role", {
    target_project_member_id: assignment.data,
    target_project_role: role.data,
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The responsibility could not be changed");
  redirect(`/projects/${projectId}/team?message=Responsibility updated`);
}
export async function removeProjectMemberAction(fd: FormData): Promise<void> {
  const assignment = z.uuid().safeParse(fd.get("assignmentId"));
  const { client, projectId } = await context(fd);
  if (!assignment.success) fail(projectId, "Invalid assignment");
  const { error } = await client.rpc("remove_project_member", {
    target_project_member_id: assignment.data,
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The assignment could not be removed");
  redirect(`/projects/${projectId}/team?message=Project access removed`);
}
