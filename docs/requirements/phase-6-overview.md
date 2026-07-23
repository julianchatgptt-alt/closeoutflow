# FILE: /docs/requirements/phase-6-overview.md

> **Document status:** Phase 6A specification — closeout requirements and template system planning. **Specification only; no code, migrations, or packages.**
> **Public brand:** **Closeout** (visible). **Domain:** `closeoutflow.com`. Internal identifiers (`@closeoutflow/*`, `cof-*`, repo/branch) unchanged.
> **Builds on (do not re-invent):** Phase 4 identity/tenancy (six org roles, forced RLS, SECURITY DEFINER helpers, `write_audit_event`, `packages/authz` deny-by-default `can()`), Phase 5 projects/companies/contacts/project-teams (`can_access_project`, `project_permission`, project roles, directory reuse, audit-backed activity), Phase 3E design system + shell, Phase 5E Keystone Fold brand + metadata/noindex conventions.
> **Depends on:** [product-requirements.md §TMPL/REQ](../product/product-requirements.md), [statuses.md §B](../product/statuses.md), [user-roles.md](../product/user-roles.md), [glossary.md](../product/glossary.md), [phase-5-data-model.md](../projects/phase-5-data-model.md), [phase-5-permissions-and-rls.md](../projects/phase-5-permissions-and-rls.md), [phase-5-exit-review.md](../projects/phase-5-exit-review.md), [phase-5e-exit-review.md](../brand/phase-5e-exit-review.md), [phase-3e-visual-direction.md](../design/phase-3e-visual-direction.md).
> **Sibling Phase 6 docs:** [requirements-and-lifecycle.md](./requirements-and-lifecycle.md), [requirement-templates.md](./requirement-templates.md), [responsibility-and-dates.md](./responsibility-and-dates.md), [phase-6-permissions-and-rls.md](./phase-6-permissions-and-rls.md), [phase-6-data-model.md](./phase-6-data-model.md), [routes-and-workflows.md](./routes-and-workflows.md), [commercial-readiness.md](./commercial-readiness.md), [phase-6-audit-events.md](./phase-6-audit-events.md), [phase-6-testing.md](./phase-6-testing.md), [phase-6-implementation-plan.md](./phase-6-implementation-plan.md), [open-decisions.md](./open-decisions.md).

---

## 1. Objective

Let an organization **define, reuse, configure, and manage the closeout requirements** expected on a construction project — the documentation obligations (O&M manuals, warranties, as-builts, attic stock, test reports, lien waivers, final permits, commissioning records, and other contractor-defined deliverables) that every later phase (portal, documents, reviews, packages) will fulfill. At the end of Phase 6 a coordinator can apply a reusable organization template to a project, add one-off requirements, assign responsibility to project companies/contacts and internal owners, set due dates, and work from a **requirement register** that beats a spreadsheet on day one — without pretending uploads, reviews, or approvals exist yet.

## 2. Scope (Phase 6 configuration layer)

- **Organization requirement categories** — a lightweight, org-editable taxonomy with seeded defaults; used by templates and the register.
- **Requirement templates** — org-scoped, versioned, reusable checklists of requirement items (TMPL-001), with clone, publish, archive, and a starter template (TMPL-002 subset, ROD-2).
- **Template application** — preview → select → resolve responsibility → set dates → atomically instantiate project requirements (REQ-001), including safe re-apply/merge (TMPL-003).
- **Project requirements** — concrete per-project records (REQ-002 custom items included) with title, description, category, responsibility, internal owner, due date, priority, required/optional flag, notes, sequence, source-template provenance.
- **Lifecycle (configuration subset)** — stored statuses honestly reachable in Phase 6: `active` and `not_applicable_approved` (REQ-006), plus independent `archived_at` soft archive/restore; assignment completeness is always derived from responsibility fields, never stored. See [requirements-and-lifecycle.md](./requirements-and-lifecycle.md).
- **Bulk operations** — assign, categorize, date, N/A, archive/restore, reorder — atomic, audited, permission-gated.
- **Requirement register UX** — the major commercial surface: grouped, searchable, filterable, mobile-capable.
- **Template library UX** — list, detail/builder, preview, clone, versioning, apply-to-project.
- **Project overview integration** — real configuration counts and next actions only.
- **Permissions + RLS** — `template.*` and `requirement.*` extending the exact Phase 4/5 pattern; app⇔SQL parity.
- **Audit** — the full catalog in [phase-6-audit-events.md](./phase-6-audit-events.md); requirement events carry `project_id` and flow into the existing activity view with no new event system.

