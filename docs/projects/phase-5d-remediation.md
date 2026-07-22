# Phase 5D remediation

> Status: complete. Date: 2026-07-21. Implementation commits: `825b279`, `aded4e8`.

Phase 5D resolves every actionable finding in the independent Phase 5C audit without adding Phase 6 data or workflows. The original audit remains unchanged in `phase-5c-audit.md`.

## Outcome

- All 5 MEDIUM findings are resolved.
- All 8 LOW findings are resolved; P5C-L4 required verification rather than a new UI change.
- Both observations are reviewed and closed with durable evidence.
- Migration `0021_phase_5d_stale_conflict_codes.sql` is the only database change. Migrations `0000`–`0020` were not edited.
- Phase 5 tenant isolation, forced RLS, audited mutations, service-role boundaries, nonce CSP, and deny-by-default authorization remain intact.

## Finding record

### P5C-M1 — MEDIUM — independent authz/RLS parity

- **Root cause:** TypeScript and SQL permission tests asserted separately and could drift together without a live cross-diff.
- **Files changed:** `packages/authz/src/__tests__/authz.test.ts`, `packages/authz/src/__tests__/sql-parity.test.ts`, `scripts/phase-5-authz-rls-parity.live.test.ts`, `scripts/run-db-tests.mjs`, `vitest.live.config.ts`, `package.json`.
- **Migration:** none.
- **Exact remediation:** added an independent live role×permission matrix that compares `authz.can` with SQL behavior and exercises owner/admin, assigned roles, inactive memberships, removed assignments, archived projects, unknown roles, unknown permissions, and forged/cross-tenant identifiers. Static coverage also fails when SQL and TypeScript permission enumerations differ.
- **Security impact:** prevents silent application/database authorization drift; PostgreSQL RLS remains final authority.
- **Customer impact:** reduces the risk of incorrect project visibility when permissions evolve.
- **Commercial impact:** makes future permission expansion safer and independently verifiable.
- **Tests added:** five live parity/security cases plus removed-membership and enumeration assertions.
- **Visual evidence:** not visual; enforced in `pnpm test:db`.
- **Validation result:** passed, including the constrained authenticated-role matrix.
- **Resolution status:** resolved.
- **Remaining risk:** each future permission must be added to `packages/authz`, the SQL helper/policy contract, and the independent live matrix in the same change; database enforcement must remain authoritative.

### P5C-M2 — MEDIUM — human-friendly dates

- **Root cause:** Phase 5 pages rendered date-only database values directly and used ad hoc timestamp formatting.
- **Files changed:** `apps/web/lib/date-format.ts`, `apps/web/lib/date-format.test.ts`, `apps/web/components/table/cells.tsx`, project list/overview/activity pages, and contact detail.
- **Migration:** none.
- **Exact remediation:** centralized date-only and timestamp formatting; date-only fields use UTC-safe calendar parsing, timestamps accept project timezones, relative activity labels retain absolute tooltips, and invalid/missing values never render `Invalid Date`.
- **Security impact:** none; presentation-only.
- **Customer impact:** project, relationship, and activity dates are readable and do not shift across timezones.
- **Commercial impact:** removes database-style date presentation from core selling surfaces.
- **Tests added:** valid, invalid, timezone, midnight, and daylight-saving-boundary cases.
- **Visual evidence:** `friendly-dates--desktop--light`, project list, overview, settings, and contact-detail captures.
- **Validation result:** unit, browser, accessibility, and capture reviews passed.
- **Resolution status:** resolved.
- **Remaining risk:** locale remains the approved US English presentation until organization locale support is explicitly scoped.

### P5C-M3 — MEDIUM — project-name breadcrumbs

