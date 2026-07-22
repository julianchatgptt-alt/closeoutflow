"use server";

import { permissions } from "@closeoutflow/authz";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActiveContext } from "../lib/active-context";
import { authorizeOrganizationAction } from "../lib/authorization";
import { companySchema, formValue } from "../lib/phase-5-schemas";
import { rateLimitRequest } from "../lib/rate-limit";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function parse(formData: FormData) {
  return companySchema.safeParse({
    companyId: formValue(formData, "companyId") || undefined,
    updatedAt: formValue(formData, "updatedAt") || undefined,
    displayName: formValue(formData, "displayName"),
    legalName: formValue(formData, "legalName"),
    website: formValue(formData, "website"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    trade: formValue(formData, "trade"),
    city: formValue(formData, "city"),
    region: formValue(formData, "region"),
    notes: formValue(formData, "notes")
  });
}
function payload(data: z.infer<typeof companySchema>) {
  return {
    display_name: data.displayName,
    legal_name: data.legalName,
    website: data.website,
    email: data.email,
    phone: data.phone,
    trade: data.trade,
    city: data.city,
    region: data.region,
    notes: data.notes,
    country: "US",
    classifications: [],
    tags: []
  };
}

export async function createCompanyAction(formData: FormData): Promise<void> {
  const parsed = parse(formData);
  if (!parsed.success)
    fail("/companies/new", parsed.error.issues[0]?.message ?? "Check the company details");
  const { client, user, organizationId } = await getActiveContext();
  if (!(await rateLimitRequest("directory-mutation", user.id)))
    fail("/companies/new", "Too many attempts. Try again shortly.");
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.companyCreate,
    resource: { type: "company", id: organizationId }
  });
  if (!auth.allowed) fail("/companies/new", "You do not have permission to create companies");
  const { data, error } = await client.rpc("create_company", {
    target_organization_id: organizationId,
    company_data: payload(parsed.data),
    request_id: createRequestId()
  });
  if (error || !data) fail("/companies/new", "The company could not be created");
  redirect(`/companies/${data}?message=Company created`);
}
export async function updateCompanyAction(formData: FormData): Promise<void> {
  const parsed = parse(formData);
  const id = formValue(formData, "companyId");
  const path = `/companies/${id}`;
  if (!parsed.success || !parsed.data.companyId || !parsed.data.updatedAt)
    fail(path, "Check the company details");
  const { client, user, organizationId } = await getActiveContext();
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.companyUpdate,
    resource: { type: "company", id: parsed.data.companyId }
  });
  if (!auth.allowed) fail(path, "You do not have permission to update companies");
  const { error } = await client.rpc("update_company", {
    target_company_id: parsed.data.companyId,
    expected_updated_at: parsed.data.updatedAt,
    company_data: payload(parsed.data),
    request_id: createRequestId()
  });
  if (error)
    fail(
      path,
      error.code === "P0001" && error.message === "company was updated by another user"
        ? "This company changed while you were editing. Reload and try again."
        : "The company could not be updated"
    );
  redirect(`${path}?message=Company updated`);
}
export async function archiveCompanyAction(formData: FormData): Promise<void> {
  return lifecycle(formData, "archive");
}
export async function restoreCompanyAction(formData: FormData): Promise<void> {
  return lifecycle(formData, "restore");
}
async function lifecycle(formData: FormData, kind: "archive" | "restore"): Promise<never> {
  const id = z.uuid().safeParse(formData.get("companyId"));
  if (!id.success) fail("/companies", "Invalid company");
  const { client, user, organizationId } = await getActiveContext();
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.companyArchive,
    resource: { type: "company", id: id.data }
  });
  if (!auth.allowed) fail(`/companies/${id.data}`, "Company lifecycle permission denied");
  const result =
    kind === "archive"
      ? await client.rpc("archive_company", {
          target_company_id: id.data,
          request_id: createRequestId()
        })
      : await client.rpc("restore_company", {
          target_company_id: id.data,
          request_id: createRequestId()
        });
  if (result.error) fail(`/companies/${id.data}`, `The company could not be ${kind}d`);
  redirect(`/companies/${id.data}?message=Company ${kind === "archive" ? "archived" : "restored"}`);
}
