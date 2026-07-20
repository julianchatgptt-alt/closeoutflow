# FILE: /docs/projects/phase-5-testing.md

> **Document status:** Phase 5A specification — the Phase 5 test plan. **Specification only.**
> **Grounding:** builds on the verified Phase 4 suite (Vitest, pgTAP run as **constrained `authenticated` roles**, Playwright 5 browser projects via `scripts/run-playwright.mjs`, `db:validate`, server-only build test, brand regression). **RLS tests must use constrained roles + `request.jwt.claims`, never service-role (which bypasses RLS).**
> **Related:** [phase-5-permissions-and-rls.md](./phase-5-permissions-and-rls.md), [phase-5-audit-events.md](./phase-5-audit-events.md), [routes-and-workflows.md](./routes-and-workflows.md), Phase 4 [phase-4-testing.md](../auth/phase-4-testing.md).

---

## 1. Test pyramid (Phase 5 emphasis)

```
  E2E (Playwright, 5 browsers + mobile) — commercial journeys
  Integration (Vitest + local Supabase) — server actions, functions, search
  DB / RLS / permission (pgTAP) — HEAVILY weighted: isolation, project-access, parity, lifecycle
  Component (Vitest + TL) — project/company/contact forms, dialogs, tables, checklist
  Unit (Vitest) — authz project matrix, zod schemas, dedupe/normalization, pagination cursors
  Static — types + lint + format + boundaries + server-only build + migration validator
```

As before, the **DB/RLS/permission layer is over-weighted** — tenant + project isolation is the authoritative boundary.

## 2. Coverage areas (each must exist before merge)

| Area | Tool | Key assertions |
|------|------|----------------|
| **authz project matrix** | Vitest | full org-role × project-role × permission ([phase-5-permissions-and-rls §2](./phase-5-permissions-and-rls.md)); deny-by-default; suspended/removed/archived-org denial; unassigned non-admin denied `project.view` |
| **RLS isolation (per table)** | pgTAP | Org B identity gets **zero** Org A rows for SELECT/INSERT/UPDATE/DELETE on all 7 tables |
| **Project-access RLS** | pgTAP | non-admin member with **no** `project_members` row → 0 project rows; assigned → sees only their project; owner/admin → all org projects |
| **authz⇔RLS parity** | Vitest+pgTAP | every `project.*`/`company.*`/`contact.*` permission enumerated; each side agrees; drift fails |
| **Policy safety** | pgTAP | no recursion (esp. `project_members`); definer helpers `search_path=''`; grants revoked from anon/authenticated |
| **Functions** | pgTAP | `create_project` atomic (project + creator member + audit); archive blocks writes; same-org guards on join tables; assignment uniqueness |
| **Project lifecycle** | pgTAP+Vitest | valid transitions allowed, prohibited (complete→cancelled, draft→published) rejected; archive/restore; who-can-transition |
| **Company lifecycle** | pgTAP+Vitest | create/update/archive/restore; archived excluded from pickers |
| **Contact lifecycle** | pgTAP+Vitest | create/update/archive/restore; contact never becomes auth user |
| **Relationships** | pgTAP | project_companies role-per-project; project_contacts consistency guard; company_contacts primary uniqueness + history (ended_on) |
| **Duplicate prevention** | Vitest+pgTAP | dedupe **warns** (normalized name/domain/phone; email) but **never blocks/auto-merges**; different-region same-name not hard-warned |
| **Search** | Vitest+pgTAP | prefix/contains; accent/case-insensitive; org-scoped (no cross-tenant results); rate-limited |
| **Pagination** | Vitest | cursor stable across inserts; default/max page sizes; archived pagination |
| **Audit events** | Vitest+pgTAP | every sensitive mutation writes the expected event with `project_id`; audit-failure rolls back; **no email/phone value or secret** in any event; immutability |
| **Activity view** | pgTAP+Vitest | `get_project_activity` returns only authorized project's events; cross-project/tenant isolation; redaction |
| **Concurrency** | Vitest | stale `updated_at` write rejected with friendly reconcile; duplicate assignment blocked by unique constraint |
| **Grants** | pgTAP | anon 0 grants; authenticated SELECT-only + function execute; service-role confined |
| **Migration validator** | Vitest | Phase 5 tables allowed; `requirements`/`documents`/etc. **still fail**; unknown table fails |
| **Service-role boundary** | build test | no client import of service-role/new server modules; extend existing `verify-server-only` |
| **Brand/preview regression** | Vitest+Playwright | converted routes drop preview marker; requirement/document routes **still** show honest preview; visible brand "Closeout" (no "CloseoutFlow") |