- **Root cause:** the client breadcrumb formatter treated every path segment as display text, exposing UUIDs and empty-looking separator segments.
- **Files changed:** project layout, `breadcrumb-context.tsx`, `project-breadcrumb.tsx`, `breadcrumbs.tsx`, `breadcrumbs.test.tsx`, `app-shell.tsx`.
- **Migration:** none.
- **Exact remediation:** the nested server layout resolves the project through the authorized tenant client and supplies only its name to the shell. Missing or inaccessible records use the existing non-enumerating 404 path. The UUID remains in links but never becomes the visible label; long labels truncate with their full value available through `title`.
- **Security impact:** inaccessible project names are not leaked.
- **Customer impact:** project navigation now reads `Projects / Project name / Section` with valid semantics.
- **Commercial impact:** removes the most visible implementation artifact from the project workspace.
- **Tests added:** route-independent breadcrumb construction for normal, nested, missing-context, long-name, and UUID cases; browser checks cover inaccessible and long-name routes.
- **Visual evidence:** project overview desktop/mobile, long-name overview, settings, and permission-denied captures.
- **Validation result:** unit, browser, axe, and visual review passed.
- **Resolution status:** resolved.
- **Remaining risk:** extremely narrow viewports intentionally hide earlier breadcrumb segments while preserving the current page and accessible labels.

### P5C-M4 — MEDIUM — full browser and accessibility reproduction

- **Root cause:** the audit environment did not reproduce the complete seeded authentication/browser harness.
- **Files changed:** `playwright.config.ts`, `playwright.capture.config.ts`, `apps/web/e2e/auth.setup.ts`, Phase 3/5 specs, `scripts/run-playwright.mjs`, `scripts/phase-5d.capture.spec.ts`, and package scripts.
- **Migration:** none.
- **Exact remediation:** each browser profile receives an independent seeded sign-in state; the Windows/OneDrive-safe production-build harness resets Supabase and cleans up processes; tablet portrait and landscape were added; skips remain capability-specific.
- **Security impact:** tests continue to use local-only credentials; no production credential or auth bypass was introduced.
- **Customer impact:** desktop, tablet, and mobile behaviors now have reproducible coverage.
- **Commercial impact:** responsive and accessible presentation is validated across the supported engine matrix.
- **Tests added:** seven-profile Phase 5 journey, responsive, error, duplicate, conflict, and axe assertions.
- **Visual evidence:** all 24 entries in `phase-5d-visual-evidence.md`.
- **Validation result:** E2E 257 passed / 107 intentional skips / 0 failed; accessibility 112/112 passed across Chromium, Firefox, WebKit, Pixel 7, iPhone 15, tablet portrait, and tablet landscape.
- **Resolution status:** resolved.
- **Remaining risk:** automated axe/browser tests do not replace future assistive-technology or customer usability studies.

### P5C-M5 — MEDIUM — stale-edit reconciliation

- **Root cause:** PostgreSQL `40001` is retried by PostgREST, so intentional optimistic-conflict exceptions could hang rather than return the UI’s friendly message; validation also rejected PostgreSQL offset timestamps.
- **Files changed:** project/company/contact actions, project settings, Phase 5 schemas/tests, migration `0021`, live parity/concurrency probe.
- **Migration:** `0021_phase_5d_stale_conflict_codes.sql` changes only intentional stale-write exceptions from `40001` to `P0001` with exact messages.
- **Exact remediation:** actions match exact server conflict messages, schema validation accepts offset concurrency tokens, and project settings offers a direct reload/reconcile action. No newer row is overwritten.
- **Security impact:** optimistic concurrency remains enforced in the database and cannot be bypassed by the UI.
- **Customer impact:** stale editors receive an immediate, understandable recovery path.
- **Commercial impact:** concurrent work fails safely instead of hanging or silently losing changes.
- **Tests added:** two simultaneous SQL updates, offset-token schema cases, exact action/browser conflict behavior, and pgTAP exception assertions.
- **Visual evidence:** project settings capture and browser reconcile assertion.
- **Validation result:** migration reset, pgTAP, live concurrency, unit, and browser tests passed.
- **Resolution status:** resolved.
- **Remaining risk:** conflict recovery reloads current data rather than offering a field-level merge UI; that is adequate for Phase 5 scope.

