# Phase 5C Audit

> **Auditor role:** Independent product/RLS/authorization/accessibility/commercial-UX reviewer.
> **Subject:** Codex Phase 5B on `codex/phase-5b-projects` (commits `4cf7484`, `a421c69`, `49bd309`, `6ac0599`, `c6ee706`, `f594f08`, `667613e`).
> **Method:** Independent inspection of code, migrations, RLS, grants, functions, and tests **plus live reproduction** — started local Supabase, reset through `0020`, ran the full pgTAP suite as constrained `authenticated` roles, executed my **own** cross-tenant + assigned-access probes, ran a live grants/forced-RLS/`search_path` census, and **logged into the running app to visually review** the projects list, project overview, company/contact directories, mobile, and dark theme. Codex's summary was not trusted without verification.
> **Boundary honored:** no implementation code, migrations, RLS, grants, config, or env changed. Added exactly one file: this document. No commits. Local Supabase and dev server were started for reproduction and stopped afterward; scratch files removed; a build-generated `next-env.d.ts` toggle was reverted.

---

## 1. Executive verdict

Phase 5B is a **strong, secure, and genuinely commercial-quality** implementation. The multi-tenant + **project-assignment** access model is real and database-enforced: I **independently proved** that an org-B owner reads **0** rows of org A's project (and forged INSERT/UPDATE are blocked), and — the Phase 5 centerpiece — an **unassigned** active org member reads **0** projects (`can_access_project=0`), gains access only after assignment, and a `viewer`-assigned member is blocked from `project.update`. All 7 tables have forced RLS; every SECURITY DEFINER function has a fixed `search_path`; `anon` has zero grants; mutations flow through audited RPCs with dual app+DB authorization; project lifecycle transitions exactly match `statuses.md`; `update_project` has real optimistic-concurrency + a field allowlist; companies/contacts are reusable with per-project roles; the project overview delivers real value (a live 60% setup checklist, companies-by-role, an **honest** closeout-readiness card with no fake metrics).

I reproduced every headline number: **Vitest 37 files / 156 tests**, **pgTAP 9 files / 205 assertions**, typecheck, lint+boundaries, `db:validate`, `db:reset` through 0020, build, plus my own DB probes and a live visual pass. The design system (Phase 3E) is preserved across light/dark/mobile.

**No CRITICAL or HIGH findings.** Findings: 0 CRITICAL, 0 HIGH, 5 MEDIUM, 8 LOW, plus observations — all fixable in Phase 5D without architectural change. The MEDIUMs are commercial-polish (breadcrumb shows a raw UUID; dates render `YYYY-MM-DD`; horizontal overflow; theme-FAB placement carried from 3E; pluralization) — none are security or data-integrity defects. **Verdict: READY FOR PHASE 5D REMEDIATION.**

---

## 2. Repository and Git state

| Check | Result |
|---|---|
| Branch | `codex/phase-5b-projects` (expected) ✅ |
| Worktree before audit | clean ✅ (verified; a build-generated `next-env.d.ts` toggle was reverted) |
| 7 Phase 5B commits present | ✅ |
| Files changed across Phase 5B | 72 |
| Migrations `0000–0011` modified | **No** ✅ |
| Phase 3E visual files modified | No (tokens/gallery untouched) ✅ |
| Phase 4 security work intact | ✅ (getUser-only, forced RLS, audit RPC all preserved) |
| Phase 6+ tables/routes | **None** (live DB shows exactly 7 tables) ✅ |
| Commit boundaries | logical (docs → data foundation → project mgmt → directories → participants → journeys → record) ✅ |
| Secrets/raw data committed | none found ✅ |
| Screenshots committed | **0** — the "26 final screenshots" are not in the repo (captured to an ephemeral/ignored location). Observation, not a defect; I captured my own. |

---

## 3. Scope compliance

**Exactly the approved Phase 5 scope.** Live `pg_tables`: `projects, companies, contacts, company_contacts, project_companies, project_contacts, project_members` — nothing else. No requirement/template/document/version/review/annotation/package/warranty/equipment/inspection/training/lien-waiver/drawing tables; no portals/secure links/billing/AI/OCR/integrations/public-API/external-search. The project sub-nav keeps requirements/documents/reviews/etc. as **honest preview tabs** (not functional). `db:validate` confirms the migration guard now allowlists the 7 Phase 5 tables while **still forbidding** business tables.

---

## 4. Migration census

