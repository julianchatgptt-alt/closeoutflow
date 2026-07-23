"use server";

import { permissions, type Permission } from "@closeoutflow/authz";
import type { Json } from "@closeoutflow/db";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActiveContext } from "../lib/active-context";
import { authorizeProjectAction } from "../lib/authorization";
import { formValue } from "../lib/phase-5-schemas";
import {
  applyTemplateSchema,
  bulkUpdateSchema,
  notApplicableSchema,
  requirementCreateSchema,
  requirementUpdateSchema,
  responsibilitySchema,
  responsibleRoles
} from "../lib/phase-6-schemas";
import { rateLimitRequest } from "../lib/rate-limit";

function requirementError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function friendlyRequirementError(error: { code?: string; message?: string } | null): string {
  if (error?.code === "P0001")
    return "This requirement changed while you were editing. Reload and try again.";
  if (error?.message === "responsible company must be active on this project")
    return "That company is no longer active on this project. Pick a current company.";
  if (error?.message === "responsible contact must be active on this project")
    return "That contact is no longer active on this project. Pick a current contact.";
  if (error?.message === "internal owner must be an active project member")
    return "That teammate is no longer on this project. Pick a current member.";
  if (error?.message === "archived projects are read only")
    return "This project is archived and read only.";
  return "The requirement could not be saved";
}

async function authorizeRequirement(projectId: string, permission: Permission) {
  const { client, user, organizationId } = await getActiveContext();
  const decision = await authorizeProjectAction({
    client,
    userId: user.id,
    organizationId,
    projectId,
    permission
  });
  return { client, user, organizationId, allowed: decision.allowed };
}

