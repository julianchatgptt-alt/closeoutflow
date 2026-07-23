# Phase 6C Audit

> **Auditor:** Independent Phase 6C review (audit-only; no implementation changes).
> **Branch audited:** `codex/phase-6b-requirements` @ `8537e86`.
> **Date:** 2026-07-23.
> **Method:** repository inspection, migration/schema census, constrained-role SQL probes against the live local database, full validation-command battery, live application journeys, and review of the 35 deterministic captures plus an independently regenerated capture set.

## 1. Executive verdict

Phase 6B is a genuinely strong, in-scope, commercially credible implementation of the closeout requirements and template system. Every load-bearing security and integrity claim independently reproduced: exactly four approved tables, append-only `0022`–`0026` with `0000`–`0021` untouched, forced RLS with zero anon grants, cross-tenant denial on every table and RPC, published-template immutability, snapshot integrity, atomic idempotent application, the `active`/`not_applicable_approved`-only lifecycle with derived attention, and TS⇔SQL parity from independent sources. The register, template library, builder, apply flow, and overview integration are premium, honest, and free of fake later-phase metrics; the corrected Keystone Fold brand and noindex conventions are preserved.

One **MEDIUM** authorization/integrity defect was found (a read-only viewer can perform a silent, unaudited no-op `updated_at` write via an empty update payload). It is not a cross-tenant, data-loss, or escalation issue and does **not** block Phase 7, but it should be the first Phase 6D fix. The remainder are LOW/OBSERVATION polish items plus the previously-deferred starter-content review.

**Verdict:** READY FOR PHASE 6D REMEDIATION. No Phase 7 blockers.

## 2. Repository and Git state

- Branch `codex/phase-6b-requirements`; worktree clean after reverting an incidental `apps/web/next-env.d.ts` touch (Playwright harness artifact — not committed). Audit file is the only intended addition.
- 10 Phase 6 commits with clear logical boundaries (docs foundation → data → templates → register → tests → fixes → docs), no unrelated refactors, no migration rewrites.
- `git diff --check 22a5d53 HEAD` clean; secret scan over the full 6B diff found no service-role keys/API keys/passwords (only the documented seed test password and the harness env injection).
- Phase 6A docs and lifecycle clarification intact; Phase 5/5E docs and branding intact; AGENTS.md/CLAUDE.md pointers updated to the 6B record + 6C audit.

## 3. Scope compliance

In scope and present: categories, templates, template items, project requirements, responsibility, dates, priority, ordering, N/A, archive/restore, bulk configuration, register + template UX, overview integration, audit/authz/RLS/testing. Prohibited scope search over the app/packages/supabase diff found **no** uploads, storage, document/version records, previews, OCR, submissions, reviews, approvals, annotations, portals, external links, notifications, reminders, package/O&M generation, warranties/equipment/inspections/training/lien-waivers/drawings records, AI, integrations, billing, or public marketing/SEO pages. Documents/reviews/equipment/etc. remain honest Phase-N previews; requirements dropped its preview marker as intended.

## 4. Migration census

| Migration | Purpose | Tables | Functions (new/redefined) | Triggers | Policies | Grants | Risks |
|---|---|---|---|---|---|---|---|
| `0022` | permission parity + category taxonomy | `requirement_categories` | redefines `has_org_permission`, `project_permission`; category CRUD + `reorder` + archive/restore + `ensure_requirement_defaults` (8 total) | `set_updated_at` | 1 SELECT (`is_org_member`) | revoke public/anon; SELECT→authenticated; all→service_role; execute→authenticated | none material |
| `0023` | templates + items, versioning, preview, starter seed | `requirement_templates`, `requirement_template_items` | create/update/save-items/publish/version/clone/archive/restore/preview + `generate_requirement_item_key` + starter seed in `ensure_requirement_defaults` (12) | `set_updated_at` ×2; item org/category guard | SELECT (`template.view`) ×2 | as above; `generate_*` execute→service_role only | none material |
| `0024` | project requirement instances | `project_requirements` | create/update/N-A/reverse/archive/restore/reorder + `assert_requirement_responsibility` (9) | `set_updated_at`; org/project/reference consistency guard | SELECT (`can_access_project`) | as above; `assert_*` execute→service_role only | see P6C-001 (empty-payload update) |
| `0025` | apply, bulk, readers | — | `apply_requirement_template`, `bulk_update_project_requirements`, `search_project_requirements`, `get_requirement_summary` (4) | — | — | execute→authenticated | none material |
| `0026` | seed contract + column comments + index self-check | — | — | — | — | — | none |

