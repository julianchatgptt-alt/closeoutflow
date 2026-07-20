"use server";

import { permissions } from "@closeoutflow/authz";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActiveContext } from "../lib/active-context";
import { authorizeOrganizationAction, authorizeProjectAction } from "../lib/authorization";
import { formValue, projectCreateSchema, projectUpdateSchema } from "../lib/phase-5-schemas";
import { rateLimitRequest } from "../lib/rate-limit";

function projectError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const parsed = projectCreateSchema.safeParse({
    name: formValue(formData, "name"),
    projectNumber: formValue(formData, "projectNumber"),
    projectType: formValue(formData, "projectType")
  });
  if (!parsed.success)
    projectError("/projects/new", parsed.error.issues[0]?.message ?? "Check the project details");
  const { client, user, organizationId } = await getActiveContext();
  if (!(await rateLimitRequest("project-mutation", user.id)))
    projectError("/projects/new", "Too many attempts. Try again shortly.");
  const decision = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.projectCreate,
    resource: { type: "project", id: organizationId }
  });
  if (!decision.allowed)
    projectError("/projects/new", "You do not have permission to create projects");
  const { data, error } = await client.rpc("create_project", {
    target_organization_id: organizationId,
    project_name: parsed.data.name,
    project_number: parsed.data.projectNumber,
    project_type: parsed.data.projectType ?? "",
    request_id: createRequestId()
  });
  if (error || !data)
    projectError(
      "/projects/new",
      error?.code === "23505"
        ? "That project number is already in use"
        : "The project could not be created"
    );
  redirect(`/projects/${data}?message=Project created`);
}

export async function updateProjectAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(
    [
      "projectId",
      "updatedAt",
      "name",
      "projectNumber",
      "projectType",
      "description",
      "city",
      "region",
      "postalCode",
      "plannedStartDate",
      "substantialCompletionDate",
      "closeoutTargetDate",
      "notes"
    ].map((key) => [key, formValue(formData, key)])
  );
  const parsed = projectUpdateSchema.safeParse(raw);
  const path = `/projects/${raw.projectId}/settings`;
  if (!parsed.success) projectError(path, "Check the project details");
  const { client, user, organizationId } = await getActiveContext();
  const decision = await authorizeProjectAction({
    client,
    userId: user.id,
    organizationId,
    projectId: parsed.data.projectId,
    permission: permissions.projectUpdate
  });
  if (!decision.allowed) projectError(path, "You do not have permission to update this project");
  const { error } = await client.rpc("update_project", {
    target_project_id: parsed.data.projectId,
    expected_updated_at: parsed.data.updatedAt,
    request_id: createRequestId(),
    project_data: {
      name: parsed.data.name,
      project_number: parsed.data.projectNumber,
      project_type: parsed.data.projectType,
      description: parsed.data.description,
      city: parsed.data.city,
      region: parsed.data.region,
      postal_code: parsed.data.postalCode,
      planned_start_date: parsed.data.plannedStartDate,
      substantial_completion_date: parsed.data.substantialCompletionDate,
      closeout_target_date: parsed.data.closeoutTargetDate,
      notes: parsed.data.notes
    }
  });
  if (error)
    projectError(
      path,
      error.code === "40001"
        ? "This project changed while you were editing. Reload and try again."
        : "The project could not be updated"
    );
  redirect(`${path}?message=Project updated`);
}

export async function changeProjectStatusAction(formData: FormData): Promise<void> {
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  const status = z.enum(["active", "cancelled"]).safeParse(formData.get("status"));
  if (!projectId.success || !status.success)
    projectError("/projects", "Invalid project status change");
  const { client, user, organizationId } = await getActiveContext();
  const decision = await authorizeProjectAction({
    client,
    userId: user.id,
    organizationId,
    projectId: projectId.data,
    permission: permissions.projectUpdate
  });
  if (!decision.allowed)
    projectError(`/projects/${projectId.data}/settings`, "Status change permission denied");
  const { error } = await client.rpc("set_project_status", {
    target_project_id: projectId.data,
    target_status: status.data,
    reason: formValue(formData, "reason"),
    request_id: createRequestId()
  });
  if (error)
    projectError(
      `/projects/${projectId.data}/settings`,
      "That status change is not available from the current state"
    );
  redirect(`/projects/${projectId.data}/settings?message=Project status updated`);
}

export async function archiveProjectAction(formData: FormData): Promise<void> {
  return projectLifecycle(formData, "archive");
}
export async function restoreProjectAction(formData: FormData): Promise<void> {
  return projectLifecycle(formData, "restore");
}
async function projectLifecycle(formData: FormData, kind: "archive" | "restore"): Promise<never> {
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  if (!projectId.success) projectError("/projects", "Invalid project");
  const { client, user, organizationId } = await getActiveContext();
  const permission = kind === "archive" ? permissions.projectArchive : permissions.projectRestore;
  const decision = await authorizeProjectAction({
    client,
    userId: user.id,
    organizationId,
    projectId: projectId.data,
    permission
  });
  if (!decision.allowed)
    projectError(
      `/projects/${projectId.data}/settings`,
      `${kind === "archive" ? "Archive" : "Restore"} permission denied`
    );
  const result =
    kind === "archive"
      ? await client.rpc("archive_project", {
          target_project_id: projectId.data,
          reason: formValue(formData, "reason"),
          request_id: createRequestId()
        })
      : await client.rpc("restore_project", {
          target_project_id: projectId.data,
          request_id: createRequestId()
        });
  if (result.error)
    projectError(`/projects/${projectId.data}/settings`, `The project could not be ${kind}d`);
  redirect(
    `/projects/${projectId.data}/settings?message=Project ${kind === "archive" ? "archived" : "restored"}`
  );
}