export async function createRequirementAction(formData: FormData): Promise<void> {
  const parsed = requirementCreateSchema.safeParse(
    Object.fromEntries(
      [
        "projectId",
        "title",
        "categoryId",
        "description",
        "responsibleCompanyId",
        "internalOwnerId",
        "dueDate",
        "addAnother"
      ].map((key) => [key, formValue(formData, key)])
    )
  );
  if (!parsed.success)
    requirementError(
      `/projects/${formValue(formData, "projectId")}/requirements`,
      parsed.error.issues[0]?.message ?? "Check the requirement details"
    );
  const path = `/projects/${parsed.data.projectId}/requirements`;
  const { client, user, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissions.requirementManage
  );
  if (!allowed) requirementError(path, "You do not have permission to add requirements");
  if (!(await rateLimitRequest("requirement-mutation", user.id)))
    requirementError(path, "Too many attempts. Try again shortly.");
  const { error } = await client.rpc("create_project_requirement", {
    target_project_id: parsed.data.projectId,
    requirement_data: {
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      category_id: parsed.data.categoryId ?? undefined,
      responsible_project_company_id: parsed.data.responsibleCompanyId ?? undefined,
      internal_owner_member_id: parsed.data.internalOwnerId ?? undefined,
      due_date: parsed.data.dueDate ?? undefined
    },
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(
    parsed.data.addAnother
      ? `${path}?message=${encodeURIComponent("Requirement added. Add another below.")}&add=1`
      : `${path}?message=${encodeURIComponent("Requirement added")}`
  );
}

export async function updateRequirementAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(
    [
      "projectId",
      "requirementId",
      "updatedAt",
      "title",
      "description",
      "notes",
      "categoryId",
      "trade",
      "priority",
      "isRequired"
    ].map((key) => [key, formValue(formData, key)])
  );
  const parsed = requirementUpdateSchema.safeParse(raw);
  const path = `/projects/${raw.projectId}/requirements/${raw.requirementId}`;
  if (!parsed.success) requirementError(path, "Check the requirement details");
  const { client, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissions.requirementManage
  );
  if (!allowed) requirementError(path, "You do not have permission to edit this requirement");
  const { error } = await client.rpc("update_project_requirement", {
    target_requirement_id: parsed.data.requirementId,
    expected_updated_at: parsed.data.updatedAt,
    requirement_data: {
      title: parsed.data.title,
      description: parsed.data.description,
      notes: parsed.data.notes,
      category_id: parsed.data.categoryId,
      trade: parsed.data.trade,
      priority: parsed.data.priority,
      is_required: parsed.data.isRequired
    },
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(`${path}?message=Requirement updated`);
}

export async function setResponsibilityAction(formData: FormData): Promise<void> {
  const parsed = responsibilitySchema.safeParse(
    Object.fromEntries(
      [
        "projectId",
        "requirementId",
        "updatedAt",
        "responsibleCompanyId",
        "responsibleContactId",
        "internalOwnerId"
      ].map((key) => [key, formValue(formData, key)])
    )
  );
  const fallback = `/projects/${formValue(formData, "projectId")}/requirements`;
  if (!parsed.success) requirementError(fallback, "Check the responsibility details");
  const path = `/projects/${parsed.data.projectId}/requirements/${parsed.data.requirementId}`;
  const { client, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissions.requirementAssign
  );
  if (!allowed) requirementError(path, "You do not have permission to assign responsibility");
  const { error } = await client.rpc("update_project_requirement", {
    target_requirement_id: parsed.data.requirementId,
    expected_updated_at: parsed.data.updatedAt,
    requirement_data: {
      responsible_project_company_id: parsed.data.responsibleCompanyId,
      responsible_project_contact_id: parsed.data.responsibleContactId,
      internal_owner_member_id: parsed.data.internalOwnerId
    },
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(`${path}?message=Responsibility updated`);
}

export async function setDueDateAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      projectId: z.uuid(),
      requirementId: z.uuid(),
      updatedAt: z.iso.datetime({ offset: true }),
      dueDate: z
        .string()
        .trim()
        .optional()
        .default("")
        .transform((value) => (value === "" ? null : value))
        .pipe(z.iso.date().nullable())
    })
    .safeParse(
      Object.fromEntries(
        ["projectId", "requirementId", "updatedAt", "dueDate"].map((key) => [
          key,
          formValue(formData, key)
        ])
      )
    );
  const fallback = `/projects/${formValue(formData, "projectId")}/requirements`;
  if (!parsed.success) requirementError(fallback, "Enter a valid due date");
  const path = `/projects/${parsed.data.projectId}/requirements/${parsed.data.requirementId}`;
  const { client, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissions.requirementSetDates
  );
  if (!allowed) requirementError(path, "You do not have permission to set due dates");
  const { error } = await client.rpc("update_project_requirement", {
    target_requirement_id: parsed.data.requirementId,
    expected_updated_at: parsed.data.updatedAt,
    requirement_data: { due_date: parsed.data.dueDate },
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(`${path}?message=Due date updated`);
}

export async function moveRequirementAction(moveValue: string, formData: FormData): Promise<void> {
  const projectId = z.uuid().safeParse(formValue(formData, "projectId"));
  const [requirementIdValue, updatedAtValue, directionValue] = moveValue.split("|");
  const movement = z
    .object({
      requirementId: z.uuid(),
      updatedAt: z.iso.datetime({ offset: true }),
      direction: z.enum(["up", "down"])
    })
    .safeParse({
      requirementId: requirementIdValue,
      updatedAt: updatedAtValue,
      direction: directionValue
    });
  if (!projectId.success || !movement.success)
    requirementError("/projects", "Invalid requirement order");

  const path = `/projects/${projectId.data}/requirements`;
  const { client, allowed } = await authorizeRequirement(
    projectId.data,
    permissions.requirementManage
  );
  if (!allowed) requirementError(path, "You do not have permission to reorder requirements");

  const { error } = await client.rpc("move_project_requirement", {
    target_requirement_id: movement.data.requirementId,
    expected_updated_at: movement.data.updatedAt,
    move_direction: movement.data.direction,
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(`${path}?message=${encodeURIComponent("Requirement order updated")}`);
}

export async function markNotApplicableAction(formData: FormData): Promise<void> {
  const parsed = notApplicableSchema.safeParse(
    Object.fromEntries(
      ["projectId", "requirementId", "updatedAt", "reason"].map((key) => [
        key,
        formValue(formData, key)
      ])
    )
  );
  const fallback = `/projects/${formValue(formData, "projectId")}/requirements`;
  if (!parsed.success)
    requirementError(fallback, parsed.error.issues[0]?.message ?? "Enter a short reason");
  const path = `/projects/${parsed.data.projectId}/requirements/${parsed.data.requirementId}`;
  const { client, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissions.requirementSetNotApplicable
  );
  if (!allowed) requirementError(path, "You do not have permission to mark not applicable");
  const { error } = await client.rpc("mark_requirement_not_applicable", {
    target_requirement_id: parsed.data.requirementId,
    expected_updated_at: parsed.data.updatedAt,
    reason: parsed.data.reason,
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(`${path}?message=Marked not applicable`);
}

export async function reverseNotApplicableAction(formData: FormData): Promise<void> {
  const projectId = z.uuid().safeParse(formValue(formData, "projectId"));
  const requirementId = z.uuid().safeParse(formValue(formData, "requirementId"));
  const updatedAt = formValue(formData, "updatedAt");
  if (!projectId.success || !requirementId.success || !updatedAt)
    requirementError("/projects", "Invalid requirement");
  const path = `/projects/${projectId.data}/requirements/${requirementId.data}`;
  const { client, allowed } = await authorizeRequirement(
    projectId.data,
    permissions.requirementSetNotApplicable
  );
  if (!allowed) requirementError(path, "You do not have permission to reopen this requirement");
  const { error } = await client.rpc("reverse_requirement_not_applicable", {
    target_requirement_id: requirementId.data,
    expected_updated_at: updatedAt,
    request_id: createRequestId()
  });
  if (error) requirementError(path, friendlyRequirementError(error));
  redirect(`${path}?message=Requirement reopened`);
}

export async function archiveRequirementAction(formData: FormData): Promise<void> {
  return requirementLifecycle(formData, "archive");
}
export async function restoreRequirementAction(formData: FormData): Promise<void> {
  return requirementLifecycle(formData, "restore");
}
async function requirementLifecycle(
  formData: FormData,
  kind: "archive" | "restore"
): Promise<never> {
  const projectId = z.uuid().safeParse(formValue(formData, "projectId"));
  const requirementId = z.uuid().safeParse(formValue(formData, "requirementId"));
  if (!projectId.success || !requirementId.success)
    requirementError("/projects", "Invalid requirement");
  const path = `/projects/${projectId.data}/requirements`;
  const { client, allowed } = await authorizeRequirement(
    projectId.data,
    permissions.requirementArchive
  );
  if (!allowed) requirementError(path, `You do not have permission to ${kind} requirements`);
  const { error } = await client.rpc(
    kind === "archive" ? "archive_project_requirement" : "restore_project_requirement",
    kind === "archive"
      ? {
          target_requirement_id: requirementId.data,
          reason: formValue(formData, "reason"),
          request_id: createRequestId()
        }
      : { target_requirement_id: requirementId.data, request_id: createRequestId() }
  );
  if (error) requirementError(path, `The requirement could not be ${kind}d`);
  redirect(`${path}?message=Requirement ${kind}d`);
}

export async function applyTemplateAction(formData: FormData): Promise<void> {
  const projectId = formValue(formData, "projectId");
  const roleAssignments: Record<string, string> = {};
  for (const role of responsibleRoles) {
    const value = formValue(formData, `role:${role}`);
    if (value) roleAssignments[role] = value;
  }
  const parsed = applyTemplateSchema.safeParse({
    projectId,
    templateId: formValue(formData, "templateId"),
    selectedItemKeys: formData.getAll("itemKeys").map(String),
    roleAssignments,
    defaultDueDate: formValue(formData, "defaultDueDate")
  });
  const fallback = `/projects/${projectId}/requirements/apply`;
  if (!parsed.success)
    requirementError(
      fallback,
      parsed.error.issues[0]?.message ?? "Check the template application details"
    );
  const path = `/projects/${parsed.data.projectId}/requirements`;
  const { client, user, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissions.requirementApplyTemplate
  );
  if (!allowed) requirementError(path, "You do not have permission to apply templates");
  if (!(await rateLimitRequest("requirement-mutation", user.id)))
    requirementError(fallback, "Too many attempts. Try again shortly.");
  const { data, error } = await client.rpc("apply_requirement_template", {
    target_project_id: parsed.data.projectId,
    target_template_id: parsed.data.templateId,
    selections: {
      selected_item_keys: parsed.data.selectedItemKeys,
      role_assignments: parsed.data.roleAssignments,
      default_due_date: parsed.data.defaultDueDate ?? undefined
    },
    request_id: createRequestId()
  });
  if (error || !data)
    requirementError(
      `${fallback}?template=${parsed.data.templateId}`,
      error?.message === "only published templates can be applied"
        ? "Only published templates can be applied"
        : "The template could not be applied. Nothing was added."
    );
  const result = data as { added_count?: number; skipped_count?: number };
  const added = result.added_count ?? 0;
  const skipped = result.skipped_count ?? 0;
  const summary =
    added === 0
      ? `No new requirements added — ${skipped} already in this project`
      : `${added} requirement${added === 1 ? "" : "s"} added${skipped ? ` · ${skipped} already present` : ""}`;
  redirect(`${path}?message=${encodeURIComponent(summary)}`);
}

export async function bulkUpdateRequirementsAction(formData: FormData): Promise<void> {
  const parsed = bulkUpdateSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    requirementIds: formData.getAll("requirementIds").map(String),
    bulkAction: formValue(formData, "bulkAction"),
    categoryId: formValue(formData, "categoryId"),
    priority: formValue(formData, "priority") || undefined,
    dueDate: formValue(formData, "dueDate"),
    responsibleCompanyId: formValue(formData, "responsibleCompanyId"),
    responsibleContactId: formValue(formData, "responsibleContactId"),
    internalOwnerId: formValue(formData, "internalOwnerId"),
    reason: formValue(formData, "reason")
  });
  const fallback = `/projects/${formValue(formData, "projectId")}/requirements`;
  if (!parsed.success)
    requirementError(
      fallback,
      parsed.error.issues[0]?.message ?? "Select requirements and a bulk change"
    );
  const path = `/projects/${parsed.data.projectId}/requirements`;
  const permissionByAction: Record<string, Permission> = {
    set_category: permissions.requirementManage,
    set_priority: permissions.requirementManage,
    set_due_date: permissions.requirementSetDates,
    set_responsible_company: permissions.requirementAssign,
    set_responsible_contact: permissions.requirementAssign,
    set_internal_owner: permissions.requirementAssign,
    mark_not_applicable: permissions.requirementSetNotApplicable,
    reverse_not_applicable: permissions.requirementSetNotApplicable,
    archive: permissions.requirementArchive,
    restore: permissions.requirementArchive
  };
  const { client, allowed } = await authorizeRequirement(
    parsed.data.projectId,
    permissionByAction[parsed.data.bulkAction] ?? permissions.requirementManage
  );
  if (!allowed) requirementError(path, "You do not have permission for that bulk change");
  const actionValue: Record<string, unknown> = {
    category_id: parsed.data.categoryId ?? undefined,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate ?? "",
    responsible_project_company_id: parsed.data.responsibleCompanyId ?? "",
    responsible_project_contact_id: parsed.data.responsibleContactId ?? "",
    internal_owner_member_id: parsed.data.internalOwnerId ?? "",
    reason: parsed.data.reason
  };
  const { data, error } = await client.rpc("bulk_update_project_requirements", {
    target_project_id: parsed.data.projectId,
    requirement_ids: parsed.data.requirementIds,
    bulk_action: parsed.data.bulkAction,
    action_value: actionValue as Json,
    request_id: createRequestId()
  });
  if (error || typeof data !== "number")
    requirementError(
      path,
      error?.message === "a reason between 3 and 200 characters is required"
        ? "Enter a short reason for marking these not applicable"
        : error?.message === "select between 1 and 200 requirements"
          ? "Select between 1 and 200 requirements"
          : "The bulk change could not be applied. Nothing was changed."
    );
  redirect(
    `${path}?message=${encodeURIComponent(`${data} requirement${data === 1 ? "" : "s"} updated`)}`
  );
}