Append-only confirmed: `0000`–`0021` byte-identical to pre-6B (`git diff 22a5d53 HEAD -- supabase/migrations` touches only `0022`–`0026`). Migration order, numeric-descriptive naming, and validator allowlist all correct; `db:validate` passes and still forbids `requirements`/`submissions`/`documents`/`document_versions`/`reviews`/`packages` etc. Generated types deterministic across two runs (identical SHA-256, no diff). `db:lint` clean.

## 5. Four-table census

All four tables verified: UUID PK; `organization_id` FK (cascade) on all; `project_id` on `project_requirements`; correct FKs (`on delete restrict` on responsibility + source-template refs, cascade on parents); unique constraints (`(org, family_id, version)`, `(template_id, item_key)`, active-name category uniqueness, partial `(project_id, source_item_key) where source_item_key not null and archived_at is null`); check constraints (status enums, `(status='not_applicable_approved')=(na_reason is not null)`, `(source_template_id is null)=(source_item_key is null)`, version≥1, anchor/offset pairing); trigram GIN search on `lower(name)` / `normalized_title`; gapped stable ordering with composite register index; `archived_at`/`archived_by`; timestamps with `set_updated_at`; `updated_at` used as the optimistic-concurrency token; forced RLS with SELECT-only authenticated grants; no delete grants (soft archive only). No unapproved Phase 6 table exists (`\dt` shows exactly the four).

## 6. Lifecycle model

Confirmed the only stored requirement statuses are `active` and `not_applicable_approved` (check constraint). `archived_at` is independent; assignment/owner/date/staleness are all derived, never stored. Probes:
- Forged `status='requested'` insert → rejected `23514` (check constraint).
- N/A without reason → rejected `23514`.
- Assign then clear responsibility (coordinator) → `status` stays `active` (verified in pgTAP `0010` and by direct probe).
- Mark N/A requires `requirement.set_not_applicable` (viewer denied `42501`); reversal returns to `active`; archive/restore leave `status` untouched.
No future workflow statuses were introduced anywhere in schema or UI.

## 7. Category model

Org-scoped; active-name uniqueness (`unique (organization_id, lower(name)) where archived_at is null`); `sort_order` ordering; archive/restore via Owner/Admin-gated RPCs; reused by both templates and project requirements via `restrict` FKs (archival cannot orphan or destroy referencing rows); seeded defaults idempotent; cross-tenant denied (Org B reads 0 Org A categories). Category archival preserves requirement history (FK restrict + soft archive). Audit events `requirement_category.created/updated/archived/restored` present.

## 8. Template versioning and immutability

Row-per-version confirmed (`family_id` + `version`, unique per org). Draft-only editing enforced; published rows and items immutable:
- `save_template_items` on a published version → denied.
- `update_requirement_template` on published → denied.
- No direct table write path (authenticated has no INSERT/UPDATE/DELETE grant).
`create_template_version` copies items with family-stable `item_key`s and increments version; `clone_requirement_template` starts a new family with regenerated keys (verified in pgTAP + probes); family-wide archive/restore; `get_template_preview` authorization-gated with duplicate flags. Concurrency guarded by `updated_at`. Second concurrent draft rejected.

## 9. Template snapshot and application integrity

`apply_requirement_template` copies items into `project_requirements` as snapshots carrying `source_template_id` + `source_item_key`. Independently verified: a first apply added 2 / skipped 4; an immediate re-apply added **0** / skipped 6 (idempotent). Later template edits and new versions do not rewrite existing project requirements (snapshots + additive merge; no update path touches prior rows). Provenance is readable in the UI ("From {Template} v{n}"). Template deletion is impossible through product workflows (archive only; no delete grant/RPC).

