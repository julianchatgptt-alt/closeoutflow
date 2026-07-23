"use server";

import { permissions, type Permission } from "@closeoutflow/authz";
import type { Json } from "@closeoutflow/db";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActiveContext } from "../lib/active-context";
import { authorizeOrganizationAction } from "../lib/authorization";
import { formValue } from "../lib/phase-5-schemas";
import {
  categorySchema,
  templateCreateSchema,
  templateItemSchema,
  templateUpdateSchema
} from "../lib/phase-6-schemas";
import { rateLimitRequest } from "../lib/rate-limit";

function templateError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function authorizeTemplate(permission: Permission) {
  const { client, user, organizationId } = await getActiveContext();
  const decision = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission,
    resource: { type: "template", id: organizationId }
  });
  return { client, user, organizationId, allowed: decision.allowed };
}

export async function createTemplateAction(formData: FormData): Promise<void> {
  const parsed = templateCreateSchema.safeParse({
    name: formValue(formData, "name"),
    description: formValue(formData, "description")
  });
  if (!parsed.success)
    templateError(
      "/templates/new",
      parsed.error.issues[0]?.message ?? "Check the template details"
    );
  const { client, user, organizationId, allowed } = await authorizeTemplate(
    permissions.templateManage
  );
  if (!allowed) templateError("/templates", "You do not have permission to create templates");
  if (!(await rateLimitRequest("template-mutation", user.id)))
    templateError("/templates/new", "Too many attempts. Try again shortly.");
  const { data, error } = await client.rpc("create_requirement_template", {
    target_organization_id: organizationId,
    template_name: parsed.data.name,
    template_description: parsed.data.description,
    request_id: createRequestId()
  });
  if (error || !data) templateError("/templates/new", "The template could not be created");
  redirect(`/templates/${data}?message=Template created — add its requirements`);
}

export async function updateTemplateAction(formData: FormData): Promise<void> {
  const parsed = templateUpdateSchema.safeParse({
    templateId: formValue(formData, "templateId"),
    updatedAt: formValue(formData, "updatedAt"),
    name: formValue(formData, "name"),
    description: formValue(formData, "description")
  });
  if (!parsed.success) templateError("/templates", "Check the template details");
  const path = `/templates/${parsed.data.templateId}`;
  const { client, allowed } = await authorizeTemplate(permissions.templateManage);
  if (!allowed) templateError(path, "You do not have permission to edit templates");
  const { error } = await client.rpc("update_requirement_template", {
    target_template_id: parsed.data.templateId,
    expected_updated_at: parsed.data.updatedAt,
    template_data: { name: parsed.data.name, description: parsed.data.description },
    request_id: createRequestId()
  });
  if (error)
    templateError(
      path,
      error.code === "P0001"
        ? "This template changed while you were editing. Reload and try again."
        : "The template could not be updated"
    );
  redirect(`${path}?message=Template updated`);
}

type TemplateItemRow = {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  trade: string | null;
  priority: string;
  is_optional: boolean;
  default_responsible_role: string | null;
  default_due_anchor: string | null;
  default_due_offset_days: number | null;
  sort_order: number;
};

async function readDraftItems(
  client: Awaited<ReturnType<typeof getActiveContext>>["client"],
  templateId: string
) {
  const { data } = await client
    .from("requirement_template_items")
    .select(
      "id,title,description,category_id,trade,priority,is_optional,default_responsible_role,default_due_anchor,default_due_offset_days,sort_order"
    )
    .eq("template_id", templateId)
    .order("sort_order")
    .order("id");
  return (data ?? []) as TemplateItemRow[];
}

function toItemPayload(item: TemplateItemRow) {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    category_id: item.category_id,
    trade: item.trade ?? "",
    priority: item.priority,
    is_optional: item.is_optional,
    default_responsible_role: item.default_responsible_role ?? "",
    default_due_anchor: item.default_due_anchor ?? "",
    default_due_offset_days: item.default_due_offset_days?.toString() ?? ""
  };
}

