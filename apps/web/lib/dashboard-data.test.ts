import { describe, expect, it, vi } from "vitest";

import {
  SUMMARY_FETCH_LIMIT,
  deriveReasons,
  describeReason,
  loadDashboardData,
  type ProjectRow
} from "./dashboard-data";
import type { RequirementSummary } from "./phase-6-schemas";

function project(overrides: Partial<ProjectRow> & { id: string }): ProjectRow {
  return {
    name: `Project ${overrides.id}`,
    project_number: null,
    status: "active",
    updated_at: "2026-07-01T00:00:00.000Z",
    closeout_target_date: null,
    team_count: 0,
    ...overrides
  };
}

function summary(overrides: RequirementSummary = {}): RequirementSummary {
  return {
    total: 10,
    not_applicable: 0,
    unassigned_company: 0,
    unassigned_owner: 0,
    missing_due_date: 0,
    stale_references: 0,
    needs_attention: 0,
    configured: 10,
    ...overrides
  };
}

/** Minimal stand-in for the Supabase client surface the loader actually uses. */
function makeClient(options: {
  projects?: ProjectRow[];
  projectError?: unknown;
  summaries?: Record<string, { data?: RequirementSummary; error?: unknown }>;
}) {
  const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
    if (name === "search_projects") {
      return Promise.resolve({
        data: options.projects ?? [],
        error: options.projectError ?? null
      });
    }
    if (name === "get_requirement_summary") {
      const entry = options.summaries?.[args.target_project_id as string];
      return Promise.resolve({ data: entry?.data ?? null, error: entry?.error ?? null });
    }
    throw new Error(`unexpected rpc ${name}`);
  });
  return { rpc } as never;
}

const noTemplates = () => Promise.resolve({ data: [] });

describe("deriveReasons", () => {
  it("reports an unconfigured project as the single 'no requirements' reason", () => {
    expect(deriveReasons(summary({ total: 0, configured: 0 }))).toEqual(["no_requirements"]);
  });

  it("returns no reasons when everything is assigned and dated", () => {
    expect(deriveReasons(summary())).toEqual([]);
  });

  it("reports every outstanding kind of setup independently", () => {
    expect(
      deriveReasons(
        summary({
          unassigned_company: 3,
          unassigned_owner: 2,
          missing_due_date: 1,
          stale_references: 4
        })
      )
    ).toEqual(["unassigned_company", "unassigned_owner", "missing_due_date", "stale_references"]);
  });

  it("treats a missing key as zero rather than throwing", () => {
    expect(deriveReasons({})).toEqual(["no_requirements"]);
  });
});

describe("describeReason", () => {
  it("uses the real count and plain language, never a raw enum", () => {
    expect(describeReason("unassigned_company", summary({ unassigned_company: 4 }))).toBe(
      "4 without a responsible company"
    );
    expect(describeReason("missing_due_date", summary({ missing_due_date: 1 }))).toBe(
      "1 without a date"
    );
    expect(describeReason("no_requirements", summary({ total: 0 }))).toBe("No requirements yet");
  });
});

