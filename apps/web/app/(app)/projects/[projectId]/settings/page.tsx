import { Button, Field, Input } from "@closeoutflow/ui";
import { notFound } from "next/navigation";
import {
  archiveProjectAction,
  changeProjectStatusAction,
  restoreProjectAction,
  updateProjectAction
} from "../../../../../actions/projects";
import {
  Notice,
  ProjectForm,
  Section,
  StatusBadge
} from "../../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../lib/active-context";

export const metadata = { title: "Project settings" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { client } = await getActiveContext();
  const { data: p } = await client.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!p) notFound();
  return (
    <>
      <PageHeader
        title="Project settings"
        description={`Edit ${p.name} and manage its lifecycle.`}
        meta={<StatusBadge status={p.status} />}
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5">
        <Section title="Project details">
          <ProjectForm action={updateProjectAction} project={p} />
        </Section>
        <Section title="Lifecycle">
          <div className="grid gap-5 lg:grid-cols-2">
            {p.status === "draft" ? (
              <form action={changeProjectStatusAction} className="rounded-md bg-surface-sunken p-4">
                <input type="hidden" name="projectId" value={p.id} />
                <input type="hidden" name="status" value="active" />
                <p className="font-semibold">Activate project</p>
                <p className="my-2 text-sm text-muted-foreground">
                  Mark this workspace ready for active project coordination.
                </p>
                <Button type="submit">Activate</Button>
              </form>
            ) : null}
            {p.status !== "archived" ? (
              <form
                action={archiveProjectAction}
                className="rounded-md border border-warning-border bg-warning-subtle p-4"
              >
                <input type="hidden" name="projectId" value={p.id} />
                <p className="font-semibold">Archive project</p>
                <p className="my-2 text-sm text-muted-foreground">
                  Archiving makes the project read-only and removes it from active lists. History is
                  preserved.
                </p>
                <Field label="Reason" htmlFor="archiveReason">
                  <Input id="archiveReason" name="reason" />
                </Field>
                <Button className="mt-3" type="submit" variant="outline">
                  Archive project
                </Button>
              </form>
            ) : (
              <form action={restoreProjectAction} className="rounded-md bg-surface-sunken p-4">
                <input type="hidden" name="projectId" value={p.id} />
                <p className="font-semibold">Restore project</p>
                <p className="my-2 text-sm text-muted-foreground">
                  Restore this project to active status and resume setup.
                </p>
                <Button type="submit">Restore project</Button>
              </form>
            )}
            {["draft", "active", "closeout_in_progress", "owner_review"].includes(p.status) ? (
              <form
                action={changeProjectStatusAction}
                className="rounded-md border border-danger-border bg-danger-subtle p-4"
              >
                <input type="hidden" name="projectId" value={p.id} />
                <input type="hidden" name="status" value="cancelled" />
                <p className="font-semibold">Cancel project</p>
                <p className="my-2 text-sm text-muted-foreground">
                  Cancellation preserves the project record and audit history.
                </p>
                <Field label="Cancellation reason" htmlFor="cancelReason" required>
                  <Input id="cancelReason" name="reason" required minLength={3} />
                </Field>
                <Button className="mt-3" type="submit" variant="destructive">
                  Cancel project
                </Button>
              </form>
            ) : null}
          </div>
        </Section>
      </div>
    </>
  );
}
