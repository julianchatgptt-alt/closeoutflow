import { Badge, EmptyState, KeyValue } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveContext } from "../../../../lib/active-context";
import { DateCell } from "../../../../components/table/cells";
import { PageHeader } from "../../../../components/shell/page-header";
import {
  Notice,
  Section,
  SetupChecklist,
  StatusBadge,
  humanize,
  linkButton,
  outlineLink
} from "../../../../components/projects/phase-5-ui";
import { formatDateOnly } from "../../../../lib/date-format";
import type { RequirementSummary } from "../../../../lib/phase-6-schemas";

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
  const [{ data, error }, summaryResult] = await Promise.all([
    client.rpc("get_project_overview", { target_project_id: projectId }),
    client.rpc("get_requirement_summary", { target_project_id: projectId })
  ]);
  if (error || !data || Array.isArray(data) || typeof data !== "object") notFound();
  const overview = data as unknown as Overview;
  const summary = (summaryResult.data ?? {}) as RequirementSummary;
  const requirementCount = (summary.total ?? 0) + (summary.not_applicable ?? 0);
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
          <SetupChecklist
            projectId={projectId}
            setup={{ ...overview.setup, requirements: requirementCount > 0 }}
          />
          <Section title="Important dates">
            <KeyValue
              items={[
                {
                  label: "Planned start",
                  value: p.planned_start_date ? (
                    <DateCell value={p.planned_start_date} />
                  ) : (
                    "Not set"
                  )
                },
                {
                  label: "Substantial completion",
                  value: p.substantial_completion_date ? (
                    <DateCell value={p.substantial_completion_date} />
                  ) : (
                    "Not set"
                  )
                },
                {
                  label: "Closeout target",
                  value: p.closeout_target_date ? (
                    <DateCell value={p.closeout_target_date} />
                  ) : (
                    "Not set"
                  )
                },
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
          <Section
            title="Closeout requirements"
            action={
              requirementCount > 0 ? (
                <Link
                  href={`/projects/${projectId}/requirements`}
                  className="text-sm font-medium text-primary"
                >
                  Open register
                </Link>
              ) : undefined
            }
          >
            {requirementCount > 0 ? (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">{summary.total ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Requirements</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {summary.needs_attention ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Need setup attention</p>
                  </div>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  {summary.unassigned_company ?? 0} unassigned · {summary.missing_due_date ?? 0}{" "}
                  without dates
                  {summary.not_applicable ? ` · ${summary.not_applicable} not applicable` : ""}
                </p>
                {(() => {
                  const total = summary.total ?? 0;
                  const configured = summary.configured ?? 0;
                  const percent = total > 0 ? Math.round((configured / total) * 100) : 0;
                  return (
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Setup progress</span>
                        <span className="tabular-nums">{percent}%</span>
                      </div>
                      <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })()}
                {(summary.upcoming ?? []).length ? (
                  <ul className="mb-4 grid gap-2 text-sm">
                    {(summary.upcoming ?? []).map((upcoming) => (
                      <li key={upcoming.id} className="flex items-center justify-between gap-3">
                        <Link
                          href={`/projects/${projectId}/requirements/${upcoming.id}`}
                          className="min-w-0 truncate font-medium hover:text-primary"
                        >
                          {upcoming.title}
                        </Link>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {formatDateOnly(upcoming.due_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {(summary.needs_attention ?? 0) > 0 ? (
                  <Link
                    className="text-sm font-medium text-primary"
                    href={`/projects/${projectId}/requirements?attention=1`}
                  >
                    Review {summary.needs_attention} requirement
                    {summary.needs_attention === 1 ? "" : "s"} needing attention →
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Define the closeout scope for this project. Apply your organization template or
                  add requirements one by one — submissions and reviews arrive in later phases.
                </p>
                <Link className={linkButton} href={`/projects/${projectId}/requirements`}>
                  Add closeout requirements
                </Link>
              </>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