## 3. Commercial-journey E2E (the differentiator)

Playwright flows asserting **behavior + speed**, not just page loads:
- **Fast create:** create a project with name only → lands on overview with setup checklist → assert < N actions.
- **Reuse:** create a company in the directory → add it to Project A as subcontractor → add the **same** company to Project B as GC by search (no re-entry) → assert both project_companies rows + distinct roles.
- **Team assignment:** assign an org member to a project → they can now open it; a non-assigned member gets denied/not-found.
- **Dedupe:** attempt to create a duplicate company → warning appears → "Create anyway" and "Use existing" both work.
- **Archive/restore:** archive a project → read-only banner + no mutations → restore.
- **Cross-tenant (E2E):** user in Org A cannot see/act on Org B's project/company/contact via UI or crafted request.
- **Mobile:** the create + directory + team flows on Pixel 7 / iPhone 15 (cards, sheets, sticky actions).

## 4. Accessibility (WCAG 2.2 AA)

axe (light + dark) + manual keyboard/SR on: project create dialog, project list, overview, settings, company list/detail, contact list/detail, add-member/add-company/add-contact dialogs, archive AlertDialog, filters, search, setup checklist, duplicate-warning (`role="status"`), error summaries. Assert: labels + error association + focus-to-first-error, dialog focus trap/return, `DataTable` `aria-sort`/`scope`/sr-only-select, status icon+label, live-region announcements on assign/remove/status-change, 44px targets, reduced-motion.

## 5. Cross-browser & mobile
Chromium/Firefox/WebKit smoke of the core journeys; Pixel 7 + iPhone 15 for the create/directory/team/relationship-table flows (card fallbacks, sheets, truncation).

## 6. Local test data
Extend `supabase/seed` (non-prod): 2 orgs (isolation), several projects across statuses (draft/active/archived), a company directory (subs, architect, owner) reused across projects, contacts with affiliations, project members across roles, a second org's mirror set for cross-tenant tests, a suspended member, an unassigned member. Clearly fake data. pgTAP builds isolated fixtures per test (`set local role authenticated` + `request.jwt.claims`) and rolls back. Vitest integration uses the Admin API helper (service-role in tests only) to provision, but **RLS assertions run as `authenticated`**.

## 7. Visual review (mandatory)
The 24 screenshot checkpoints in [commercial-readiness §13](./commercial-readiness.md), captured via the repo's Playwright harness (as in Phase 3E/4D), before final completion. Founder soft-review at overview + directory.

## 8. Where tests run (gates)
Same as Phase 4: pre-commit (format/lint/quick typecheck); PR required (typecheck, lint+boundaries, unit/component, **pgTAP RLS+parity+project-access+functions**, migration apply+types-diff=0+append-only+validator, server-only build, build, brand regression, Playwright smoke+axe); merge→staging (full E2E 5 browsers + a11y); prod promotion (smoke + manual approval).

## 9. Definition of done (Phase 5)
- All coverage areas green; the 22 quality gates in the 5A prompt satisfied.
- **pgTAP proves zero cross-tenant access** on every Phase 5 table **and** proves project-assignment access control (unassigned non-admin denied).
- authz⇔RLS parity green for all `project.*`/`company.*`/`contact.*`; suspended/removed/archived denied.
- Duplicate prevention warns, never auto-merges; archive preserves history.
- Search + cursor pagination validated at seed scale; every sensitive mutation audited (blocking, no PII/secret); activity renders from audit only.
- **No requirement/document/review/portal tables**; validator still forbids them; requirement/document routes remain honest previews.
- a11y (light+dark) + mobile + cross-browser green; brand "Closeout"; Phase 3E reused (no parallel system).
- Screenshots delivered; commercial-journey E2E green.

---

*Continue to [phase-5-implementation-plan.md](./phase-5-implementation-plan.md).*
