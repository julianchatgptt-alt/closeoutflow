# Phase 6D requirements security and audit remediation

> **Status:** Complete.
> **Date:** 2026-07-23.
> **Branch:** `codex/phase-6d-requirements-remediation`.
> **Source audit:** [phase-6c-audit.md](./phase-6c-audit.md), preserved byte-for-byte at SHA-256 `8CC9C4AD2E0487D4A5E36169BB471A7181250A8D4AF0E44EA1D2FAD7C70C16B6`.

## Scope and outcome

Phase 6D closes the one MEDIUM and three LOW Phase 6C findings, resolves the suspended-membership presentation observation, and records the deferred starter-content review. It adds no Phase 7 tables or behavior. Requirement, submission, document, review, and approval remain separate; RLS and the `packages/authz` permission model remain deny-by-default; audit remains immutable and distinct from logs/analytics; AI remains suggestion-only.

The remediation is append-only at the database boundary:

- `0027_phase_6d_requirement_update_hardening.sql`
- `0028_phase_6d_ordering_and_overview_hardening.sql`

Migrations `0000`–`0026` were not edited.

## Finding remediation

### P6C-001 — empty update write

- **Finding ID:** P6C-001
- **Severity:** MEDIUM
- **Root cause:** `update_project_requirement` reached an unconditional `UPDATE` after only `requirement.view`; an empty object did not trigger field-group authorization.
- **Files changed:** `supabase/migrations/0027_phase_6d_requirement_update_hardening.sql`, `supabase/tests/0011_phase_6d_remediation.test.sql`, `packages/db/src/types.generated.ts`, and the Phase 6 database-reference docs.
- **Migration:** `0027_phase_6d_requirement_update_hardening.sql`.
- **Exact remediation:** Field groups are authorized before mutation, mixed payloads require every represented permission, unknown keys reject, and authorized empty/same-value payloads return the existing token without an update or audit.
- **Permission impact:** Viewer and Internal Reviewer can no longer invoke the update mutation with `{}`; manage/assign/set-dates permissions remain independently enforced.
- **Security impact:** Removes a least-privilege mutation path and prevents unaudited optimistic-concurrency churn without broadening any grant.
- **User impact:** Authorized no-op saves no longer make another editor's token stale; real edits behave as before.
- **Tests added:** Constrained-role pgTAP coverage for empty, same-value, general, responsibility, date, mixed, unknown, stale, tenant/assignment, suspended-membership, and exact-audit behavior.
- **Validation result:** 32/32 Phase 6D pgTAP assertions pass; the full database suite passes 322 assertions plus five live tests.
- **Status:** Resolved.
- **Remaining risk:** None repository-controlled.

`update_project_requirement` previously authorized only `requirement.view` before reaching an unconditional `UPDATE`. An empty JSON object therefore skipped every field-group escalation, fired `set_updated_at`, invalidated legitimate concurrency tokens, and wrote no audit event.

Migration `0027` now:

- requires `requirement.manage`, `requirement.assign`, and/or `requirement.set_dates` according to every supplied field group before any mutation;
- requires every permission represented by a mixed payload;
- denies an empty payload from assigned Viewer and Internal Reviewer roles;
- permits an empty object only for an actor with at least one requirement-write capability and returns the existing `updated_at`;
- treats authorized same-value payloads as true no-ops;
- rejects non-object and unknown-key payloads;
- preserves title/category/reference validation, tenant/project scoping, archived guards, and the `P0001` optimistic-concurrency contract;
- updates and audits only values that actually changed.

pgTAP verifies Viewer/Reviewer denial, zero token churn, zero audit rows for authorized no-ops, all field groups, mixed payload behavior, unknown-key rejection, stale-token rejection, and three granular audit events for a real three-group mutation.

### P6C-002 — unused broad reorder mutation

- **Finding ID:** P6C-002
- **Severity:** LOW
- **Root cause:** The exposed array-based reorder RPC had no caller even though the approved design required an accessible ordering workflow.
- **Files changed:** `supabase/migrations/0028_phase_6d_ordering_and_overview_hardening.sql`, `supabase/tests/0011_phase_6d_remediation.test.sql`, `packages/db/src/types.generated.ts`, `apps/web/actions/project-requirements.ts`, the requirement-register page, `apps/web/e2e/phase-6.spec.ts`, and Phase 6 workflow/audit/data docs.
- **Migration:** `0028_phase_6d_ordering_and_overview_hardening.sql`.
- **Exact remediation:** Revoke/drop the broad function and replace it with one-step, same-category, concurrency-checked `move_project_requirement`.
- **Permission impact:** Only callers with `requirement.manage` can move a row; anonymous users have no execute grant.
- **Security impact:** Eliminates the unnecessary client-supplied UUID-array surface and narrows authority to one scoped adjacent move.
- **User impact:** Authorized users receive explicit keyboard/touch Move up/down controls where adjacency is unambiguous.
- **Tests added:** pgTAP for function/grant inventory, authorization, stale tokens, category boundaries, tenant isolation, ordering, and audit; Chromium mutation journey plus all-profile register/accessibility coverage.
- **Validation result:** Focused ordering journey passes; the full cross-browser suite passes 397 tests with 149 intentional skips and zero failures.
- **Status:** Resolved.
- **Remaining risk:** None repository-controlled.