## 10. Project-requirement model

All specified fields present; no document/submission/review/approval semantics embedded. Reserved `record_type` is nullable and never surfaced. Ordering gapped and stable; concurrency token present.

## 11. Responsibility integrity

References point only to `project_companies` / `project_contacts` / `project_members`, validated same-project and active at assignment via `assert_requirement_responsibility`:
- Forged/other-project company assignment → rejected (`responsible company must be active on this project`).
- Cross-tenant requirement update → `42501`.
Stale references (e.g. seeded "Gone Interiors" removed from the project) are **preserved and visibly flagged** ("Company left project" chip) rather than nulled — confirmed in the live register and `needs_attention` derivation. Removed/suspended member owners flagged likewise.

## 12. Date and timezone behavior

Date-only `due_date`; project-timezone "today"/"planned date passed" derivation; `formatDateOnly` renders friendly dates with `timeZone:"UTC"` on the date-only string (no day shift); template anchor+offset resolves once at apply and is never recalculated; bulk date set/clear audited; no scheduling engine present. "Planned date passed" copy is neutral (not "overdue submission").

## 13. Permissions

All 11 identifiers present with correct role mappings. Template permissions org-scoped (`template.view` all members; `manage`/`publish` Owner/Admin/PM/Coordinator; `archive` Owner/Admin). Requirement permissions project-scoped via effective project role (admin/PM/Coordinator full config; Reviewer/Viewer `requirement.view` only). Owner/Admin org-wide; non-admin assigned-only; unknown role/permission deny; suspended/removed membership and removed assignment deny (probed live). Project responsibility grants no org elevation; platform role separate.

## 14. TypeScript/SQL/RLS parity

`packages/authz` matrices (`rolePermissions`, `projectRolePermissions`) are cross-diffed against the SQL by parsing `has_org_permission` (migrations `0006`/`0012`/`0022`) and `project_permission` (`0013`/`0022`) — independent sources, not derived from one another. Parity + validator + authz matrix tests pass (16/16). No drift in role names, permission names, scopes, Owner/Admin/Coordinator/Reviewer/Viewer mappings, assigned-only, or unknown-input handling.

## 15. Application authorization

Every sensitive server action in `actions/requirement-templates.ts` and `actions/project-requirements.ts` was reviewed: Zod validation → server-resolved active org/project (client ids never trusted) → `authz.can()` → SECURITY DEFINER RPC that re-authorizes in-DB → friendly error mapping; creates/applies rate-limited (`template-mutation`, `requirement-mutation`). No hidden-UI-only protection: the DB layer denies independently (verified by direct RPC probes bypassing the UI). See P6C-001 for the one gap (empty-payload update reaches a no-op write under `requirement.view`).

## 16. Mutation-function census

