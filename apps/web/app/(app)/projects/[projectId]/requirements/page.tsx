import { Button, EmptyState, Field, Input, Select } from "@closeoutflow/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import {
  bulkUpdateRequirementsAction,
  createRequirementAction,
  moveRequirementAction
} from "../../../../../actions/project-requirements";
import {
  Notice,
  StatusBadge,
  humanize,
  linkButton,
  outlineLink
} from "../../../../../components/projects/phase-5-ui";
import {
  DueDateCell,
  OwnerCell,
  RequirementStatusBadge,
  ResponsibilityCell,
  SourceLine
} from "../../../../../components/requirements/phase-6-ui";
import { ConfirmSubmit } from "../../../../../components/requirements/confirm-submit";
import { PageHeader } from "../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../lib/active-context";
import type { RegisterRow, RequirementSummary } from "../../../../../lib/phase-6-schemas";

export const metadata = { title: "Requirements" };

type Query = {
  q?: string;
  category?: string;
  status?: string;
  attention?: string;
  archived?: string;
  add?: string;
  after?: string;
  error?: string;
  message?: string;
};

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Query>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(projectId).success) notFound();
  const { client, organizationId } = await getActiveContext();

  const cursor = (query.after ?? "").split("~");
  const filters: Record<string, string> = {};
  if (query.category) filters.category_id = query.category;
  if (query.status === "active" || query.status === "not_applicable") filters.status = query.status;
  if (query.attention === "1") filters.needs_attention = "true";
  if (query.archived === "1") filters.include_archived = "true";

  const [projectResult, summaryResult, rowsResult, canManageResult, categoriesResult] =
    await Promise.all([
      client.from("projects").select("id,name,status").eq("id", projectId).maybeSingle(),
      client.rpc("get_requirement_summary", { target_project_id: projectId }),
      client.rpc("search_project_requirements", {
        target_project_id: projectId,
        search_query: query.q ?? "",
        filters,
        page_size: 200,
        ...(cursor.length === 3 && cursor[2]
          ? {
              cursor_category_sort: Number(cursor[0]),
              cursor_sort_order: Number(cursor[1]),
              cursor_id: cursor[2]
            }
          : {})
      }),
      client.rpc("project_permission", {
        target_project_id: projectId,
        permission: "requirement.manage"
      }),
      client
        .from("requirement_categories")
        .select("id,name,sort_order")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("sort_order")
    ]);

  const project = projectResult.data;
  if (!project || summaryResult.error) notFound();
  const summary = (summaryResult.data ?? {}) as RequirementSummary;
  const rows = (rowsResult.data ?? []) as RegisterRow[];
  const canManage = canManageResult.data === true && project.status !== "archived";
  const categories = categoriesResult.data ?? [];
  const registerPath = `/projects/${projectId}/requirements`;
  const hasFilters = Boolean(query.q || query.category || query.status || query.attention);
  const hasAnyConfigured = (summary.total ?? 0) + (summary.not_applicable ?? 0) > 0;
  const canReorder =
    canManage && !hasFilters && query.archived !== "1" && query.after === undefined;

  const grouped = new Map<string, RegisterRow[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.category_name) ?? [];
    bucket.push(row);
    grouped.set(row.category_name, bucket);
  }
  const lastRow = rows.at(-1);
  const nextCursor =
    rows.length === 200 && lastRow
      ? `${lastRow.category_sort}~${lastRow.sort_order}~${lastRow.id}`
      : null;

  const chip = (label: string, count: number | undefined, href: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-foreground hover:bg-muted"}`}
    >
      {label}
      <span className="tabular-nums text-muted-foreground">{count ?? 0}</span>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Requirements"
        description={`The closeout scope for ${project.name}. Requests and submissions arrive with the subcontractor portal.`}
        meta={<StatusBadge status={project.status} />}
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Link className={outlineLink} href={`${registerPath}/apply`}>
                Apply template
              </Link>
              <Link className={linkButton} href={`${registerPath}?add=1#add-requirement`}>
                Add requirement
              </Link>
            </div>
          ) : undefined
        }
      />
      <Notice error={query.error} message={query.message} recoveryHref={registerPath} />
      {project.status === "archived" ? (
        <p role="status" className="mb-5 rounded-md border border-border bg-muted p-3 text-sm">
          This project is archived. The requirement register is read only.
        </p>
      ) : null}

      {hasAnyConfigured ? (
        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Register summary">
          {chip("Requirements", summary.total, registerPath, !hasFilters && query.archived !== "1")}
          {chip(
            "Needs attention",
            summary.needs_attention,
            `${registerPath}?attention=1`,
            query.attention === "1"
          )}
          {chip(
            "Not applicable",
            summary.not_applicable,
            `${registerPath}?status=not_applicable`,
            query.status === "not_applicable"
          )}
          <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
            {summary.unassigned_company ?? 0} unassigned · {summary.missing_due_date ?? 0} without
            dates
          </span>
        </div>
      ) : null}

      {hasAnyConfigured ? (
        <form
          method="get"
          className="mb-5 flex flex-wrap items-end gap-3 rounded-lg bg-surface p-4 shadow-card"
        >
          <label
            htmlFor="register-search"
            className="grid min-w-48 flex-1 gap-1.5 text-sm font-semibold"
          >
            <span className="sr-only">Search requirements</span>
            <Input
              id="register-search"
              type="search"
              name="q"
              placeholder="Search requirements"
              defaultValue={query.q ?? ""}
              aria-label="Search requirements"
            />
          </label>
          <label htmlFor="register-filter-category" className="grid gap-1.5 text-sm font-semibold">
            Category
            <Select
              id="register-filter-category"
              name="category"
              defaultValue={query.category ?? ""}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
          <label htmlFor="register-filter-status" className="grid gap-1.5 text-sm font-semibold">
            Status
            <Select id="register-filter-status" name="status" defaultValue={query.status ?? ""}>
              <option value="">All statuses</option>
              <option value="active">Planned</option>
              <option value="not_applicable">Not applicable</option>
            </Select>
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="archived"
              value="1"
              defaultChecked={query.archived === "1"}
            />
            Include removed
          </label>
          <Button type="submit">Apply</Button>
          <Link className={outlineLink} href={registerPath}>
            Clear
          </Link>
        </form>
      ) : null}

      {canManage && (query.add === "1" || !hasAnyConfigured) ? (
        <section
          id="add-requirement"
          aria-label="Add requirement"
          className="mb-5 rounded-lg bg-surface p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Add a requirement
          </h2>
          <form action={createRequirementAction} className="mt-3 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={projectId} />
            <Field label="Requirement title" htmlFor="requirement-title" required>
              <Input id="requirement-title" name="title" required maxLength={200} />
            </Field>
            <Field label="Category" htmlFor="requirement-category">
              <Select id="requirement-category" name="categoryId" defaultValue="">
                <option value="">General</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end gap-3 sm:col-span-2">
              <Button type="submit">Add requirement</Button>
              <Button type="submit" name="addAnother" value="1" variant="outline">
                Add &amp; add another
              </Button>
              <p className="text-sm text-muted-foreground">
                Assign responsibility and dates from the requirement afterward.
              </p>
            </div>
          </form>
        </section>
      ) : null}

      {rowsResult.error ? (
        <EmptyState
          title="The register could not load"
          description="Reload the page to try again. Nothing was changed."
        />
      ) : rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No matching requirements"
            description="Try a broader search or clear the filters."
            action={
              <Link className={outlineLink} href={registerPath}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Every closeout starts with the scope"
            description="Apply your organization template or the starter, or add requirements one by one. Uploads and reviews arrive in later phases — this register is where the scope lives."
            action={
              canManage ? (
                <div className="flex flex-wrap justify-center gap-3">
                  <Link className={linkButton} href={`${registerPath}/apply`}>
                    Apply a template
                  </Link>
                  <Link className={outlineLink} href={`${registerPath}?add=1#add-requirement`}>
                    Add one requirement
                  </Link>
                </div>
              ) : undefined
            }
          />
        )
      ) : (
        <form action={bulkUpdateRequirementsAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="overflow-hidden rounded-lg bg-surface shadow-card">
            <table className="hidden w-full table-fixed text-sm md:table">
              <colgroup>
                {canManage ? <col className="w-12" /> : null}
                <col />
                <col className="w-[19%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-32" />
                {canReorder ? <col className="w-24" /> : null}
              </colgroup>
              <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {canManage ? (
                    <th className="py-3 pl-5">
                      <span className="sr-only">Select</span>
                    </th>
                  ) : null}
                  <th className={canManage ? "py-3" : "py-3 pl-5"}>Requirement</th>
                  <th>Responsible</th>
                  <th>Internal owner</th>
                  <th>Due date</th>
                  <th className="pr-5">Status</th>
                  {canReorder ? <th className="pr-5 text-right">Order</th> : null}
                </tr>
              </thead>
              {[...grouped.entries()].map(([categoryName, categoryRows]) => (
                <tbody key={categoryName} className="divide-y border-b">
                  <tr className="bg-muted/40">
                    <th
                      colSpan={(canManage ? 6 : 5) + (canReorder ? 1 : 0)}
                      scope="colgroup"
                      className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {categoryName}{" "}
                      <span className="font-normal tabular-nums">({categoryRows.length})</span>
                    </th>
                  </tr>
                  {categoryRows.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-muted/50 ${row.archived_at ? "opacity-60" : ""}`}
                    >
                      {canManage ? (
                        <td className="pl-5">
                          <input
                            type="checkbox"
                            name="requirementIds"
                            value={row.id}
                            aria-label={`Select ${row.title}`}
                          />
                        </td>
                      ) : null}
                      <td className={`py-3.5 pr-4 ${canManage ? "" : "pl-5"}`}>
                        <Link
                          href={`${registerPath}/${row.id}`}
                          className="block truncate font-semibold hover:text-primary"
                          title={row.title}
                        >
                          {row.title}
                        </Link>
                        <SourceLine row={row} />
                      </td>
                      <td className="pr-4">
                        <ResponsibilityCell row={row} />
                      </td>
                      <td className="pr-4">
                        <OwnerCell row={row} />
                      </td>
                      <td className="pr-4">
                        <DueDateCell row={row} />
                      </td>
                      <td className="pr-5">
                        <RequirementStatusBadge
                          status={row.status}
                          archived={Boolean(row.archived_at)}
                        />
                      </td>
                      {canReorder ? (
                        <td className="pr-5">
                          <div
                            className="flex justify-end gap-1"
                            role="group"
                            aria-label={`Reorder ${row.title}`}
                          >
                            <button
                              type="submit"
                              formAction={moveRequirementAction.bind(
                                null,
                                `${row.id}|${row.updated_at}|up`
                              )}
                              disabled={rowIndex === 0}
                              aria-label={`Move ${row.title} up`}
                              title="Move up"
                              className="grid h-11 w-11 place-items-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9"
                            >
                              <ChevronUp className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="submit"
                              formAction={moveRequirementAction.bind(
                                null,
                                `${row.id}|${row.updated_at}|down`
                              )}
                              disabled={rowIndex === categoryRows.length - 1}
                              aria-label={`Move ${row.title} down`}
                              title="Move down"
                              className="grid h-11 w-11 place-items-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9"
                            >
                              <ChevronDown className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
            <div className="md:hidden">
              {[...grouped.entries()].map(([categoryName, categoryRows]) => (
                <section key={categoryName} aria-label={categoryName}>
                  <h2 className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryName}
                    <span className="tabular-nums">{categoryRows.length}</span>
                  </h2>
                  <div className="divide-y">
                    {categoryRows.map((row, rowIndex) => (
                      <article
                        key={row.id}
                        className={`p-4 ${row.archived_at ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {canManage ? (
                              <label className="float-left mr-3 mt-0.5">
                                <input
                                  type="checkbox"
                                  name="requirementIds"
                                  value={row.id}
                                  aria-label={`Select ${row.title}`}
                                />
                              </label>
                            ) : null}
                            <Link
                              href={`${registerPath}/${row.id}`}
                              className="font-semibold hover:text-primary"
                            >
                              {row.title}
                            </Link>
                            <SourceLine row={row} />
                          </div>
                          <RequirementStatusBadge
                            status={row.status}
                            archived={Boolean(row.archived_at)}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <ResponsibilityCell row={row} />
                          <DueDateCell row={row} />
                        </div>
                        {canReorder ? (
                          <div
                            className="mt-3 flex gap-2 border-t pt-3"
                            role="group"
                            aria-label={`Reorder ${row.title}`}
                          >
                            <button
                              type="submit"
                              formAction={moveRequirementAction.bind(
                                null,
                                `${row.id}|${row.updated_at}|up`
                              )}
                              disabled={rowIndex === 0}
                              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                            >
                              <ChevronUp className="h-4 w-4" aria-hidden />
                              Move up
                            </button>
                            <button
                              type="submit"
                              formAction={moveRequirementAction.bind(
                                null,
                                `${row.id}|${row.updated_at}|down`
                              )}
                              disabled={rowIndex === categoryRows.length - 1}
                              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                            >
                              <ChevronDown className="h-4 w-4" aria-hidden />
                              Move down
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {canManage ? (
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border bg-surface/95 p-4 shadow-card backdrop-blur-sm md:sticky md:bottom-0">
              <label htmlFor="bulk-action" className="grid gap-1.5 text-sm font-semibold">
                Change selected
                <Select id="bulk-action" name="bulkAction" defaultValue="set_responsible_company">
                  <option value="set_responsible_company">Assign responsible company</option>
                  <option value="set_internal_owner">Assign internal owner</option>
                  <option value="set_due_date">Set due date</option>
                  <option value="set_category">Set category</option>
                  <option value="set_priority">Set priority</option>
                  <option value="mark_not_applicable">Mark not applicable</option>
                  <option value="reverse_not_applicable">Reopen (undo not applicable)</option>
                  <option value="archive">Remove from register</option>
                  <option value="restore">Restore removed</option>
                </Select>
              </label>
              <BulkValueFields projectId={projectId} categories={categories} client={client} />
              <ConfirmSubmit
                title="Apply bulk change?"
                description="The change applies to every selected requirement in one step. Removal and not-applicable changes can be reversed later."
                actionLabel="Apply to selected"
              />
            </div>
          ) : null}
        </form>
      )}

      {nextCursor ? (
        <div className="mt-5 flex justify-end">
          <Link
            className={outlineLink}
            href={`${registerPath}?${new URLSearchParams({
              ...(query.q ? { q: query.q } : {}),
              ...(query.category ? { category: query.category } : {}),
              ...(query.status ? { status: query.status } : {}),
              ...(query.attention ? { attention: query.attention } : {}),
              ...(query.archived ? { archived: query.archived } : {}),
              after: nextCursor
            }).toString()}`}
          >
            Next 200 requirements
          </Link>
        </div>
      ) : null}
      {query.after ? (
        <div className="mt-3 flex justify-end">
          <Link className="text-sm font-medium text-primary" href={registerPath}>
            Back to the start of the register
          </Link>
        </div>
      ) : null}
    </>
  );
}

async function BulkValueFields({
  projectId,
  categories,
  client
}: {
  projectId: string;
  categories: Array<{ id: string; name: string }>;
  client: Awaited<ReturnType<typeof getActiveContext>>["client"];
}) {
  const [{ data: companies }, { data: overview }] = await Promise.all([
    client
      .from("project_companies")
      .select("id,role,companies!inner(display_name)")
      .eq("project_id", projectId)
      .eq("status", "active"),
    client.rpc("get_project_overview", { target_project_id: projectId })
  ]);
  const team =
    ((overview as { team?: Array<{ id: string; display_name: string }> } | null)?.team ?? []) || [];
  return (
    <>
      <label htmlFor="bulk-company" className="grid gap-1.5 text-sm font-semibold">
        Company
        <Select id="bulk-company" name="responsibleCompanyId" defaultValue="">
          <option value="">— none —</option>
          {companies?.map((relation) => {
            const company = Array.isArray(relation.companies)
              ? relation.companies[0]
              : relation.companies;
            return (
              <option key={relation.id} value={relation.id}>
                {company?.display_name} ({humanize(relation.role)})
              </option>
            );
          })}
        </Select>
      </label>
      <label htmlFor="bulk-owner" className="grid gap-1.5 text-sm font-semibold">
        Internal owner
        <Select id="bulk-owner" name="internalOwnerId" defaultValue="">
          <option value="">— none —</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.display_name}
            </option>
          ))}
        </Select>
      </label>
      <label htmlFor="bulk-due" className="grid gap-1.5 text-sm font-semibold">
        Due date
        <Input id="bulk-due" type="date" name="dueDate" />
      </label>
      <label htmlFor="bulk-category" className="grid gap-1.5 text-sm font-semibold">
        Category
        <Select id="bulk-category" name="categoryId" defaultValue="">
          <option value="">— keep —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </label>
      <label htmlFor="bulk-priority" className="grid gap-1.5 text-sm font-semibold">
        Priority
        <Select id="bulk-priority" name="priority" defaultValue="normal">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </Select>
      </label>
      <label htmlFor="bulk-reason" className="grid min-w-40 gap-1.5 text-sm font-semibold">
        Reason (for not applicable)
        <Input id="bulk-reason" name="reason" maxLength={200} />
      </label>
    </>
  );
}
