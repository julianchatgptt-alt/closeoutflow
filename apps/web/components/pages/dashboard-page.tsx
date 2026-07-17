import Link from "next/link";

import { ActivityList } from "../dashboard/activity-list";
import { AttentionList } from "../dashboard/attention-list";
import { ProjectHealth } from "../dashboard/project-health";
import { StatStrip } from "../dashboard/stat-strip";
import { SupportingRail } from "../dashboard/supporting-rail";
import { PageHeader } from "../shell/page-header";

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Thursday, Jul 16 · Sample Construction Co."
        previewPhase={11}
        previewMessage="This dashboard shows static sample data for design review. Live portfolio analytics arrive in Phase 11."
        actions={
          <Link
            href="/projects"
            className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium text-primary hover:underline"
          >
            Go to projects <span aria-hidden="true">›</span>
          </Link>
        }
      />
      <div className="grid gap-6 pb-[env(safe-area-inset-bottom)]">
        <StatStrip />
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <AttentionList />
          <SupportingRail />
        </div>
        <ProjectHealth />
        <ActivityList />
      </div>
    </>
  );
}
