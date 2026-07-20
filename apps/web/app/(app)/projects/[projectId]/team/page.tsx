import { Button, EmptyState, Select } from "@closeoutflow/ui";
import { notFound } from "next/navigation";
import {
  assignProjectMemberAction,
  changeProjectMemberRoleAction,
  removeProjectMemberAction
} from "../../../../../actions/project-members";
import {
  Notice,
  Section,
  StatusBadge,
  humanize
} from "../../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../../components/shell/page-header";
import { getActiveContext } from "../../../../../lib/active-context";

const roles = [
  "project_administrator",
  "project_manager",
  "closeout_coordinator",
  "internal_reviewer",
  "viewer"
];
export const metadata = { title: "Project team" };
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { client, organizationId } = await getActiveContext();
  const [{ data: project }, { data: assigned }, { data: members }] = await Promise.all([
    client.from("projects").select("id,name,status").eq("id", projectId).maybeSingle(),
    client
      .from("project_members")
      .select(
        "id,membership_id,project_role,status,organization_memberships!inner(user_profiles!inner(display_name),role,status)"
      )
      .eq("project_id", projectId)
      .eq("status", "active"),
    client
      .from("organization_memberships")
      .select("id,role,user_profiles!inner(display_name)")
      .eq("organization_id", organizationId)
      .eq("status", "active")
  ]);
  if (!project) notFound();
  return (
    <>
      <PageHeader
        title="Internal project team"
        description={`Project assignments control access and responsibility for ${project.name}. Organization membership remains separate.`}
        meta={<StatusBadge status={project.status} />}
      />
      <Notice error={query.error} message={query.message} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="Assigned teammates">
          {assigned?.length ? (
            <div className="divide-y">
              {assigned.map((a) => {
                const membership = Array.isArray(a.organization_memberships)
                  ? a.organization_memberships[0]
                  : a.organization_memberships;
                const profile =
                  membership && Array.isArray(membership.user_profiles)
                    ? membership.user_profiles[0]
                    : membership?.user_profiles;
                return (
                  <div key={a.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_15rem_auto]">
                    <div>
                      <p className="font-medium">{profile?.display_name ?? "Teammate"}</p>
                      <p className="text-xs text-muted-foreground">
                        Organization role: {membership?.role ? humanize(membership.role) : "Member"}
                      </p>
                    </div>
                    <form action={changeProjectMemberRoleAction} className="flex gap-2">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <Select
                        aria-label="Project responsibility"
                        name="projectRole"
                        defaultValue={a.project_role}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {humanize(r)}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" variant="outline" size="sm">
                        Save
                      </Button>
                    </form>
                    <form action={removeProjectMemberAction}>
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No teammates assigned"
              description="Assign an active organization member to grant project access."
            />
          )}
        </Section>
        <Section title="Assign teammate">
          <form action={assignProjectMemberAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="grid gap-1.5 text-sm font-semibold">
              Organization member
              <Select name="membershipId" required defaultValue="">
                <option value="" disabled>
                  Select a member
                </option>
                {members?.map((m) => {
                  const profile = Array.isArray(m.user_profiles)
                    ? m.user_profiles[0]
                    : m.user_profiles;
                  return (
                    <option key={m.id} value={m.id}>
                      {profile?.display_name ?? "Member"} · {humanize(m.role)}
                    </option>
                  );
                })}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Project responsibility
              <Select name="projectRole" defaultValue="viewer">
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </Select>
            </label>
            <Button type="submit">Assign to project</Button>
          </form>
        </Section>
      </div>
    </>
  );
}
