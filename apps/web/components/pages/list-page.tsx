"use client";

import Link from "next/link";

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
        description={`${config.description} ${mockNotice}`}
        actions={<DisabledPhaseAction label={config.action} phase={config.phase} />}
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
      description: "Sample obligations remain separate from documents, reviews, and approvals.",
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
      description: "Static file-version presentation; no stored files exist.",
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
      description: "A mock queue demonstrating human-controlled review states only.",
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
      description: "Illustrative dates requiring later professional verification.",
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
      description: "Org-wide directory layout using clearly fake subcontractors.",
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
      description: "Static role examples; no users, invitations, or permissions are active.",
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
      description: "Starter-template rows are visual samples only.",
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