~30 Phase 6 SECURITY DEFINER functions (exit review's "~25" is an approximation; census: 8 in `0022`, 12 in `0023`, 9 in `0024`, 4 in `0025`, two of which are helper redefinitions). Spot-and-broad census confirms all are `postgres`-owned, `search_path=''`, no anon/public execute, execute granted to `authenticated` (internal helpers `generate_requirement_item_key` and `assert_requirement_responsibility` to `service_role` only). Transaction boundaries atomic; audit inline/blocking; concurrency via `updated_at`; idempotency via `item_key`; safe errcodes (`42501`/`22023`/`23505`/`P0001`); no recursion; no existence leakage (foreign ids return generic `42501`).

## 17. RLS matrix

| Actor | categories | templates | template_items | project_requirements |
|---|---|---|---|---|
| anon | 0 rows, 0 grants | 0 | 0 | 0 |
| cross-tenant member | 0 | 0 | 0 | 0 |
| Owner / Admin | all org | all org | all org | all org projects |
| assigned PM/Coordinator | org | org (view) + manage | org | assigned project |
| assigned Reviewer/Viewer | org | org (view) | org | assigned project (read) |
| unassigned member | org (library visible) | org (library visible) | org | **0** |
| suspended / removed member | 0 | 0 | 0 | 0 |
| removed assignment | org | org | org | 0 for that project |
| archived project | n/a | n/a | n/a | read-only; writes blocked |
| archived template/requirement | visible w/ filter | visible; edits blocked | visible; edits blocked | visible; edits blocked |
| platform admin | no bypass | no bypass | no bypass | no bypass |
| service_role | full (definer/audit only) | full | full | full |

All reproduced with constrained `authenticated` roles + `request.jwt.claims` (pgTAP `0010`, 76 assertions, plus ad-hoc probes). Forced RLS on all four; no tenant/template/project existence leakage.

## 18. Grants census

`anon`: nothing (not present in `role_table_grants`; no function execute). `authenticated`: SELECT on the four tables + execute on the Phase 6 RPCs; **no** direct INSERT/UPDATE/DELETE (writes only via RPC). `service_role`: full, used only inside definer functions/audit. Audit schema remains off PostgREST and immutable (`test:live-security` passed). No unsafe default privileges observed.

## 19. Audit-event review

Full catalog present and matching the spec (22 actions): category ×4, template ×6, version_created, cloned, applied, requirement created/updated/responsibility_changed/due_date_changed/marked_not_applicable/not_applicable_reversed/archived/restored/reordered/bulk_updated. All blocking/in-transaction. Redaction verified: no email/phone values or free-text bodies in metadata; N/A reasons truncated to ≤80-char labels; `template.applied` writes one event with counts (per-row `requirement.created` suppressed during apply — confirmed: two applies produced exactly two `template.applied` rows, no per-row spam); `bulk_updated` caps ids at 50. Immutability re-verified.

## 20. Requirement-register review

Category-grouped operational register with summary chips (total / needs-attention / not-applicable), lean rows (title + provenance line, responsible company/contact, internal owner, friendly due date + "Planned date passed", quiet status ink), search + category/status/archived filters (URL-serialized), 200-row cursor paging, bulk selection + bottom bar, honest portal-deferral copy, archived read-only banner, empty/no-results/error/permission states. No UUIDs, ISO dates, or enum language surfaced (E2E asserts this). Reads as a genuine closeout register, not a spreadsheet/checklist clone. Light and dark both polished.

## 21. Derived-attention review

Indicators (unassigned company, unassigned owner, missing due date, planned date passed, stale company/contact/member, setup attention) are computed in `search_project_requirements`/`get_requirement_summary` from current data; no stored attention status exists. Removing responsibility flips indicators with no requirement-row write. Archived/N-A excluded correctly. Chip counts match rows (verified: register `needs_attention=3`/summary `3`; overview panel "4 need attention" includes the missing-date case). Labels are plain-English.

## 22. Bulk-operation review

Selection → bottom bar → AlertDialog confirmation; all-or-nothing transaction; per-action permission; cross-project/tenant mixing rejected (`invalid requirement selection`); 200 cap enforced (201 → `select between 1 and 200 requirements`); one aggregate audit event. Mobile bar is non-sticky below `md` (fixed during 6B visual review). See P6C-003 re: N/A reason UX.

## 23. Template-library review

First-class `/templates` sidebar surface; family cards with version+status chips, item counts, search, archived filter, create/clone/archive; prominent starter disclaimer; viewer read-only framing; `/settings/templates` redirects. Feels reusable and valuable, not buried settings.

## 24. Template-builder review

Draft builder with metadata, category-grouped items, required/optional, responsibility hints, anchor+offset date rules, keyboard move-up/down reorder (no drag-only requirement), batched save, publish confirmation, version chain, edit-as-new-version, org-category manager. A coordinator can build a usable template without documentation.

## 25. Custom-requirement review

Title-first fast create (+ category default, "add & add another"), optional enrichment on the detail page, duplicate-title advisory (normalized), server + client validation, success feedback, correct category placement (E2E-verified). Practical create time is seconds.

## 26. Project-overview integration

Overview requirement panel uses only real configuration data: total, need-attention, unassigned, without-dates, not-applicable, category counts, next upcoming date, "Setup progress" bar (labeled as setup, derived from configured share), deep-filtered CTA; the setup checklist's "Add closeout requirements" step is activated. No submission/approval/rejection/readiness/risk metrics anywhere (E2E asserts absence).

## 27. Search, pagination, ordering, and scale

`test:phase6-scale` seeds 2,000 requirements and proves two full non-overlapping 200-row pages with stable `(category_sort, sort_order, id)` cursoring, title search isolating one row, a full needs-attention page, summary totals matching the live register, an atomic 200-row bulk update, and summary/search within the local latency budget — all rolled back. Trigram GIN + composite register index back the query paths; no N+1 in the readers (single grouped query + summary aggregate).

## 28. Concurrency

`updated_at` optimistic-concurrency tokens on template meta, item saves, publish, and every requirement mutation; stale tokens raise `P0001` mapped to a friendly reconcile message with a reload path (Phase 5D pattern). Apply idempotency serializes via the partial unique index. One integrity gap: an empty-payload update bumps the token with no change and no audit (P6C-001), which can churn other editors' tokens.

## 29. Commercial-journey review

- **J1 first register:** empty state sells the scope → apply (choose → preview with honest skip counts → resolve roles → confirm) → useful register with attention guidance. Clear, fast, no training needed.
- **J2 template creation:** create → add/order items → publish (confirmation) → apply; version locks correctly.
- **J3 custom requirement:** title-first, lands in the right category with "Custom requirement" provenance.
- **J4 reuse:** re-apply reports 0 added; new version leaves the prior project unchanged.
- **J5 access:** owner all; unassigned member gets a non-enumerating not-found; assigned reviewer read-only; suspended/removed denied. All reproduced.

The system saves real administrative effort versus spreadsheets and feels worth paying for.

## 30. Premium visual review

Reviewed the 35 Codex captures plus independently regenerated captures. Register (light/dark/tablet/Pixel/iPhone), needs-attention, not-applicable, bulk-selected, add flow, long title, empty, requirement detail (light/dark/iPhone), N/A confirm, stale-conflict, not-found, template library (+no-results), builder (light/dark/tablet), version chain, apply flow (choose/preview desktop-dark/Pixel/iPhone), overview panel: all exhibit consistent surface hierarchy, IBM Plex typography, engineered-blue system, quiet status ink, tabular numerals, human breadcrumbs (template name, not id — fixed in 6B), and the corrected Keystone Fold logo. Dark mode is fully realized. No generic-checklist look, spreadsheet clutter, excessive borders, raw technical values, or fake metrics. Genuinely premium.

## 31. Accessibility review

`test:a11y` passes across seven profiles in light and dark (register, templates, apply flow scanned). Manual review confirms labelled controls with `htmlFor`/`id` associations, sr-only table selection labels, keyboard reorder alternative in the builder, AlertDialog confirmations, focus management, status via icon+text, 44px targets, reduced-motion honored. No drag-only requirement. One minor UX note (P6C-003).

## 32. Responsive review

Register/library/apply verified desktop→tablet→Pixel→iPhone via captures and the seven-profile E2E; the register table becomes cards below `md`, the bulk bar is non-sticky on phones, long titles truncate with tooltips, no horizontal document clipping, dialogs behave on small viewports. No desktop-only workflow.

## 33. Testing review

Independently reproduced: `test` 44 files/181; `test:db` 11 pgTAP files/290 assertions + 5 live; `test:e2e` 396 passed / 143 skipped / 0 failed across seven profiles (13.6m clean run after clearing a stray port-3000 process); `test:a11y` green; `test:phase6-scale` green at 2,000; `server-only`, `live-security`, `production-probe` green. pgTAP uses constrained `authenticated` roles (not service-role) for isolation assertions; parity derives the two matrices from independent sources; immutability/idempotency/cross-tenant assertions are substantive (not page-load-only). The 143 skips are the documented per-profile intentional skips (desktop-only keyboard journeys, run-once census/mutation tests) — justified. No meaningless/broad-snapshot tests observed.

## 34. SEO, metadata, and privacy boundary

`(app)` layout sets `robots: { index: false, follow: false }`, covering `/templates`, `/templates/[id]`, and all `/projects/[id]/requirements*` routes. `production-probe` confirms private-route behavior, canonical metadata, unique-nonce CSP, security headers, `/design` 404 in production mode, and zero health-request audit writes. No public SEO/marketing page introduced; no template/requirement names leak through public metadata. Marketing terminology remains recorded in `commercial-readiness.md` only.

## 35. Starter-template content review

The starter (`Standard Commercial Closeout - Starter`, ~39 items) covers O&M manuals, warranties, as-builts, permits/inspections (incl. CO), test & commissioning, training, attic stock, lien waivers & financial, and general (closeout letter, keys, final cleaning). Terminology is industry-standard and neutral; optional items are flagged; no completeness guarantee or contractual/legal assertion is made; the "verify against your contract documents… does not provide legal advice" disclaimer appears on the template, the library, and the apply flow. **Classification: Safe for development seed data; safe for production with the disclaimer, with founder/construction-professional review recommended before production exposure** (aligns with ROD-2). Not a Phase 7 blocker; not a Phase 6D blocker.

## 36. Documentation review

`phase-6-implementation-progress.md` and `phase-6-exit-review.md` match reality; deviations disclosed (server-rendered house style, single-dialog bulk confirm, deferred category-archive UI, `.env.local` local-dev copy). Lifecycle/permissions/RPC/audit docs match code. No stale stored-`not_assigned` language remains in `docs/requirements/`. Screenshot index present. Commands match scripts. Scale claims reproducible. Minor: exit review's "~25 functions" understates the ~30 actual (P6C-005, LOW).

## 37. Git review

Logical commits, no unrelated refactors, no secrets, no build artifacts, no migration rewrites, no Phase 5/5E regression, Phase 6A docs preserved, generated types committed per policy, worktree clean before this audit file.

## 38. Findings summary

| ID | Severity | Area | Title | Phase 7 blocker | Owner |
|---|---|---|---|---|---|
| P6C-001 | MEDIUM | Application authz / concurrency | Read-only viewer can perform a silent, unaudited no-op `updated_at` write via empty update payload | No | Backend |
| P6C-002 | LOW | Feature completeness | `reorder_project_requirements` RPC has no register UI entry point | No | Frontend |
| P6C-003 | LOW | UX / a11y | N/A confirmation opens before the required Reason is validated client-side | No | Frontend |
| P6C-004 | OBSERVATION | Phase 5 carryover | Overview internal-team panel lists a suspended member | No | Backend (Phase 5) |
| P6C-005 | LOW | Documentation | Exit review "~25 functions" understates the ~30 actual | No | Docs |
| P6C-006 | DEFERRED | Starter content | Founder/construction-professional review before production | No | Founder |

## 39. Detailed findings

### P6C-001 — MEDIUM — Read-only viewer performs a silent, unaudited no-op write

- **Area:** Application authorization / optimistic concurrency.
- **Evidence:** As a project `viewer` (only `requirement.view`), `public.update_project_requirement(id, current_updated_at, '{}'::jsonb)` **succeeds** and returns a new `updated_at` (probed: `2026-07-23 12:54:48.029272+00` → `12:56:49.661585+00`); a follow-up count shows **0** audit rows for the touch. General-field, responsibility, and N/A edits by the same viewer correctly deny (`42501`).
- **Files:** `supabase/migrations/0024_project_requirements.sql`, `update_project_requirement` (permission gate requires only `requirement.view`; the `manage`/`assign`/`set_dates` escalations are skipped when the payload has no corresponding keys, and the trailing `UPDATE ... SET (all unchanged)` still fires the `set_updated_at` trigger).
- **Specification violated:** least-privilege (Reviewer/Viewer are read-only, [phase-6-permissions-and-rls.md §2](./phase-6-permissions-and-rls.md)); "every sensitive mutation … blocking audit" ([phase-6-audit-events.md](./phase-6-audit-events.md)).
- **Failure scenario:** a read-only viewer (or any client replaying an empty payload) repeatedly bumps `updated_at`, invalidating coordinators' in-flight edit forms (stale-conflict `P0001`) — a low-effort editing-denial/griefing vector — with no audit trail and no data change.
- **Customer impact:** intermittent, unexplained "someone else updated this" errors during legitimate editing; no data corruption or exposure.
- **Commercial impact:** erodes trust in concurrency handling; a read-only role that can write at all is a credibility risk in security review.
- **Exact remediation:** in `update_project_requirement`, after computing changed fields, if there are **no** general fields, no responsibility change, and no due-date change, return early without an UPDATE (raise `22023 'no changes provided'` or no-op return the existing token) — and require at least one of `requirement.manage/assign/set_dates` before any write. Ship as a new append-only migration (`0027`) redefining the function; do not edit `0024`.
- **Tests required:** pgTAP — assigned viewer empty-payload update denied/no-op with no `updated_at` change and 0 audit rows; coordinator empty payload is a no-op (no token churn); existing field/responsibility/date paths unchanged.
- **Visual verification:** none.
- **Blocks Phase 7:** No.
- **Owner:** Backend.

### P6C-002 — LOW — Orphaned reorder RPC without register UI

- **Evidence:** `reorder_project_requirements` is implemented, granted to `authenticated`, and audited (`requirement.reordered`), but the register (`apps/web/app/(app)/projects/[projectId]/requirements/page.tsx`) has no reorder control (rows order by category then `sort_order`); no server action calls it.
- **Specification:** [routes-and-workflows.md §3] lists reorder among register bulk/ordering affordances.
- **Impact:** minor feature gap; users cannot manually reorder within a category (template order + creation order govern). No security impact.
- **Remediation:** either add a keyboard-accessible reorder affordance + server action wired to the RPC, or record the deferral explicitly in the exit review. **Tests:** E2E reorder if implemented. **Blocks Phase 7:** No. **Owner:** Frontend.

### P6C-003 — LOW — N/A reason not validated before the confirmation dialog

- **Evidence:** on the requirement detail, the required "Reason" field sits in the Register-actions panel; the `ConfirmAction` AlertDialog opens on button click and submits the form on confirm; an empty reason is caught only server-side (`22023 'a reason between 3 and 200 characters is required'` → error redirect) rather than by inline client validation.
- **Impact:** a user can confirm N/A with no reason and bounce off a server error; recoverable but not premium.
- **Remediation:** mark the reason input `required`/`minlength=3` and block dialog confirm until valid, or move the reason inside the dialog. **Tests:** component/E2E. **Blocks Phase 7:** No. **Owner:** Frontend.

### P6C-004 — OBSERVATION — Suspended member shown in overview team panel

- **Evidence:** overview "Internal team" lists "Sam Suspended · Internal Reviewer"; `get_project_overview` filters `project_members.status='active'` but not the underlying `organization_memberships.status`. Pre-existing Phase 5 behavior, surfaced (not caused) by Phase 6.
- **Impact:** cosmetic; a suspended member appears assigned though RLS correctly denies them access.
- **Remediation:** join membership status in `get_project_overview` (Phase 5 hardening, out of Phase 6 scope). **Blocks Phase 7:** No. **Owner:** Backend (Phase 5).

### P6C-005 — LOW — Function-count imprecision in exit review

- **Evidence:** exit review says "~25 SECURITY DEFINER functions"; actual census ≈ 30 (8/12/9/4 across `0022`–`0025`, incl. two redefined helpers).
- **Remediation:** correct the figure. **Blocks Phase 7:** No. **Owner:** Docs.

### P6C-006 — DEFERRED — Starter-template content review

See §35. Safe for production with the shipped disclaimer; founder/construction-professional review recommended before production exposure. Not a Phase 6D or Phase 7 blocker.

## 40. Deferred items confirmed

- P6C-006 starter-content professional review (ROD-2).
- Production-scale (real-tenancy) load testing beyond the deterministic 2,000-row local probe.
- CSV template import (ROD-3) — correctly not built.
- Category rename/reorder/archive **UI** (RPCs exist; UI deferred, disclosed).
- `.env.local` local-dev convenience copy (gitignored, disclosed).

## 41. Validation commands and actual results

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed (+ boundaries) |
| `pnpm typecheck` | Passed, 15/15 |
| `pnpm test` | Passed, 44 files / 181 |
| `pnpm build` | Passed, 15/15 |
| `pnpm test:server-only` | Passed |
| `pnpm db:reset` | Passed through `0026` + seed |
| `pnpm db:types` | Deterministic (identical SHA-256 ×2, no diff) |
| `pnpm db:lint` | Passed (no schema errors) |
| `pnpm db:validate` | Passed (Phase 4/5/6 allowlist; later tables forbidden) |
| `pnpm test:db` | Passed, 11 pgTAP / 290 + 5 live |
| `pnpm test:phase6-scale` | Passed at 2,000; rolled back |
| `pnpm test:e2e` | Passed, 396 / 143 skipped / 0 failed (clean run after clearing a stray port-3000 node process; an initial run failed only because that process blocked the harness bind — environment, not code) |
| `pnpm test:a11y` | Passed |
| `pnpm test:live-security` | Passed |
| `pnpm test:production-probe` | Passed |
| `pnpm capture:phase6` | Passed (independently regenerated) |
| Targeted SQL probes | cross-tenant denied; published immutable; idempotent re-apply; forged responsibility rejected; archived-project blocked; bulk 201 capped; anon 0 grants; functions `postgres`/`search_path=''`/no anon exec; **P6C-001 reproduced** |

Codex's reported validation was independently reproduced (the single E2E "failure" was a local port conflict, resolved and re-run green).

## 42. Phase 6D remediation order

1. **Authorization/concurrency:** P6C-001 (empty-payload no-op write; new migration `0027`).
2. **Commercial workflow / completeness:** P6C-002 (register reorder — implement or formally defer).
3. **UX/accessibility:** P6C-003 (N/A reason inline validation).
4. **Documentation:** P6C-005 (function count); note P6C-004 for Phase 5 hardening backlog.
5. **Deferred production-readiness:** P6C-006 (starter-content review) — founder track.

(No cross-tenant, snapshot, lifecycle, or template-immutability findings to precede these.)

## 43. Final checklist

Confirmed unless noted:

- ✅ Exactly four approved tables exist
- ✅ Migrations 0022–0026 are append-only
- ✅ Migrations 0000–0021 are untouched
- ✅ Forced RLS on all four tables
- ✅ Anonymous access denied (zero grants)
- ✅ Cross-tenant access denied
- ✅ Assigned-project access enforced
- ✅ Suspended and removed members denied
- ✅ Removed assignment revokes access
- ✅ TypeScript and SQL permissions match (independent parity)
- ✅ Published templates immutable
- ✅ Template items immutable after publication
- ✅ New template versions work
- ✅ Cloning creates a new family
- ✅ Applying a template creates snapshots
- ✅ Later template edits do not rewrite projects
- ✅ Template application atomic
- ✅ Template application idempotent
- ✅ Stable item-key dedupe works
- ✅ Requirement lifecycle is only active/N-A
- ✅ Archive is independent of status
- ✅ Assignment state is derived
- ✅ Responsibility IDs are project-scoped
- ✅ Stale responsibility is visible (not silently removed)
- ✅ Date-only behavior is timezone safe
- ✅ Bulk operations cap at 200
- ✅ Bulk operations atomic
- ✅ Audit events immutable and redacted
- ✅ No hard-delete UI exists
- ✅ No Phase 7+ entities exist
- ✅ Requirement register is commercially usable
- ✅ Template library is first-class
- ✅ Builder usable without documentation
- ✅ Overview metrics are real
- ✅ No fake metrics exist
- ✅ 2,000-row behavior credible
- ✅ Mobile/tablet behavior intentional
- ✅ Accessibility foundation credible
- ✅ Phase 5E branding preserved
- ✅ Corrected Keystone Fold logo active
- ✅ Private routes noindex
- ✅ No private metadata leakage
- ✅ CSP remains nonce-based
- ✅ `/design` production-inaccessible
- ✅ No secrets committed
- ✅ Git history clean
- ⚠️ Read-only role cannot write — **partial** (P6C-001: empty-payload no-op write reaches a viewer; fix in 6D)
