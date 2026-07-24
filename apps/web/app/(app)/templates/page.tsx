import { Badge, Button, EmptyState, Input } from "@closeoutflow/ui";
import Link from "next/link";

import { Notice, StatusBadge, linkButton } from "../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../components/shell/page-header";
import { getActiveContext } from "../../../lib/active-context";
import { formatDateOnly } from "../../../lib/date-format";

export const metadata = { title: "Requirement Templates" };

type TemplateRow = {
  id: string;
  family_id: string;
  version: number;
  name: string;
  description: string | null;
  status: string;
  is_starter: boolean;
  updated_at: string;
  archived_at: string | null;
  requirement_template_items: Array<{ count: number }> | { count: number } | null;
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ q?: string; archived?: string; error?: string; message?: string }>;
}) {
  const query = await searchParams;
  const { client, organizationId, membership } = await getActiveContext();
  await client.rpc("ensure_requirement_defaults", { target_organization_id: organizationId });

  const { data, error } = await client
    .from("requirement_templates")
    .select(
      "id,family_id,version,name,description,status,is_starter,updated_at,archived_at,requirement_template_items(count)"
    )
    .eq("organization_id", organizationId)
    .order("version", { ascending: false });
  const canManage = ["owner", "administrator", "project_manager", "closeout_coordinator"].includes(
    membership.role
  );

  const families = new Map<string, TemplateRow[]>();
  for (const row of (data ?? []) as TemplateRow[]) {
    const bucket = families.get(row.family_id) ?? [];
    bucket.push(row);
    families.set(row.family_id, bucket);
  }
  const search = (query.q ?? "").trim().toLowerCase();
  const showArchived = query.archived === "1";
  const cards = [...families.values()]
    .map((versions) => {
      const archived = versions.every((version) => version.archived_at);
      const display = versions.find((version) => version.status === "published") ?? versions[0]!;
      const draft = versions.find((version) => version.status === "draft");
      return { versions, archived, display, draft };
    })
    .filter((family) => (showArchived ? family.archived : !family.archived))
    .filter((family) => !search || family.display.name.toLowerCase().includes(search))
    .sort((a, b) => a.display.name.localeCompare(b.display.name));

  const itemCount = (row: TemplateRow) =>
    Array.isArray(row.requirement_template_items)
      ? (row.requirement_template_items[0]?.count ?? 0)
      : (row.requirement_template_items?.count ?? 0);

  return (
    <>
      <PageHeader
        title="Requirement Templates"
        description="Capture your closeout standard once, then apply it to every project. Published versions are locked; edits create the next version."
        actions={
          canManage ? (
            <Link className={linkButton} href="/templates/new">
              New template
            </Link>
          ) : undefined
        }
      />
      <Notice error={query.error} message={query.message} />
      <form method="get" className="mb-5 flex flex-wrap items-center gap-3">
        <label htmlFor="template-search" className="min-w-56 flex-1 sm:max-w-xs">
          <span className="sr-only">Search templates</span>
          <Input
            id="template-search"
            type="search"
            name="q"
            placeholder="Search templates"
            defaultValue={query.q ?? ""}
            aria-label="Search templates"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="archived" value="1" defaultChecked={showArchived} />
          Show archived
        </label>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {error ? (
        <EmptyState
          title="Templates could not load"
          description="Reload the page to try again. Nothing was changed."
        />
      ) : cards.length === 0 ? (
        <EmptyState
          title={search || showArchived ? "No matching templates" : "No templates yet"}
          description={
            search || showArchived
              ? "Try a broader search or clear the filters."
              : "Templates let you set up a project’s closeout scope in minutes instead of rebuilding it each time."
          }
          action={
            !search && !showArchived && canManage ? (
              <Link className={linkButton} href="/templates/new">
                Create your first template
              </Link>
            ) : undefined
          }
        />
      ) : (
        /* Templates are a reuse surface, not a settings table: one card per
           family, leading with the name, what it standardises, and where the
           version chain currently stands. */
        <ul className="grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ display, draft, archived }) => {
            const target = draft ?? display;
            const count = itemCount(target);
            return (
              <li key={display.family_id}>
                <Link
                  href={`/templates/${target.id}`}
                  className="group flex h-full flex-col rounded-lg bg-surface p-5 shadow-card transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2
                      className="min-w-0 truncate font-semibold group-hover:text-primary"
                      title={display.name}
                    >
                      {display.name}
                    </h2>
                    {archived ? (
                      <div className="shrink-0">
                        <StatusBadge status="archived" />
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
                    {display.is_starter
                      ? "Editable starting point. Verify requirements against your contract documents and project obligations."
                      : display.description || "Reusable closeout standard"}
                  </p>

                  {!archived ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {display.status === "published" ? (
                        <Badge tone="success">v{display.version} published</Badge>
                      ) : null}
                      {draft ? <Badge tone="warning">v{draft.version} draft</Badge> : null}
                    </div>
                  ) : null}

                  <div className="mt-auto flex items-baseline justify-between gap-3 pt-4 text-[13px] text-muted-foreground">
                    <span className="tabular-nums">
                      {count} {count === 1 ? "requirement" : "requirements"}
                    </span>
                    <span>Updated {formatDateOnly(display.updated_at)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {/* FD-6 starter disclaimer, worded exactly as approved. */}
      <p className="mt-6 rounded-lg bg-surface-sunken p-4 text-[13px] text-muted-foreground">
        Editable starting point. Verify requirements against your contract documents and project
        obligations. Closeout does not provide legal advice.
      </p>
      {!canManage ? (
        <p className="mt-2 text-sm text-muted-foreground">
          You can browse templates; editing is available to administrators, project managers, and
          closeout coordinators.
        </p>
      ) : null}
    </>
  );
}