| # | Migration | Purpose | Tables | Functions | Triggers | RLS | Grants | Audit |
|---|-----------|---------|--------|-----------|----------|-----|--------|-------|
| 0012 | project extensions & permissions | pg_trgm/unaccent; `normalize_directory_text`; extend `has_org_permission` | — | 2 | — | — | narrow | ✅ definer+`search_path=''` |
| 0013 | projects & project_members | atomic project + creator assignment | projects, project_members | create/update/status/archive/restore + member assign/change/remove; `can_access_project`, `project_permission` | set_updated_at | enable+**force** | SELECT + fn-execute | ✅ blocking, real request_id |
| 0014 | companies | reusable directory | companies | create/update/archive/restore, search | set_updated_at | enable+**force** | narrow | ✅ |
| 0015 | contacts & affiliations | directory + history | contacts, company_contacts | create/update/archive, link/end, search | set_updated_at | enable+**force** | narrow | ✅ |
| 0016 | project_companies | role-per-project | project_companies | assign/update/remove | set_updated_at | enable+**force** | narrow | ✅ |
| 0017 | project_contacts | responsibility + consistency | project_contacts | assign/update/remove | set_updated_at | enable+**force** | narrow | ✅ |
| 0018 | project_member hardening | recursion-safe policy finalization | — | — | — | policy | — | ✅ |
| 0019 | project readers & grants | overview/activity/search readers, grants census | — | get_project_overview/activity, search_* | — | — | grants | ✅ |
| 0020 | seed contract | deterministic non-prod seed | — | — | — | — | — | ✅ (fake data) |

Append-only; `0000–0011` untouched; order correct; `db:reset` through 0020 reproduced clean. **Risk: none material** (see per-area findings). **Result: PASS.**

---

## 5. Phase 5 table census

All 7: UUID PK, `organization_id` FK (cascade), project FK where applicable, `created_at/updated_at` + trigger, `text`+`check` statuses/roles, **RLS enabled+forced** (verified live: all `t/t`), grants = `authenticated` SELECT only (verified live), `service_role` all. Integrity highlights verified in-migration:
- `projects`: partial unique `(organization_id, lower(project_number)) where project_number is not null`; trigram GIN on name/number; tags GIN; **date-ordering check constraints**; country `^[A-Z]{2}$`.
- `project_members`: `unique(project_id, membership_id)`; FK to `organization_memberships` (`on delete restrict`); recursion-safe SELECT policy.
- `project_companies`: `unique(project_id, company_id)` (one role per company per project); same-org enforced.
- `project_contacts`: `unique(project_id, contact_id)`; company-consistency; reserved responsibility flags.
- `company_contacts`: primary-uniqueness partial index; effective dates.

No unapproved table. **Result: PASS.**

---

## 6. Project model and lifecycle

- **Model:** UUID PK + **UUID routing** (`/projects/[uuid]`), name-only creation (2–160 check), optional org-unique `project_number`, progressive enrichment (type/delivery/address/dates/timezone/tags/notes), `created_by`, archive fields. Owner/architect/GC/PM are **relationships, not columns** — correct. Route UUID grants nothing without access (RLS-gated; verified).
- **Lifecycle:** `set_project_status` enforces the **exact** `statuses.md` transitions (draft→active/cancelled; active→closeout_in_progress/cancelled; closeout_in_progress→owner_review/cancelled; owner_review→closeout_in_progress/published/cancelled; published→owner_review/complete); **prohibited** transitions (`complete→cancelled`, `draft→published`, any→archived-via-status) are rejected; cancellation requires a reason. Archive/restore via dedicated functions; archived projects are **read-only** (write-block verified in `update_project`). The UI keeps later workflow-driven states honest (sub-nav previews). **Result: PASS** (labels render via StatusBadge, e.g., Draft/Active — verified visually).

---

## 7. Project creation transaction

`create_project`: `has_org_permission('project.create')` (owner/admin/PM/coordinator), name-only required, **atomic** project + creator `project_members` (role = project_administrator for owner/admin else project_manager, server-set — client cannot forge), audit `project.created` in-transaction (rolls back on failure), `unique_violation`→friendly "project number is already in use". Client cannot forge org ownership (org resolved server-side) or creator assignment. Live UX: the **1-field "Create project"** dialog + fast landing on the overview is present and premium (screenshot). Practical create ≈ 1 field / ~2 clicks. **Result: PASS.**

---

## 8. Project access and authorization

**Independently proven at the DB layer** (constrained `authenticated` roles):
- Org-B owner → org-A project: **0 rows**; forged update/create **blocked**.
- Unassigned active org member (PM) → project: **0 rows**, `can_access_project=0`; `update_project` **blocked**.
- After `assign_project_member` → **1 row** readable.
- `viewer`-assigned member → `project.update` **blocked** (role-scoped).

