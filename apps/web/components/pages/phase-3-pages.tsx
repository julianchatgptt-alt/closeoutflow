"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import {
  Badge,
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

import { OrganizationSettingsForm } from "../form/sample-form";
import { PageHeader } from "../shell/page-header";
import { OverdueFlag, RiskIndicator, type RiskLevel } from "../status/risk-indicator";
import { StatusBadge } from "../status/status-badge";
import { DateCell, FileCell, UserCell } from "../table/cells";
import { DataTable, type TableColumn } from "../table/data-table";
import {
  companies,
  documents,
  equipment,
  mockNotice,
  projects,
  requirements,
  reviews,
  team,
  templates,
  warranties
} from "../../src/mock/phase-3";

const disabledAction = (label: string, phase: number) => (
  <Button disabled>
    {label} — Phase {phase}
  </Button>
);

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
                <RiskIndicator level={project.risk as RiskLevel} />
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

type ListKind =
  | "projects"
  | "requirements"
  | "documents"
  | "reviews"
  | "equipment"
  | "warranties"
  | "companies"
  | "team"
  | "templates";

export function ListPage({ kind }: { kind: ListKind }) {
  const configs = listConfigs();
  const config = configs[kind];
  return (
    <>
      <PageHeader
        title={config.title}
        description={`${config.description} ${mockNotice}`}
        actions={disabledAction(config.action, config.phase)}
      />
      {config.table}
    </>
  );
}

function listConfigs(): Record<
  ListKind,
  { title: string; description: string; action: string; phase: number; table: React.ReactNode }
> {
  return {
    projects: {
      title: "Projects",
      description: "Review the project-list pattern using three static sample projects.",
      action: "New project",
      phase: 5,
      table: (
        <DataTable
          caption="Projects"
          data={[...projects]}
          columns={projectColumns}
          emptyTitle="No projects yet"
          emptyDescription="Projects can be created in Phase 5."
          cardTitle={(row) => <Link href={`/projects/${row.id}`}>{row.name}</Link>}
        />
      )
    },
    requirements: {
      title: "Requirements",
      description:
        "Sample obligations are separate from submissions, documents, reviews, and approvals.",
      action: "New requirement",
      phase: 6,
      table: (
        <DataTable
          caption="Requirements"
          data={[...requirements]}
          columns={requirementColumns}
          emptyTitle="No requirements yet"
          emptyDescription="Requirements arrive in Phase 6."
        />
      )
    },
    documents: {
      title: "Documents",
      description: "File versions and statuses below are static and do not represent stored files.",
      action: "Upload",
      phase: 8,
      table: (
        <DataTable
          caption="Documents"
          data={[...documents]}
          columns={documentColumns}
          emptyTitle="No documents yet"
          emptyDescription="Uploads and version history arrive in Phase 8."
        />
      )
    },
    reviews: {
      title: "Reviews",
      description: "This mock review queue demonstrates human-controlled status presentation only.",
      action: "Assign review",
      phase: 9,
      table: (
        <DataTable
          caption="Reviews"
          data={[...reviews]}
          columns={reviewColumns}
          emptyTitle="Nothing to review yet"
          emptyDescription="Review workflows arrive in Phase 9."
        />
      )
    },
    equipment: {
      title: "Equipment",
      description: "Sample asset-register structure; no equipment records exist.",
      action: "Add equipment",
      phase: 12,
      table: (
        <DataTable
          caption="Equipment"
          data={[...equipment]}
          columns={equipmentColumns}
          emptyTitle="No equipment yet"
          emptyDescription="Equipment records arrive in Phase 12."
        />
      )
    },
    warranties: {
      title: "Warranties",
      description:
        "Dates are illustrative and require legal and construction-professional verification.",
      action: "Add warranty",
      phase: 12,
      table: (
        <DataTable
          caption="Warranties"
          data={[...warranties]}
          columns={warrantyColumns}
          emptyTitle="No warranties yet"
          emptyDescription="Warranty records arrive in Phase 12."
        />
      )
    },
    companies: {
      title: "Companies",
      description: "Org-wide company-directory layout using clearly fake subcontractors.",
      action: "Add company",
      phase: 5,
      table: (
        <DataTable
          caption="Companies"
          data={[...companies]}
          columns={companyColumns}
          emptyTitle="No companies yet"
          emptyDescription="Company records arrive in Phase 5."
        />
      )
    },
    team: {
      title: "Team",
      description:
        "Static internal-role examples; no users, invitations, or permissions are active.",
      action: "Invite member",
      phase: 4,
      table: (
        <DataTable
          caption="Team members"
          data={[...team]}
          columns={teamColumns}
          emptyTitle="No team members yet"
          emptyDescription="Organization membership arrives in Phase 4."
        />
      )
    },
    templates: {
      title: "Requirement Templates",
      description: "Starter-template cards are visual samples only.",
      action: "New template",
      phase: 6,
      table: (
        <DataTable
          caption="Requirement templates"
          data={[...templates]}
          columns={templateColumns}
          emptyTitle="No templates yet"
          emptyDescription="Requirement templates arrive in Phase 6."
        />
      )
    }
  };
}

