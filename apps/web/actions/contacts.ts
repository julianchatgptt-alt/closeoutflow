"use server";

import { permissions } from "@closeoutflow/authz";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getActiveContext } from "../lib/active-context";
import { authorizeOrganizationAction } from "../lib/authorization";
import { contactSchema, formValue } from "../lib/phase-5-schemas";
import { rateLimitRequest } from "../lib/rate-limit";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function parse(fd: FormData) {
  return contactSchema.safeParse({
    contactId: formValue(fd, "contactId") || undefined,
    updatedAt: formValue(fd, "updatedAt") || undefined,
    firstName: formValue(fd, "firstName"),
    lastName: formValue(fd, "lastName"),
    email: formValue(fd, "email"),
    phone: formValue(fd, "phone"),
    jobTitle: formValue(fd, "jobTitle"),
    department: formValue(fd, "department"),
    notes: formValue(fd, "notes")
  });
}
function payload(d: z.infer<typeof contactSchema>) {
  return {
    first_name: d.firstName,
    last_name: d.lastName,
    email: d.email,
    phone: d.phone,
    job_title: d.jobTitle,
    department: d.department,
    notes: d.notes
  };
}
export async function createContactAction(fd: FormData): Promise<void> {
  const parsed = parse(fd);
  if (!parsed.success)
    fail("/contacts/new", parsed.error.issues[0]?.message ?? "Check the contact details");
  const { client, user, organizationId } = await getActiveContext();
  if (!(await rateLimitRequest("directory-mutation", user.id)))
    fail("/contacts/new", "Too many attempts. Try again shortly.");
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.contactCreate,
    resource: { type: "contact", id: organizationId }
  });
  if (!auth.allowed) fail("/contacts/new", "You do not have permission to create contacts");
  const { data, error } = await client.rpc("create_contact", {
    target_organization_id: organizationId,
    contact_data: payload(parsed.data),
    request_id: createRequestId()
  });
  if (error || !data) fail("/contacts/new", "The contact could not be created");
  redirect(`/contacts/${data}?message=Contact created`);
}
export async function updateContactAction(fd: FormData): Promise<void> {
  const parsed = parse(fd);
  const id = formValue(fd, "contactId");
  const path = `/contacts/${id}`;
  if (!parsed.success || !parsed.data.contactId || !parsed.data.updatedAt)
    fail(path, "Check the contact details");
  const { client, user, organizationId } = await getActiveContext();
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.contactUpdate,
    resource: { type: "contact", id: parsed.data.contactId }
  });
  if (!auth.allowed) fail(path, "You do not have permission to update contacts");
  const { error } = await client.rpc("update_contact", {
    target_contact_id: parsed.data.contactId,
    expected_updated_at: parsed.data.updatedAt,
    contact_data: payload(parsed.data),
    request_id: createRequestId()
  });
  if (error)
    fail(
      path,
      error.code === "P0001" && error.message === "contact was updated by another user"
        ? "This contact changed while you were editing. Reload and try again."
        : "The contact could not be updated"
    );
  redirect(`${path}?message=Contact updated`);
}
export async function archiveContactAction(fd: FormData): Promise<void> {
  return lifecycle(fd, "archive");
}
export async function restoreContactAction(fd: FormData): Promise<void> {
  return lifecycle(fd, "restore");
}
async function lifecycle(fd: FormData, kind: "archive" | "restore"): Promise<never> {
  const id = z.uuid().safeParse(fd.get("contactId"));
  if (!id.success) fail("/contacts", "Invalid contact");
  const { client, user, organizationId } = await getActiveContext();
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.contactArchive,
    resource: { type: "contact", id: id.data }
  });
  if (!auth.allowed) fail(`/contacts/${id.data}`, "Contact lifecycle permission denied");
  const result =
    kind === "archive"
      ? await client.rpc("archive_contact", {
          target_contact_id: id.data,
          request_id: createRequestId()
        })
      : await client.rpc("restore_contact", {
          target_contact_id: id.data,
          request_id: createRequestId()
        });
  if (result.error) fail(`/contacts/${id.data}`, `The contact could not be ${kind}d`);
  redirect(`/contacts/${id.data}?message=Contact ${kind === "archive" ? "archived" : "restored"}`);
}

export async function linkCompanyContactAction(fd: FormData): Promise<void> {
  const company = z.uuid().safeParse(fd.get("companyId"));
  const contact = z.uuid().safeParse(fd.get("contactId"));
  if (!company.success || !contact.success) fail("/contacts", "Invalid company affiliation");
  const { client, user, organizationId } = await getActiveContext();
  const auth = await authorizeOrganizationAction({
    client,
    userId: user.id,
    organizationId,
    permission: permissions.contactUpdate,
    resource: { type: "contact", id: contact.data }
  });
  if (!auth.allowed) fail(`/contacts/${contact.data}`, "Affiliation permission denied");
  const { error } = await client.rpc("link_company_contact", {
    target_company_id: company.data,
    target_contact_id: contact.data,
    affiliation_data: {
      job_title: formValue(fd, "jobTitle"),
      department: formValue(fd, "department"),
      is_primary_contact: fd.get("isPrimaryContact") === "on",
      started_on: formValue(fd, "startedOn")
    },
    request_id: createRequestId()
  });
  if (error) fail(`/contacts/${contact.data}`, "The affiliation could not be saved");
  redirect(`/contacts/${contact.data}?message=Company affiliation saved`);
}
export async function endCompanyContactAction(fd: FormData): Promise<void> {
  const affiliation = z.uuid().safeParse(fd.get("affiliationId"));
  const contact = z.uuid().safeParse(fd.get("contactId"));
  if (!affiliation.success || !contact.success) fail("/contacts", "Invalid company affiliation");
  const { client } = await getActiveContext();
  const { error } = await client.rpc("end_company_contact", {
    target_company_contact_id: affiliation.data,
    p_ended_on: formValue(fd, "endedOn") || new Date().toISOString().slice(0, 10),
    request_id: createRequestId()
  });
  if (error) fail(`/contacts/${contact.data}`, "The affiliation could not be ended");
  redirect(`/contacts/${contact.data}?message=Affiliation history preserved`);
}
