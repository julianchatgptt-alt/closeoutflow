import { MoreHorizontal } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  KeyValue,
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
        description="Project closeout status, ownership, and current progress."
        previewPhase={5}
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
            <div className="mt-6 grid grid-cols-3 divide-x border-t pt-4">
              {[
                ["Missing", 2],
                ["Overdue", 1],
                ["Awaiting review", 2]
              ].map(([label, value]) => (
                <div key={label} className="px-3 first:pl-0 last:pr-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
                </div>
              ))}
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
                <p className="text-xs text-muted-foreground">Updated recently</p>
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
      <PageHeader title={title} {...(description ? { description } : {})} previewPhase={phase} />
      <EmptyState
        title={`No ${title.toLowerCase()} yet`}
        description="This workspace section has no records to show."
      />
    </>
  );
}
