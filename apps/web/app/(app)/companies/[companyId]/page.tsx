import { Button } from "@closeoutflow/ui";
import { notFound } from "next/navigation";
import {
  archiveCompanyAction,
  restoreCompanyAction,
  updateCompanyAction
} from "../../../../actions/companies";
import {
  DirectoryForm,
  Notice,
  Section,
  StatusBadge
} from "../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../components/shell/page-header";
import { getActiveContext } from "../../../../lib/active-context";
export const metadata = { title: "Company detail" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ companyId }, query] = await Promise.all([params, searchParams]);
  const { client } = await getActiveContext();
  const [{ data: c }, { data: affiliations }, { data: projects }] = await Promise.all([
    client.from("companies").select("*").eq("id", companyId).maybeSingle(),
    client
      .from("company_contacts")
      .select("id,status,job_title,contacts!inner(id,first_name,last_name,email)")
      .eq("company_id", companyId),
    client
      .from("project_companies")
      .select("id,role,status,projects!inner(id,name)")
      .eq("company_id", companyId)
  ]);
  if (!c) notFound();
  return (
    <>
      <PageHeader
        title={c.display_name}
        description="Reusable organization company"
        meta={<StatusBadge status={c.status} />}
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5">
        <Section title="Company details">
          <DirectoryForm kind="company" action={updateCompanyAction} record={c} />
        </Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Associated contacts">
            {affiliations?.length ? (
              <ul className="divide-y">
                {affiliations.map((a) => {
                  const p = Array.isArray(a.contacts) ? a.contacts[0] : a.contacts;
                  return (
                    <li key={a.id} className="py-3">
                      <a className="font-medium text-primary" href={`/contacts/${p?.id}`}>
                        {p?.first_name} {p?.last_name}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {a.job_title || "Contact"} · {a.status}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No company contacts yet.</p>
            )}
          </Section>
          <Section title="Associated projects">
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
                        {a.role.replaceAll("_", " ")} · {a.status}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                This company has not been assigned to a project.
              </p>
            )}
          </Section>
        </div>
        <Section title="Archive and restore">
          <p className="mb-3 text-sm text-muted-foreground">
            Archiving removes this company from active pickers while preserving every relationship
            and audit event.
          </p>
          <form action={c.status === "archived" ? restoreCompanyAction : archiveCompanyAction}>
            <input type="hidden" name="companyId" value={c.id} />
            <Button type="submit" variant="outline">
              {c.status === "archived" ? "Restore company" : "Archive company"}
            </Button>
          </form>
        </Section>
      </div>
    </>
  );
}