### P5C-L1 — LOW — duplicate-warning live verification

- **Root cause:** duplicate preflight existed but had not been exercised in the auditor’s live browser session.
- **Files changed:** `apps/web/e2e/phase-5.spec.ts`, capture spec/config.
- **Migration:** none.
- **Exact remediation:** added live company-name and contact-email warning assertions while confirming legitimate creation remains available.
- **Security impact:** no change; tenant-scoped server validation remains authoritative.
- **Customer impact:** reuse guidance is visible without blocking legitimate duplicates.
- **Commercial impact:** makes directory reuse obvious and reduces accidental duplication.
- **Tests added:** company and contact duplicate-warning browser assertions.
- **Visual evidence:** `company-duplicate-warning--desktop--light`.
- **Validation result:** passed in all applicable browser profiles.
- **Resolution status:** resolved.
- **Remaining risk:** suggestions are intentionally advisory; exact duplicate policy remains a human decision.

### P5C-L2 — LOW — horizontal overflow

- **Root cause:** project subnavigation and wide Phase 5 content could contribute intrinsic width beyond the desktop viewport.
- **Files changed:** `project-subnav.tsx`, Phase 5 responsive browser assertions.
- **Migration:** none.
- **Exact remediation:** constrained the sticky subnavigation to the viewport and kept intentional internal horizontal scrolling inside the navigation region; browser tests assert document width does not exceed viewport width.
- **Security impact:** none.
- **Customer impact:** pages no longer create whole-document horizontal scrolling.
- **Commercial impact:** desktop and tablet layouts feel intentional.
- **Tests added:** route/theme/viewport overflow assertions.
- **Visual evidence:** project list and project overview desktop/mobile captures.
- **Validation result:** passed across all seven profiles.
- **Resolution status:** resolved.
- **Remaining risk:** unusually long localized labels may require future locale-specific tuning.

### P5C-L3 — LOW — teammate pluralization

- **Root cause:** project cards always used the plural noun.
- **Files changed:** `apps/web/app/(app)/projects/page.tsx`, Phase 5 E2E assertions.
- **Migration:** none.
- **Exact remediation:** singular and plural labels now follow the real team count.
- **Security impact:** none.
- **Customer impact:** removes awkward copy.
- **Commercial impact:** improves perceived product care.
- **Tests added:** seeded one-teammate browser assertion.
- **Visual evidence:** `projects--mobile--light`.
- **Validation result:** passed.
- **Resolution status:** resolved.
- **Remaining risk:** none within the current English-only copy scope.

### P5C-L4 — LOW — theme-toggle placement

- **Root cause:** the audit screenshot appeared to show an earlier floating theme control.
- **Files changed:** no product change required; Phase 3 and capture tests provide current-state evidence.
- **Migration:** none.
- **Exact remediation:** reproduced the current shell and confirmed theme controls live in the account menu/preferences, not a floating application FAB.
- **Security impact:** none.
- **Customer impact:** no control obscures project content.
- **Commercial impact:** the shell retains the approved Phase 3E hierarchy.
- **Tests added:** existing theme persistence test now runs across the expanded harness; light/dark captures were regenerated.
- **Visual evidence:** projects desktop light/dark and all shell captures.
- **Validation result:** verified; no floating theme FAB exists in current application routes.
- **Resolution status:** resolved by reproduction and evidence.
- **Remaining risk:** the temporary brand mark and auth visuals remain inputs to the dedicated next visual-polish phase.

### P5C-L5 — LOW — mobile relationship/team clarity

