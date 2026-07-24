import { Badge } from "@closeoutflow/ui";
import { AlertTriangle } from "lucide-react";

import { formatDateOnly } from "../../lib/date-format";
import type { RegisterRow } from "../../lib/phase-6-schemas";

/** Stored lifecycle labels only — assignment completeness is derived, never a status. */
export function RequirementStatusBadge({
  status,
  archived
}: {
  status: string;
  archived?: boolean;
}) {
  if (archived) return <Badge tone="neutral">Removed</Badge>;
  if (status === "not_applicable_approved") return <Badge tone="neutral">Not applicable</Badge>;
  return <Badge tone="info">Planned</Badge>;
}

/**
 * Derived attention, shown as a quiet warning chip. These mean "setup is
 * incomplete", never "something failed", so they must never read as an alarm.
 */
export function StaleChip({ label }: { label: string }) {
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-[11px] font-medium leading-4 text-warning-foreground">
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

export function ResponsibilityCell({ row }: { row: RegisterRow }) {
  if (!row.responsible_project_company_id && !row.responsible_contact_name) {
    return row.status === "active" && !row.archived_at ? (
      <span className="text-sm font-medium text-warning-foreground">Unassigned</span>
    ) : (
      <span className="text-sm text-muted-foreground">—</span>
    );
  }
  return (
    <div className="min-w-0">
      {row.responsible_company_name ? (
        <p className="truncate text-sm font-medium" title={row.responsible_company_name}>
          {row.responsible_company_name}
        </p>
      ) : null}
      {row.responsible_contact_name ? (
        <p
          className="truncate text-[13px] text-muted-foreground"
          title={row.responsible_contact_name}
        >
          {row.responsible_contact_name}
        </p>
      ) : null}
      {row.responsible_company_stale ? <StaleChip label="Company left project" /> : null}
      {row.responsible_contact_stale ? <StaleChip label="Contact left project" /> : null}
    </div>
  );
}

export function OwnerCell({ row }: { row: RegisterRow }) {
  if (!row.internal_owner_member_id)
    return row.status === "active" && !row.archived_at ? (
      <span className="text-sm text-muted-foreground">No owner</span>
    ) : (
      <span className="text-sm text-muted-foreground">—</span>
    );
  return (
    <div className="min-w-0">
      <p className="truncate text-sm" title={row.internal_owner_name ?? undefined}>
        {row.internal_owner_name}
      </p>
      {row.internal_owner_stale ? <StaleChip label="No longer on project" /> : null}
    </div>
  );
}

export function DueDateCell({ row }: { row: RegisterRow }) {
  if (!row.due_date)
    return row.status === "active" && !row.archived_at ? (
      <span className="text-sm text-muted-foreground">No date</span>
    ) : (
      <span className="text-sm text-muted-foreground">—</span>
    );
  const passed =
    row.status === "active" &&
    !row.archived_at &&
    row.due_date < new Date().toISOString().slice(0, 10);
  return (
    <div>
      <time dateTime={row.due_date} className="text-sm tabular-nums">
        {formatDateOnly(row.due_date)}
      </time>
      {passed ? (
        <p className="text-xs font-medium text-warning-foreground">Planned date passed</p>
      ) : null}
    </div>
  );
}

export function SourceLine({ row }: { row: RegisterRow }) {
  return (
    <p className="truncate text-[13px] text-muted-foreground">
      {row.source_template_name
        ? `From ${row.source_template_name} v${row.source_template_version}`
        : "Custom requirement"}
      {!row.is_required ? " · Optional" : ""}
      {row.priority === "high" ? " · High priority" : ""}
    </p>
  );
}
