import { Button, EmptyState, Input, Select } from "@closeoutflow/ui";
import Link from "next/link";
import { Search } from "lucide-react";
import { getActiveContext } from "../../../lib/active-context";
import { PageHeader } from "../../../components/shell/page-header";
import {
  Notice,
  StatusBadge,
  humanize,
  linkButton,
  outlineLink
} from "../../../components/projects/phase-5-ui";

export const metadata = { title: "Projects" };
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    assigned?: string;
    archived?: string;
    cursor?: string;
    cursorId?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const query = await searchParams;
  const { client } = await getActiveContext();
  const { data, error } = await client.rpc("search_projects", {
    search_query: query.q ?? "",
    assigned_only: query.assigned === "1",
    include_archived: query.archived === "1",
    page_size: 25,
    ...(query.status ? { status_filter: query.status } : {}),
    ...(query.cursor ? { cursor_updated_at: query.cursor } : {}),
    ...(query.cursorId ? { cursor_id: query.cursorId } : {})
  });
  const projects = data ?? [];
  const last = projects.at(-1);
  const next = last
    ? new URLSearchParams({ ...query, cursor: last.updated_at, cursorId: last.id })
    : null;
  return (
    <>
      <PageHeader
        title="Projects"
        description="Create, organize, and staff every closeout workspace."
        actions={
          <Link className={linkButton} href="/projects/new">
            Create project
          </Link>
        }
      />
      <Notice error={query.error ?? error?.message} message={query.message} />
      <form
        className="mb-5 grid gap-3 rounded-lg bg-surface p-4 shadow-card md:grid-cols-[minmax(14rem,1fr)_12rem_auto_auto]"
        method="get"
      >
        <label htmlFor="project-search" className="relative">
          <span className="sr-only">Search projects</span>
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            id="project-search"
            name="q"
            defaultValue={query.q}
            placeholder="Search name or number"
            className="pl-9"
          />
        </label>
        <Select aria-label="Project status" name="status" defaultValue={query.status ?? ""}>
          <option value="">All statuses</option>
          {[
            "draft",
            "active",
            "closeout_in_progress",
            "owner_review",
            "published",
            "complete",
            "cancelled"
          ].map((v) => (
            <option key={v} value={v}>
              {humanize(v)}
            </option>
          ))}
        </Select>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="assigned"
            value="1"
            defaultChecked={query.assigned === "1"}
          />
          Assigned to me
        </label>
        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          <Link className={outlineLink} href="/projects">
            Clear
          </Link>
        </div>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="archived"
            value="1"
            defaultChecked={query.archived === "1"}
          />
          Include archived
        </label>
      </form>
      {!error && projects.length === 0 ? (
        <EmptyState
          title={query.q || query.status ? "No matching projects" : "No projects yet"}
          description={
            query.q || query.status
              ? "Try a broader search or clear the filters."
              : "Create your first project in under a minute. Only the name is required."
          }
          action={
            !query.q && !query.status ? (
              <Link className={linkButton} href="/projects/new">
                Create your first project
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg bg-surface shadow-card">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th>Status</th>
                <th>Type</th>
                <th>Closeout target</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-5 py-4">
                    <Link className="font-semibold hover:text-primary" href={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.project_number || "No project number"}
                    </p>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{p.project_type ? humanize(p.project_type) : "—"}</td>
                  <td>{p.closeout_target_date ?? "—"}</td>
                  <td>{p.team_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y md:hidden">
            {projects.map((p) => (
              <article key={p.id}>
                <Link href={`/projects/${p.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.project_number || "No project number"}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {p.team_count} teammates ·{" "}
                    {p.closeout_target_date
                      ? `Target ${p.closeout_target_date}`
                      : "No closeout date"}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
      {next && projects.length === 25 ? (
        <div className="mt-5 flex justify-end">
          <Link className={outlineLink} href={`/projects?${next}`}>
            Next page
          </Link>
        </div>
      ) : null}
    </>
  );
}
