import { Button, EmptyState, Field, Input, Select } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { applyTemplateAction } from "../../../../../../actions/project-requirements";
import {
  Notice,
  Section,
  humanize,
  linkButton,
  outlineLink
} from "../../../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../../lib/active-context";

export const metadata = { title: "Apply template" };

type PreviewItem = {
  item_id: string;
  item_key: string;
  title: string;
  category_name: string;
  trade: string | null;
  priority: string;
  is_optional: boolean;
  default_responsible_role: string | null;
  default_due_anchor: string | null;
  default_due_offset_days: number | null;
  already_in_project: boolean;
  previously_removed: boolean;
};

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ template?: string; error?: string; message?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(projectId).success) notFound();
  const { client, organizationId } = await getActiveContext();
  await client.rpc("ensure_requirement_defaults", { target_organization_id: organizationId });

  const [{ data: project }, { data: templates }] = await Promise.all([
    client.from("projects").select("id,name,status").eq("id", projectId).maybeSingle(),
    client
      .from("requirement_templates")
      .select("id,family_id,version,name,description,is_starter,requirement_template_items(count)")
      .eq("organization_id", organizationId)
      .eq("status", "published")
      .is("archived_at", null)
      .order("version", { ascending: false })
  ]);
  if (!project) notFound();
  const registerPath = `/projects/${projectId}/requirements`;
  if (project.status === "archived") {
    return (
      <>
        <PageHeader title="Apply template" description={project.name} />
        <EmptyState
          title="This project is archived"
          description="Archived projects are read only. Restore the project to change its requirements."
          action={
            <Link className={outlineLink} href={registerPath}>
              Back to register
            </Link>
          }
        />
      </>
    );
  }

  // Current version per family (highest published).
  const currentByFamily = new Map<string, NonNullable<typeof templates>[number]>();
  for (const template of templates ?? []) {
    if (!currentByFamily.has(template.family_id)) currentByFamily.set(template.family_id, template);
  }
  const currentTemplates = [...currentByFamily.values()];
  const selectedTemplateId = z.uuid().safeParse(query.template).success
    ? query.template
    : undefined;
  const selectedTemplate = (templates ?? []).find((t) => t.id === selectedTemplateId);

  let previewItems: PreviewItem[] = [];
  let previewError = false;
  if (selectedTemplate) {
    const { data, error } = await client.rpc("get_template_preview", {
      target_template_id: selectedTemplate.id,
      target_project_id: projectId
    });
    previewItems = (data ?? []) as PreviewItem[];
    previewError = Boolean(error);
  }

  const roles = [
    ...new Set(
      previewItems
        .filter((item) => !item.already_in_project && item.default_responsible_role)
        .map((item) => item.default_responsible_role as string)
    )
  ];
  const { data: projectCompanies } = selectedTemplate
    ? await client
        .from("project_companies")
        .select("id,role,companies!inner(display_name)")
        .eq("project_id", projectId)
        .eq("status", "active")
    : { data: [] };

  const grouped = new Map<string, PreviewItem[]>();
  for (const item of previewItems) {
    const bucket = grouped.get(item.category_name) ?? [];
    bucket.push(item);
    grouped.set(item.category_name, bucket);
  }
  const newItems = previewItems.filter((item) => !item.already_in_project);
  const duplicateCount = previewItems.length - newItems.length;

  return (
    <>
      <PageHeader
        title="Apply template"
        description={`Choose a published template, review its requirements, and add them to ${project.name} in one step.`}
        actions={
          <Link className={outlineLink} href={registerPath}>
            Back to register
          </Link>
        }
      />
      <Notice error={query.error} message={query.message} />

      {!selectedTemplate ? (
        currentTemplates.length === 0 ? (
          <EmptyState
            title="No published templates yet"
            description="Publish a template in the library first, or add requirements one by one."
            action={
              <Link className={linkButton} href="/templates">
                Open the template library
              </Link>
            }
          />
        ) : (
          <Section title="Choose a template">
            <ul className="divide-y">
              {currentTemplates.map((template) => {
                const itemCount = Array.isArray(template.requirement_template_items)
                  ? (template.requirement_template_items[0]?.count ?? 0)
                  : 0;
                return (
                  <li key={template.id}>
                    <Link
                      href={`${registerPath}/apply?template=${template.id}`}
                      className="flex min-h-14 items-center justify-between gap-4 py-3 hover:text-primary"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {template.name}
                          {template.is_starter ? " · Starter" : ""}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          v{template.version} · {itemCount} requirement{itemCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-primary">Preview →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Starter content is a general example. Verify every requirement against your contract
              documents and project obligations.
            </p>
          </Section>
        )
      ) : previewError ? (
        <EmptyState
          title="The template preview could not load"
          description="Reload the page to try again. Nothing was added."
        />
      ) : (
        <form action={applyTemplateAction} className="grid gap-5">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="templateId" value={selectedTemplate.id} />
          <Section
            title={`${selectedTemplate.name} · v${selectedTemplate.version}`}
            action={
              <Link className="text-sm font-medium text-primary" href={`${registerPath}/apply`}>
                Choose a different template
              </Link>
            }
          >
            <p className="mb-4 text-sm text-muted-foreground">
              {newItems.length} requirement{newItems.length === 1 ? "" : "s"} will be added.
              {duplicateCount
                ? ` ${duplicateCount} already in this project will be skipped.`
                : ""}{" "}
              Optional items start unchecked. Nothing is emailed or requested — this configures the
              register only.
            </p>
            <div className="grid gap-4">
              {[...grouped.entries()].map(([categoryName, items]) => (
                <fieldset key={categoryName} className="min-w-0">
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryName}
                  </legend>
                  <ul className="grid gap-1.5">
                    {items.map((item) => (
                      <li key={item.item_id}>
                        <label
                          className={`flex min-h-11 items-center gap-3 rounded-md px-2 py-1.5 text-sm ${item.already_in_project ? "text-muted-foreground" : "hover:bg-muted/60"}`}
                        >
                          <input
                            type="checkbox"
                            name="itemKeys"
                            value={item.item_key}
                            defaultChecked={!item.is_optional && !item.already_in_project}
                            disabled={item.already_in_project}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[
                                item.trade,
                                item.is_optional ? "Optional" : null,
                                item.default_responsible_role
                                  ? `Usually the ${humanize(item.default_responsible_role).toLowerCase()}`
                                  : null
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Required"}
                            </span>
                          </span>
                          {item.already_in_project ? (
                            <span className="shrink-0 text-xs font-medium">Already in project</span>
                          ) : item.previously_removed ? (
                            <span className="shrink-0 text-xs font-medium text-warning-foreground">
                              Previously removed
                            </span>
                          ) : null}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ))}
            </div>
          </Section>

          {roles.length ? (
            <Section title="Resolve responsibility">
              <p className="mb-4 text-sm text-muted-foreground">
                The template suggests who usually furnishes each item. Pick the matching company on
                this project, or leave items unassigned and assign later.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {roles.map((role) => (
                  <Field key={role} label={`${humanize(role)} items`} htmlFor={`role-${role}`}>
                    <Select id={`role-${role}`} name={`role:${role}`} defaultValue="">
                      <option value="">Leave unassigned</option>
                      {(projectCompanies ?? []).map((relation) => {
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
                  </Field>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Missing a company?{" "}
                <Link
                  className="font-medium text-primary"
                  href={`/projects/${projectId}/companies`}
                >
                  Add it to the project first
                </Link>
                .
              </p>
            </Section>
          ) : null}

          <Section title="Dates">
            <div className="flex flex-wrap items-end gap-4">
              <Field
                label="Fallback due date"
                htmlFor="defaultDueDate"
                help="Items with template date rules resolve from the project’s substantial-completion and closeout-target dates. This optional date covers the rest."
              >
                <Input type="date" id="defaultDueDate" name="defaultDueDate" />
              </Field>
            </div>
          </Section>

          <div className="flex items-center justify-end gap-3">
            <Link className={outlineLink} href={registerPath}>
              Cancel
            </Link>
            <Button type="submit">
              Add {newItems.length} requirement{newItems.length === 1 ? "" : "s"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