async function saveItems(
  templateId: string,
  updatedAt: string,
  items: Array<Record<string, unknown>>,
  path: string
) {
  const { client, allowed } = await authorizeTemplate(permissions.templateManage);
  if (!allowed) templateError(path, "You do not have permission to edit templates");
  const { error } = await client.rpc("save_template_items", {
    target_template_id: templateId,
    expected_updated_at: updatedAt,
    items: items as unknown as Json,
    request_id: createRequestId()
  });
  if (error)
    templateError(
      path,
      error.code === "P0001"
        ? "This template changed while you were editing. Reload and try again."
        : error.message === "published template versions cannot be edited"
          ? "Published versions are locked. Start a new version to edit."
          : "The requirements could not be saved"
    );
  return client;
}

export async function saveTemplateItemAction(formData: FormData): Promise<void> {
  const parsed = templateItemSchema.safeParse(
    Object.fromEntries(
      [
        "templateId",
        "updatedAt",
        "itemId",
        "title",
        "description",
        "categoryId",
        "trade",
        "priority",
        "isOptional",
        "defaultResponsibleRole",
        "defaultDueAnchor",
        "defaultDueOffsetDays"
      ].map((key) => [key, formValue(formData, key)])
    )
  );
  if (!parsed.success)
    templateError(
      `/templates/${formValue(formData, "templateId")}`,
      parsed.error.issues[0]?.message ?? "Check the requirement details"
    );
  const path = `/templates/${parsed.data.templateId}`;
  const { client } = await getActiveContext();
  const existing = (await readDraftItems(client, parsed.data.templateId)).map(toItemPayload);
  const entry = {
    id: parsed.data.itemId ?? "",
    title: parsed.data.title,
    description: parsed.data.description,
    category_id: parsed.data.categoryId,
    trade: parsed.data.trade,
    priority: parsed.data.priority,
    is_optional: parsed.data.isOptional,
    default_responsible_role: parsed.data.defaultResponsibleRole ?? "",
    default_due_anchor: parsed.data.defaultDueAnchor ?? "",
    default_due_offset_days: parsed.data.defaultDueOffsetDays?.toString() ?? ""
  };
  const items = parsed.data.itemId
    ? existing.map((item) => (item.id === parsed.data.itemId ? entry : item))
    : [...existing, entry];
  await saveItems(parsed.data.templateId, parsed.data.updatedAt, items, path);
  redirect(
    `${path}?message=${encodeURIComponent(parsed.data.itemId ? "Requirement updated" : "Requirement added")}`
  );
}

export async function removeTemplateItemAction(formData: FormData): Promise<void> {
  const templateId = z.uuid().safeParse(formValue(formData, "templateId"));
  const itemId = z.uuid().safeParse(formValue(formData, "itemId"));
  const updatedAt = formValue(formData, "updatedAt");
  if (!templateId.success || !itemId.success || !updatedAt)
    templateError("/templates", "Invalid requirement removal");
  const path = `/templates/${templateId.data}`;
  const { client } = await getActiveContext();
  const items = (await readDraftItems(client, templateId.data))
    .filter((item) => item.id !== itemId.data)
    .map(toItemPayload);
  await saveItems(templateId.data, updatedAt, items, path);
  redirect(`${path}?message=Requirement removed`);
}

export async function moveTemplateItemAction(formData: FormData): Promise<void> {
  const templateId = z.uuid().safeParse(formValue(formData, "templateId"));
  const itemId = z.uuid().safeParse(formValue(formData, "itemId"));
  const direction = z.enum(["up", "down"]).safeParse(formValue(formData, "direction"));
  const updatedAt = formValue(formData, "updatedAt");
  if (!templateId.success || !itemId.success || !direction.success || !updatedAt)
    templateError("/templates", "Invalid requirement move");
  const path = `/templates/${templateId.data}`;
  const { client } = await getActiveContext();
  const items = (await readDraftItems(client, templateId.data)).map(toItemPayload);
  const index = items.findIndex((item) => item.id === itemId.data);
  const target = direction.data === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length)
    redirect(`${path}?message=Requirement is already at the edge of its list`);
  const current = items[index]!;
  items[index] = items[target]!;
  items[target] = current;
  await saveItems(templateId.data, updatedAt, items, path);
  redirect(`${path}?message=Requirement reordered`);
}

