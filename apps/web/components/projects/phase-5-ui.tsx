import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Textarea
} from "@closeoutflow/ui";
import { ArrowRight, Check, Circle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const linkButton =
  "cof-primary-contrast inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1d4f9a] px-4 text-sm font-medium hover:bg-[#17427f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const outlineLink =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Notice({
  error,
  message,
  recoveryHref
}: {
  error?: string | undefined;
  message?: string | undefined;
  recoveryHref?: string | undefined;
}) {
  if (!error && !message) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-5 rounded-md border p-3 text-sm ${error ? "border-danger-border bg-danger-subtle" : "border-success-border bg-success-subtle"}`}
    >
      <span>{error ?? message}</span>
      {error && recoveryHref ? (
        <Link className="ml-3 font-semibold underline underline-offset-2" href={recoveryHref}>
          Reload current project
        </Link>
      ) : null}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active" || status === "complete"
      ? "success"
      : status === "archived" || status === "cancelled"
        ? "neutral"
        : status === "draft"
          ? "warning"
          : "info";
  return <Badge tone={tone}>{humanize(status)}</Badge>;
}
export function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function Section({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function SetupChecklist({
  projectId,
  setup
}: {
  projectId: string;
  setup: Record<string, boolean>;
}) {
  const steps = [
    ["details", "Add project details", `/projects/${projectId}/settings`],
    ["team", "Assign the internal team", `/projects/${projectId}/team`],
    ["owner_company", "Add the owner company", `/projects/${projectId}/companies`],
    ["key_companies", "Add key companies", `/projects/${projectId}/companies`],
    ["key_contacts", "Add key contacts", `/projects/${projectId}/contacts`]
  ] as const;
  const done = steps.filter(([key]) => setup[key]).length;
  const percent = Math.round((done / steps.length) * 100);
  return (
    <Section title="Project setup">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{percent}%</p>
          <p className="text-sm text-muted-foreground">
            {done} of {steps.length} setup steps complete
          </p>
        </div>
        <div aria-hidden className="h-2 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ol className="divide-y divide-border">
        {steps.map(([key, label, href]) => (
          <li key={key}>
            <Link href={href} className="flex min-h-12 items-center gap-3 py-2 hover:text-primary">
              {setup[key] ? (
                <Check className="h-5 w-5 text-success" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
              )}
              <span className={setup[key] ? "text-muted-foreground line-through" : "font-medium"}>
                {label}
              </span>
              {!setup[key] ? <ArrowRight className="ml-auto h-4 w-4" aria-hidden /> : null}
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}
export function ProjectForm({
  action,
  project
}: {
  action: (fd: FormData) => void | Promise<void>;
  project?: Record<string, unknown>;
}) {
  const value = (key: string) => (typeof project?.[key] === "string" ? project[key] : "");
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="projectId" value={value("id")} />
      <input type="hidden" name="updatedAt" value={value("updated_at")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={value("name")} maxLength={160} required />
        </Field>
        <Field
          label="Project number"
          htmlFor="projectNumber"
          help="Optional; must be unique in this organization."
        >
          <Input id="projectNumber" name="projectNumber" defaultValue={value("project_number")} />
        </Field>
        <Field label="Project type" htmlFor="projectType">
          <Select id="projectType" name="projectType" defaultValue={value("project_type")}>
            <option value="">Select a type</option>
            {[
              "office",
              "retail",
              "medical",
              "restaurant",
              "warehouse",
              "school",
              "municipal",
              "multifamily",
              "church",
              "other"
            ].map((v) => (
              <option value={v} key={v}>
                {humanize(v)}
              </option>
            ))}
          </Select>
        </Field>
        {project ? (
          <>
            <Field label="City" htmlFor="city">
              <Input id="city" name="city" defaultValue={value("city")} />
            </Field>
            <Field label="State or region" htmlFor="region">
              <Input id="region" name="region" defaultValue={value("region")} />
            </Field>
            <Field label="Postal code" htmlFor="postalCode">
              <Input id="postalCode" name="postalCode" defaultValue={value("postal_code")} />
            </Field>
            <Field label="Planned start" htmlFor="plannedStartDate">
              <Input
                type="date"
                id="plannedStartDate"
                name="plannedStartDate"
                defaultValue={value("planned_start_date")}
              />
            </Field>
            <Field label="Substantial completion" htmlFor="substantialCompletionDate">
              <Input
                type="date"
                id="substantialCompletionDate"
                name="substantialCompletionDate"
                defaultValue={value("substantial_completion_date")}
              />
            </Field>
            <Field label="Closeout target" htmlFor="closeoutTargetDate">
              <Input
                type="date"
                id="closeoutTargetDate"
                name="closeoutTargetDate"
                defaultValue={value("closeout_target_date")}
              />
            </Field>
          </>
        ) : null}
      </div>
      {project ? (
        <>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" name="description" defaultValue={value("description")} />
          </Field>
          <Field label="Internal notes" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={value("notes")} />
          </Field>
        </>
      ) : null}
      <div className="flex justify-end gap-3">
        <Link href={project ? `/projects/${value("id")}` : "/projects"} className={outlineLink}>
          Cancel
        </Link>
        <Button type="submit">{project ? "Save project" : "Create project"}</Button>
      </div>
    </form>
  );
}

export function DirectoryForm({
  kind,
  action,
  record
}: {
  kind: "company" | "contact";
  action: (fd: FormData) => void | Promise<void>;
  record?: Record<string, unknown>;
}) {
  const contact = kind === "contact";
  const value = (key: string) => (typeof record?.[key] === "string" ? record[key] : "");
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name={`${kind}Id`} value={value("id")} />
      <input type="hidden" name="updatedAt" value={value("updated_at")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {contact ? (
          <>
            <Field label="First name" htmlFor="firstName" required>
              <Input id="firstName" name="firstName" required defaultValue={value("first_name")} />
            </Field>
            <Field label="Last name" htmlFor="lastName" required>
              <Input id="lastName" name="lastName" required defaultValue={value("last_name")} />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input type="email" id="email" name="email" defaultValue={value("email")} />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={value("phone")} />
            </Field>
            <Field label="Job title" htmlFor="jobTitle">
              <Input id="jobTitle" name="jobTitle" defaultValue={value("job_title")} />
            </Field>
            <Field label="Department" htmlFor="department">
              <Input id="department" name="department" defaultValue={value("department")} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Company name" htmlFor="displayName" required>
              <Input
                id="displayName"
                name="displayName"
                required
                defaultValue={value("display_name")}
              />
            </Field>
            <Field label="Legal name" htmlFor="legalName">
              <Input id="legalName" name="legalName" defaultValue={value("legal_name")} />
            </Field>
            <Field label="Website" htmlFor="website">
              <Input id="website" name="website" defaultValue={value("website")} />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input type="email" id="email" name="email" defaultValue={value("email")} />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={value("phone")} />
            </Field>
            <Field label="Trade or specialty" htmlFor="trade">
              <Input id="trade" name="trade" defaultValue={value("trade")} />
            </Field>
            <Field label="City" htmlFor="city">
              <Input id="city" name="city" defaultValue={value("city")} />
            </Field>
            <Field label="State or region" htmlFor="region">
              <Input id="region" name="region" defaultValue={value("region")} />
            </Field>
          </>
        )}
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={value("notes")} />
      </Field>
      <div className="flex justify-end gap-3">
        <Link href={`/${contact ? "contacts" : "companies"}`} className={outlineLink}>
          Cancel
        </Link>
        <Button type="submit">{record ? "Save changes" : `Create ${kind}`}</Button>
      </div>
    </form>
  );
}