## 3. Non-goals (explicitly excluded — the honest boundary)

No file upload/storage/versions/previews, OCR, review or approval or rejection workflows, annotations, subcontractor or owner portals, secure external links, reminder delivery, email/notification infrastructure, package generation, O&M assembly, AI, integrations, billing, or public marketing pages. No submission/approval/completion/risk metrics anywhere — every indicator in Phase 6 derives from configuration data the phase actually stores. Requirement routes drop their preview markers; documents/reviews/portals/package routes keep them.

### Roadmap traceability (deliberate re-scoping)

The Phase 1 roadmap's Phase 6 also listed RULE-001 (basic rule conditions), REQ-003's invite step, REQ-004's operational lifecycle, REQ-005 exceptions, and REQ-007 waivers. The founder's Phase 6 directive narrows this phase to the configuration layer; the remainder moves with the systems that make them truthful: invitations/`requested` → Phase 7, submission/review statuses → Phases 8–9, exceptions/waivers → Phase 7/9 (ROD-1), rules engine → later phase with its "design-early" seam preserved (ROD-6). This deviation is recorded here rather than by editing the approved Phase 1 docs.

## 4. User outcomes

1. Open a project with no requirements → understand the value → apply a template → land in a useful register in minutes.
2. Build a reusable company-standard template once; apply it to every project; later template changes never silently rewrite existing projects.
3. Add a one-off requirement in seconds (title + category is enough); enrich progressively.
4. See at a glance what is unassigned, undated, N/A, or ready for the Phase 7 request step — responsibility and deadlines obvious.
5. Bulk-fix a messy register (assign a sub to 12 items, date a whole category) in one confirmed action.

## 5. Business outcomes

- **Replaces the closeout spreadsheet** — the register is where the closeout scope lives, with provenance, audit, and reuse a spreadsheet cannot match.
- **Compounding template value** — company standards captured once become a switching cost and an onboarding accelerator.
- **Foundation for the sellable loop** — Phases 7–9 (portal → documents → reviews) attach directly to these records; nothing built here is throwaway.

## 6. Main architecture decisions (detailed in siblings)

| Area | Decision |
|------|----------|
| Template versioning | **Row-per-version**: a template row is one immutable-once-published version (`family_id` + `version`); editing a published template creates the next draft version. Project requirements reference the exact applied row. ([requirement-templates.md §3](./requirement-templates.md)) |
| Snapshots | Project requirements are **copied snapshots** at apply time — template edits never mutate existing projects; re-apply is an explicit, previewed merge. |
| Categories | One org-scoped `requirement_categories` taxonomy (seeded defaults, org-editable, ordered, archivable) shared by templates and registers. No separate template-section entity. |
| Lifecycle | Single stored `status`; Phase 6 permits only `active` and `not_applicable_approved`; the [statuses §B](../product/statuses.md) operational values (`requested`, `submitted`, …) are appended from `active` by the phases that make them true — no rename. Assignment completeness, missing due dates, "planned date passed", stale references, and setup attention are **derived indicators**, never statuses; `archived_at` is independent of `status`. |
| Responsibility | Instance-level responsibility resolves to **concrete Phase 5 records**: `project_companies`, `project_contacts`, `project_members`. Templates carry only a default **project-company role hint** for fast resolution at apply time. |
| Dates | **Date-only** due dates in the project timezone; optional; template items may carry a simple anchor+offset default (substantial completion / closeout target); no scheduling engine; no silent recalculation. |
| Tables | Exactly **4 new tables**: `requirement_categories`, `requirement_templates`, `requirement_template_items`, `project_requirements`. ([phase-6-data-model.md](./phase-6-data-model.md)) |
| Mutations | SECURITY DEFINER RPCs only (Phase 4/5 pattern): dual app+DB authorization, inline blocking audit, safe errcodes, `updated_at` concurrency, idempotent template application. |
| Isolation | Every table carries `organization_id`; forced RLS; `can_access_project` gates project rows; template existence never leaks cross-tenant. |
| Navigation | Templates get a first-class **Templates** library surface (ROD-4 recommends a sidebar item; `/settings/templates` redirects). |