The approved Phase 6 register design includes keyboard-accessible ordering. The prior `reorder_project_requirements(project, category, uuid[])` function was granted but had no application caller and accepted a broad client-provided array.

Migration `0028` revokes and drops that function, then adds `move_project_requirement(requirement, expected_updated_at, direction)`:

- one adjacent step (`up` or `down`) within the requirement's existing project/category;
- `requirement.manage` required in both application authorization and PostgreSQL;
- archived project/requirement guards;
- optimistic concurrency on the moved row;
- no-op at category boundaries;
- one blocking `requirement.reordered` event only when order changes;
- no anonymous execute grant and no client-supplied organization/category authority.

The register exposes labelled Move up/down controls on desktop and visible 44px controls on mobile. Controls appear only in the first, unfiltered, active-register view so adjacency is unambiguous. Component/browser and pgTAP coverage verify authorization, tenant isolation, concurrency, ordering, and audit.

### P6C-003 — N/A reason preflight

- **Finding ID:** P6C-003
- **Severity:** LOW
- **Root cause:** The 3–200 character reason rule existed only in the server action and PostgreSQL function.
- **Files changed:** `apps/web/components/requirements/not-applicable-action.tsx`, its component test, the requirement-detail page, and `apps/web/e2e/phase-6.spec.ts`.
- **Migration:** None; server/database validation was already correct.
- **Exact remediation:** Add a dedicated client form that trims and validates before opening the existing confirmation while retaining server/database enforcement.
- **Permission impact:** None.
- **Security impact:** No authority moved client-side; client validation is usability-only defense in depth.
- **User impact:** Invalid reasons produce an immediate associated inline error and focus recovery instead of a postback.
- **Tests added:** Three component tests (min/max/valid confirmation plus axe) and cross-browser invalid/valid confirmation coverage.
- **Validation result:** Component tests pass 3/3; dedicated accessibility passes 161/161; the full browser suite is green.
- **Status:** Resolved.
- **Remaining risk:** Automated checks do not replace customer assistive-technology research.

The requirement-detail N/A action now validates the trimmed reason against the same 3–200 character bounds enforced by Zod and PostgreSQL. Invalid input:

- does not open the confirmation dialog;
- renders an associated inline `role="alert"` error;
- sets `aria-invalid`/`aria-describedby`;
- returns focus to the reason field.

Valid input opens the existing destructive confirmation. The server action and database function still revalidate, so client validation is usability defense rather than an authorization or integrity boundary.

### P6C-004 — suspended member presentation

- **Finding ID:** P6C-004
- **Severity:** OBSERVATION
- **Root cause:** The Phase 5 overview reader filtered active `project_members` but did not also require an active organization membership for the active-team presentation.
- **Files changed:** `supabase/migrations/0028_phase_6d_ordering_and_overview_hardening.sql`, `supabase/tests/0011_phase_6d_remediation.test.sql`, and `apps/web/e2e/phase-6.spec.ts`.
- **Migration:** `0028_phase_6d_ordering_and_overview_hardening.sql`.
- **Exact remediation:** Filter the active overview/setup roster through active organization membership without deleting the historical project-member row.
- **Permission impact:** None; suspended-member authorization was already denied.
- **Security impact:** Presentation now matches the existing denial model and cannot imply that a suspended person is available.
- **User impact:** Suspended people disappear from active team/setup choices while historical relationships remain intact.
- **Tests added:** Targeted constrained-role overview assertion and browser assertion against the suspended seed fixture.
- **Validation result:** Phase 6D pgTAP, full DB, and full browser suites pass.
- **Status:** Resolved.
- **Remaining risk:** Historical presentation in future audit/timeline features must continue to label state honestly.

`get_project_overview` now requires both `project_members.status='active'` and `organization_memberships.status='active'` for the active team roster and setup-team calculation. The historical project assignment remains stored; no membership, RLS, or audit row is weakened or deleted. pgTAP and browser regression checks confirm the suspended fixture is absent from active presentation while security denial remains covered by the existing suites.

### P6C-005 — function inventory accuracy

- **Finding ID:** P6C-005
- **Severity:** LOW
- **Root cause:** Exit evidence used an approximate function count that had drifted from the implemented schema.
- **Files changed:** `docs/requirements/phase-6-exit-review.md`, this remediation record, and related Phase 6 function-reference docs.
- **Migration:** None.
- **Exact remediation:** Replace the approximation with the stable 32-function Phase 6 census and document the separately redefined Phase 5 overview reader.
- **Permission impact:** None.
- **Security impact:** Improves auditability; no runtime behavior or grant changed.
- **User impact:** None.
- **Tests added:** Existing function/grant census assertions were extended for the removed and replacement reorder functions.
- **Validation result:** Documentation count reconciles with the passing pgTAP function inventory and generated types.
- **Status:** Resolved.
- **Remaining risk:** Future migrations must update the census or point to an automated inventory.

