import { Card, EmptyState, ErrorState, Metric } from "@closeoutflow/ui";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { AttentionPanel } from "../../../components/dashboard/attention-panel";
import { DashboardRail } from "../../../components/dashboard/dashboard-rail";
import { linkButton, outlineLink } from "../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../components/shell/page-header";
import { getActiveContext } from "../../../lib/active-context";
import { loadDashboardData, type DashboardData } from "../../../lib/dashboard-data";

export const metadata = { title: "Dashboard" };

export default async function Page() {
  const { client, organizationId } = await getActiveContext();

  const { data: organization } = await client
    .from("organizations")
    .select("display_name")
    .eq("id", organizationId)
    .maybeSingle();
  const organizationName = organization?.display_name ?? undefined;

  let data: DashboardData;
  try {
    data = await loadDashboardData(client, organizationId, () =>
      client
        .from("requirement_templates")
        .select("id,name,version,updated_at")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(3)
    );
  } catch {
    return (
      <>
        <DashboardHeader organizationName={organizationName} />
        <ErrorState description="We couldn't load your projects just now. Refresh the page to try again." />
      </>
    );
  }

  // First run: nothing exists yet, so sell the first action rather than
  // showing a grid of zeroes.
  if (data.activeProjects.length === 0 && data.recentProjects.length === 0) {
    return (
      <>
        <DashboardHeader organizationName={organizationName} />
        <EmptyState
          title="Create your first project"
          description="Closeout starts with the scope. Create a project and we'll help you assemble its closeout requirements — from a template or from scratch."
          action={
            <Link className={linkButton} href="/projects/new">
              New project
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeader organizationName={organizationName} />

      <div className="grid gap-6">
        <Card
          tier="panel"
          className="grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <Metric label="Active projects" value={data.activeProjects.length} href="/projects" />
          <Metric
            label="Projects needing setup"
            value={data.projectsNeedingSetup}
            attention={data.projectsNeedingSetup > 0}
          />
          <Metric
            label="Requirements needing attention"
            value={data.requirementsNeedingAttention}
            attention={data.requirementsNeedingAttention > 0}
            {...(data.bounded
              ? { detail: `Across your ${data.summarizedCount} most recent active projects` }
              : {})}
          />
        </Card>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
          {data.attention.length > 0 ? (
            <AttentionPanel items={data.attention} />
          ) : (
            <AllConfigured
              hasSummaries={data.summarizedCount > 0}
              hasActiveProjects={data.activeProjects.length > 0}
            />
          )}
          <DashboardRail data={data} />
        </div>
      </div>
    </>
  );
}

function DashboardHeader({ organizationName }: { organizationName?: string | undefined }) {
  return (
    <PageHeader
      title="Dashboard"
      {...(organizationName ? { description: organizationName } : {})}
      actions={
        <Link className={linkButton} href="/projects/new">
          New project
        </Link>
      }
    />
  );
}

/**
 * Calm success, not invented work. Shown when every active project we can read
 * already has responsibility and dates set — and, separately, when the caller
 * can see projects but not their requirements.
 */
function AllConfigured({
  hasSummaries,
  hasActiveProjects
}: {
  hasSummaries: boolean;
  hasActiveProjects: boolean;
}) {
  if (!hasActiveProjects) {
    return (
      <Card tier="raised" className="p-6">
        <h2 className="text-section">No active projects</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          None of your projects are active right now. Start a new one, or open an existing project
          to move it forward.
        </p>
        <Link className={`${outlineLink} mt-5`} href="/projects">
          View projects
        </Link>
      </Card>
    );
  }

  if (!hasSummaries) {
    return (
      <Card tier="raised" className="p-6">
        <h2 className="text-section">Your projects</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          You don&apos;t have access to the closeout requirements on these projects, so there is
          nothing to set up here. Ask an organization administrator if you need it.
        </p>
        <Link className={`${outlineLink} mt-5`} href="/projects">
          View projects
        </Link>
      </Card>
    );
  }

  return (
    <Card tier="raised" className="p-6">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-success-subtle">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-success-foreground" />
      </span>
      <h2 className="text-section mt-4">Every active project is set up</h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Each active project has its closeout requirements assigned to a responsible company, given
        an internal owner, and dated.
      </p>
      <Link className={`${outlineLink} mt-5`} href="/projects">
        View projects
      </Link>
    </Card>
  );
}