export async function publishTemplateAction(formData: FormData): Promise<void> {
  const templateId = z.uuid().safeParse(formValue(formData, "templateId"));
  const updatedAt = formValue(formData, "updatedAt");
  if (!templateId.success || !updatedAt) templateError("/templates", "Invalid publish request");
  const path = `/templates/${templateId.data}`;
  const { client, allowed } = await authorizeTemplate(permissions.templatePublish);
  if (!allowed) templateError(path, "You do not have permission to publish templates");
  const { error } = await client.rpc("publish_requirement_template", {
    target_template_id: templateId.data,
    expected_updated_at: updatedAt,
    request_id: createRequestId()
  });
  if (error)
    templateError(
      path,
      error.message === "a template needs at least one requirement before publishing"
        ? "Add at least one requirement before publishing"
        : error.code === "P0001"
          ? "This template changed while you were editing. Reload and try again."
          : "The template could not be published"
    );
  redirect(`${path}?message=Template published — it can now be applied to projects`);
}

export async function createTemplateVersionAction(formData: FormData): Promise<void> {
  const templateId = z.uuid().safeParse(formValue(formData, "templateId"));
  if (!templateId.success) templateError("/templates", "Invalid template");
  const path = `/templates/${templateId.data}`;
  const { client, allowed } = await authorizeTemplate(permissions.templateManage);
  if (!allowed) templateError(path, "You do not have permission to edit templates");
  const { data, error } = await client.rpc("create_template_version", {
    target_template_id: templateId.data,
    request_id: createRequestId()
  });
  if (error || !data)
    templateError(
      path,
      error?.message === "a draft version of this template already exists"
        ? "A draft version already exists — finish or publish it first"
        : "A new version could not be started"
    );
  redirect(`/templates/${data}?message=New draft version created`);
}

export async function cloneTemplateAction(formData: FormData): Promise<void> {
  const templateId = z.uuid().safeParse(formValue(formData, "templateId"));
  const name = z.string().trim().min(2).max(120).safeParse(formValue(formData, "name"));
  if (!templateId.success) templateError("/templates", "Invalid template");
  const path = `/templates/${templateId.data}`;
  if (!name.success) templateError(path, "Enter a name for the duplicate template");
  const { client, allowed } = await authorizeTemplate(permissions.templateManage);
  if (!allowed) templateError(path, "You do not have permission to duplicate templates");
  const { data, error } = await client.rpc("clone_requirement_template", {
    target_template_id: templateId.data,
    new_template_name: name.data,
    request_id: createRequestId()
  });
  if (error || !data) templateError(path, "The template could not be duplicated");
  redirect(`/templates/${data}?message=Template duplicated as a new draft`);
}

export async function archiveTemplateAction(formData: FormData): Promise<void> {
  return templateLifecycle(formData, "archive");
}
export async function restoreTemplateAction(formData: FormData): Promise<void> {
  return templateLifecycle(formData, "restore");
}
async function templateLifecycle(formData: FormData, kind: "archive" | "restore"): Promise<never> {
  const templateId = z.uuid().safeParse(formValue(formData, "templateId"));
  if (!templateId.success) templateError("/templates", "Invalid template");
  const path = `/templates/${templateId.data}`;
  const { client, allowed } = await authorizeTemplate(permissions.templateArchive);
  if (!allowed) templateError(path, `You do not have permission to ${kind} templates`);
  const { error } = await client.rpc(
    kind === "archive" ? "archive_requirement_template" : "restore_requirement_template",
    { target_template_id: templateId.data, request_id: createRequestId() }
  );
  if (error) templateError(path, `The template could not be ${kind}d`);
  redirect(`/templates?message=Template ${kind}d`);
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const parsed = categorySchema.safeParse({
    name: formValue(formData, "name"),
    description: formValue(formData, "description")
  });
  const returnTo = formValue(formData, "returnTo") || "/templates";
  if (!parsed.success)
    templateError(returnTo, parsed.error.issues[0]?.message ?? "Check the category details");
  const { client, organizationId, allowed } = await authorizeTemplate(permissions.templateManage);
  if (!allowed) templateError(returnTo, "You do not have permission to manage categories");
  const { error } = await client.rpc("create_requirement_category", {
    target_organization_id: organizationId,
    category_name: parsed.data.name,
    category_description: parsed.data.description,
    request_id: createRequestId()
  });
  if (error)
    templateError(
      returnTo,
      error.code === "23505"
        ? "A category with that name already exists"
        : "The category could not be created"
    );
  redirect(`${returnTo}?message=Category created`);
}
