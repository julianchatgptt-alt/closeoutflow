import { Button, EmptyState, Input, Select } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignProjectContactAction,
  removeProjectContactAction
} from "../../../../../actions/project-contacts";
import { Notice, Section, StatusBadge } from "../../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../lib/active-context";

export const metadata = { title: "Project contacts" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { client, organizationId } = await getActiveContext();
  const [{ data: project }, { data: relationships }, { data: contacts }] = await Promise.all([
    client.from("projects").select("id,name,status").eq("id", projectId).maybeSingle(),
    client
      .from("project_contacts")
      .select(
        "id,project_title,is_primary_contact,is_closeout_contact,contacts!inner(id,first_name,last_name,email)"
      )
      .eq("project_id", projectId)
      .eq("status", "active"),
    client.rpc("search_contacts", {
      target_organization_id: organizationId,
      include_archived: false,
      page_size: 100
    })
  ]);
  if (!project) notFound();
  return (
    <>
      <PageHeader
        title="Project contacts"
        description={`Reuse people from the organization directory without creating user accounts for ${project.name}.`}
        meta={<StatusBadge status={project.status} />}
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Section title="Assigned contacts">
          {relationships?.length ? (
            <div className="divide-y">
              {relationships.map((r) => {
                const c = Array.isArray(r.contacts) ? r.contacts[0] : r.contacts;
                return (
                  <div key={r.id} className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/contacts/${c?.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {c?.first_name} {c?.last_name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.project_title || "Project contact"}
                        {r.is_primary_contact ? " · Primary" : ""}
                        {r.is_closeout_contact ? " · Closeout contact" : ""}
                      </p>
                    </div>
                    <form action={removeProjectContactAction}>
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="relationshipId" value={r.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        Remove
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No contacts assigned"
              description="Add key owner, architect, and trade contacts from the reusable directory."
            />
          )}
        </Section>
        <Section title="Add an existing contact">
          <form action={assignProjectContactAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="grid gap-1.5 text-sm font-semibold">
              Contact
              <Select name="contactId" required defaultValue="">
                <option value="" disabled>
                  Select contact
                </option>
                {contacts?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.company_name ? ` · ${c.company_name}` : ""}
                  </option>
                ))}
              </Select>
            </label>
            <label htmlFor="project-contact-title" className="grid gap-1.5 text-sm font-semibold">
              Project title
              <Input id="project-contact-title" name="projectTitle" />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="isPrimaryContact" />
              Primary project contact
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="isCloseoutContact" />
              Closeout contact
            </label>
            <Button type="submit">Add to project</Button>
            <Link className="text-center text-sm font-medium text-primary" href="/contacts/new">
              Create a new contact
            </Link>
          </form>
        </Section>
      </div>
    </>
  );
}
