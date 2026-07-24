import { Button, EmptyState, Input } from "@closeoutflow/ui";
import { Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "../../../components/shell/page-header";
import {
  Notice,
  StatusBadge,
  linkButton,
  outlineLink
} from "../../../components/projects/phase-5-ui";
import { getActiveContext } from "../../../lib/active-context";
export const metadata = { title: "Companies" };
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ q?: string; archived?: string; error?: string; message?: string }>;
}) {
  const query = await searchParams;
  const { client, organizationId } = await getActiveContext();
  const { data, error } = await client.rpc("search_companies", {
    target_organization_id: organizationId,
    search_query: query.q ?? "",
    include_archived: query.archived === "1",
    page_size: 50
  });
  const rows = data ?? [];
  return (
    <>
      <PageHeader
        title="Companies"
        description="Maintain one reusable organization directory; project roles are assigned per project."
        actions={
          <Link className={linkButton} href="/companies/new">
            Create company
          </Link>
        }
      />
      <Notice error={query.error ?? error?.message} message={query.message} />
      <form
        method="get"
        className="mb-5 flex flex-col gap-3 rounded-lg bg-surface-sunken p-4 sm:flex-row"
      >
        <label htmlFor="company-search" className="relative flex-1">
          <span className="sr-only">Search companies</span>
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="company-search"
            name="q"
            defaultValue={query.q}
            placeholder="Search company or website"
            className="pl-9"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="archived"
            value="1"
            defaultChecked={query.archived === "1"}
          />
          Include archived
        </label>
        <Button type="submit">Search</Button>
        <Link className={outlineLink} href="/companies">
          Clear
        </Link>
      </form>
      {rows.length ? (
        <div className="overflow-hidden rounded-lg bg-surface shadow-card">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-hairline text-left">
              <tr>
                <th className="text-overline px-5 py-3">Company</th>
                <th className="text-overline">Trade</th>
                <th className="text-overline">Projects</th>
                <th className="text-overline">Contacts</th>
                <th className="text-overline">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-sunken">
                  <td className="max-w-sm px-5 py-3.5">
                    <Link
                      href={`/companies/${c.id}`}
                      className="block truncate font-semibold hover:text-primary"
                      title={c.display_name}
                    >
                      {c.display_name}
                    </Link>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {c.legal_name || "Reusable organization record"}
                    </p>
                  </td>
                  <td className="text-[13.5px]">{c.trade || "—"}</td>
                  <td className="tabular-nums">{c.project_count}</td>
                  <td className="tabular-nums">{c.contact_count}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-hairline md:hidden">
            {rows.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`} className="block p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-semibold" title={c.display_name}>
                    {c.display_name}
                  </p>
                  <div className="shrink-0">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  {c.project_count} {c.project_count === 1 ? "project" : "projects"} ·{" "}
                  {c.contact_count} {c.contact_count === 1 ? "contact" : "contacts"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title={query.q ? "No matching companies" : "No companies yet"}
          description={
            query.q
              ? "Try a broader search."
              : "Create a reusable company once, then assign different roles on each project."
          }
          action={
            !query.q ? (
              <Link className={linkButton} href="/companies/new">
                Create company
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}
