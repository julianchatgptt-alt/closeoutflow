"use server";

import { permissions } from "@closeoutflow/authz";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveContext } from "../lib/active-context";
import { authorizeProjectAction } from "../lib/authorization";
import { companyRoles, formValue } from "../lib/phase-5-schemas";

function fail(id: string, msg: string): never {
  redirect(`/projects/${id}/companies?error=${encodeURIComponent(msg)}`);
}
async function context(fd: FormData) {
  const id = z.uuid().safeParse(fd.get("projectId"));
  if (!id.success) fail("invalid", "Invalid project");
  const a = await getActiveContext();
  const d = await authorizeProjectAction({
    client: a.client,
    userId: a.user.id,
    organizationId: a.organizationId,
    projectId: id.data,
    permission: permissions.projectManageCompanies
  });
  if (!d.allowed) fail(id.data, "Project company permission denied");
  return { ...a, projectId: id.data };
}
export async function assignProjectCompanyAction(fd: FormData): Promise<void> {
  const company = z.uuid().safeParse(fd.get("companyId"));
  const role = z.enum(companyRoles).safeParse(fd.get("role"));
  const { client, projectId } = await context(fd);
  if (!company.success || !role.success) fail(projectId, "Select a company and project role");
  const { error } = await client.rpc("assign_project_company", {
    target_project_id: projectId,
    target_company_id: company.data,
    relationship_data: {
      role: role.data,
      trade_scope: formValue(fd, "tradeScope"),
      contract_number: formValue(fd, "contractNumber")
    },
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The company could not be assigned");
  redirect(`/projects/${projectId}/companies?message=Company added to project`);
}
export async function removeProjectCompanyAction(fd: FormData): Promise<void> {
  const relationship = z.uuid().safeParse(fd.get("relationshipId"));
  const { client, projectId } = await context(fd);
  if (!relationship.success) fail(projectId, "Invalid company assignment");
  const { error } = await client.rpc("remove_project_company", {
    target_project_company_id: relationship.data,
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The company assignment could not be removed");
  redirect(`/projects/${projectId}/companies?message=Company removed from project`);
}
