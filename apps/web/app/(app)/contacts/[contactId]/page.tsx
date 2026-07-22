import { Button, Input, Select } from "@closeoutflow/ui";
import { notFound } from "next/navigation";
import {
  archiveContactAction,
  endCompanyContactAction,
  linkCompanyContactAction,
  restoreContactAction,
  updateContactAction
} from "../../../../actions/contacts";
import {
  DirectoryForm,
  Notice,
  Section,
  StatusBadge
} from "../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../components/shell/page-header";
import { DateCell } from "../../../../components/table/cells";
import { getActiveContext } from "../../../../lib/active-context";
export const metadata = { title: "Contact detail" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ contactId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ contactId }, query] = await Promise.all([params, searchParams]);
  const { client, organizationId } = await getActiveContext();
  const [{ data: c }, { data: affiliations }, { data: projects }, { data: companies }] =
    await Promise.all([
      client.from("contacts").select("*").eq("id", contactId).maybeSingle(),
      client
        .from("company_contacts")
        .select(
          "id,status,job_title,department,started_on,ended_on,is_primary_contact,companies!inner(id,display_name)"
        )
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false }),
      client
        .from("project_contacts")
        .select("id,status,project_title,projects!inner(id,name)")
        .eq("contact_id", contactId),
      client.rpc("search_companies", {
        target_organization_id: organizationId,
        include_archived: false,
        page_size: 100
      })
    ]);
  if (!c) notFound();
  return (
    <>
      <PageHeader
        title={`${c.first_name} ${c.last_name}`}
        description="Reusable external contact — not an authenticated user"
        meta={<StatusBadge status={c.status} />}
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5">
        <Section title="Contact details">
          <DirectoryForm kind="contact" action={updateContactAction} record={c} />
        </Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Company affiliation history">
            {affiliations?.length ? (
              <ul className="divide-y">
                {affiliations.map((a) => {
                  const company = Array.isArray(a.companies) ? a.companies[0] : a.companies;
                  return (
                    <li key={a.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <a
                            href={`/companies/${company?.id}`}
                            className="font-medium text-primary"
                          >
                            {company?.display_name}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            {a.job_title || "Contact"} · {a.status}
                            {a.started_on ? (
                              <>
                                {" "}
                                · since <DateCell value={a.started_on} />
                              </>
                            ) : null}
                            {a.ended_on ? (
                              <>
                                {" "}
                                · ended <DateCell value={a.ended_on} />
                              </>
                            ) : null}
                          </p>
                        </div>
                        {a.status === "active" ? (
                          <form action={endCompanyContactAction}>
                            <input type="hidden" name="contactId" value={c.id} />
                            <input type="hidden" name="affiliationId" value={a.id} />
                            <Button size="sm" variant="ghost" type="submit">
                              End
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">No company affiliations.</p>
            )}
            <form
              action={linkCompanyContactAction}
              className="mt-4 grid gap-3 rounded-md bg-surface-sunken p-4"
            >
              <input type="hidden" name="contactId" value={c.id} />
              <label className="grid gap-1 text-sm font-semibold">
                Company
                <Select name="companyId" required defaultValue="">
                  <option value="" disabled>
                    Select company
                  </option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.display_name}
                    </option>
                  ))}
                </Select>
              </label>
              <label htmlFor="affiliation-title" className="grid gap-1 text-sm font-semibold">
                Job title
                <Input id="affiliation-title" name="jobTitle" defaultValue={c.job_title ?? ""} />
              </label>
              <label htmlFor="affiliation-start" className="grid gap-1 text-sm font-semibold">
                Start date
                <Input id="affiliation-start" type="date" name="startedOn" />
              </label>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" name="isPrimaryContact" />
                Primary company contact
              </label>
              <Button type="submit">Save affiliation</Button>
            </form>
          </Section>
          <Section title="Project relationships">
            {projects?.length ? (
              <ul className="divide-y">
                {projects.map((a) => {
                  const p = Array.isArray(a.projects) ? a.projects[0] : a.projects;
                  return (
                    <li key={a.id} className="py-3">
                      <a className="font-medium text-primary" href={`/projects/${p?.id}`}>
                        {p?.name}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {a.project_title || "Project contact"} · {a.status}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                This contact has not been assigned to a project.
              </p>
            )}
          </Section>
        </div>
        <Section title="Archive and restore">
          <p className="mb-3 text-sm text-muted-foreground">
            Archiving preserves affiliations and project history while removing this contact from
            active pickers.
          </p>
          <form action={c.status === "archived" ? restoreContactAction : archiveContactAction}>
            <input type="hidden" name="contactId" value={c.id} />
            <Button type="submit" variant="outline">
              {c.status === "archived" ? "Restore contact" : "Archive contact"}
            </Button>
          </form>
        </Section>
      </div>
    </>
  );
}
