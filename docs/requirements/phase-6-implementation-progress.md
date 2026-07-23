# Phase 6 implementation progress

> **Status:** Phase 6B implementation and Phase 6D audit remediation complete. Closing evidence and the full validation record are in [phase-6-exit-review.md](./phase-6-exit-review.md); finding-by-finding evidence is in [phase-6d-remediation.md](./phase-6d-remediation.md).
> **Branches:** Phase 6B `codex/phase-6b-requirements`; Phase 6D `codex/phase-6d-requirements-remediation`. Migrations `0022`–`0028` are append-only; `0000`–`0021` remain untouched.

## Task record (plan T0–T20)

| Task | Result |
| --- | --- |
| T0 review/baseline/branch | Phase 6A docs verified as the only pending changes and committed first (`docs: define Phase 6 requirements foundation`); branch created from the completed Phase 5E head; Keystone Fold assets confirmed active. |
| T1 authz additions | 11 permissions added to `packages/authz` (`template.view/manage/publish/archive`, `requirement.view/manage/assign/set_dates/apply_template/set_not_applicable/archive`); org + project matrices extended; archived projects allow `requirement.view` only; full Vitest matrix incl. coordinator-full/reviewer-read/unknown-deny cases. |
| T2 validator | `scripts/validate-migrations.mjs` allowlists exactly the 4 Phase 6 tables and now requires their presence; `requirements`/`submissions`/`documents`/`document_versions`/`reviews`/`packages`/etc. remain forbidden with red-path tests. |
| T3 `0022` categories + permission parity | `requirement_categories` (forced RLS, active-name uniqueness, ordering) + category RPCs + `ensure_requirement_defaults` (9 seeded categories, idempotent, single seeded audit event); `has_org_permission`/`project_permission` extended — the authz⇔SQL parity harness now parses `0022`. |
| T4 `0023` templates | `requirement_templates` (row-per-version: `family_id`+`version`), `requirement_template_items` (family-stable `item_key`); draft-only editing via batched `save_template_items`; publish/version/clone/family-archive/restore; `get_template_preview` with duplicate flags; starter template (~39 items) seeded idempotently with the verify-against-contract disclaimer. |
| T5 `0024` project requirements | `project_requirements` snapshot table — stored lifecycle **`active`/`not_applicable_approved` only**, independent `archived_at`, three responsibility FKs to Phase 5 rows, date-only due dates, provenance columns, apply-idempotency partial unique, consistency triggers; create/update/N-A/reverse/archive/restore/reorder RPCs with granular audit and `P0001` stale-conflict codes. |
| T6 `0025` apply/bulk/readers | `apply_requirement_template` (atomic, `item_key`-idempotent, role-hint + anchor-date resolution), `bulk_update_project_requirements` (10 actions, all-or-nothing, 200 cap, single audit event), `search_project_requirements` (grouped cursor reader with derived stale indicators), `get_requirement_summary`. |
| T7 parity + audit | Parity harness green for every new permission; full audit catalog wired in-transaction with redaction (N/A reasons truncated to 80-char labels, no email/phone values, per-row events suppressed during apply). |
| T8 `0026` seed + pgTAP + types | Deterministic Phase 6 fixtures (template family v1 published/v2 draft, tenant-B mirror, stale-company assignment, N/A, archived, unassigned, undated, past-planned-date rows); pgTAP file `0010` adds 76 assertions (suite total 290); `types.generated.ts` regenerated, deterministic across two runs. |
| T9 server actions | `actions/requirement-templates.ts` + `actions/project-requirements.ts`: Zod → active-org/project revalidation → `can()` → RPC → friendly error mapping (incl. stale-conflict reconcile) → rate limiting (`template-mutation`, `requirement-mutation`). |
| T10 template library | `/templates` sidebar surface (ROD-4); search/archived filter; family cards with version chips; starter disclaimer; read-only framing for viewers; `/settings/templates` redirects. |
| T11 builder + versioning | Draft builder (add/edit/remove + keyboard move-up/down reorder — no drag dependency), publish confirmation, version chain pills, edit-as-new-version, clone, org-category manager, family archive/restore. |
| T12 register | Category-grouped operational register: summary chips (total/needs-attention/not-applicable), derived indicators (Unassigned, No owner, No date, Planned date passed, stale-reference chips), lean rows with provenance, URL-serialized filters, 200-row cursor paging, mobile card fallback, honest portal-deferral copy, archived read-only banner. |
| T13 apply flow | Two-screen flow (choose → preview/resolve/confirm): duplicate skip counts, optional items unchecked, role-hint resolution against active project companies, anchor-date note + fallback date, atomic confirm with honest result counts. |
| T14 detail + custom create + assignment + dates | Title-first fast create (+ add-another), requirement detail with separated Details/Responsibility/Due date/Provenance/Actions sections, three-slot assignment pickers filtered to active rows (stale current values kept visible with chips), N/A confirmation with required reason, archive/restore, stale-conflict recovery. |
| T15 bulk operations | Selection checkboxes + bulk bar (assign company/owner, set date/category/priority, N-A/reopen, remove/restore) behind an AlertDialog confirmation; all-or-nothing server call. |
| T16 overview integration | Real requirement panel (counts, needs-attention, setup-progress bar labeled as setup, next 3 upcoming dates, deep-filtered CTA); “Add closeout requirements” setup-checklist step activated; no submission/approval/readiness/risk language. |
| T17 polish | Active-organization scoping on all list queries; a11y label associations; light/dark; reduced motion; long-title truncation; no raw UUID/ISO/database terms on Phase 6 surfaces. |
| T18 validation | See exit review for the full command record, incl. the 2,000-requirement scale probe (`test:phase6-scale`). |
| T19 visual review | `capture:phase6` deterministic harness (35 captures across desktop/tablet/Pixel/iPhone × light/dark); the review found and fixed a Firefox table-cell collapse, a raw template-id breadcrumb, and a phone-hostile sticky bulk bar before closeout; reviewed evidence indexed in the exit review. |
| T20 docs + exit review | This record + [phase-6-exit-review.md](./phase-6-exit-review.md); AGENTS/CLAUDE pointers updated at T0. |

