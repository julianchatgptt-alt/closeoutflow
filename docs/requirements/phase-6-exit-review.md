# Phase 6 exit review

> **Decision:** Phase 6B implementation, Phase 6C independent audit, and Phase 6D remediation are complete. Phase 6 is ready for the full-product visual and SEO phase.
> **Date:** 2026-07-23.
> **Branches:** `codex/phase-6b-requirements` (implementation) and `codex/phase-6d-requirements-remediation` (audit remediation).
> **Audit evidence:** [phase-6c-audit.md](./phase-6c-audit.md) is preserved byte-for-byte; remediation evidence is in [phase-6d-remediation.md](./phase-6d-remediation.md).

## Implementation result

Closeout now provides the complete Phase 6 configuration layer: organization requirement categories, reusable row-per-version requirement templates with a first-class library and builder, atomic idempotent template application, project requirement snapshots with derived attention indicators, three-slot responsibility assignment against the Phase 5 relationship model, date-only due dates in project context, not-applicable approval with preflight-validated reasons, independent soft archival, capped all-or-nothing bulk operations, accessible adjacent ordering, real project-overview integration, immutable in-transaction audit, and forced-RLS tenant/project isolation mirrored by `packages/authz`.

## Tables and migrations

Exactly four new tables — `requirement_categories`, `requirement_templates`, `requirement_template_items`, `project_requirements` — created by append-only migrations `0022`–`0026`; remediation migrations `0027`–`0028` redefine functions/grants only and add no tables. Migrations `0000`–`0026` are untouched by Phase 6D. The migration validator allowlists exactly these tables, requires their presence, and still rejects `requirements`, `submissions`, `documents`, `document_versions`, `reviews`, `packages`, and every other later-phase table (with red-path self-tests).

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

DB (SECURITY DEFINER, `search_path=''`, narrow grants, blocking audit): exactly 32 current Phase 6 feature/helper functions — 6 category/default; 9 template/version/preview; 7 requirement lifecycle/configuration (create/update/N-A/reverse/archive/restore/move); 4 apply/bulk/register-reader; and 6 permission/helper/guard functions. The former broad `reorder_project_requirements` function is revoked and removed; `move_project_requirement` is the only register-order mutation and requires `requirement.manage` plus an `updated_at` token. The Phase 5 `get_project_overview` redefinition for suspended-team presentation is tracked separately from this count.
App: `actions/requirement-templates.ts` (10 actions) and `actions/project-requirements.ts` (11 actions), each Zod-validated, active-org/project revalidated, `can()`-authorized, RPC-backed, rate-limited where applicable, with friendly stale-conflict/error mapping.

## Routes

`/templates`, `/templates/new`, `/templates/[templateId]` (new first-class library surface + sidebar item); `/settings/templates` → redirect; `/projects/[id]/requirements` (register, preview marker removed), `/requirements/apply`, `/requirements/[requirementId]`; project overview requirement panel + activated setup-checklist step. All Phase 6 routes are private, authenticated, and noindex under the existing metadata conventions. Documents/reviews/portals/package routes keep their honest previews.

## Audit events

Full catalog per [phase-6-audit-events.md](./phase-6-audit-events.md): 9 template/category events, `template.applied` (one event per apply with counts; per-row events suppressed), and 9 requirement events incl. granular `responsibility_changed`/`due_date_changed` and single-event `bulk_updated` (ids capped at 50). All blocking/in-transaction; redaction pgTAP-asserted (no email/phone values; N/A reasons truncated to labels); immutability re-verified by the existing audit suites.

## RLS matrix result

pgTAP (`supabase/tests/0010_phase_6_requirements.test.sql` + `0011_phase_6d_remediation.test.sql`, 108 Phase 6 assertions; 322 across the database suite, all using constrained `authenticated` roles with `request.jwt.claims`) proves: forced RLS + zero anon grants + select-only authenticated grants on all 4 tables; zero cross-tenant rows for every table; foreign template ids denied without existence leakage; unassigned members see zero project requirements while retaining library read; suspended members lose both; assigned PM limited to the assigned project; archived projects read-only; published-template immutability; apply idempotency; bulk cap/mixing rejection; starter seeding idempotency; Viewer/Reviewer empty-update denial; authorized empty/same-value no-op behavior; field-group and mixed-payload authorization; stale update/move rejection; old reorder-function removal; narrow move grants/isolation/audit; and suspended-team exclusion. The live E2E layer re-verifies unassigned non-enumerating 404, viewer read-only surfaces, N/A preflight, ordering controls, and active-team presentation.

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
- **Ordering:** two custom rows are moved with labelled keyboard/touch controls; the database verifies authorization, category scope, stale-token rejection, and one audit event.
- **N/A preflight:** invalid short input renders an associated inline error and cannot open confirmation; a valid reason opens confirmation without mutating until approved.

