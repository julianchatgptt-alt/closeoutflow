import { z } from "zod";

const optionalText = z.string().trim().max(500).optional().default("");
const concurrencyToken = z.iso.datetime({ offset: true });
export const projectTypes = [
  "restaurant",
  "retail",
  "medical",
  "office",
  "warehouse",
  "church",
  "school",
  "municipal",
  "multifamily",
  "other"
] as const;
export const projectRoles = [
  "project_administrator",
  "project_manager",
  "closeout_coordinator",
  "internal_reviewer",
  "viewer"
] as const;
export const companyRoles = [
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

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name").max(160),
  projectNumber: z.string().trim().max(80).optional().default(""),
  projectType: z.enum(projectTypes).optional().or(z.literal(""))
});

export const projectUpdateSchema = z.object({
  projectId: z.uuid(),
  updatedAt: concurrencyToken,
  name: z.string().trim().min(2).max(160),
  projectNumber: optionalText,
  projectType: z.enum(projectTypes).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().default(""),
  city: optionalText,
  region: optionalText,
  postalCode: optionalText,
  plannedStartDate: z.string().optional().default(""),
  substantialCompletionDate: z.string().optional().default(""),
  closeoutTargetDate: z.string().optional().default(""),
  notes: z.string().max(8000).optional().default("")
});

export const companySchema = z.object({
  companyId: z.uuid().optional(),
  updatedAt: concurrencyToken.optional(),
  displayName: z.string().trim().min(2, "Enter a company name").max(160),
  legalName: optionalText,
  website: optionalText,
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: optionalText,
  trade: optionalText,
  city: optionalText,
  region: optionalText,
  notes: z.string().max(8000).optional().default("")
});

export const contactSchema = z.object({
  contactId: z.uuid().optional(),
  updatedAt: concurrencyToken.optional(),
  firstName: z.string().trim().min(1, "Enter a first name").max(100),
  lastName: z.string().trim().min(1, "Enter a last name").max(100),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: optionalText,
  jobTitle: optionalText,
  department: optionalText,
  notes: z.string().max(8000).optional().default("")
});

export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}
