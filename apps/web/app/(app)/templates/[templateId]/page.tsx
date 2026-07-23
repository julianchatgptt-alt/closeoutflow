import { Button, EmptyState, Field, Input, Select, Textarea } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import {
  archiveTemplateAction,
  cloneTemplateAction,
  createCategoryAction,
  createTemplateVersionAction,
  moveTemplateItemAction,
  publishTemplateAction,
  removeTemplateItemAction,
  restoreTemplateAction,
  saveTemplateItemAction,
  updateTemplateAction
} from "../../../../actions/requirement-templates";
import { ConfirmAction } from "../../../../components/projects/confirm-action";
import { Notice, Section, humanize, outlineLink } from "../../../../components/projects/phase-5-ui";
import { ConfirmSubmit } from "../../../../components/requirements/confirm-submit";
import { PageHeader } from "../../../../components/shell/page-header";
import { TemplateBreadcrumb } from "../../../../components/shell/template-breadcrumb";
import { getActiveContext } from "../../../../lib/active-context";
import { responsibleRoles } from "../../../../lib/phase-6-schemas";

export const metadata = { title: "Template" };

type ItemRow = {
  id: string;
  item_key: string;
  title: string;
  description: string | null;
  category_id: string;
  trade: string | null;
  priority: string;
  is_optional: boolean;
  default_responsible_role: string | null;
  default_due_anchor: string | null;
  default_due_offset_days: number | null;
  sort_order: number;
};

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ templateId }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(templateId).success) notFound();
  const { client, organizationId, membership } = await getActiveContext();

  const { data: template } = await client
    .from("requirement_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!template) notFound();

  const [{ data: items }, { data: versions }, { data: categories }, { data: projects }] =
    await Promise.all([
      client
        .from("requirement_template_items")
        .select(
          "id,item_key,title,description,category_id,trade,priority,is_optional,default_responsible_role,default_due_anchor,default_due_offset_days,sort_order"
        )
        .eq("template_id", templateId)
        .order("sort_order")
        .order("id"),
      client
        .from("requirement_templates")
        .select("id,version,status,archived_at")
        .eq("family_id", template.family_id)
        .order("version"),
      client
        .from("requirement_categories")
        .select("id,name,sort_order")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("sort_order"),
      template.status === "published" && !template.archived_at
        ? client.rpc("search_projects", { page_size: 25 })
        : Promise.resolve({ data: [] })
    ]);

  const canManage = ["owner", "administrator", "project_manager", "closeout_coordinator"].includes(
    membership.role
  );
  const canArchive = ["owner", "administrator"].includes(membership.role);
  const isDraft = template.status === "draft" && !template.archived_at;
  const editable = isDraft && canManage;
  const detailPath = `/templates/${templateId}`;
  const categoryName = (id: string) =>
    (categories ?? []).find((category) => category.id === id)?.name ?? "Uncategorized";

  const grouped = new Map<string, ItemRow[]>();
  for (const item of (items ?? []) as ItemRow[]) {
    const key = categoryName(item.category_id);
    const bucket = grouped.get(key) ?? [];
    bucket.push(item);
    grouped.set(key, bucket);
  }

  return (
    <TemplateBreadcrumb template={{ id: template.id, name: template.name }}>
      <PageHeader
        title={template.name}
        description={
          template.archived_at
            ? "This template family is archived."
            : isDraft
              ? `Draft v${template.version} — add and order requirements, then publish to lock this version.`
              : `Published v${template.version} — locked. Start a new version to make changes.`
        }
        meta={
          <span className="text-sm font-medium">
            {template.archived_at
              ? "Archived"
              : isDraft
                ? `v${template.version} · Draft`
                : `v${template.version} · Published`}
          </span>
        }
        actions={
          <Link className={outlineLink} href="/templates">
            All templates
          </Link>
        }
      />
      <Notice error={query.error} message={query.message} recoveryHref={detailPath} />

      {(versions ?? []).length > 1 ? (
        <nav aria-label="Template versions" className="mb-5 flex flex-wrap gap-2">
          {(versions ?? []).map((version) => (
            <Link
              key={version.id}
              href={`/templates/${version.id}`}
              aria-current={version.id === templateId ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium ${version.id === templateId ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-muted"}`}
            >
              v{version.version} · {humanize(version.status)}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,.8fr)]">
        <div className="grid content-start gap-5">
          {editable ? (
            <Section title="Template details">
              <form action={updateTemplateAction} className="grid gap-4">
                <input type="hidden" name="templateId" value={templateId} />
                <input type="hidden" name="updatedAt" value={template.updated_at} />
                <Field label="Name" htmlFor="template-name" required>
                  <Input
                    id="template-name"
                    name="name"
                    defaultValue={template.name}
                    required
                    maxLength={120}
                  />
                </Field>
                <Field label="Description" htmlFor="template-description">
                  <Textarea
                    id="template-description"
                    name="description"
                    defaultValue={template.description ?? ""}
                  />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" variant="outline">
                    Save details
                  </Button>
                </div>
              </form>
            </Section>
          ) : null}

          <Section title={`Requirements (${(items ?? []).length})`}>
            {(items ?? []).length === 0 ? (
              <EmptyState
                title="No requirements yet"
                description="Add the deliverables this standard should collect — O&M manuals, warranties, as-builts, permits, and anything your contracts require."
              />
            ) : (
              <div className="grid gap-5">
                {[...grouped.entries()].map(([name, groupItems]) => (
                  <section key={name} aria-label={name}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {name}
                    </h3>
                    <ul className="divide-y rounded-md border">
                      {groupItems.map((item) => (
                        <li key={item.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {[
                                  item.trade,
                                  item.is_optional ? "Optional" : "Required",
                                  item.priority === "high" ? "High priority" : null,
                                  item.default_responsible_role
                                    ? `Usually the ${humanize(item.default_responsible_role).toLowerCase()}`
                                    : null,
                                  item.default_due_anchor
                                    ? `Due ${item.default_due_offset_days ?? 0} days from ${humanize(item.default_due_anchor).toLowerCase()}`
                                    : null
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            {editable ? (
                              <div className="flex shrink-0 items-center gap-1">
                                <form action={moveTemplateItemAction}>
                                  <input type="hidden" name="templateId" value={templateId} />
                                  <input type="hidden" name="itemId" value={item.id} />
                                  <input
                                    type="hidden"
                                    name="updatedAt"
                                    value={template.updated_at}
                                  />
                                  <input type="hidden" name="direction" value="up" />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Move ${item.title} up`}
                                  >
                                    ↑
                                  </Button>
                                </form>
                                <form action={moveTemplateItemAction}>
                                  <input type="hidden" name="templateId" value={templateId} />
                                  <input type="hidden" name="itemId" value={item.id} />
                                  <input
                                    type="hidden"
                                    name="updatedAt"
                                    value={template.updated_at}
                                  />
                                  <input type="hidden" name="direction" value="down" />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Move ${item.title} down`}
                                  >
                                    ↓
                                  </Button>
                                </form>
                                <form action={removeTemplateItemAction}>
                                  <input type="hidden" name="templateId" value={templateId} />
                                  <input type="hidden" name="itemId" value={item.id} />
                                  <input
                                    type="hidden"
                                    name="updatedAt"
                                    value={template.updated_at}
                                  />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Remove ${item.title}`}
                                  >
                                    Remove
                                  </Button>
                                </form>
                              </div>
                            ) : null}
                          </div>
                          {editable ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm font-medium text-primary">
                                Edit requirement
                              </summary>
                              <TemplateItemForm
                                templateId={templateId}
                                updatedAt={template.updated_at}
                                categories={categories ?? []}
                                item={item}
                              />
                            </details>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Section>

          {editable ? (
            <Section title="Add a requirement">
              <TemplateItemForm
                templateId={templateId}
                updatedAt={template.updated_at}
                categories={categories ?? []}
              />
            </Section>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          {editable ? (
            <Section title="Publish">
              <p className="mb-4 text-sm text-muted-foreground">
                Publishing locks v{template.version}. Projects always apply published versions;
                later edits create v{template.version + 1}.
              </p>
              <form action={publishTemplateAction}>
                <input type="hidden" name="templateId" value={templateId} />
                <input type="hidden" name="updatedAt" value={template.updated_at} />
                <ConfirmSubmit
                  title={`Publish v${template.version}?`}
                  description="The version and its requirements become locked and available to apply on projects. Future edits start a new draft version."
                  actionLabel="Publish template"
                />
              </form>
            </Section>
          ) : null}

          {template.status === "published" && !template.archived_at ? (
            <Section title="Apply to a project">
              {(projects ?? []).length ? (
                <ul className="divide-y">
                  {(projects ?? []).slice(0, 8).map((project: { id: string; name: string }) => (
                    <li key={project.id}>
                      <Link
                        className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm font-medium hover:text-primary"
                        href={`/projects/${project.id}/requirements/apply?template=${templateId}`}
                      >
                        <span className="truncate">{project.name}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don’t have access to an active project yet.
                </p>
              )}
            </Section>
          ) : null}

          {canManage && !template.archived_at ? (
            <Section title="Template actions">
              <div className="grid gap-4">
                {template.status === "published" ? (
                  <form action={createTemplateVersionAction}>
                    <input type="hidden" name="templateId" value={templateId} />
                    <Button type="submit" variant="outline">
                      Edit as new version
                    </Button>
                  </form>
                ) : null}
                <form action={cloneTemplateAction} className="grid gap-2">
                  <input type="hidden" name="templateId" value={templateId} />
                  <Field label="Duplicate as" htmlFor="clone-name">
                    <Input id="clone-name" name="name" defaultValue={`Copy of ${template.name}`} />
                  </Field>
                  <Button type="submit" variant="outline">
                    Duplicate template
                  </Button>
                </form>
                {canArchive ? (
                  <ConfirmAction
                    action={archiveTemplateAction}
                    fields={{ templateId }}
                    title="Archive this template?"
                    description="Every version of this template is hidden from the library and project pickers. Existing project requirements keep their history. You can restore it later."
                    actionLabel="Archive template"
                  />
                ) : null}
              </div>
            </Section>
          ) : null}

          {template.archived_at && canArchive ? (
            <Section title="Template actions">
              <form action={restoreTemplateAction}>
                <input type="hidden" name="templateId" value={templateId} />
                <Button type="submit" variant="outline">
                  Restore template
                </Button>
              </form>
            </Section>
          ) : null}

          {editable ? (
            <Section title="Categories">
              <p className="mb-3 text-sm text-muted-foreground">
                Categories group requirements in every template and register. Renames apply
                everywhere.
              </p>
              <form action={createCategoryAction} className="grid gap-3">
                <input type="hidden" name="returnTo" value={detailPath} />
                <Field label="New category" htmlFor="category-name">
                  <Input id="category-name" name="name" maxLength={80} />
                </Field>
                <Button type="submit" variant="outline">
                  Add category
                </Button>
              </form>
            </Section>
          ) : null}
        </div>
      </div>
    </TemplateBreadcrumb>
  );
}

function TemplateItemForm({
  templateId,
  updatedAt,
  categories,
  item
}: {
  templateId: string;
  updatedAt: string;
  categories: Array<{ id: string; name: string }>;
  item?: ItemRow;
}) {
  const prefix = item ? `item-${item.id}` : "new-item";
  return (
    <form action={saveTemplateItemAction} className="mt-3 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="updatedAt" value={updatedAt} />
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <Field label="Requirement title" htmlFor={`${prefix}-title`} required>
        <Input
          id={`${prefix}-title`}
          name="title"
          defaultValue={item?.title ?? ""}
          required
          maxLength={200}
        />
      </Field>
      <Field label="Category" htmlFor={`${prefix}-category`} required>
        <Select
          id={`${prefix}-category`}
          name="categoryId"
          defaultValue={item?.category_id ?? categories[0]?.id ?? ""}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Trade or scope" htmlFor={`${prefix}-trade`}>
        <Input id={`${prefix}-trade`} name="trade" defaultValue={item?.trade ?? ""} />
      </Field>
      <Field label="Usually furnished by" htmlFor={`${prefix}-role`}>
        <Select
          id={`${prefix}-role`}
          name="defaultResponsibleRole"
          defaultValue={item?.default_responsible_role ?? ""}
        >
          <option value="">Not specified</option>
          {responsibleRoles.map((role) => (
            <option key={role} value={role}>
              {humanize(role)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Priority" htmlFor={`${prefix}-priority`}>
        <Select id={`${prefix}-priority`} name="priority" defaultValue={item?.priority ?? "normal"}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </Select>
      </Field>
      <label className="flex min-h-10 items-center gap-2 self-end text-sm font-medium">
        <input type="checkbox" name="isOptional" defaultChecked={item?.is_optional ?? false} />
        Optional (deselectable when applying)
      </label>
      <Field
        label="Due-date rule"
        htmlFor={`${prefix}-anchor`}
        help="Optional. Resolved into a real date once, when the template is applied."
      >
        <Select
          id={`${prefix}-anchor`}
          name="defaultDueAnchor"
          defaultValue={item?.default_due_anchor ?? ""}
        >
          <option value="">No date rule</option>
          <option value="substantial_completion">From substantial completion</option>
          <option value="closeout_target">From closeout target</option>
        </Select>
      </Field>
      <Field label="Offset (days)" htmlFor={`${prefix}-offset`}>
        <Input
          type="number"
          id={`${prefix}-offset`}
          name="defaultDueOffsetDays"
          min={-365}
          max={730}
          defaultValue={item?.default_due_offset_days ?? ""}
        />
      </Field>
      <Field label="Description" htmlFor={`${prefix}-description`}>
        <Textarea
          id={`${prefix}-description`}
          name="description"
          defaultValue={item?.description ?? ""}
        />
      </Field>
      <div className="flex items-end justify-end sm:col-span-2">
        <Button type="submit">{item ? "Save requirement" : "Add requirement"}</Button>
      </div>
    </form>
  );
}
