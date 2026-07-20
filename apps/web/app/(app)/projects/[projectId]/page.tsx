import { Badge, EmptyState, KeyValue } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveContext } from "../../../../lib/active-context";
import { PageHeader } from "../../../../components/shell/page-header";
import {
  Notice,
  Section,
  SetupChecklist,
  StatusBadge,
  humanize,
  outlineLink
} from "../../../../components/projects/phase-5-ui";

type Overview = {
  project: {
    name: string;
    project_number?: string | null;
    status: string;
    planned_start_date?: string | null;
    substantial_completion_date?: string | null;
    closeout_target_date?: string | null;
    city?: string | null;
    region?: string | null;
  };
  setup: Record<string, boolean>;
  team: Array<{ id: string; display_name: string; project_role: string }>;
  companies: Array<{ id: string; display_name: string; role: string }>;
  contacts: Array<{ id: string; name: string; project_title?: string | null }>;
};
export const metadata = { title: "Project overview" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { client } = await getActiveContext();
  const { data, error } = await client.rpc("get_project_overview", {
    target_project_id: projectId
  });
  if (error || !data || Array.isArray(data) || typeof data !== "object") notFound();
  const overview = data as unknown as Overview;
  const p = overview.project;
  return (
    <>
      <PageHeader
        title={String(p.name)}
        description={p.project_number ? `Project ${p.project_number}` : "Project workspace"}
        meta={<StatusBadge status={String(p.status)} />}
        actions={
          <Link className={outlineLink} href={`/projects/${projectId}/settings`}>
            Project settings
          </Link>
        }
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.8fr)]">
        <div className="grid gap-5">
          <SetupChecklist projectId={projectId} setup={overview.setup} />
          <Section title="Important dates">
            <KeyValue
              items={[
                { label: "Planned start", value: p.planned_start_date ?? "Not set" },
                {
                  label: "Substantial completion",
                  value: p.substantial_completion_date ?? "Not set"
                },
                { label: "Closeout target", value: p.closeout_target_date ?? "Not set" },
                {
                  label: "Location",
                  value: [p.city, p.region].filter(Boolean).join(", ") || "Not set"
                }
              ]}
            />
          </Section>
          <Section
            title="Internal team"
            action={
              <Link
                href={`/projects/${projectId}/team`}
                className="text-sm font-medium text-primary"
              >
                Manage
              </Link>
            }
          >
            {overview.team.length ? (
              <ul className="divide-y">
                {overview.team.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-3">
                    <span>{m.display_name}</span>
                    <Badge tone="neutral">{humanize(m.project_role)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No team assigned"
                description="Assign internal teammates to make responsibility clear."
              />
            )}
          </Section>
        </div>
        <div className="grid content-start gap-5">
          <Section
            title="Companies"
            action={
              <Link
                href={`/projects/${projectId}/companies`}
                className="text-sm font-medium text-primary"
              >
                Manage
              </Link>
            }
          >
            {overview.companies.length ? (
              <ul className="space-y-3">
                {overview.companies.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <p className="font-medium">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground">{humanize(c.role)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add the owner, general contractor, and key trade partners.
              </p>
            )}
          </Section>
          <Section
            title="Key contacts"
            action={
              <Link
                href={`/projects/${projectId}/contacts`}
                className="text-sm font-medium text-primary"
              >
                Manage
              </Link>
            }
          >
            {overview.contacts.length ? (
              <ul className="space-y-3">
                {overview.contacts.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.project_title || "Project contact"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Reuse contacts from the organization directory.
              </p>
            )}
          </Section>
          <Section title="Closeout readiness">
            <p className="text-sm text-muted-foreground">
              Project setup is available now. Requirements and document readiness arrive in future
              phases; no placeholder metrics are shown.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