## 7. Security principles (preserved, unchanged)

Deny-by-default everywhere (unknown role/permission → deny); no client-trusted `organization_id`/`project_id`/`template_id`; forced RLS + narrow grants + fixed `search_path=''`; no recursive policies; service-role confined to definer functions and audit; immutable in-transaction audit; authz⇔RLS parity tests; append-only migrations; migration validator extended explicitly for the 4 tables while requirement-adjacent later-phase tables stay forbidden.

## 8. Commercial-quality principles

Fast over thorough at entry (title-first creation, short apply flow — never a long wizard); reuse over re-entry (templates and categories); responsibility and dates visible at a glance; every empty state sells the next action; honest deferral language ("Requests and submissions arrive with the subcontractor portal"); premium Phase 3E surfaces — an operational register, not a spreadsheet clone; mobile designed, not shrunk.

## 9. Dependencies

Phase 4 auth/tenancy + authz + audit RPC; Phase 5 tables/helpers (`can_access_project`, `project_permission`, directories, project relationships, activity view); Phase 3E components (`DataTable`, `Dialog`/`Sheet`, `Combobox`, `StatusBadge`, `EmptyState`, `PageHeader`); Phase 5E brand/metadata conventions; local Supabase; migration validator (reviewed allowlist change). **No new external providers.**

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Lifecycle language implies uploads/reviews exist | Store only truthful §B subset; derived labels reviewed for honesty; brand/preview regression tests assert no submission/approval language. |
| Template versioning over-engineered | Row-per-version (2 tables, no snapshot machinery); publish is a flag flip; version chains linear. |
| Re-apply silently rewrites projects | Snapshot instances + stable `item_key` dedupe + explicit previewed merge; never delete/overwrite existing rows. |
| Register becomes a spreadsheet clone | Category-grouped operational register with next-action emphasis; lean default columns; card mobile. |
| Cross-tenant/template leakage | Forced RLS keyed on org; pgTAP matrix incl. template-existence probes. |
| Responsibility dangles when Phase 5 rows are removed/archived | Defined invalidation rules + register "needs attention" surfacing ([responsibility-and-dates.md §4](./responsibility-and-dates.md)). |
| Scale (2,000 requirements) | Indexed grouped cursor pagination, summary RPC, bounded bulk ops; scale probe in tests. |
| Permission sprawl | Small stable permission set with role mapping mirrored SQL-side; parity harness extended. |

## 11. Success criteria

- Applying a published template produces a correct, deduplicated, audited requirement set atomically; applying it twice adds nothing new; a newer version merges additively via preview.
- Register shows requirement, category, responsibility, internal owner, due date, status, and source; search/filter/bulk work at 500+ rows; mobile cards usable.
- Custom requirement created in ≤ 15 seconds (title + category).
- pgTAP proves zero cross-tenant access on all 4 tables and correct project-access gating; parity green for every new permission; unknown role/permission denies.
- Every sensitive mutation writes its audit event in-transaction; requirement events appear in project activity with no new event system.
- No submission/review/approval/completion metric anywhere; deferred routes keep honest previews.
- Overview requirement panel shows only real configuration data; the setup checklist's "Add closeout requirements" step becomes real.
- Founder screenshot review (desktop/tablet/mobile × light/dark) passes with no Phase 5E regression.

---

*Continue to [requirements-and-lifecycle.md](./requirements-and-lifecycle.md).*