- **Root cause:** the auditor did not reproduce the relationship dialogs and internal-team distinction on mobile.
- **Files changed:** `apps/web/e2e/phase-5.spec.ts`, capture spec/config.
- **Migration:** none.
- **Exact remediation:** added mobile assertions and captures for project companies, contacts, and internal team, including search-first reuse language and organization-role versus project-responsibility labels.
- **Security impact:** assignment actions remain server-authorized and RLS-constrained.
- **Customer impact:** mobile users can distinguish reusable directory records from internal account assignments.
- **Commercial impact:** field workflows remain understandable on phone-sized screens.
- **Tests added:** mobile relationship and team dialog assertions.
- **Visual evidence:** six desktop/mobile project-company, project-contact, and project-team captures.
- **Validation result:** passed on Pixel 7, iPhone 15, and both tablet orientations.
- **Resolution status:** resolved.
- **Remaining risk:** physical-device keyboard behavior remains a future manual usability input.

### P5C-L6 — LOW — contact-email audit redaction

- **Root cause:** the audit metadata whitelist was reviewed in code but lacked a direct value-leak assertion.
- **Files changed:** `supabase/tests/0009_phase_5d_audit_redaction.test.sql`.
- **Migration:** none.
- **Exact remediation:** pgTAP creates/updates contact data and proves contact email values are absent from `contact.*` metadata while required audit identity remains present.
- **Security impact:** adds regression coverage for audit minimization without weakening immutable audit history.
- **Customer impact:** contact email addresses are not copied into audit metadata.
- **Commercial impact:** strengthens privacy posture for customer directories.
- **Tests added:** audit whitelist and email-absence assertions.
- **Visual evidence:** not visual; pgTAP evidence.
- **Validation result:** passed within 10 pgTAP files / 214 assertions.
- **Resolution status:** resolved.
- **Remaining risk:** future audit actions must extend the whitelist deliberately and receive equivalent privacy tests.

### P5C-L7 — LOW — larger-than-seed performance

- **Root cause:** Phase 5B validation used normal seed volume only.
- **Files changed:** `scripts/phase-5-scale.sql`, `scripts/probe-phase-5-scale.mjs`, `package.json`.
- **Migration:** none; test data is transactionally rolled back.
- **Exact remediation:** added a deterministic local probe with 75 projects, 75 companies, 75 contacts, and 75 activity events; it checks pagination stability, search, tenant isolation, and query plans/timings.
- **Security impact:** constrained-role queries confirm isolation at larger local volume.
- **Customer impact:** list and overview behavior remains stable beyond demo-sized data.
- **Commercial impact:** provides an early regression baseline for realistic small-customer datasets.
- **Tests added:** `pnpm test:phase5-scale`.
- **Visual evidence:** project/directory list captures complement the query probe.
- **Validation result:** passed; search 5.208 ms, overview 1.387 ms, activity 0.428 ms in the recorded local run.
- **Resolution status:** resolved.
- **Remaining risk:** local deterministic scale is not production load testing; production telemetry and capacity testing remain later operational work.

### P5C-L8 — LOW — concurrency and duplicate UI coverage

- **Root cause:** the database guard and UI warning existed without explicit simultaneous-update and live duplicate assertions.
- **Files changed:** live parity test, migration `0021`, Phase 5 browser spec, database test runner.
- **Migration:** `0021` for reliably surfaced intentional conflicts.
- **Exact remediation:** added two concurrent `psql` update attempts proving one succeeds and one conflicts, plus live duplicate-warning assertions.
- **Security impact:** proves no silent last-write-wins path was introduced.
- **Customer impact:** conflicts and possible duplicates are actionable rather than technical or silent.
- **Commercial impact:** improves trust during multi-user project administration.
- **Tests added:** live concurrency and cross-browser duplicate/reconcile cases.
- **Visual evidence:** settings and duplicate-warning captures.
- **Validation result:** passed.
- **Resolution status:** resolved.
- **Remaining risk:** high-contention production behavior should be monitored operationally.

### P5C-O1 — OBSERVATION — generated-file and screenshot hygiene

