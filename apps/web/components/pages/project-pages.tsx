import { MoreHorizontal } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  KeyValue,
  MetricCard,
  Progress
} from "@closeoutflow/ui";

import { projects } from "../../src/mock/phase-3";
import { PageHeader } from "../shell/page-header";
import { StatusBadge } from "../status/status-badge";
import { DateCell } from "../table/cells";
import { DisabledPhaseAction } from "./page-actions";

export function ProjectOverviewPage() {
  const project = projects[0];
  return (
    <>
      <PageHeader
        title={project.name}
        description="Static project-workspace preview. Project creation and records arrive in Phase 5."
        meta={<StatusBadge category="project" status={project.status} />}
        actions={
          <>
            <Button variant="outline" disabled>
              <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
              Actions
            </Button>
            <DisabledPhaseAction label="Edit project" phase={5} />
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project summary</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              items={[
                { label: "Owner", value: "Riverside Health Partners" },
                { label: "Address", value: "1200 Riverside Drive, Sample City" },
                { label: "Project manager", value: "Jordan Lee" },
                { label: "Target closeout", value: <DateCell value={project.target} /> }
              ]}
            />
            <div className="mt-6">
              <Progress value={72} label="18 of 25 sample requirements complete" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Missing" value={2} />
              <MetricCard label="Overdue" value={1} />
              <MetricCard label="Awaiting review" value={2} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent project activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              "HVAC manual entered review",
              "Roofing warranty requested",
              "Fire alarm report approved"
            ].map((item) => (
              <div key={item} className="border-b pb-3 text-sm last:border-0">
                <p>{item}</p>
                <p className="text-xs text-muted-foreground">Static provenance example</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function FutureProjectPage({
  title,
  phase,
  description
}: {
  title: string;
  phase: number;
  description?: string;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description ?? `This project section arrives in Phase ${phase}.`}
      />
      <EmptyState
        title={`${title} arrives in Phase ${phase}`}
        description="This route exists only to review the future project-navigation structure. It contains no records or feature behavior."
      />
    </>
  );
}