describe("loadDashboardData", () => {
  it("counts only genuinely in-flight projects as active", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [
          project({ id: "a", status: "active" }),
          project({ id: "b", status: "closeout_in_progress" }),
          project({ id: "c", status: "owner_review" }),
          project({ id: "d", status: "draft" }),
          project({ id: "e", status: "complete" }),
          project({ id: "f", status: "cancelled" })
        ],
        summaries: {
          a: { data: summary() },
          b: { data: summary() },
          c: { data: summary() }
        }
      }),
      "org",
      noTemplates
    );

    expect(data.activeProjects.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("sums requirements needing attention across the projects it could read", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [project({ id: "a" }), project({ id: "b" })],
        summaries: {
          a: { data: summary({ needs_attention: 7, unassigned_company: 7, configured: 3 }) },
          b: { data: summary({ needs_attention: 5, missing_due_date: 5, configured: 5 }) }
        }
      }),
      "org",
      noTemplates
    );

    expect(data.requirementsNeedingAttention).toBe(12);
    expect(data.projectsNeedingSetup).toBe(2);
  });

  it("omits a project whose requirements the caller may not read, rather than counting it as zero", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [project({ id: "a" }), project({ id: "denied" })],
        summaries: {
          a: { data: summary({ needs_attention: 4, unassigned_owner: 4 }) },
          denied: { error: { code: "42501", message: "permission denied" } }
        }
      }),
      "org",
      noTemplates
    );

    // The project is still an active project, but contributes no counts and
    // never appears in the attention list.
    expect(data.activeProjects).toHaveLength(2);
    expect(data.summarizedCount).toBe(1);
    expect(data.requirementsNeedingAttention).toBe(4);
    expect(data.attention.map((entry) => entry.project.id)).toEqual(["a"]);
  });

  it("puts projects with nothing configured first, then ranks by outstanding count", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [project({ id: "many" }), project({ id: "few" }), project({ id: "empty" })],
        summaries: {
          many: { data: summary({ needs_attention: 9, unassigned_company: 9 }) },
          few: { data: summary({ needs_attention: 2, unassigned_company: 2 }) },
          empty: { data: summary({ total: 0, configured: 0 }) }
        }
      }),
      "org",
      noTemplates
    );

    expect(data.attention.map((entry) => entry.project.id)).toEqual(["empty", "many", "few"]);
  });

  it("excludes fully configured projects from the attention list", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [project({ id: "done" })],
        summaries: { done: { data: summary() } }
      }),
      "org",
      noTemplates
    );

    expect(data.attention).toEqual([]);
    expect(data.projectsNeedingSetup).toBe(0);
    expect(data.requirementsNeedingAttention).toBe(0);
  });

  it("bounds how many summaries it requests and says so when the counts are partial", async () => {
    const projects = Array.from({ length: SUMMARY_FETCH_LIMIT + 4 }, (_, index) =>
      project({ id: `p${index}` })
    );
    const summaries = Object.fromEntries(
      projects.map((entry) => [
        entry.id,
        { data: summary({ needs_attention: 1, missing_due_date: 1 }) }
      ])
    );
    const client = makeClient({ projects, summaries });

    const data = await loadDashboardData(client, "org", noTemplates);

    const summaryCalls = (client as unknown as { rpc: { mock: { calls: unknown[][] } } }).rpc.mock
      .calls.length;
    // One search_projects call plus exactly SUMMARY_FETCH_LIMIT summary calls.
    expect(summaryCalls).toBe(SUMMARY_FETCH_LIMIT + 1);
    expect(data.bounded).toBe(true);
    expect(data.requirementsNeedingAttention).toBe(SUMMARY_FETCH_LIMIT);
  });

  it("does not claim the counts are partial when every active project was summarized", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [project({ id: "a" })],
        summaries: { a: { data: summary() } }
      }),
      "org",
      noTemplates
    );
    expect(data.bounded).toBe(false);
  });

  it("orders recently updated projects by real updated_at, newest first", async () => {
    const data = await loadDashboardData(
      makeClient({
        projects: [
          project({ id: "old", updated_at: "2026-01-01T00:00:00.000Z" }),
          project({ id: "new", updated_at: "2026-07-20T00:00:00.000Z" }),
          project({ id: "mid", updated_at: "2026-04-01T00:00:00.000Z" })
        ],
        summaries: {
          old: { data: summary() },
          new: { data: summary() },
          mid: { data: summary() }
        }
      }),
      "org",
      noTemplates
    );

    expect(data.recentProjects.map((p) => p.id)).toEqual(["new", "mid", "old"]);
  });

  it("surfaces a failed project read so the page can show an error state", async () => {
    await expect(
      loadDashboardData(makeClient({ projectError: { message: "boom" } }), "org", noTemplates)
    ).rejects.toBeTruthy();
  });

  it("handles an organization with no projects at all", async () => {
    const data = await loadDashboardData(makeClient({ projects: [] }), "org", noTemplates);
    expect(data.activeProjects).toEqual([]);
    expect(data.recentProjects).toEqual([]);
    expect(data.attention).toEqual([]);
    expect(data.requirementsNeedingAttention).toBe(0);
  });
});
