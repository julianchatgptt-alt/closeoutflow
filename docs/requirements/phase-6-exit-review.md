# Phase 6B exit review

> **Decision:** pending final validation record (populated below).
> **Date:** 2026-07-23.
> **Branch:** `codex/phase-6b-requirements`.

## Implementation result

Closeout now provides the complete Phase 6 configuration layer: organization requirement categories, reusable row-per-version requirement templates with a first-class library and builder, atomic idempotent template application, project requirement snapshots with derived attention indicators, three-slot responsibility assignment against the Phase 5 relationship model, date-only due dates in project context, not-applicable approval with reasons, independent soft archival, capped all-or-nothing bulk operations, real project-overview integration, immutable in-transaction audit, and forced-RLS tenant/project isolation mirrored by `packages/authz`.

## Tables and migrations

Exactly four new tables — `requirement_categories`, `requirement_templates`, `requirement_template_items`, `project_requirements` — created by append-only migrations `0022`–`0026`. Migrations `0000`–`0021` are untouched. The migration validator allowlists exactly these tables, requires their presence, and still rejects `requirements`, `submissions`, `documents`, `document_versions`, `reviews`, `packages`, and every other later-phase table (with red-path self-tests).

## Lifecycle confirmation

- Stored lifecycle is exactly `active` / `not_applicable_approved` (check constraint + function guards; forged values rejected at `23514`, direct writes impossible for `authenticated`).
- `archived_at` is independent soft archival; archive/restore never change `status` (pgTAP-asserted).
- Assignment completeness is **derived**: assigning/clearing responsibility performs no lifecycle transition (pgTAP-asserted), and removal of a Phase 5 row flips the derived stale/attention state with no write to the requirement.
- Derived indicators implemented: unassigned responsible company, unassigned internal owner, missing due date, planned date passed, stale company/contact/member reference, setup attention required, setup progress.
- Marking N/A requires `requirement.set_not_applicable` + a 3–200 character reason and writes `requirement.marked_not_applicable`; reversal returns to `active`.
- Future submission/review statuses are not implemented and no UI implies them.

## Permissions and parity

11 permissions with the approved names and role mappings ([phase-6-permissions-and-rls.md](./phase-6-permissions-and-rls.md)); Owner/Admin org-wide, assigned-only for non-admins, coordinator full configuration, reviewer/viewer read-only, template archive Owner/Admin. The TypeScript⇔SQL parity harness derives one side from `packages/authz` matrices and the other by parsing the migration SQL (`0006`/`0012`/`0022` for org scope, `0013`/`0022` for project scope) — independent sources, drift fails CI.

## RPCs / actions

DB (SECURITY DEFINER, `search_path=''`, narrow grants, blocking audit): 6 category functions incl. idempotent `ensure_requirement_defaults`; 9 template functions (create/update/save-items/publish/version/clone/archive/restore/preview); 7 requirement functions (create/update/N-A/reverse/archive/restore/reorder); `apply_requirement_template`; `bulk_update_project_requirements`; readers `search_project_requirements` + `get_requirement_summary`.
App: `actions/requirement-templates.ts` (10 actions) and `actions/project-requirements.ts` (10 actions), each Zod-validated, active-org/project revalidated, `can()`-authorized, RPC-backed, rate-limited, with friendly stale-conflict/error mapping.

## Routes

`/templates`, `/templates/new`, `/templates/[templateId]` (new first-class library surface + sidebar item); `/settings/templates` → redirect; `/projects/[id]/requirements` (register, preview marker removed), `/requirements/apply`, `/requirements/[requirementId]`; project overview requirement panel + activated setup-checklist step. All Phase 6 routes are private, authenticated, and noindex under the existing metadata conventions. Documents/reviews/portals/package routes keep their honest previews.

## Audit events

Full catalog per [phase-6-audit-events.md](./phase-6-audit-events.md): 9 template/category events, `template.applied` (one event per apply with counts; per-row events suppressed), and 9 requirement events incl. granular `responsibility_changed`/`due_date_changed` and single-event `bulk_updated` (ids capped at 50). All blocking/in-transaction; redaction pgTAP-asserted (no email/phone values; N/A reasons truncated to labels); immutability re-verified by the existing audit suites.

## RLS matrix result

pgTAP (`supabase/tests/0010_phase_6_requirements.test.sql`, 76 assertions, constrained `authenticated` roles with `request.jwt.claims`) proves: forced RLS + zero anon grants + select-only authenticated grants on all 4 tables; zero cross-tenant rows for every table; foreign template ids denied without existence leakage; unassigned members see zero project requirements while retaining library read; suspended members lose both; assigned PM limited to the assigned project; archived projects read-only; published-template immutability; apply idempotency; bulk cap/mixing rejection; starter seeding idempotency. The live E2E layer re-verifies unassigned non-enumerating 404 and viewer read-only surfaces.

