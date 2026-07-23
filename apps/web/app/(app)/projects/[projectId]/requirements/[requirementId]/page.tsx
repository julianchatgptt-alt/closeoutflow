import { Button, Field, Input, Select, Textarea } from "@closeoutflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import {
  archiveRequirementAction,
  markNotApplicableAction,
  restoreRequirementAction,
  reverseNotApplicableAction,
  setDueDateAction,
  setResponsibilityAction,
  updateRequirementAction
} from "../../../../../../actions/project-requirements";
import { ConfirmAction } from "../../../../../../components/projects/confirm-action";
import {
  Notice,
  Section,
  humanize,
  outlineLink
} from "../../../../../../components/projects/phase-5-ui";
import {
  RequirementStatusBadge,
  StaleChip
} from "../../../../../../components/requirements/phase-6-ui";
import { NotApplicableAction } from "../../../../../../components/requirements/not-applicable-action";
import { PageHeader } from "../../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../../lib/active-context";
import { formatDateOnly } from "../../../../../../lib/date-format";

export const metadata = { title: "Requirement" };

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string; requirementId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ projectId, requirementId }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(projectId).success || !z.uuid().safeParse(requirementId).success)
    notFound();
  const { client, organizationId } = await getActiveContext();

  const [
    requirementResult,
    projectResult,
    categoriesResult,
    companiesResult,
    contactsResult,
    overviewResult,
    canManageResult
  ] = await Promise.all([
    client
      .from("project_requirements")
      .select("*")
      .eq("id", requirementId)
      .eq("project_id", projectId)
      .maybeSingle(),
    client.from("projects").select("id,name,status").eq("id", projectId).maybeSingle(),
    client
      .from("requirement_categories")
      .select("id,name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("sort_order"),
    client
      .from("project_companies")
      .select("id,role,status,companies!inner(display_name,status)")
      .eq("project_id", projectId),
    client
      .from("project_contacts")
      .select("id,status,project_company_id,contacts!inner(first_name,last_name,status)")
      .eq("project_id", projectId),
    client.rpc("get_project_overview", { target_project_id: projectId }),
    client.rpc("project_permission", {
      target_project_id: projectId,
      permission: "requirement.manage"
    })
  ]);

  const requirement = requirementResult.data;
  const project = projectResult.data;
  if (!requirement || !project) notFound();
  const categories = categoriesResult.data ?? [];
  const companies = (companiesResult.data ?? []).map((relation) => ({
    id: relation.id,
    role: relation.role,
    status: relation.status,
    name:
      (Array.isArray(relation.companies) ? relation.companies[0] : relation.companies)
        ?.display_name ?? "Company",
    companyStatus:
      (Array.isArray(relation.companies) ? relation.companies[0] : relation.companies)?.status ??
      "active"
  }));
  const contacts = (contactsResult.data ?? []).map((relation) => {
    const contact = Array.isArray(relation.contacts) ? relation.contacts[0] : relation.contacts;
    return {
      id: relation.id,
      status: relation.status,
      name: [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || "Contact",
      contactStatus: contact?.status ?? "active"
    };
  });
  const team =
    ((overviewResult.data as { team?: Array<{ id: string; display_name: string }> } | null)?.team ??
      []) ||
    [];
  const registerPath = `/projects/${projectId}/requirements`;
  const detailPath = `${registerPath}/${requirementId}`;
  const canManage = canManageResult.data === true && project.status !== "archived";
  const archived = Boolean(requirement.archived_at);
  const editable = canManage && !archived;
  const notApplicable = requirement.status === "not_applicable_approved";

  const activeCompany = companies.find((c) => c.id === requirement.responsible_project_company_id);
  const activeContact = contacts.find((c) => c.id === requirement.responsible_project_contact_id);
  const activeOwner = team.find((member) => member.id === requirement.internal_owner_member_id);
  const companyStale =
    activeCompany &&
    (activeCompany.status !== "active" || activeCompany.companyStatus !== "active");
  const contactStale =
    activeContact &&
    (activeContact.status !== "active" || activeContact.contactStatus !== "active");
  const ownerStale = Boolean(requirement.internal_owner_member_id) && !activeOwner;

  return (
    <>
      <PageHeader
        title={requirement.title}
        description={
          requirement.source_template_id
            ? "Added from a requirement template."
            : "Custom project requirement."
        }
        meta={<RequirementStatusBadge status={requirement.status} archived={archived} />}
        actions={
          <Link className={outlineLink} href={registerPath}>
            Back to register
          </Link>
        }
      />
      <Notice error={query.error} message={query.message} recoveryHref={detailPath} />
      {archived ? (
        <p role="status" className="mb-5 rounded-md border border-border bg-muted p-3 text-sm">
          This requirement was removed from the register. Its history is retained.
          {canManage ? " Restore it to make changes." : ""}
        </p>
      ) : null}
      {notApplicable ? (
        <p role="status" className="mb-5 rounded-md border border-border bg-muted p-3 text-sm">
          Marked not applicable{requirement.na_reason ? ` — ${requirement.na_reason}` : ""}.
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.9fr)]">
        <div className="grid content-start gap-5">
          <Section title="Details">
            {editable ? (
              <form action={updateRequirementAction} className="grid gap-4">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="requirementId" value={requirementId} />
                <input type="hidden" name="updatedAt" value={requirement.updated_at} />
                <Field label="Title" htmlFor="title" required>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={requirement.title}
                    required
                    maxLength={200}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category" htmlFor="categoryId">
                    <Select
                      id="categoryId"
                      name="categoryId"
                      defaultValue={requirement.category_id}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Trade or scope" htmlFor="trade">
                    <Input id="trade" name="trade" defaultValue={requirement.trade ?? ""} />
                  </Field>
                  <Field label="Priority" htmlFor="priority">
                    <Select id="priority" name="priority" defaultValue={requirement.priority}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </Select>
                  </Field>
                  <label className="flex min-h-10 items-center gap-2 self-end text-sm font-medium">
                    <input
                      type="checkbox"
                      name="isRequired"
                      defaultChecked={requirement.is_required}
                    />
                    Required for closeout
                  </label>
                </div>
                <Field label="Description" htmlFor="description">
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={requirement.description ?? ""}
                  />
                </Field>
                <Field label="Internal notes" htmlFor="notes">
                  <Textarea id="notes" name="notes" defaultValue={requirement.notes ?? ""} />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit">Save details</Button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="font-semibold text-muted-foreground">Category</dt>
                  <dd>{categories.find((c) => c.id === requirement.category_id)?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Trade</dt>
                  <dd>{requirement.trade ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Priority</dt>
                  <dd>{humanize(requirement.priority)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Description</dt>
                  <dd>{requirement.description ?? "—"}</dd>
                </div>
              </dl>
            )}
          </Section>

          <Section title="Responsibility">
            <p className="mb-4 text-sm text-muted-foreground">
              Responsibility is project configuration. Requests are sent when the subcontractor
              portal arrives — nothing is emailed today.
            </p>
            {companyStale ? (
              <StaleChip label="Assigned company is no longer on this project" />
            ) : null}
            {contactStale ? (
              <StaleChip label="Assigned contact is no longer on this project" />
            ) : null}
            {ownerStale ? <StaleChip label="Assigned owner is no longer on this project" /> : null}
            {editable ? (
              <form action={setResponsibilityAction} className="grid gap-4 sm:grid-cols-3">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="requirementId" value={requirementId} />
                <input type="hidden" name="updatedAt" value={requirement.updated_at} />
                <Field label="Responsible company" htmlFor="responsibleCompanyId">
                  <Select
                    id="responsibleCompanyId"
                    name="responsibleCompanyId"
                    defaultValue={requirement.responsible_project_company_id ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {companies
                      .filter(
                        (c) =>
                          (c.status === "active" && c.companyStatus === "active") ||
                          c.id === requirement.responsible_project_company_id
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({humanize(c.role)})
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Responsible contact" htmlFor="responsibleContactId">
                  <Select
                    id="responsibleContactId"
                    name="responsibleContactId"
                    defaultValue={requirement.responsible_project_contact_id ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {contacts
                      .filter(
                        (c) =>
                          (c.status === "active" && c.contactStatus === "active") ||
                          c.id === requirement.responsible_project_contact_id
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Internal owner" htmlFor="internalOwnerId">
                  <Select
                    id="internalOwnerId"
                    name="internalOwnerId"
                    defaultValue={requirement.internal_owner_member_id ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.display_name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex items-center justify-between gap-3 sm:col-span-3">
                  <p className="text-sm text-muted-foreground">
                    Missing someone?{" "}
                    <Link
                      className="font-medium text-primary"
                      href={`/projects/${projectId}/companies`}
                    >
                      Manage project companies
                    </Link>{" "}
                    or{" "}
                    <Link className="font-medium text-primary" href={`/projects/${projectId}/team`}>
                      the internal team
                    </Link>
                    .
                  </p>
                  <Button type="submit">Save responsibility</Button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-muted-foreground">Responsible company</dt>
                  <dd>{activeCompany?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Responsible contact</dt>
                  <dd>{activeContact?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Internal owner</dt>
                  <dd>{activeOwner?.display_name ?? "Unassigned"}</dd>
                </div>
              </dl>
            )}
          </Section>

          <Section title="Due date">
            {editable ? (
              <form action={setDueDateAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="requirementId" value={requirementId} />
                <input type="hidden" name="updatedAt" value={requirement.updated_at} />
                <Field label="Planned due date" htmlFor="dueDate">
                  <Input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    defaultValue={requirement.due_date ?? ""}
                  />
                </Field>
                <Button type="submit">Save date</Button>
                <p className="text-sm text-muted-foreground">
                  Dates are calendar dates in the project’s timezone.
                </p>
              </form>
            ) : (
              <p className="text-sm">
                {requirement.due_date ? formatDateOnly(requirement.due_date) : "No date set"}
              </p>
            )}
          </Section>
        </div>

        <div className="grid content-start gap-5">
          <Section title="Provenance">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-semibold text-muted-foreground">Source</dt>
                <dd>
                  {requirement.source_template_id ? "Applied from a template" : "Added manually"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground">Created</dt>
                <dd>{formatDateOnly(requirement.created_at)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              Every change to this requirement is recorded in{" "}
              <Link className="font-medium text-primary" href={`/projects/${projectId}/activity`}>
                project activity
              </Link>
              .
            </p>
          </Section>

          {canManage ? (
            <Section title="Register actions">
              <div className="grid gap-4">
                {archived ? (
                  <form action={restoreRequirementAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="requirementId" value={requirementId} />
                    <Button type="submit" variant="outline">
                      Restore to register
                    </Button>
                  </form>
                ) : (
                  <>
                    {notApplicable ? (
                      <form action={reverseNotApplicableAction}>
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="requirementId" value={requirementId} />
                        <input type="hidden" name="updatedAt" value={requirement.updated_at} />
                        <Button type="submit" variant="outline">
                          Reopen requirement
                        </Button>
                      </form>
                    ) : (
                      <NotApplicableAction
                        action={markNotApplicableAction}
                        fields={{
                          projectId,
                          requirementId,
                          updatedAt: requirement.updated_at
                        }}
                      />
                    )}
                    <ConfirmAction
                      action={archiveRequirementAction}
                      fields={{ projectId, requirementId }}
                      title="Remove from register?"
                      description="The requirement is removed from the active register. Its history is retained and it can be restored."
                      actionLabel="Remove requirement"
                    />
                  </>
                )}
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}
