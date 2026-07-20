import { Button, EmptyState, Input, Select } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignProjectCompanyAction,
  removeProjectCompanyAction
} from "../../../../../actions/project-companies";
import {
  Notice,
  Section,
  StatusBadge,
  humanize
} from "../../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../lib/active-context";

const roles = [
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
];
export const metadata = { title: "Project companies" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { client, organizationId } = await getActiveContext();
  const [{ data: project }, { data: relationships }, { data: companies }] = await Promise.all([
    client.from("projects").select("id,name,status").eq("id", projectId).maybeSingle(),
    client
      .from("project_companies")
      .select("id,role,trade_scope,contract_number,companies!inner(id,display_name)")
      .eq("project_id", projectId)
      .eq("status", "active"),
    client.rpc("search_companies", {
      target_organization_id: organizationId,
      include_archived: false,
      page_size: 100
    })
  ]);
  if (!project) notFound();
  return (
    <>
      <PageHeader
        title="Project companies"
        description={`Reuse organization companies and give each one a project-specific role on ${project.name}.`}
        meta={<StatusBadge status={project.status} />}
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Section title="Assigned companies">
          {relationships?.length ? (
            <div className="divide-y">
              {relationships.map((r) => {
                const company = Array.isArray(r.companies) ? r.companies[0] : r.companies;
                return (
                  <div key={r.id} className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/companies/${company?.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {company?.display_name ?? "Company"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {humanize(r.role)}
                        {r.trade_scope ? ` · ${r.trade_scope}` : ""}
                      </p>
                    </div>
                    <form action={removeProjectCompanyAction}>
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
              title="No companies assigned"
              description="Add the owner, general contractor, architect, or key trade partners."
            />
          )}
        </Section>
        <Section title="Add an existing company">
          <form action={assignProjectCompanyAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="grid gap-1.5 text-sm font-semibold">
              Company
              <Select name="companyId" required defaultValue="">
                <option value="" disabled>
                  Select company
                </option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Project role
              <Select name="role" defaultValue="subcontractor">
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </Select>
            </label>
            <label htmlFor="project-company-scope" className="grid gap-1.5 text-sm font-semibold">
              Trade or scope
              <Input id="project-company-scope" name="tradeScope" />
            </label>
            <label
              htmlFor="project-company-contract"
              className="grid gap-1.5 text-sm font-semibold"
            >
              Contract number
              <Input id="project-company-contract" name="contractNumber" />
            </label>
            <Button type="submit">Add to project</Button>
            <Link className="text-center text-sm font-medium text-primary" href="/companies/new">
              Create a new company
            </Link>
          </form>
        </Section>
      </div>
    </>
  );
}