## Scale result

`pnpm test:phase6-scale` seeds 2,000 requirements on the seeded project and proves: two full non-overlapping 200-row register pages with stable `(category, order, id)` cursoring; title search isolating one row; a full needs-attention page; summary totals matching the live register; a 200-row bulk update applied atomically; summary and search within the local latency budget — all rolled back.

## Validation record

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current (no dependency changes in Phase 6B) |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, including workspace import boundaries |
| `pnpm typecheck` | Passed, 15/15 workspaces |
| `pnpm test` | Passed, 45 files / 184 tests (including N/A preflight component/axe coverage) |
| `pnpm build` | Passed, 15/15 workspaces and all Phase 6 routes |
| `pnpm test:server-only` | Passed; privileged DB and auth imports fail client builds as required |
| `pnpm db:start` / `pnpm db:reset` | Passed through migration `0028` plus deterministic seed |
| `pnpm db:types` | Passed twice; deterministic SHA-256 `4CCB5B263B3A01541D490D86F5A30DBEAE872DCB4CA5AB3E1C1EBA71BC5144DF` |
| `pnpm db:lint` | Passed; zero schema findings |
| `pnpm db:validate` | Passed; Phase 6 allowlist + forbidden later-phase tables |
| `pnpm test:db` | Passed, 12 pgTAP files / 322 assertions + 5 live tests |
| Targeted Phase 6D pgTAP | Passed, 32/32 permission, no-op, ordering, audit, tenant, and suspended-member assertions |
| Targeted N/A form tests | Passed, 3/3 including inline association, bounds, confirmation, and axe |
| `pnpm test:phase6-scale` | Passed at 2,000 requirements; transaction rolled back |
| `pnpm test:e2e` | Passed, 397 passed / 149 intentional project skips / 0 failed across seven profiles (final Phase 6D run, 21.1m) |
| `pnpm test:a11y` | Passed, 161/161 across seven profiles (light + dark) |
| `pnpm test:live-security` | Passed; audit UPDATE/DELETE/TRUNCATE blocked, audit schema off PostgREST |
| `pnpm test:production-probe` | Passed; protected Phase 6 routes, canonical metadata, unique-nonce CSP, security headers, zero health audit writes |
| Phase 6D affected-view capture | Passed; register ordering and N/A inline-validation views captured and reviewed only |
| Secret/diff checks | Passed; local secret scan clean, `git diff --check` clean, Phase 6C audit hash unchanged |

## Visual evidence index

The Phase 6B deterministic 35-capture manifest remains the full baseline: register, requirement detail, template library/builder/version chain, apply flow, and overview across desktop/tablet/Pixel/iPhone plus light/dark and edge states. Phase 6D did not regenerate that unaffected matrix. Because two user-facing screens changed, only `requirement-ordering--desktop--light.png` and `not-applicable-inline-validation--desktop--light.png` were captured to the machine-local Phase 6D evidence directory and reviewed. The register capture shows enabled adjacent controls with balanced disabled boundary states and no new clutter; the detail capture shows the concise inline error associated directly with the reason field, with no confirmation dialog. The existing responsive/keyboard behavior is independently green in the seven-profile E2E and 161-case accessibility suites.

## Deferred Phase 7+ functionality (confirmed absent)

No file uploads, storage buckets, document/version records, previews, OCR, submissions, reviews/approvals/rejections, annotations, subcontractor/owner portals, secure external links, reminders, notification infrastructure, package/O&M generation, warranty/equipment/inspection/training/lien-waiver/drawing records, AI, integrations, billing, or marketing/SEO pages. No fake metrics or later-phase controls; deferral copy names the future capability honestly.

## Known risks

- Local scale validation (2,000 rows) is deterministic but not production-tenancy load testing; indexes and cursor paging are in place.
- Automated axe coverage cannot replace assistive-technology or customer usability research.
- Starter-template content awaits founder/construction-professional review before production exposure (ROD-2); the contract-verification/not-legal-advice disclaimer ships with it. This is a non-blocking production-readiness action.
- Approved deviations are listed in [phase-6-implementation-progress.md](./phase-6-implementation-progress.md) — none reduce specified capability, honesty, or security guarantees.
- No Phase 6C MEDIUM or LOW finding remains open; see [phase-6d-remediation.md](./phase-6d-remediation.md).

## Phase 6 verdict

PHASE 6 COMPLETE — READY FOR FULL-PRODUCT VISUAL AND SEO PHASE
