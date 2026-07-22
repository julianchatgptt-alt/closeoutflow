import { EmptyState } from "@closeoutflow/ui";
import { notFound } from "next/navigation";
import {
  Notice,
  Section,
  StatusBadge,
  humanize
} from "../../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../../components/shell/page-header";
import { TimestampCell } from "../../../../../components/table/cells";
import { getActiveContext } from "../../../../../lib/active-context";

export const metadata = { title: "Project activity" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { client } = await getActiveContext();
  const [{ data: project }, { data: activity, error }] = await Promise.all([
    client.from("projects").select("id,name,status,timezone").eq("id", projectId).maybeSingle(),
    client.rpc("get_project_activity", { target_project_id: projectId, page_size: 50 })
  ]);
  if (!project) notFound();
  return (
    <>
      <PageHeader
        title="Project activity"
        description={`A safe, human-readable view of immutable audit events for ${project.name}.`}
        meta={<StatusBadge status={project.status} />}
      />
      <Notice error={query.error ?? error?.message} />
      <Section title="Recent activity">
        {activity?.length ? (
          <ol className="divide-y">
            {activity.map((event) => (
              <li key={event.id} className="py-4">
                <p className="font-medium">{humanize(event.action.replace(/^project\./, ""))}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.actor_name} ·{" "}
                  <TimestampCell value={event.occurred_at} timeZone={project.timezone} />
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No activity yet"
            description="Project changes will appear here without exposing private form data."
          />
        )}
      </Section>
    </>
  );
}
