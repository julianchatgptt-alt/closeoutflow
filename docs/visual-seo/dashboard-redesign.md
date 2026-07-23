# FILE: /docs/visual-seo/dashboard-redesign.md

> **Document status:** Phase 6E-A specification — complete new dashboard architecture on **real data only**. The current dashboard is 100% fabricated Phase 8/9/11 content and must be rebuilt.
> **Grounding:** [current-visual-audit.md §1](./current-visual-audit.md); real readers `search_projects`, `get_requirement_summary(project_id)`, `get_project_overview(project_id)`, `get_project_activity`.

## 1. What the current dashboard must lose (delete)

Remove entirely: the `PreviewPill`; `StatStrip` ("Awaiting my review", "Overdue"); `AttentionList` ("Missing submission", "review awaiting response", risk badges); `SupportingRail` ("Awaiting my review", "Upcoming deadlines"); `ProjectHealth` (`RiskIndicator`, "18/25", "Trends arrive in Phase 11"); `ActivityList` (fabricated "reviewed"/"submitted" verbs). None describe implemented systems.

## 2. What is truthfully available (build only from these)

Real, access-scoped signals from Phase 5/6:
- Active project count; projects by lifecycle status; recently updated projects (`search_projects`).
- Per accessible project: requirements total, unassigned company, unassigned owner, missing due date, planned-date-passed, not-applicable, needs-attention, setup progress, next upcoming dates (`get_requirement_summary`).
- Project setup completeness (overview setup checklist share).
- Recently configured templates (`requirement_templates` list).
- Recommended next action (derived: "3 projects need requirement setup", "12 requirements missing a responsible company").
- Real audit-backed activity **per project** (`get_project_activity`) — org-wide activity has no reader today (see §7).

**Forbidden (systems don't exist):** awaiting review, submitted/approved documents, missing submissions, review queues, approval rates, risk scores, package readiness, document completion %, deadlines from reminders, fake health.

## 3. First-viewport intent

Within five seconds a contractor should understand: **"Here are my active projects and exactly what closeout setup still needs attention, with one obvious next step."** One dominant focal element (raised surface), then supporting context — not a four-up KPI strip over identical panels.

## 4. Three composition directions

### Direction A — "Attention-first operational list" (RECOMMENDED)
- **Hero (raised, focal):** "Projects needing setup attention" — a compact operational list of the caller's active projects ranked by attention count, each row: project name · lifecycle status · "N requirements need attention" (unassigned/undated/stale) · setup-progress meter · row link to that project's register (deep-filtered to `?attention=1`). One primary action: **New project**.
- **Left/main below hero:** "Recently updated projects" (real `updated_at`).
- **Right rail (quiet):** small `Metric` trio (Active projects · Projects needing setup · Requirements needing attention) + "Recently configured templates" + a single "Recommended next action" line.
- **Why:** leads with the product's real job (organize closeout scope + fix responsibility/dates), gives a focal point, uses only real data, and every element is a deep link into work.

### Direction B — "Portfolio snapshot + activity"
- **Top:** a refined single `Metric` row (3–4 real counts, no attention alarm styling).
- **Main:** two-column — "Projects" (status-grouped list) + "Recent project activity" (real per-project audit, aggregated client-side across the caller's top projects).
- **Right:** setup-attention summary + templates.
- **Trade-off:** more balanced but less of a clear focal point; activity aggregation is bounded N+1 (§7).

### Direction C — "Single focus + drill-in" (minimal, honest-limited)
- One large focal panel: "Your closeout setup" — org-level rollup of requirements-needing-attention with a category-style breakdown and a prominent CTA into the most-attention project; a thin secondary strip of active projects beneath.
- **Trade-off:** cleanest and most premium, but shows less at a glance; best if org-level aggregation stays intentionally limited.

**Recommendation: Direction A.** It is the most operational, most obviously worth paying for, uses only real access-scoped data, and degrades gracefully to an honest empty state. Founder confirms via FD-1 ([open-decisions.md](./open-decisions.md)).

## 5. Widgets: remove / keep / redesign

| Current widget | Action | Replacement |
|----------------|--------|-------------|
| `PreviewPill` header | **Remove** | real date/org context in the page header |
| `StatStrip` | **Rebuild** | `Metric` trio (real counts), quiet, one row, no alarm styling |
| `AttentionList` | **Rebuild** | attention-ranked **project** list (setup attention, not reviews) |
| `SupportingRail` | **Rebuild** | quiet rail: metrics + recent templates + next action |
| `ProjectHealth` | **Remove** | (risk/health = Phase 11; not shown) |
| `ActivityList` | **Redesign or defer** | real per-project activity if §7 aggregation approved; else omit |

## 6. Empty & limited states

- **No projects:** premium empty state — "Create your first project and we'll help you assemble the closeout scope" + primary **New project** (mirrors the Phase 5 first-run moment).
- **Projects but no requirements configured anywhere:** hero becomes "Set up your first closeout register" pointing at the most-recent project's requirements + apply-template.
- **Everything configured:** hero shows "All active projects have responsibility and dates set" (calm success), with recent activity/templates as context — never invents attention.
- If org-level data cannot be retrieved safely, ship the **honest limited dashboard** (Direction C minimal): a real active-projects list + New project, and nothing fabricated.

## 7. Data-source plan (the one place 6E might touch data — conservative)

The dashboard is org-level but all real readers are **per-project** and access-gated. Two options:

- **Path A (default, NO new SQL):** the dashboard Server Component calls `search_projects` (RLS-scoped) for the caller's accessible active projects, then calls the existing `get_requirement_summary(project_id)` for a **bounded** set (e.g., top N by `updated_at`, N≈10) to compute attention/setup. Bounded N+1, read-only, fully authorization-respecting, **zero schema/permission/RLS change**. Sufficient for Directions A/C at realistic org sizes.
- **Path B (optional, ONE new read-only RPC — founder-gated FD-2):** a `get_organization_requirement_overview()` SECURITY DEFINER reader (`search_path=''`, `authenticated` execute) that aggregates the same counts across `can_access_project` projects in one query, mirroring `get_requirement_summary`'s security exactly, with pgTAP cross-tenant/access coverage and audit-free (read-only). This is the *single* legitimate data addition contemplated by 6E and only if Path A proves too slow at large orgs.

**6E-B default: Path A.** Path B requires founder approval (FD-2) and, if approved, is a standalone reviewed migration — never bundled into visual commits. Under no circumstance may the dashboard fetch tenant data client-side or bypass RLS.

## 8. Mobile structure

- Single column: page header → hero attention list (cards) → metrics (2-up) → recent projects → templates/next-action. 44px targets; safe-area bottom padding; no horizontal scroll.

## 9. Light/dark

- Hero is the one raised surface (real elevation in dark); metrics/rail are quiet surfaces; attention chips use `warning-subtle`, never red alarms; both themes captured.

## 10. Acceptance criteria (dashboard)

- Zero fabricated content; every number traces to `search_projects`/`get_requirement_summary`.
- No "review/submission/approval/risk/deadline/health/%" language anywhere.
- `PREVIEW` pill gone.
- One clear focal element in the first viewport; one primary action (New project).
- Honest empty/limited states for no-projects and all-configured.
- Real data verified live for the seeded org; captured desktop light/dark + mobile.

---

*Continue to [authenticated-pages-redesign.md](./authenticated-pages-redesign.md).*
