"use client";

import Link from "next/link";

import { Badge } from "@closeoutflow/ui";

import type {
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
import { OverdueFlag, RiskIndicator, type RiskLevel } from "../status/risk-indicator";
import { StatusBadge } from "../status/status-badge";
import { DateCell, FileCell, UserCell } from "../table/cells";
import type { TableColumn } from "../table/data-table";

export const projectColumns: Array<TableColumn<(typeof projects)[number]>> = [
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
      <RiskIndicator
        level={row.risk as RiskLevel}
        drivers={
          row.risk === "High"
            ? "Owner review and an approaching closeout date"
            : row.risk === "Medium"
              ? "Overdue closeout requirements"
              : "No overdue closeout requirements"
        }
      />
    )
  },
  { key: "pm", header: "PM", render: (row) => <UserCell name={row.pm} /> }
];

export const requirementColumns: Array<TableColumn<(typeof requirements)[number]>> = [
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

export const documentColumns: Array<TableColumn<(typeof documents)[number]>> = [
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

export const reviewColumns: Array<TableColumn<(typeof reviews)[number]>> = [
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

export const equipmentColumns: Array<TableColumn<(typeof equipment)[number]>> = [
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
  { key: "docs", header: "Linked docs", className: "text-right tabular-nums" }
];

export const warrantyColumns: Array<TableColumn<(typeof warranties)[number]>> = [
  { key: "name", header: "Warranty" },
  { key: "type", header: "Type", render: (row) => <Badge tone="neutral">{row.type}</Badge> },
  { key: "coverage", header: "Coverage" },
  { key: "start", header: "Start", render: (row) => <DateCell value={row.start} /> },
  { key: "end", header: "End", render: (row) => <DateCell value={row.end} /> },
  { key: "party", header: "Responsible party" }
];

export const companyColumns: Array<TableColumn<(typeof companies)[number]>> = [
  { key: "name", header: "Company" },
  { key: "trades", header: "Trades" },
  { key: "contacts", header: "Contacts", className: "text-right tabular-nums" },
  { key: "projects", header: "Projects", className: "text-right tabular-nums" },
  { key: "primary", header: "Primary contact", render: (row) => <UserCell name={row.primary} /> }
];

export const teamColumns: Array<TableColumn<(typeof team)[number]>> = [
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

export const templateColumns: Array<TableColumn<(typeof templates)[number]>> = [
  { key: "name", header: "Template" },
  { key: "type", header: "Project type" },
  { key: "items", header: "Items", className: "text-right tabular-nums" },
  {
    key: "version",
    header: "Version",
    render: (row) => <span className="font-mono">{row.version}</span>
  }
];
