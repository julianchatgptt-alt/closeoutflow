"use server";

import { permissions } from "@closeoutflow/authz";
import { createRequestId } from "@closeoutflow/observability";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveContext } from "../lib/active-context";
import { authorizeProjectAction } from "../lib/authorization";
import { formValue } from "../lib/phase-5-schemas";

function fail(id: string, msg: string): never {
  redirect(`/projects/${id}/contacts?error=${encodeURIComponent(msg)}`);
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
    permission: permissions.projectManageContacts
  });
  if (!d.allowed) fail(id.data, "Project contact permission denied");
  return { ...a, projectId: id.data };
}
export async function assignProjectContactAction(fd: FormData): Promise<void> {
  const contact = z.uuid().safeParse(fd.get("contactId"));
  const { client, projectId } = await context(fd);
  if (!contact.success) fail(projectId, "Select a contact");
  const { error } = await client.rpc("assign_project_contact", {
    target_project_id: projectId,
    target_contact_id: contact.data,
    relationship_data: {
      project_title: formValue(fd, "projectTitle"),
      is_primary_contact: fd.get("isPrimaryContact") === "on",
      is_closeout_contact: fd.get("isCloseoutContact") === "on"
    },
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The contact could not be assigned");
  redirect(`/projects/${projectId}/contacts?message=Contact added to project`);
}
export async function removeProjectContactAction(fd: FormData): Promise<void> {
  const relationship = z.uuid().safeParse(fd.get("relationshipId"));
  const { client, projectId } = await context(fd);
  if (!relationship.success) fail(projectId, "Invalid contact assignment");
  const { error } = await client.rpc("remove_project_contact", {
    target_project_contact_id: relationship.data,
    request_id: createRequestId()
  });
  if (error) fail(projectId, "The contact assignment could not be removed");
  redirect(`/projects/${projectId}/contacts?message=Contact removed from project`);
}