- **Root cause:** `next-env.d.ts` referenced a development-only types path and Phase 5B screenshots were ephemeral.
- **Files changed:** `apps/web/next-env.d.ts`, capture config/spec, `phase-5d-visual-evidence.md`, package scripts.
- **Migration:** none.
- **Exact remediation:** generated types reference `.next/types/routes.d.ts`; screenshots use a deterministic external capture directory with a committed manifest and harness.
- **Security impact:** no credentials or captured auth state are committed.
- **Customer/commercial impact:** durable audit evidence without repository binary growth.
- **Tests added:** build/typecheck and deterministic 24-image capture.
- **Visual evidence:** complete manifest and external output directory.
- **Validation result:** passed.
- **Resolution status:** reviewed and closed.
- **Remaining risk:** external screenshots are machine-local; the committed command/manifest is the durable reproducibility contract.

### P5C-O2 — OBSERVATION — production nonce CSP

- **Root cause:** production CSP was correct, while local WebKit reproduction needed an explicit local/test environment signal.
- **Files changed:** `apps/web/proxy.ts`, `apps/web/proxy.test.ts`, cookie-security helper/tests, production probe, UI tokens/CSS required by WebKit native controls.
- **Migration:** none.
- **Exact remediation:** production behavior remains strict; only `APP_ENV=local|test` receives development-compatible CSP/cookie behavior. The production probe now covers tenant routes, nonce uniqueness, forbidden script directives, security headers, canonical metadata, safe redirects, `/design` 404, and zero health audit writes.
- **Security impact:** preview/staging/production retain secure cookies and strict nonce CSP; no service-role material reaches the client.
- **Customer/commercial impact:** production security stays strict while local cross-engine validation is deterministic.
- **Tests added:** CSP branch tests, cookie-security tests, expanded production probe, and WebKit coverage.
- **Visual evidence:** dark/light and WebKit browser runs.
- **Validation result:** passed.
- **Resolution status:** reviewed and closed.
- **Remaining risk:** deployed-environment header verification remains a normal release check once hosting exists.

## Validation record

| Gate | Result |
| --- | --- |
| Install, format, lint, typecheck | Passed; 15/15 packages typechecked |
| Unit/integration tests | Passed; 40 files / 172 tests |
| Build and server-only boundary | Passed; 15/15 build tasks |
| Database reset/lint/validation | Passed through migration `0021` |
| Generated database types | Passed twice; SHA-256 `8DBB300EE4AAF130D140FA65D4B837B1E1065C1E1FB02918BBA88E9AE5449DF5` both times |
| Database tests | Passed; 10 pgTAP files / 214 assertions and 1 live file / 5 tests |
| Live database security | Passed; audit UPDATE, DELETE, TRUNCATE blocked and audit schema unavailable through PostgREST |
| Health/audit probe | Passed; repeated health requests created zero audit rows |
| Scale probe | Passed at 75 records/events per tested domain with rollback |
| Production-like probe | Passed all protected routes, CSP, metadata, redirects, headers, design gate, and health-audit checks |
| Full E2E matrix | Passed; 257 passed / 107 intentional skips / 0 failed |
| Full accessibility matrix | Passed; 112/112 |
| Visual capture | Passed; 24 screenshots generated and reviewed |
| Secret scan | Local signature scan passed; gitleaks was not installed, so no gitleaks claim is made |
| Git/pre-commit | `git diff --check` and staged-file hooks passed; founder audit hash preserved |

## Phase boundary and final risk

No Phase 6 table, route, workflow, document, review, approval, portal, billing, integration, OCR, or AI capability was added. No RLS, CSP, audit immutability, service-role protection, or optimistic-concurrency control was weakened. The only remaining inputs are non-blocking: founder commercial review, dedicated brand/auth visual polish, physical-device usability, and later production-scale operational testing.

**Phase 5 verdict: complete and ready for the dedicated brand/auth visual-polish phase.**
