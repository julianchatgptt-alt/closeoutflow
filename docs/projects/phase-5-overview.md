# FILE: /docs/projects/phase-5-overview.md

> **Document status:** Phase 5A specification — projects, companies, contacts, project teams. **Specification only; no code, migrations, or packages.**
> **Public brand:** **Closeout** (visible). **Domain:** `closeoutflow.com`. Internal identifiers (`@closeoutflow/*`, `cof-*`, repo/branch) unchanged.
> **Builds on (do not re-invent):** Phase 4 identity/tenancy — `organizations`, `organization_memberships` (roles: owner, administrator, project_manager, closeout_coordinator, internal_reviewer, viewer), forced RLS + SECURITY DEFINER helpers (`is_org_member`, `has_org_role`, `has_org_permission`), the service-role-only `write_audit_event` RPC, `packages/authz` deny-by-default `can()`, secure org switching (`cof-active-org` cookie, server-revalidated), and the Phase 3E premium design system + shell.
> **Depends on:** [product-requirements.md](../product/product-requirements.md), [user-roles.md](../product/user-roles.md), [statuses.md](../product/statuses.md) (project lifecycle = source of truth), [data-architecture.md](../architecture/data-architecture.md), [auth-and-permissions.md](../architecture/auth-and-permissions.md), Phase 4 [permissions-and-rls.md](../auth/permissions-and-rls.md) / [phase-4-data-model.md](../auth/phase-4-data-model.md) / [phase-4c-audit.md](../auth/phase-4c-audit.md), [phase-3e-visual-direction.md](../design/phase-3e-visual-direction.md).
> **Sibling Phase 5 docs:** [projects-and-lifecycle.md](./projects-and-lifecycle.md), [companies-and-contacts.md](./companies-and-contacts.md), [project-participants-and-access.md](./project-participants-and-access.md), [phase-5-permissions-and-rls.md](./phase-5-permissions-and-rls.md), [phase-5-data-model.md](./phase-5-data-model.md), [routes-and-workflows.md](./routes-and-workflows.md), [commercial-readiness.md](./commercial-readiness.md), [phase-5-audit-events.md](./phase-5-audit-events.md), [phase-5-testing.md](./phase-5-testing.md), [phase-5-implementation-plan.md](./phase-5-implementation-plan.md), [open-decisions.md](./open-decisions.md).

---

## 1. Objective

Turn Closeout's placeholder project workspace into the **real system of record for commercial construction projects and the companies/people around them** — the foundation every later closeout workflow (requirements, subcontractor invitations, document requests, reviews, warranties, packages, owner portal) will attach to. At the end of Phase 5 an authorized user can create and run projects, maintain a **reusable** company + contact directory, assemble a project's internal team and external participants, and navigate it all securely, on a UI that feels **worth paying for** — not a generic CRUD admin.

## 2. Scope

Projects (identity, metadata, lifecycle, overview, list/search/filter, archive/restore); an org-scoped **company directory**; an org-scoped **contact directory**; company↔contact relationships; **project↔company** and **project↔contact** relationships (with project-specific roles); an **internal project-team** assignment model; a stable **`project.*` permission + RLS layer** aligned app-side and DB-side; audit events; project-scoped search/pagination foundations; conversion of the relevant Phase 3 placeholder routes to functional; accessibility, responsive, and commercial polish.

## 3. Non-goals (explicitly excluded)

Requirement templates/instances, document uploads/versions/processing, review workflows/annotations, subcontractor/owner **portal access** or secure external links, O&M/package generation, warranties/equipment/inspections/training/lien-waivers/drawings, general notifications, billing/Stripe, AI/OCR, external integrations, public API, heavy external search. **No fake requirement/document records** to fill the workspace. Project sub-nav tabs for those modules remain **honest previews** (Phase 3E treatment).

## 4. User outcomes

The 20 capabilities in the prompt, each mapped to a route ([routes-and-workflows.md](./routes-and-workflows.md)), a permission ([phase-5-permissions-and-rls.md](./phase-5-permissions-and-rls.md)), and an audit event ([phase-5-audit-events.md](./phase-5-audit-events.md)). Headline outcomes: **create a usable project in under a minute** (name only), enrich it progressively, reuse a subcontractor across many projects without re-typing, and see a **useful project overview before any requirement exists**.

## 5. Business outcomes