## Phase 6D audit-remediation record

The independent Phase 6C audit is preserved byte-for-byte in [phase-6c-audit.md](./phase-6c-audit.md) (SHA-256 `8CC9C4AD2E0487D4A5E36169BB471A7181250A8D4AF0E44EA1D2FAD7C70C16B6`) and was committed before remediation. Phase 6D resolved every MEDIUM/LOW finding and the suspended-team observation without creating a Phase 7 surface:

| Finding | Resolution |
| --- | --- |
| P6C-001 empty update write | Append-only `0027` redefines `update_project_requirement`: each supplied field group requires its own permission before mutation; Viewer/Reviewer empty payloads deny; authorized empty and same-value payloads return the existing token without `UPDATE` or audit; mixed payloads require every included permission; stale actual writes still fail `P0001`. |
| P6C-002 unused reorder RPC | Append-only `0028` revokes and removes the unused array reorder RPC, adds the narrower `move_project_requirement` RPC with `requirement.manage`, optimistic concurrency, project/category scope, and blocking audit, and exposes keyboard/touch Move up/down controls in the unfiltered register. |
| P6C-003 N/A validation | The detail action validates the trimmed 3–200 character reason client-side, associates inline errors accessibly, focuses the invalid field, and opens confirmation only after valid input; server/DB validation remains authoritative. |
| P6C-004 suspended team presentation | `get_project_overview` now joins only active organization memberships into the active team roster and setup calculation. The historical `project_members` row remains unchanged; RLS behavior is unchanged. |
| P6C-005 function census | Exit evidence now records the exact current 32-function Phase 6 feature/helper inventory rather than an approximate count. |
| P6C-006 starter content | Remains intentionally non-blocking for local completion: content is development-safe, carries the contract-verification/not-legal-advice disclaimer, and still requires founder/construction-professional review before production exposure. |

Phase 6D adds `supabase/tests/0011_phase_6d_remediation.test.sql` (32 pgTAP assertions), component tests for N/A preflight validation, and browser coverage for ordering, N/A validation, and suspended-team exclusion. Generated database types replace the removed broad RPC with the real `move_project_requirement` signature.

## Approved deviations / notes (recorded, not hidden)

- **Implementation style follows the shipped Phase 5B house patterns** (server-rendered pages + progressive-enhancement forms + dialog confirmations) rather than the sheet-heavy interaction sketches in the 6A routes doc; every specified capability, state, and honesty rule is preserved. Register row-level quick actions live on the requirement detail page; the register handles mass changes through the bulk bar.
- **Bulk confirmation** is a single AlertDialog (action + count explained in copy) rather than a typed-count input; destructive bulk actions remain soft and reversible.
- **Category archive/restore RPCs** exist at the DB layer with Owner/Admin gating; the Phase 6 UI exposes category create/list (rename/reorder/archive UI deferred to first customer need — functions and audit are in place).
- **Requirement audit excerpt** on the detail page links to the existing project activity feed rather than embedding a filtered timeline (no new event system either way).
- **Requirement ordering** uses explicit adjacent Move up/down controls instead of drag-and-drop. It is keyboard/touch accessible, concurrency-checked, and deliberately hidden in filtered/archived/paginated views where "adjacent" would be ambiguous.
- **`.env.local` note:** local `next dev` requires the root env values (the repo stores them at the root; Next reads the app directory). A gitignored copy in `apps/web/` is used for local dev; the Playwright harness injects env explicitly and is unaffected.