const projectColumns: Array<TableColumn<(typeof projects)[number]>> = [
  {
    key: "name",
    header: "Name",
    render: (row) => (
      <Link className="font-medium text-primary hover:underline" href={`/projects/${row.id}`}>
        {row.name}
      </Link>
    )
  },
  { key: "type", header: "Type" },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge category="project" status={row.status} />
  },
  { key: "target", header: "Target closeout", render: (row) => <DateCell value={row.target} /> },
  {
    key: "risk",
    header: "Risk",
    render: (row) => (
      <RiskIndicator level={row.risk as RiskLevel} drivers="Sample driver explanation" />
    )
  },
  { key: "pm", header: "PM", render: (row) => <UserCell name={row.pm} /> }
];
const requirementColumns: Array<TableColumn<(typeof requirements)[number]>> = [
  { key: "name", header: "Requirement" },
  { key: "trade", header: "Trade" },
  { key: "company", header: "Assigned company" },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge category="requirement" status={row.status} />
  },
  {
    key: "due",
    header: "Due",
    render: (row) => <DateCell value={row.due} overdue={row.flag === "Overdue"} />
  },
  {
    key: "flag",
    header: "Attention",
    render: (row) => (row.flag === "—" ? "—" : <OverdueFlag label={row.flag} />)
  }
];
const documentColumns: Array<TableColumn<(typeof documents)[number]>> = [
  { key: "file", header: "File", render: (row) => <FileCell name={row.file} size={row.size} /> },
  { key: "requirement", header: "Requirement" },
  {
    key: "version",
    header: "Version",
    render: (row) => <span className="font-mono">{row.version}</span>
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge category="document" status={row.status} />
  },
  { key: "uploader", header: "Uploaded by", render: (row) => <UserCell name={row.uploader} /> },
  { key: "date", header: "Date", render: (row) => <DateCell value={row.date} /> }
];
const reviewColumns: Array<TableColumn<(typeof reviews)[number]>> = [
  { key: "item", header: "Submission / Requirement" },
  { key: "stage", header: "Stage", render: (row) => <Badge tone="neutral">{row.stage}</Badge> },
  { key: "reviewer", header: "Reviewer", render: (row) => <UserCell name={row.reviewer} /> },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge category="review" status={row.status} />
  },
  { key: "updated", header: "Updated", render: (row) => <DateCell value={row.updated} /> }
];
const equipmentColumns: Array<TableColumn<(typeof equipment)[number]>> = [
  { key: "name", header: "Equipment" },
  { key: "manufacturer", header: "Manufacturer" },
  {
    key: "model",
    header: "Model / Serial",
    render: (row) => <span className="font-mono">{row.model}</span>
  },
  { key: "location", header: "Location" },
  {
    key: "warranty",
    header: "Warranty",
    render: (row) => <Badge tone="neutral">{row.warranty}</Badge>
  },
  { key: "docs", header: "Linked docs" }
];
const warrantyColumns: Array<TableColumn<(typeof warranties)[number]>> = [
  { key: "name", header: "Warranty" },
  { key: "type", header: "Type", render: (row) => <Badge tone="neutral">{row.type}</Badge> },
  { key: "coverage", header: "Coverage" },
  { key: "start", header: "Start", render: (row) => <DateCell value={row.start} /> },
  { key: "end", header: "End", render: (row) => <DateCell value={row.end} /> },
  { key: "party", header: "Responsible party" }
];
const companyColumns: Array<TableColumn<(typeof companies)[number]>> = [
  { key: "name", header: "Company" },
  { key: "trades", header: "Trades" },
  { key: "contacts", header: "Contacts" },
  { key: "projects", header: "Projects" },
  { key: "primary", header: "Primary contact", render: (row) => <UserCell name={row.primary} /> }
];
const teamColumns: Array<TableColumn<(typeof team)[number]>> = [
  {
    key: "name",
    header: "Member",
    render: (row) => <UserCell name={row.name} detail={row.email} />
  },
  { key: "role", header: "Role", render: (row) => <Badge tone="neutral">{row.role}</Badge> },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={row.status === "Active" ? "success" : "info"}>{row.status}</Badge>
  },
  { key: "last", header: "Last active" }
];
const templateColumns: Array<TableColumn<(typeof templates)[number]>> = [
  { key: "name", header: "Template" },
  { key: "type", header: "Project type" },
  { key: "items", header: "Items" },
  {
    key: "version",
    header: "Version",
    render: (row) => <span className="font-mono">{row.version}</span>
  }
];

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
            {disabledAction("Edit project", 5)}
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
export function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Company-wide analytics and reports arrive in Phase 11. No charts or live metrics are shown."
      />
      <EmptyState
        title="Reports arrive in Phase 11"
        description="This intentionally disabled preview makes no claim that reporting is functional."
      />
    </>
  );
}
export function SettingsGeneralPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization settings are a read-only Phase 3 preview."
      />
      <OrganizationSettingsForm />
    </>
  );
}
export function FutureSettingsPage({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader
        title={title}
        description={`This settings area becomes functional in Phase ${phase}.`}
      />
      <EmptyState
        title={`${title} arrives in Phase ${phase}`}
        description="No configuration, credentials, billing information, or audit data exists on this preview route."
      />
    </>
  );
}