- **Time-to-value:** a contractor reaches a live project + team in one short session → the product demonstrates worth on day one.
- **Reduced admin:** reusable directory eliminates re-entering the same subs/architects/owners per project (the #1 spreadsheet pain).
- **Trust:** clean handling of messy real-world data (companies that play different roles per project; contacts who change employers) signals a product built by people who understand construction.
- **Retention foundation:** the directory + project records accumulate switching-cost value that later phases compound.

## 6. Main architecture decisions

| Area | Decision |
|------|----------|
| Project identity | UUID PK; **route by UUID**; optional human `project_number` (org-unique when present); optional display `slug` (non-authoritative, cosmetic). |
| Lifecycle | Exactly the [statuses.md §A](../product/statuses.md) set: `draft → active → closeout_in_progress → owner_review → published → complete → archived (+ cancelled)`. No invented states. Phase 5 exercises `draft`/`active`/`archived`/`cancelled`; later phases drive the closeout states. |
| Reuse | **Companies and contacts are org-scoped directory records**, linked to projects via join tables (`project_companies`, `project_contacts`). Never duplicate a company per project. |
| Company roles | **Relationship-specific**, not global: a company's role (owner/GC/sub/architect/…) lives on `project_companies`, so one company can be a sub on Project A and the GC on Project B. A company carries only lightweight global classification tags. |
| Internal team vs org membership | **Separate `project_members` table** referencing an org membership; project responsibility ≠ org role. Does not duplicate Phase 4 memberships. |
| Access model | Owners/Administrators see **all** org projects; PM/Coordinator/Reviewer/Viewer see **assigned** projects (+ optional org-wide read grant). Assignment grants project access; **RLS enforces it**. |
| Internal vs external people | Contacts are **directory records, never auth users**; internal team = auth users via membership. The two are visually and structurally distinct. |
| Isolation | Every Phase 5 table carries `organization_id`; forced RLS; client-supplied org/project id is never proof of access. |
| History | Archive + status + effective-dated relationships; **removal ≠ destruction** (soft/relationship removal preserves meaning). Hard delete is restricted/deferred. |

## 7. Security principles (preserved)

Database-enforced tenant isolation (forced RLS on every table); deny-by-default (unknown role/permission, missing/suspended membership, archived org, stale project access → deny); no client-trusted `organization_id`/`project_id`; service-role confined to audit RPC + narrow definer functions (never tenant CRUD); immutable audit for sensitive changes; authz⇔RLS parity; project access separate from — and composable with — future project-scoped permissions.

## 8. Commercial-quality principles

Progressive enrichment (minimal required fields); reuse over re-entry; no dead-end wizards; every empty state points at the next valuable action; the project overview earns its place before requirements exist; premium Phase 3E surfaces (framed workspace, tabular data, quiet status ink); mobile is designed, not shrunk; technical DB errors never shown to users.

## 9. Dependencies

Phase 4 auth/tenancy + `authz` + audit RPC + org switching; Phase 3E design system, shell, `DataTable`, forms, dialogs, StatusBadge, EmptyState; local Supabase + Mailpit; migration validator (must be extended to allow the Phase 5 tables while still forbidding requirement/document tables). **No new external providers.**

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Cross-tenant leak via a project/company/contact/join table | Forced RLS keyed on `organization_id` + project-access helper; exhaustive pgTAP cross-tenant matrix; authz⇔RLS parity ([phase-5-permissions-and-rls.md](./phase-5-permissions-and-rls.md)). |
| RLS recursion on project-access checks | SECURITY DEFINER helpers (`can_access_project`) bypass RLS internally; direct predicates on join tables; pgTAP asserts termination. |
| Duplicate companies/contacts proliferate (spreadsheet-2.0) | Normalized-name/domain/email dedupe **warnings** at create time; merge-readiness in schema; never auto-merge on weak similarity ([companies-and-contacts.md](./companies-and-contacts.md)). |
| Feels like generic CRUD | Connected workflow (create → team → companies → contacts → setup checklist), premium overview, reuse-first directory ([commercial-readiness.md](./commercial-readiness.md)). |
| Over-asking at creation | One required field (name); everything else progressive. |
| Access model paints Phase 6 into a corner | `project_members` + `project.*` permissions designed to compose with future project-scoped requirement/document permissions without rework. |
| History lost on relationship removal | Effective-dated/soft-removed join rows; archive not delete. |
| Mobile relationship tables unusable | Table→card transforms, sheets for assignment dialogs, long-name truncation (Phase 3E patterns). |

## 11. Success criteria

- A user creates a project with **name only**, lands on a useful overview, and completes setup (team + key companies + contacts) without navigating disconnected forms.
- Companies/contacts are **reusable** across projects; the same sub is added to a second project by search, not re-entry.
- **pgTAP proves zero cross-tenant access** on every Phase 5 table for SELECT/INSERT/UPDATE/DELETE, and proves an **unassigned** non-admin member cannot read a project they aren't on.
- **authz⇔RLS parity** green for all `project.*` permissions; suspended/removed members and archived orgs denied.
- Archive/restore preserves history; duplicate warnings never auto-merge.
- Every sensitive change writes an immutable audit event; project activity renders from audit (no parallel event system).
- Phase 5 creates **no** requirement/document/portal tables; the migration validator still forbids them.
- The UI reuses Phase 3E; mobile is intentional; screenshots pass founder review.
- Verdict: the project-setup and directory experiences **feel worth paying for**.

---

*Continue to [projects-and-lifecycle.md](./projects-and-lifecycle.md).*
