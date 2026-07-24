import "server-only";

import type { RequirementSummary } from "./phase-6-schemas";
import type { RequestAuthClient } from "./server-auth";

/**
 * Dashboard data assembly (Phase 6E-B2, FD-2 Path A — no new SQL).
 *
 * Every number here comes from readers that already exist and already enforce
 * authorization: `search_projects` is RLS-scoped to the caller, and
 * `get_requirement_summary` re-checks `can_access_project` plus
 * `requirement.view` per project and raises 42501 otherwise. We call the
 * summary for a bounded set of projects only — never the whole organization —
 * so this stays a small, read-only, bounded N+1 rather than an aggregate that
 * would need a new SECURITY DEFINER function.
 *
 * Nothing here may describe submissions, reviews, approvals, risk, health or
 * completion percentages: none of those systems exist.
 */

/** How many projects we will pull a requirement summary for. */
export const SUMMARY_FETCH_LIMIT = 10;

export type ProjectRow = {
  id: string;
  name: string;
  project_number: string | null;
  status: string;
  updated_at: string;
  closeout_target_date: string | null;
  team_count: number;
};

/** Why a project is surfaced as needing setup attention. Derived, never stored. */
export type AttentionReason =
  | "no_requirements"
  | "unassigned_company"
  | "unassigned_owner"
  | "missing_due_date"
  | "stale_references";

export type ProjectAttention = {
  project: ProjectRow;
  /** Null when the caller may see the project but not its requirements. */
  summary: RequirementSummary | null;
  reasons: AttentionReason[];
  needsAttention: number;
  total: number;
  configured: number;
};

export type DashboardData = {
  activeProjects: ProjectRow[];
  recentProjects: ProjectRow[];
  attention: ProjectAttention[];
  /** Projects we could read a summary for — the denominator for the counts. */
  summarizedCount: number;
  /** True when more projects exist than we summarized, so counts are partial. */
  bounded: boolean;
  requirementsNeedingAttention: number;
  projectsNeedingSetup: number;
  templates: Array<{ id: string; name: string; version: number; updated_at: string }>;
};

export function deriveReasons(summary: RequirementSummary): AttentionReason[] {
  const reasons: AttentionReason[] = [];
  if ((summary.total ?? 0) === 0) {
    reasons.push("no_requirements");
    return reasons;
  }
  if ((summary.unassigned_company ?? 0) > 0) reasons.push("unassigned_company");
  if ((summary.unassigned_owner ?? 0) > 0) reasons.push("unassigned_owner");
  if ((summary.missing_due_date ?? 0) > 0) reasons.push("missing_due_date");
  if ((summary.stale_references ?? 0) > 0) reasons.push("stale_references");
  return reasons;
}

export function describeReason(
  reason: AttentionReason,
  summary: RequirementSummary | null
): string {
  switch (reason) {
    case "no_requirements":
      return "No requirements yet";
    case "unassigned_company":
      return `${summary?.unassigned_company ?? 0} without a responsible company`;
    case "unassigned_owner":
      return `${summary?.unassigned_owner ?? 0} without an internal owner`;
    case "missing_due_date":
      return `${summary?.missing_due_date ?? 0} without a date`;
    case "stale_references":
      return `${summary?.stale_references ?? 0} pointing at someone who left the project`;
  }
}

/**
 * Sort so the projects with the most outstanding setup lead, but keep projects
 * that have no requirements at all at the very top — those are the ones where
 * the next action is most obvious.
 */
function rankAttention(a: ProjectAttention, b: ProjectAttention) {
  const aEmpty = a.reasons.includes("no_requirements");
  const bEmpty = b.reasons.includes("no_requirements");
  if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;
  if (a.needsAttention !== b.needsAttention) return b.needsAttention - a.needsAttention;
  return b.project.updated_at.localeCompare(a.project.updated_at);
}

export async function loadDashboardData(
  client: RequestAuthClient,
  organizationId: string,
  listTemplates: () => PromiseLike<{
    data: Array<{ id: string; name: string; version: number; updated_at: string }> | null;
  }>
): Promise<DashboardData> {
  void organizationId;

  const { data: projectData, error: projectError } = await client.rpc("search_projects", {
    search_query: "",
    assigned_only: false,
    include_archived: false,
    page_size: 50
  });
  if (projectError) throw projectError;

  const projects = (projectData ?? []) as ProjectRow[];
  // "Active" means the project is genuinely in flight — not draft, cancelled or
  // complete. Those are real lifecycle statuses from Phase 5.
  const activeProjects = projects.filter((project) =>
    ["active", "closeout_in_progress", "owner_review"].includes(project.status)
  );

  const recentProjects = [...projects]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  const candidates = activeProjects.slice(0, SUMMARY_FETCH_LIMIT);
  const summaries = await Promise.all(
    candidates.map(async (project) => {
      try {
        const { data, error } = await client.rpc("get_requirement_summary", {
          target_project_id: project.id
        });
        // A caller can hold project access without `requirement.view`. That is a
        // legitimate permission outcome, not a dashboard failure — we simply
        // omit the project's counts rather than showing a zero we cannot stand
        // behind.
        if (error) return { project, summary: null };
        return { project, summary: (data ?? {}) as RequirementSummary };
      } catch {
        return { project, summary: null };
      }
    })
  );

  const readable = summaries.filter(
    (entry): entry is { project: ProjectRow; summary: RequirementSummary } => entry.summary !== null
  );

  const attention: ProjectAttention[] = readable
    .map(({ project, summary }) => {
      const reasons = deriveReasons(summary);
      return {
        project,
        summary,
        reasons,
        needsAttention: summary.needs_attention ?? 0,
        total: summary.total ?? 0,
        configured: summary.configured ?? 0
      };
    })
    .filter((entry) => entry.reasons.length > 0)
    .sort(rankAttention);

  const requirementsNeedingAttention = readable.reduce(
    (total, entry) => total + (entry.summary.needs_attention ?? 0),
    0
  );

  const { data: templateData } = await listTemplates();

  return {
    activeProjects,
    recentProjects,
    attention,
    summarizedCount: readable.length,
    bounded: activeProjects.length > candidates.length,
    requirementsNeedingAttention,
    projectsNeedingSetup: attention.length,
    templates: templateData ?? []
  };
}
