"use client";

import Link from "next/link";

import {
  companies,
  documents,
  equipment,
  projects,
  requirements,
  reviews,
  team,
  templates,
  warranties
} from "../../src/mock/phase-3";
import { PageHeader } from "../shell/page-header";
import { DataTable } from "../table/data-table";
import {
  companyColumns,
  documentColumns,
  equipmentColumns,
  projectColumns,
  requirementColumns,
  reviewColumns,
  teamColumns,
  templateColumns,
  warrantyColumns
} from "./list-columns";
import { DisabledPhaseAction } from "./page-actions";

export type ListKind =
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
  const config = listConfigs()[kind];
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={<DisabledPhaseAction label={config.action} phase={config.phase} />}
        previewPhase={config.phase}
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
      description: "Track closeout progress, risk, and ownership across projects.",
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
      description: "Track every closeout obligation separately from its documents and approvals.",
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
      description: "Review document status and version context for this project.",
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
      description: "Review items awaiting human decisions and follow-up.",
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
      description: "Organize equipment records and their closeout documents.",
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
      description: "Review warranty coverage, responsible parties, and key dates.",
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
      description: "Find project partners, trades, and primary contacts.",
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
      description: "Review organization membership and role assignments.",
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
      description: "Standardize recurring closeout requirements by project type.",
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