Owner/Admin see all org projects (via `has_org_role` short-circuit in `can_access_project`); still require **active** membership + **active** org (suspended member/org denied — org-status checked in the helper). Removed assignment (`status='removed'`) revokes access. App layer mirrors this via `authorizeProjectAction` + RLS. **Result: PASS — the core Phase 5 security promise holds.**

---

## 9. RLS matrix

| Table | SELECT | INSERT/UPDATE/DELETE | Anon | Cross-tenant | Suspended/removed | Unassigned | Archived |
|-------|--------|----------------------|------|--------------|-------------------|-----------|----------|
| projects | `can_access_project(id)` | fn only (no direct grant) | deny | deny (probed) | deny | deny (probed) | read-only; writes blocked |
| project_members | self OR direct-predicate access | fn only | deny | deny | deny | deny | — |
| companies | `has_org_permission('company.view')` | fn only | deny | deny | deny | n/a (org-scoped) | archived filtered |
| contacts | `has_org_permission('contact.view')` | fn only | deny | deny | deny | n/a | archived filtered |
| company_contacts | org member (via parents) | fn only | deny | deny | deny | n/a | — |
| project_companies | `can_access_project(project_id)` | fn only | deny | deny | deny | deny | — |
| project_contacts | `can_access_project(project_id)` | fn only | deny | deny | deny | deny | — |

All **enable+force**; no platform-admin bypass policy (consistent with Phase 4); service-role confined to fns/audit. No recursion (verified: `project_members` policy uses direct `organization_memberships` predicate + definer helper). No existence leakage (inaccessible project → 0 rows / not-found). **Result: PASS.**

---

## 10. RLS helper review

`can_access_project`, `project_permission`, `has_org_permission`, `normalize_directory_text`: all **`security definer` + `set search_path = ''`** (live census: **zero** definer functions missing search_path), revoked from public/anon, granted authenticated+service_role, null-safe (`auth.uid()` null → no rows → deny), deny-by-default (`else false`). `can_access_project` correctly requires active org + active membership + (owner/admin OR active assignment); archived-org and suspended-member denial verified. No arbitrary org-id trust (all keyed to `auth.uid()`). pgTAP covers them (file 0008). **Result: PASS.**

---

## 11. Authz/RLS parity

TS `rolePermissions` (+ project `project_permission` app-side) mirrors SQL `has_org_permission` (org-scope) and `project_permission` (project-scope). I compared them directly:
- Org-scope: `project.create`/`company.*`/`contact.*` = owner/admin/PM/coordinator (create/update/archive); `project.view_all` = owner/admin — **agree** TS↔SQL.
- Project-scope: `project.update` = admin/PM/coordinator; `archive/restore` = project_administrator; `manage_team` = admin/PM; `manage_companies/contacts` = admin/PM/coordinator — **agree**.

**Finding P5C-M1 (MEDIUM, carried from P4C-M2):** parity is **manual duplication** across TS + two SQL functions; the parity tests assert each side independently rather than diffing a shared enumeration. They agree today, but a future permission added to one side could drift. Recommend a test enumerating every `permissions.*` value asserting `has_org_permission`/`project_permission` returns a defined mapping (no silent `else false`), plus a role×permission cross-check exercising both `authz.can` and a live RLS statement. **Result: PASS today; add drift guard.**

---

## 12. Grants census (live)

`anon`: **zero** grants on all 7 tables and (confirmed in Phase 4) audit schema. `authenticated`: **SELECT only** on all 7 (verified) + execute on the Phase 5 RPCs; **no direct INSERT/UPDATE/DELETE** (forged direct update returned `permission denied for table projects`). `service_role`: full (server-only). Project members cannot enumerate unrelated projects (RLS + `can_access_project`). **Result: PASS.**

---

## 13. Company model and duplicate handling

Organization-scoped, **reusable** (Ace Mechanical shows Projects=2 in the live directory), **classification is a per-project role** (global `classifications[]` are tags only; role on `project_companies` — verified: same company can hold different roles per project). Archived not deleted; searchable (trigram); audited; RLS-protected. **No tax/banking/payment data** stored (schema check confirms). Duplicate detection: create-time **warnings** on normalized name/website-domain/phone, **no auto-merge**, user can proceed when legitimately distinct, server-side revalidation. **Finding P5C-L1 (LOW):** verify (via 5D screenshot) the duplicate-warning UI actually fires at seed scale — I confirmed the helper/logic exists but did not exercise the warning UI live. **Result: PASS.**