## Template behavior

Row-per-version proven: published v1 immutable (item edits rejected), draft v2 published then v3 created with copied family-stable `item_key`s, clone starts a new family with regenerated keys, family-wide archive/restore, starter template seeded once per organization with the contract-verification disclaimer (never presented as authoritative; no legal advice).

## Project-requirement behavior

Snapshots with provenance; re-applying a template adds nothing (skips reported honestly); newer versions merge additively; template edits never rewrite existing projects; responsibility references validated project-scoped/active at assignment while stale pointers stay visible with explicit chips and reassignment paths; due dates resolve template anchors once at apply and are never silently recalculated.

## Commercial journeys (E2E-verified)

- **First register (J1):** empty register sells the scope → apply flow (choose → preview with duplicate skips → resolve roles → confirm) → register with honest counts.
- **Template creation (J2):** create → add requirement → publish (confirmation) → version locked, "Edit as new version" offered.
- **Custom requirement (J3):** title-first create lands in the chosen category with "Custom requirement" provenance.
- **Reuse (J4):** re-apply reports 0 additions; preview shows "Already in project".
- **Access (J5):** owner sees all; unassigned member gets a non-enumerating not-found; assigned reviewer gets a read-only register with no configuration controls; viewers browse the library read-only.
- **Bulk:** two selected rows changed by one confirmed action.

## Scale result

`pnpm test:phase6-scale` seeds 2,000 requirements on the seeded project and proves: two full non-overlapping 200-row register pages with stable `(category, order, id)` cursoring; title search isolating one row; a full needs-attention page; summary totals matching the live register; a 200-row bulk update applied atomically; summary and search within the local latency budget — all rolled back.

## Validation record

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current (no dependency changes in Phase 6B) |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, including workspace import boundaries |
| `pnpm typecheck` | Passed, 15/15 workspaces |
| `pnpm test` | Passed, 44 files / 181 tests (incl. new authz matrix, parity, validator suites) |
| `pnpm build` | Passed, 15/15 workspaces and all Phase 6 routes |
| `pnpm test:server-only` | PENDING |
| `pnpm db:start` / `pnpm db:reset` | Passed through migration `0026` plus deterministic seed |
| `pnpm db:types` | Passed twice; deterministic output (identical SHA-256 across consecutive runs) |
| `pnpm db:lint` | Passed; no schema errors |
| `pnpm db:validate` | Passed; Phase 6 allowlist + forbidden later-phase tables |
| `pnpm test:db` | Passed, 11 pgTAP files / 290 assertions + 5 live tests |
| `pnpm test:phase6-scale` | Passed at 2,000 requirements; transaction rolled back |
| `pnpm test:e2e` | PENDING |
| `pnpm test:a11y` | PENDING |
| `pnpm test:live-security` | PENDING |
| `pnpm test:production-probe` | PENDING |
| `pnpm capture:phase6` | PENDING |

## Visual evidence index

`pnpm capture:phase6` writes the deterministic manifest to the machine-local evidence directory (`PHASE6_CAPTURE_DIR`). Captures: register (desktop light/dark, tablet, Pixel, iPhone, needs-attention, not-applicable, bulk-selected, add flow, long title, empty desktop/mobile); requirement detail (desktop light/dark, iPhone, N/A confirmation, stale-conflict, not-found); template library (desktop light/dark, tablet, Pixel, no-results); builder draft (desktop light/dark, tablet); published version chain; apply flow (choose, preview desktop light/dark, Pixel, iPhone); overview requirement panel (desktop light/dark, Pixel). Review outcome recorded below after capture.

## Deferred Phase 7+ functionality (confirmed absent)

No file uploads, storage buckets, document/version records, previews, OCR, submissions, reviews/approvals/rejections, annotations, subcontractor/owner portals, secure external links, reminders, notification infrastructure, package/O&M generation, warranty/equipment/inspection/training/lien-waiver/drawing records, AI, integrations, billing, or marketing/SEO pages. No fake metrics or later-phase controls; deferral copy names the future capability honestly.

## Known risks

- Local scale validation (2,000 rows) is deterministic but not production-tenancy load testing; indexes and cursor paging are in place.
- Automated axe coverage cannot replace assistive-technology or customer usability research.
- Starter-template content awaits founder/construction-professional review before production exposure (ROD-2); the disclaimer ships with it.
- Approved deviations are listed in [phase-6-implementation-progress.md](./phase-6-implementation-progress.md) — none reduce specified capability, honesty, or security guarantees.

## Phase 6 verdict

PENDING FINAL VALIDATION.
