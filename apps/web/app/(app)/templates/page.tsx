import { Button, EmptyState, Input } from "@closeoutflow/ui";
import Link from "next/link";

import { Notice, StatusBadge, humanize, linkButton } from "../../../components/projects/phase-5-ui";
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
        <div className="overflow-hidden rounded-lg bg-surface shadow-card">
          <table className="hidden w-full table-fixed text-sm md:table">
            <colgroup>
              <col />
              <col className="w-56" />
              <col className="w-36" />
              <col className="w-32" />
            </colgroup>
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Template</th>
                <th>Status</th>
                <th>Requirements</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cards.map(({ display, draft, archived }) => (
                <tr key={display.family_id} className="hover:bg-muted/50">
                  <td className="px-5 py-4">
                    <Link
                      className="block truncate font-semibold hover:text-primary"
                      href={`/templates/${(draft ?? display).id}`}
                      title={display.name}
                    >
                      {display.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {display.is_starter
                        ? "Starter — verify against your contract documents"
                        : display.description || "Reusable closeout standard"}
                    </p>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {archived ? (
                        <StatusBadge status="archived" />
                      ) : (
                        <>
                          {display.status === "published" ? (
                            <span className="text-sm">v{display.version} · Published</span>
                          ) : null}
                          {draft ? (
                            <span className="text-sm text-muted-foreground">
                              {display.status === "published" ? " · " : ""}v{draft.version} draft
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="tabular-nums">{itemCount(draft ?? display)}</td>
                  <td>{formatDateOnly(display.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y md:hidden">
            {cards.map(({ display, draft, archived }) => (
              <article key={display.family_id}>
                <Link href={`/templates/${(draft ?? display).id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate font-semibold">{display.name}</p>
                    {archived ? <StatusBadge status="archived" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {archived
                      ? `v${display.version}`
                      : `${display.status === "published" ? `v${display.version} published` : ""}${draft ? `${display.status === "published" ? " · " : ""}v${draft.version} draft` : ""}`}{" "}
                    · {itemCount(draft ?? display)} requirement
                    {itemCount(draft ?? display) === 1 ? "" : "s"}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
      <p className="mt-5 text-sm text-muted-foreground">
        {humanize("starter")} content is a general example only. Verify every requirement against
        your contract documents and project obligations. Closeout does not provide legal advice.
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