---

## 14. Contact model and duplicate handling

Org-scoped; **never auth users** (reserved `linked_user_id`/`portal_status` unused; no promotion path); can exist without company; historical affiliations via `company_contacts`; reusable project relationships; archived not deleted; `citext` email + `normalized_email` for **advisory** duplicate-email warning (no hard block, no cross-tenant existence leak — RLS-scoped). Directory renders cleanly (live). **Result: PASS.**

---

## 15. Relationship integrity

- **company_contacts:** primary-uniqueness partial index; effective dates (start/end); same-tenant enforced; history preserved (end-dating, not delete).
- **project_companies:** role-per-project; `unique(project_id, company_id)`; trade/contract/primary-contact; same-org guard; archived-company/project handling; audit events. Global company record does **not** gain fixed roles from project relationships (verified — role lives on the join row).
- **project_contacts:** project title/responsibility; optional `project_company_id` with consistency guard; same-org; reserved closeout/document/review flags (unused); no portal access; no contact/user conflation.

All mutations audited, RLS-gated, soft-removal (history preserved). **Result: PASS.**

---

## 16. Internal project-team model

`project_members` references `organization_memberships` (not a duplicate of Phase 4 membership); five project responsibilities; **creator auto-assigned atomically**; add/change/remove via `project.manage_team`-gated RPCs; owner/admin visibility; assignment grants access; suspended/removed org member denied (membership gate first); **removed assignment revokes access** (verified). Project responsibility does **not** elevate org role (separate concepts — a viewer-assigned member still can't update). RLS recursion prevented. **Result: PASS.**

---

## 17. Project list review

Live `/projects` is **polished operational software**, not a generic table: clear H1 + value subtitle, "Create project" primary, a search/status-filter/assigned-to-me/include-archived toolbar in a paper card, a lean table (Project + number sub-line, Status badge, Type, Closeout target, Team count), real data, premium empty surrounding space. Mobile → **cards** (verified: "1 teammates · Target 2026-11-01"). Dark theme clean. Findings: dates render `2026-11-01` not friendly format (**P5C-M2**); ~58px horizontal overflow at 1440 (**P5C-L2**); "1 teammates" pluralization (**P5C-L3**); theme-FAB bottom-left carried from 3E (**P5C-L4**). **Result: PASS with polish findings.**

---

## 18. Project overview and setup-checklist review

**This is the commercial-quality centerpiece and it succeeds.** Live overview shows: identity header (name + "Project 2026-021" + Draft badge + Project settings), a **PROJECT SETUP** card with a real **60% meter / "3 of 5 setup steps complete"** and checked/unchecked steps with per-step arrows (derived from real data), COMPANIES (Ace Mechanical / General Contractor), KEY CONTACTS (reuse CTA), IMPORTANT DATES (planned/substantial/closeout-target/location), INTERNAL TEAM (Riley Reviewer / Internal Reviewer badge), and an **honest CLOSEOUT READINESS card**: "Project setup is available now. Requirements and document readiness arrive in future phases; no placeholder metrics are shown." **No fake requirement/document/review/risk metrics** — exactly as required. Strong focal point (setup checklist), paper cards, overline labels, no nested-card clutter. **Finding P5C-M3 (MEDIUM):** the **breadcrumb shows the raw project UUID** (`Projects / 50000000 0000 4000 8000 000000000002`) with empty middle segments (`/ / /`) instead of the project name — the spec required `Projects › {name} › {tab}`. Looks unfinished on an otherwise premium page. **Result: PASS with the breadcrumb finding.**

---

## 19. Directory and relationship UX review

Company directory subtitle ("Maintain one reusable organization directory; project roles are assigned per project") communicates the **reuse value** clearly; Projects/Contacts counts make reuse tangible. Contacts directory clean. Relationship add flows are search-first (reuse) with create-inline + dedupe (verified in code/actions). External framing keeps companies/contacts distinct from internal members. **Finding P5C-L5 (LOW):** confirm via 5D screenshots that the "add company/contact by search vs create-inline" dialogs and the internal-team-vs-org-Team distinction read clearly on mobile (card fallbacks). **Result: PASS.**

---

## 20. Activity and audit review

Activity is a **derived read over `audit.audit_events`** via `get_project_activity` (authorization-gated by `can_access_project`, cursor-paginated, redacted) — **no parallel event system**. Phase 5 events (project.created/updated/status_changed/archived/restored; member assigned/role_changed/removed; company/contact created/updated/archived/restored; project company/contact added/role_changed/removed) are written **in-transaction (blocking)** with `project_id` set and **real request_ids** (improving on Phase 4's random-UUID pattern, P4C-L2). Metadata carries ids/labels/changed-field keys, not raw notes/emails (seed events confirm: `{"name":...}`, `{"company_id":..,"role":..}`). Audit immutability intact (pgTAP 0001/0002 still pass). **Finding P5C-L6 (LOW):** verify no contact **email value** appears in any `contact.*` event metadata (spec says names OK, emails omitted) — confirm the redaction whitelist in 5D tests. **Result: PASS.**

---

## 21. Search, pagination, concurrency, and performance

- **Search:** DB-native (trigram GIN on name/number; `normalize_directory_text` + unaccent); org-scoped under RLS (no cross-tenant leak); case/accent-insensitive.
- **Pagination:** stable ordering index `(organization_id, updated_at desc, id)` supports cursor pagination.
- **Concurrency:** `update_project` enforces **optimistic concurrency** (`updated_at <> expected` → errcode `40001` "project was updated by another user") + a strict field allowlist (prevents mass-assignment). Unique constraints prevent duplicate assignments. This satisfies the spec's "detect, don't silently last-write-wins."
- **Performance:** actions are server-first; `get_project_overview` composes the overview server-side (avoiding N+1); indexes present. **Finding P5C-L7 (LOW):** validate overview/activity query counts and list performance at larger-than-seed scale before production (a 5D/pre-prod task). **Result: PASS.**

---

## 22. Visual-quality review

Reviewed live at 1440 (light+dark), 390 (mobile): Phase 3E **preserved** — tinted graphite canvas + white paper surfaces, quiet StatusBadge ink, overline section labels, tabular-ish numbers, one primary action per view, no nested-card clutter, strong focal points (projects table; overview setup checklist). Dark theme is the desaturated graphite (no navy monotony). Mobile is genuinely re-flowed to cards, not shrunk. **Does not read as generic CRUD.** Findings: raw-UUID breadcrumb (P5C-M3), un-formatted dates (P5C-M2), minor horizontal overflow (P5C-L2), FAB placement (P5C-L4). **Result: premium; polish findings only.**

---

## 23. Commercial-journey review

- **First-project journey:** empty→create (1 field)→overview→setup checklist guiding team/owner/companies/contacts — clear, fast, honest next actions. **Strong.**
- **Reuse journey:** directory shows a company on 2 projects; role-per-project verified in DB; add-by-search flow present. **Strong** (validate the second-project add UX in 5D screenshots).
- **Access journey:** owner/admin see all; assigned non-admin sees assigned; **unassigned cannot discover** (proved: 0 rows); removing assignment / suspending membership revokes access. **Proven at the DB layer.**

A commercial contractor would understand these without training; the product **feels worth paying for**. **Result: PASS.**

---

## 24. Accessibility and responsive review

Component-level a11y inherited from Phase 3E (Radix overlays, Field label/error association, DataTable `aria-sort`/`scope`/sr-only-select, status icon+label, 44px targets) is present in the reused components. Mobile card fallbacks + stacked toolbars verified live. **Not independently re-run:** the axe/E2E browser suites depend on the repo's `run-playwright.mjs` harness (start/reset Supabase + seeded login), which I did not stand up end-to-end for all 5 projects — recorded honestly (§31), not as a defect. Codex reports 76 a11y passes + 5-browser coverage; the code-level foundation is credible. **Finding P5C-M4 (MEDIUM):** independently re-run the a11y/E2E suite in the wired harness during 5D to close the verification gap (esp. on the new project/company/contact forms + assignment dialogs). **Result: credible, verification-gap noted.**

---

## 25. Testing review

- **Reproduced:** Vitest **37/156**, pgTAP **9 files/205 assertions** — match Codex exactly. pgTAP runs as **constrained `authenticated` roles** with `request.jwt.claims` (verified pattern in file 0008) — **not** service-role, so isolation assertions are trustworthy. My independent probes corroborate (not a shared-fixture false positive).
- **Not reproduced:** Playwright 172/59-skip + 76 a11y (harness — §24/§31).
- **Quality:** meaningful assertions (project-access, lifecycle, concurrency, dedupe). **Finding P5C-L8 (LOW):** confirm the suite includes an explicit **two-concurrent-`update_project`** test (the concurrency guard exists; ensure a test exercises the `40001` path) and a duplicate-warning UI assertion. **Result: PASS with additions.**

---

## 26. Documentation and Git review

Phase 5A specs preserved; progress/exit-review present and consistent with the implementation I inspected; commands match scripts; founder decisions (POD-6 access default, POD-7 no-hard-delete) recorded; deferred Phase 6 work honest. Git: logical commits, no unrelated refactors, no secrets/raw data, no migration rewrites, Phase 4 history intact. **Observation:** `next-env.d.ts` was committed pointing at `.next/dev/types/` (a dev-build artifact toggle) — harmless but a minor hygiene note; and the 26 screenshots aren't committed (ephemeral). **Result: PASS.**

---

## 27. Post-Phase-5 brand/auth polish inputs (for the dedicated future pass — NOT Phase 6 blockers)

- **Temporary "C" logo** still in sidebar + mobile — replace with the real Closeout logo/wordmark; add favicon + PWA icon. (Not a Phase 6 blocker.)
- **Sign-in page** is functional/clean but plain — the future pass should add trust presentation (background, brand, value copy) for a premium first impression.
- **Sign-up / verification / reset / invitation / onboarding** inherit the same plain public shell — candidate for brand + trust-signal treatment.
- **Breadcrumb-UUID issue (P5C-M3)** and **date formatting (P5C-M2)** are Phase-5D polish, but the brand pass should ensure the project header/breadcrumb reads premium.
- **Email branding:** confirm the future pass covers Closeout-branded transactional email headers/footers (Phase 4 emails exist; visual polish pending).
- **Light/dark brand behavior:** the "C" mark on the primary tile reads fine in both themes; the real logo must be validated in both.
- **Trust-signal opportunity:** the company/contact directories and project overview are strong "worth paying for" surfaces — feature them in marketing/auth trust copy later.

---

## 28. Findings summary

| ID | Severity | Area | Title | P6 blocker | Owner |
|----|----------|------|-------|:----------:|-------|
| P5C-M1 | MEDIUM | Authz/RLS parity | TS↔SQL permission matrices duplicated with no cross-diff test | No | Codex |
| P5C-M2 | MEDIUM | Visual/commercial | Dates render `YYYY-MM-DD`, not the friendly tabular format the design specifies | No | Codex |
| P5C-M3 | MEDIUM | Visual/commercial | Breadcrumb shows raw project UUID (+ empty segments) instead of project name | No | Codex |
| P5C-M4 | MEDIUM | Verification | a11y/E2E browser suite not independently reproducible without the wired harness; re-run in 5D | No | Codex |
| P5C-M5 | MEDIUM | Concurrency/UX | Confirm the stale-edit `40001` path surfaces a friendly reconcile message in the UI (guard exists DB-side) | No | Codex |
| P5C-L1 | LOW | Dedupe UX | Verify duplicate-warning UI fires live (company/contact) | No | Codex |
| P5C-L2 | LOW | Responsive | ~58px horizontal overflow at 1440 (`bodyScrollW 1498 > 1440`) | No | Codex |
| P5C-L3 | LOW | Copy | "1 teammates" — no singular/plural handling | No | Codex |
| P5C-L4 | LOW | Visual | Theme-toggle FAB still floats bottom-left (carried from Phase 3E) | No | Codex |
| P5C-L5 | LOW | Mobile UX | Verify relationship/assignment dialogs + internal-vs-org-team distinction on mobile | No | Codex |
| P5C-L6 | LOW | Audit privacy | Assert no contact email value in `contact.*` audit metadata | No | Codex |
| P5C-L7 | LOW | Performance | Validate overview/list/activity at >seed scale pre-prod | No | Codex |
| P5C-L8 | LOW | Tests | Add explicit two-concurrent-update + duplicate-warning-UI tests | No | Codex |
| P5C-O1 | OBSERVATION | Hygiene | `next-env.d.ts` committed with dev-types path; screenshots not committed | — | — |
| P5C-O2 | OBSERVATION | Security | Prod CSP nonce/no-unsafe-inline confirmed (dev shows unsafe-eval as expected) | — | — |

---

## 29. Detailed findings

### P5C-M1 — MEDIUM — Authz/RLS parity has no cross-diff test
- **Evidence:** `packages/authz/src/index.ts` `rolePermissions`; `supabase/migrations/0012` `has_org_permission`; `0013` `project_permission` — three hand-maintained matrices.
- **Spec:** [phase-5-permissions-and-rls §8](./phase-5-permissions-and-rls.md) parity requirement.
- **Failure scenario:** a permission added to TS but not SQL (or vice versa) → UI allows an action the DB denies (or reverse); confusing failures, and for a future permission a possible allow-mismatch.
- **Customer/commercial impact:** low today (they agree), but a maintenance landmine as Phase 6 permissions layer on.
- **Remediation:** add a test enumerating every `Object.values(permissions)` asserting `has_org_permission`/`project_permission` returns a role-set (fails on omission); add a role×permission cross-check via both `authz.can` and a live RLS statement.
- **Tests:** the parity enumeration + cross-check. **Visual:** none. **Blocks Phase 6:** No.

### P5C-M2 — MEDIUM — Dates render as ISO `YYYY-MM-DD`
- **Evidence:** live projects list "2026-11-01", overview "2026-10-15"; spec ([phase-3e/patterns] date cells) calls for a friendly tabular format (e.g., "Nov 1, 2026").
- **Failure scenario:** none functional; **commercial impact:** ISO dates read as "raw/unfinished" to construction users and undercut the premium feel on the two most-viewed screens.
- **Remediation:** format dates via the shared date cell (absolute friendly + tabular; relative tooltip); apply to list, overview, detail.
- **Tests:** component test asserting formatted output. **Visual:** re-shoot projects + overview. **Blocks Phase 6:** No.

### P5C-M3 — MEDIUM — Breadcrumb shows raw project UUID
- **Evidence:** live overview breadcrumb `Projects / / / 50000000 0000 4000 8000 000000000002` (empty middle segments + UUID) vs spec `Projects › {name} › {tab}` ([routes-and-workflows §15](./routes-and-workflows.md)).
- **Failure scenario:** none functional; **commercial impact:** a raw UUID in the breadcrumb of an otherwise-premium overview reads distinctly unfinished; also empty `/ / /` segments indicate a breadcrumb-generation bug on the `[projectId]/overview` nesting.
- **Remediation:** resolve the project name server-side for the breadcrumb; drop empty segments; show `Projects › {name} › Overview`.
- **Tests:** breadcrumb component/E2E asserting name + no empty segments. **Visual:** re-shoot overview. **Blocks Phase 6:** No.

### P5C-M4 — MEDIUM — a11y/E2E not independently reproduced
- **Evidence:** the browser suites require `scripts/run-playwright.mjs` (Supabase reset + seeded login); I verified login + captured screens manually but did not run the full 5-project axe/E2E suite.
- **Remediation (5D):** run `pnpm test:e2e` + `pnpm test:a11y` end-to-end and attach results; ensure new project/company/contact forms + assignment/archive dialogs are axe-clean (light+dark) and keyboard-complete.
- **Tests:** the existing suites, executed. **Visual:** n/a. **Blocks Phase 6:** No (verification hygiene).

### P5C-M5 — MEDIUM — Confirm stale-edit UI reconcile
- **Evidence:** `update_project` raises `40001` "project was updated by another user" (DB-side guard confirmed); the action maps errors to a generic message.
- **Failure scenario:** two users edit a project; second save is correctly rejected, but the user must get a **clear** "someone else updated this — reload and retry" message + a path to reconcile, not a generic failure.
- **Remediation:** map errcode `40001` to a specific reconcile message + reload affordance in the settings form.
- **Tests:** action/E2E asserting the `40001` path shows the reconcile message. **Visual:** settings error state. **Blocks Phase 6:** No.

*(P5C-L1…L8 detailed inline in §13,17,19,20,21,25 with evidence, remediation, and required tests; all LOW, none block Phase 6.)*

---

## 30. Deferred items confirmed (correct)

Requirements/templates/documents/reviews/packages/warranties/equipment/inspections/training/lien-waivers/drawings, portals, secure links, general notifications, billing, AI/OCR, integrations, public API, heavy external search — all correctly absent. Company CSV import (schema-ready, engine deferred — POD-9). Project cover images (initials/typographic now — POD-11). Record merge (schema-ready, deferred). The temporary "C" logo + public-auth visual polish → the dedicated post-Phase-5 brand/auth pass (§27).

---

## 31. Validation commands and actual results

| Command | Reproduced | Result |
|---|---|---|
| `pnpm typecheck` | ✅ | PASS |
| `pnpm lint` | ✅ | PASS + boundaries |
| `pnpm test` | ✅ | **37 files / 156 tests PASS** (matches) |
| `pnpm db:validate` | ✅ | PASS (Phase 5 allowlist; business tables still forbidden) |
| `pnpm db:start` / `db:reset` | ✅ | migrations 0000–0020 + seed applied clean |
| `pnpm test:db` (pgTAP) | ✅ | **9 files / 205 assertions PASS** (matches); constrained `authenticated` roles |
| **Independent cross-tenant probe** | ✅ | org-B reads **0** org-A projects; forged INSERT/UPDATE blocked |
| **Independent assigned-access probe** | ✅ | unassigned PM **0** rows; assigned **1**; viewer `project.update` blocked |
| **Live grants/forced-RLS/search_path census** | ✅ | anon 0 grants; all 7 forced RLS; 0 definer fns missing search_path |
| `pnpm build` | ✅ | compiled successfully |
| **Live visual review** (login as owner) | ✅ | projects/overview/companies/contacts/mobile/dark reviewed |
| Prod CSP probe | ✅ (prior audits) | nonce+strict-dynamic, no unsafe-inline in prod (dev shows unsafe-eval, expected) |
| `pnpm test:e2e` / `test:a11y` (full) | ❌ not reproduced | harness-dependent (§24/§M4); login + manual captures done instead |

**Environment:** Node v24, pnpm 10.33, Windows + Docker. All security-critical + data-integrity + core-visual checks reproduced; only the full browser a11y/E2E suite was environment-limited.

---

## 32. Phase 5D remediation order

1. **Cross-tenant / authorization:** none required (verified clean); **P5C-M1** parity cross-diff test (defense-in-depth before Phase 6 permissions).
2. **Data integrity / lifecycle:** none required (verified); **P5C-L6** audit-email redaction assertion; **P5C-L8** concurrency/dedupe tests.
3. **Commercial workflow friction:** **P5C-M3** breadcrumb name, **P5C-M2** date formatting, **P5C-M5** stale-edit reconcile message, **P5C-L1/L5** dedupe + mobile-dialog validation, **P5C-L3** pluralization.
4. **Visual quality:** **P5C-L2** horizontal overflow, **P5C-L4** theme-FAB placement (or defer to brand pass).
5. **Accessibility / responsive:** **P5C-M4** re-run a11y/E2E; verify new forms/dialogs.
6. **Performance / concurrency:** **P5C-L7** scale validation.
7. **Testing:** P5C-L8 additions.
8. **Docs / polish:** P5C-O1 hygiene; feed §27 into the brand/auth pass.

**Exact first remediation:** **P5C-M3** — resolve and render the **project name** in the breadcrumb (drop the empty `/ / /` segments and the raw UUID) on `/projects/[id]/*`. It's the most visible "unfinished" cue on the premium overview and a quick, high-impact fix.

---

## 33. Final checklist

| Item | Verdict |
|---|---|
| Phase 5 tasks implemented | ✅ (migrations 0012–0020, all flows) |
| Exactly seven approved tables exist | ✅ (live DB) |
| No Phase 6 entities exist | ✅ |
| All Phase 5 tables use forced RLS | ✅ (verified `t/t`) |
| Cross-tenant access denied | ✅ (independently probed) |
| Owner/Admin see all projects | ✅ |
| Non-admin roles see assigned projects only | ✅ (probed) |
| Assignment removal revokes access | ✅ |
| Suspended membership revokes access | ✅ |
| Project creation atomic | ✅ |
| Creator assignment atomic | ✅ |
| Companies reusable | ✅ (Projects=2 in directory) |
| Contacts reusable | ✅ |
| Project company roles relationship-specific | ✅ |
| Contacts not treated as authenticated users | ✅ |
| Archive/restore preserve history | ✅ |
| No hard-delete product UI | ✅ (soft status only) |
| Search/pagination scalable | ✅ (trigram + cursor; validate at scale — L7) |
| Audit records immutable | ✅ |
| No fake closeout metrics | ✅ (honest readiness card) |
| Project creation commercially usable | ✅ (1-field dialog) |
| Project overview provides real Phase 5 value | ✅ (setup checklist + real data) |
| Setup checklist useful | ✅ (60% derived meter) |
| Company/contact reuse obvious | ✅ (directory copy + counts) |
| Mobile behavior intentional | ✅ (cards, stacked toolbars) |
| Visual quality premium | ✅ (polish findings only) |
| Phase 3E design preserved | ✅ |
| Closeout branding preserved | ✅ (domain-only "closeoutflow" in metadata) |
| CSP nonce-based | ✅ |
| `/design` production-inaccessible | ✅ (local/test only; 404 in prod) |
| Accessibility foundation credible | ✅ (suite re-run recommended — M4) |
| Browser tests exist | ✅ (not re-run here) |
| No secrets committed | ✅ |
| Git history clean | ✅ |

---

*Audit complete. No repository files were modified except the creation of this document. No commits were made. Local Supabase + dev server were started for reproduction and stopped; scratch files and a build-generated `next-env.d.ts` toggle were reverted.*