The exit review no longer uses an approximate count. The current Phase 6 inventory is exactly 32 SECURITY DEFINER feature/helper functions:

- 6 category/default functions;
- 9 template/version/preview functions;
- 7 project-requirement lifecycle/configuration functions (including the new move function);
- 4 apply/bulk/register-reader functions;
- 6 permission/helper/guard functions introduced or redefined for Phase 6.

The Phase 5 `get_project_overview` function redefined by `0028` is documented separately as the P6C-004 carryover fix and is not included in the Phase 6 feature count.

### P6C-006 — starter-template review

- **Finding ID:** P6C-006
- **Severity:** DEFERRED
- **Root cause:** Construction-professional/founder content approval is outside repository-local technical validation.
- **Files changed:** This remediation record, the implementation-progress record, and the exit review.
- **Migration:** None.
- **Exact remediation:** Preserve the development-safe starter and shipped contract-verification/not-legal-advice disclaimer; explicitly record pre-production content review.
- **Permission impact:** None.
- **Security impact:** None.
- **User impact:** The starter remains available without being represented as authoritative legal or contractual guidance.
- **Tests added:** Existing browser/database seed coverage continues to assert the disclaimer and deterministic starter behavior.
- **Validation result:** Starter seed/idempotency and disclaimer checks remain green.
- **Status:** Deferred founder-track review; non-blocking for repository completion.
- **Remaining risk:** Content should not be exposed as production guidance until reviewed by the founder or a qualified construction professional.

The starter content remains clearly synthetic/development-safe and continues to display the shipped warning to verify every requirement against contract documents. It makes no legal-validity claim and is not legal advice. Founder and construction-professional review is recommended before production exposure; this review is a non-blocking production-readiness action, not a local Phase 6 correctness or Phase 7 gate.

## Files and behavior affected

- Database: append-only migrations `0027`/`0028`, generated public-schema types, and `0011_phase_6d_remediation.test.sql`.
- Application: requirement move server action, register ordering controls, and the dedicated N/A preflight component.
- Browser coverage: Phase 6 ordering, N/A invalid/valid confirmation flow, and suspended-team exclusion.
- Documentation: Phase 6 permissions/data/audit/workflow references, implementation progress, and exit review.

No business-domain table, storage bucket, secure external link, upload, submission, document, review, approval, notification, package, portal, billing, integration, AI, marketing, or SEO surface was added.

## Security and integrity confirmation

- Forced RLS and tenant/project access helpers are unchanged.
- Viewer/Reviewer remain read-only at the application and database layers.
- Service-role credentials remain server-only and are not used by the new application path.
- Audit writes remain blocking and immutable; no-op calls write nothing rather than a misleading event.
- The removed RPC is absent from generated types and grants.
- N/A remains distinct from waiver and retains its reason/audit semantics.
- Ordering changes only `sort_order`; it cannot mutate lifecycle, assignment, dates, provenance, or content.
- Historical suspended assignments are preserved while active presentation is corrected.

## Validation record

| Gate | Result |
| --- | --- |
| Install/static/unit/build | Frozen install, format, lint/boundaries, 15-workspace typecheck/build, 45 files / 184 unit tests, and server-only probes pass |
| Database lifecycle | Start/reset through `0028`, generated types, schema lint (zero findings), migration validator, and deterministic seed pass |
| Generated types | Consecutive `db:types` runs are identical at SHA-256 `4CCB5B263B3A01541D490D86F5A30DBEAE872DCB4CA5AB3E1C1EBA71BC5144DF` |
| Database tests | 12 pgTAP files / 322 assertions plus five live tests pass; targeted Phase 6D file passes 32/32 |
| Component tests | N/A preflight passes 3/3, including axe coverage |
| Scale | 2,000-requirement cursor/search/summary/bulk probe passes and rolls back |
| Cross-browser | 397 passed / 149 intentional skips / zero failed across seven profiles |
| Accessibility | 161/161 dedicated axe/Playwright cases pass |
| Live security | Audit UPDATE/DELETE/TRUNCATE remain blocked and the audit schema remains unavailable through PostgREST |
| Production-like probe | Protected routes, canonical metadata, hostile redirects, unique-nonce CSP, security headers, request IDs, and zero health audit writes pass |
| Visual review | Only affected views recaptured: desktop register ordering and desktop N/A inline validation; both reviewed with no blocker |
| Repository hygiene | Local secret scan and `git diff --check` pass; source audit hash remains unchanged |

## Remaining risk / founder action

No remaining repository-controlled Phase 6C MEDIUM or LOW finding is open. The only founder-track action is the already-disclosed, non-blocking construction-professional review of starter-template content before production exposure. Production-scale real-tenancy load testing and assistive-technology/customer usability research remain launch-readiness activities rather than Phase 6 defects.
