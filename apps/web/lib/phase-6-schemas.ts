import { z } from "zod";

const concurrencyToken = z.iso.datetime({ offset: true });
const dateOnly = z.iso.date();

export const requirementPriorities = ["low", "normal", "high"] as const;
export const responsibleRoles = [
  "owner",
  "general_contractor",
  "subcontractor",
  "architect",
  "engineer",
  "consultant",
  "supplier",
  "manufacturer",
  "commissioning_agent",
  "testing_agency",
  "other"
] as const;
export const dueAnchors = ["substantial_completion", "closeout_target"] as const;
export const bulkActions = [
  "set_category",
  "set_priority",
  "set_due_date",
  "set_responsible_company",
  "set_responsible_contact",
  "set_internal_owner",
  "mark_not_applicable",
  "reverse_not_applicable",
  "archive",
  "restore"
] as const;

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((value) => (value === "" ? null : value))
  .pipe(z.uuid().nullable());
const optionalDate = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((value) => (value === "" ? null : value))
  .pipe(dateOnly.nullable());

export const templateCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter a template name").max(120),
  description: z.string().trim().max(1000).optional().default("")
});

export const templateUpdateSchema = z.object({
  templateId: z.uuid(),
  updatedAt: concurrencyToken,
  name: z.string().trim().min(2, "Enter a template name").max(120),
  description: z.string().trim().max(1000).optional().default("")
});

export const templateItemSchema = z.object({
  templateId: z.uuid(),
  updatedAt: concurrencyToken,
  itemId: optionalUuid,
  title: z.string().trim().min(2, "Enter a requirement title").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  categoryId: z.uuid("Choose a category"),
  trade: z.string().trim().max(80).optional().default(""),
  priority: z.enum(requirementPriorities).default("normal"),
  isOptional: z
    .string()
    .optional()
    .default("")
    .transform((value) => value === "on" || value === "true"),
  defaultResponsibleRole: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => (value === "" ? null : value))
    .pipe(z.enum(responsibleRoles).nullable()),
  defaultDueAnchor: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => (value === "" ? null : value))
    .pipe(z.enum(dueAnchors).nullable()),
  defaultDueOffsetDays: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(z.number().int().min(-365).max(730).nullable())
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name").max(80),
  description: z.string().trim().max(500).optional().default("")
});

export const requirementCreateSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(2, "Enter a requirement title").max(200),
  categoryId: optionalUuid,
  description: z.string().trim().max(2000).optional().default(""),
  responsibleCompanyId: optionalUuid,
  internalOwnerId: optionalUuid,
  dueDate: optionalDate,
  addAnother: z.string().optional().default("")
});

export const requirementUpdateSchema = z.object({
  projectId: z.uuid(),
  requirementId: z.uuid(),
  updatedAt: concurrencyToken,
  title: z.string().trim().min(2, "Enter a requirement title").max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
  categoryId: z.uuid().optional(),
  trade: z.string().trim().max(80).optional(),
  priority: z.enum(requirementPriorities).optional(),
  isRequired: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "on" || value === "true"))
});

export const responsibilitySchema = z.object({
  projectId: z.uuid(),
  requirementId: z.uuid(),
  updatedAt: concurrencyToken,
  responsibleCompanyId: optionalUuid,
  responsibleContactId: optionalUuid,
  internalOwnerId: optionalUuid
});

export const dueDateSchema = z.object({
  projectId: z.uuid(),
  requirementId: z.uuid(),
  updatedAt: concurrencyToken,
  dueDate: optionalDate
});

export const notApplicableSchema = z.object({
  projectId: z.uuid(),
  requirementId: z.uuid(),
  updatedAt: concurrencyToken,
  reason: z.string().trim().min(3, "Enter a short reason").max(200)
});

export const applyTemplateSchema = z.object({
  projectId: z.uuid(),
  templateId: z.uuid(),
  selectedItemKeys: z.array(z.string().min(3).max(80)).min(1, "Select at least one requirement"),
  roleAssignments: z.record(z.enum(responsibleRoles), z.uuid().or(z.literal(""))),
  defaultDueDate: optionalDate
});

export const bulkUpdateSchema = z.object({
  projectId: z.uuid(),
  requirementIds: z.array(z.uuid()).min(1, "Select at least one requirement").max(200),
  bulkAction: z.enum(bulkActions),
  categoryId: optionalUuid,
  priority: z.enum(requirementPriorities).optional(),
  dueDate: optionalDate,
  responsibleCompanyId: optionalUuid,
  responsibleContactId: optionalUuid,
  internalOwnerId: optionalUuid,
  reason: z.string().trim().max(200).optional().default("")
});

export type RegisterRow = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  category_id: string;
  category_name: string;
  category_sort: number;
  trade: string | null;
  priority: string;
  is_required: boolean;
  status: string;
  na_reason: string | null;
  due_date: string | null;
  sort_order: number;
  updated_at: string;
  archived_at: string | null;
  responsible_project_company_id: string | null;
  responsible_company_name: string | null;
  responsible_company_stale: boolean;
  responsible_project_contact_id: string | null;
  responsible_contact_name: string | null;
  responsible_contact_stale: boolean;
  internal_owner_member_id: string | null;
  internal_owner_name: string | null;
  internal_owner_stale: boolean;
  source_template_id: string | null;
  source_template_name: string | null;
  source_template_version: number | null;
};

export type RequirementSummary = {
  total?: number;
  not_applicable?: number;
  unassigned_company?: number;
  unassigned_owner?: number;
  missing_due_date?: number;
  stale_references?: number;
  needs_attention?: number;
  configured?: number;
  by_category?: Array<{ category_id: string; name: string; count: number }>;
  upcoming?: Array<{ id: string; title: string; due_date: string }>;
};

export function rowNeedsAttention(row: RegisterRow) {
  return (
    row.status === "active" &&
    !row.archived_at &&
    (!row.responsible_project_company_id ||
      row.responsible_company_stale ||
      row.responsible_contact_stale ||
      !row.internal_owner_member_id ||
      row.internal_owner_stale ||
      !row.due_date)
  );
}
