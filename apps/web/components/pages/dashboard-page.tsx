import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle, MetricCard } from "@closeoutflow/ui";

import { projects, reviews, mockNotice } from "../../src/mock/phase-3";
import { PageHeader } from "../shell/page-header";
import { RiskIndicator, type RiskLevel } from "../status/risk-indicator";
import { StatusBadge } from "../status/status-badge";

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${mockNotice} Portfolio analytics become functional in Phase 11.`}
        actions={<Button disabled>Customize — Phase 11</Button>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active projects" value={3} detail="Sample data" />
        <MetricCard label="Due this week" value={7} detail="Sample requirements" />
        <MetricCard label="Awaiting my review" value={2} detail="Sample queue" />
        <MetricCard label="Overdue items" value={1} detail="Sample attention item" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attention needed</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {projects.slice(0, 2).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-start justify-between gap-3 rounded-md border p-3 hover:bg-muted"
              >
                <span>
                  <span className="block font-medium">{project.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {project.id === "riverside-medical-office"
                      ? "2 overdue requirements"
                      : "1 review awaiting response"}
                  </span>
                </span>
                <RiskIndicator
                  level={project.risk as RiskLevel}
                  drivers={
                    project.id === "riverside-medical-office"
                      ? "2 overdue requirements"
                      : "1 review awaiting response"
                  }
                />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting my review</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {reviews.slice(0, 2).map((review) => (
              <Link
                key={review.id}
                href="/projects/riverside-medical-office/reviews"
                className="flex items-center justify-between gap-2 border-b pb-3 last:border-0"
              >
                <span>
                  <span className="block text-sm font-medium">{review.item}</span>
                  <span className="text-xs text-muted-foreground">{review.stage}</span>
                </span>
                <StatusBadge category="review" status={review.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent sample activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4">
            {[
              "Jordan Lee reviewed the HVAC O&M Manual",
              "Sam Rivera submitted a replacement document",
              "Morgan Chen requested the Roofing Warranty",
              "Avery Patel approved the Fire Alarm Test Report"
            ].map((item, index) => (
              <li key={item} className="flex gap-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs tabular-nums">
                  {index + 1}
                </span>
                <span>
                  {item}
                  <span className="block text-xs text-muted-foreground">
                    Static provenance example · {index + 1}h ago
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
