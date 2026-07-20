# FILE: /docs/projects/phase-5-permissions-and-rls.md

> **Document status:** Phase 5A specification — `project.*` permissions, authorization, and RLS. **Specification only; no SQL.**
> **Grounding (verified in Phase 4C audit):** `packages/authz` deny-by-default `can()` with `rolePermissions` matrix; SQL `has_org_permission(org, perm)` mirrors it; SECURITY DEFINER helpers (`is_org_member`, `has_org_role`, `has_org_permission`) with `search_path=''` + narrow grants; forced RLS on every tenant table; mutations via SECURITY DEFINER RPCs granted to `authenticated`; audit via service-role-only `write_audit_event`; `anon` has zero table grants. **Phase 5 extends this exact pattern — no new paradigm.**
> **Related:** [project-participants-and-access.md](./project-participants-and-access.md), [phase-5-data-model.md](./phase-5-data-model.md).

---

## 1. Permission identifiers (added to `packages/authz`)

Stable dotted `project.*` permissions. **No requirement/document/review permissions** (later phases).

| Permission | Scope | Meaning |
|------------|-------|---------|
| `project.create` | org | create a project (auto-assigns creator) |
| `project.view` | project | view a project the actor can access |
| `project.view_all` | org | view **all** org projects (implicit for owner/admin) |
| `project.update` | project | edit identity/metadata/status |
| `project.archive` | project | archive |
| `project.restore` | project | restore an archived project |
| `project.manage_team` | project | assign/change/remove internal members |
| `project.manage_companies` | project | add/edit/remove project companies |
| `project.manage_contacts` | project | add/edit/remove project contacts |
| `company.view` | org | view the company directory |
| `company.create` | org | create a directory company |
| `company.update` | org | edit a company |
| `company.archive` | org | archive/restore a company |
| `contact.view` | org | view the contact directory |
| `contact.create` | org | create a contact |
| `contact.update` | org | edit a contact |
| `contact.archive` | org | archive/restore a contact |

## 2. Role → permission matrix (Phase 5)

**Two scopes interact:** org role (Phase 4 membership) sets org-wide + directory capability and the *ceiling*; project role (`project_members`) grants **project-scoped** capability for non-admins.

### Org-scope permissions by org role
| Permission | Owner | Admin | PM | Coordinator | Reviewer | Viewer |
|------------|:-----:|:-----:|:--:|:-----------:|:--------:|:------:|
| project.create | ✔ | ✔ | ✔ | ✔ | — | — |
| project.view_all | ✔ | ✔ | — | — | — | — |
| company.view / contact.view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| company.create/update/archive | ✔ | ✔ | ✔ | ✔ | — | — |
| contact.create/update/archive | ✔ | ✔ | ✔ | ✔ | — | — |

### Project-scope permissions (require project access — see §3)
| Permission | Owner/Admin (any project) | Assigned `project_administrator` | Assigned `project_manager` | Assigned `closeout_coordinator` | Assigned `internal_reviewer` | Assigned `viewer` |
|------------|:--:|:--:|:--:|:--:|:--:|:--:|
| project.view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| project.update | ✔ | ✔ | ✔ | ✔ | — | — |
| project.archive/restore | ✔ | ✔ | — | — | — | — |
| project.manage_team | ✔ | ✔ | ✔ | — | — | — |
| project.manage_companies | ✔ | ✔ | ✔ | ✔ | — | — |
| project.manage_contacts | ✔ | ✔ | ✔ | ✔ | — | — |

> Owner/Administrator (org role) are treated as `project_administrator` on **every** project implicitly. Non-admins get project permissions **only** from their `project_members.project_role` on that project.

## 3. Project-access rule (the crux)

`can_access_project(project_id)` → true iff the caller is an **active** org member of the project's org **and** ( org role ∈ {owner, administrator} **or** has an **active** `project_members` row for that project ). Encapsulated in a SECURITY DEFINER helper so RLS policies stay simple and non-recursive.

`project_permission(project_id, permission)` → resolves the caller's effective project role (owner/admin ⇒ project_administrator; else the `project_members.project_role`) and checks it against the §2 project matrix. Used by RLS write policies and mirrored by `authz` app-side.

## 4. Application authorization

Every project/company/contact/relationship **mutation** server action calls `authorizeProjectAction`/`authorizeOrganizationAction` (`authz.can(...)`) **and** invokes a SECURITY DEFINER RPC that re-authorizes in-DB — the exact defense-in-depth pattern verified in Phase 4C (`members.ts`). Reads use RLS-scoped queries in Server Components. The active org/project is resolved server-side and **re-validated**; a client-supplied `organization_id`/`project_id` is **never** proof of access.

`authz` additions: extend `permissions`, `rolePermissions`, and the `Actor` to carry an optional **project context** (`projectRole?`, `projectAccess?`) so `can(actor, 'project.update', { organizationId, projectId })` resolves org-role + project-role. Suspended account/membership, org mismatch, archived org → deny (existing logic reused).

## 5. RLS strategy by table

**All Phase 5 tables:** `ENABLE` + `FORCE ROW LEVEL SECURITY`; default deny; `revoke all from public, anon, authenticated` then `grant select to authenticated` (mutations via RPC only, matching Phase 4); `grant all to service_role`. `anon` gets **nothing**. Platform admins get **no** bypass policy (Phase 4 pattern).

Helper functions (SECURITY DEFINER, `search_path=''`, granted `authenticated,service_role`, revoked public/anon): `can_access_project(uuid)`, `project_permission(uuid,text)`, plus reuse of `is_org_member`/`has_org_role`/`has_org_permission`. **Recursion avoidance:** `project_members` SELECT policy uses a **direct** predicate (`is_org_member(organization_id) AND (has_org_role(org,{owner,administrator}) OR membership_id = <caller's membership>)`); `can_access_project` (definer) is used by *other* tables' policies, never by `project_members`'s own SELECT in a way that re-enters it. pgTAP asserts termination.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `projects` | `can_access_project(id)` | (fn `create_project`) | (fn; `project_permission(id,'project.update')` + not archived) | none |
| `companies` | `has_org_permission(org,'company.view')` (any active member) | (fn) | (fn `company.update`) | none |
| `contacts` | `has_org_permission(org,'contact.view')` | (fn) | (fn `contact.update`) | none |
| `company_contacts` | member of org (via company's org) | (fn) | (fn) | none |
| `project_companies` | `can_access_project(project_id)` | (fn `project.manage_companies`) | (fn) | none |
| `project_contacts` | `can_access_project(project_id)` | (fn `project.manage_contacts`) | (fn) | none |
| `project_members` | self-row OR `can_access_project(project_id)` (direct predicate) | (fn `project.manage_team`) | (fn) | none |

- **Organization isolation:** every policy first requires the caller be an active member of the row's `organization_id` (denormalized on every table) — cross-tenant denied structurally.
- **Project-assignment access:** non-admins see project rows only where `can_access_project` is true.
- **Owner/admin:** `has_org_role(org,{owner,administrator})` short-circuits project access to all org projects.
- **Suspended/removed member:** `is_org_member` requires `status='active'` → denied.
- **Archived project:** SELECT allowed (read-only); UPDATE policies additionally require `status <> 'archived'` (writes blocked except via `restore_project`).
- **Platform admin / service-role:** no bypass policy; service-role bypasses RLS but is used only in definer functions + audit; platform admins act via existing audited platform functions only.
- **INSERT/DELETE:** no direct grants — all creation/removal goes through SECURITY DEFINER functions (which authorize + audit + enforce archive/consistency rules). "Removal" is soft (`status`), never row DELETE.

## 6. SECURITY DEFINER functions (Phase 5)

All: `security definer`, `set search_path=''`, revoke public/anon, grant `authenticated`, internal `auth.uid()` + permission checks, safe errcodes (`42501` permission, `22023` validation, `23505` conflict), pgTAP-covered, audit inline. Examples: `create_project`, `update_project`, `set_project_status`, `archive_project`, `restore_project`, `create_company`, `update_company`, `archive_company`/`restore_company`, `create_contact`/`update_contact`/`archive_contact`/`restore_contact`, `link_company_contact`/`end_company_contact`, `assign_project_company`/`update_project_company`/`remove_project_company`, `assign_project_contact`/`update_project_contact`/`remove_project_contact`, `assign_project_member`/`change_project_member_role`/`remove_project_member`. Read helpers: `get_project_overview`, `search_companies`, `search_contacts`, `search_projects`, `get_project_activity` (all definer + authorization-gated, returning only authorized rows).

## 7. Grants census (intended)

`anon`: nothing. `authenticated`: SELECT on the 7 tables (RLS-gated) + execute on the Phase 5 functions; **no direct INSERT/UPDATE/DELETE grants**. `service_role`: full (server-only) + `write_audit_event`. Confirmed by a pgTAP grants assertion.

## 8. Authz⇔RLS parity

Same duplication risk flagged in Phase 4C (P4C-M2). Mitigation for Phase 5: a **parity test** that (a) enumerates every `project.*`/`company.*`/`contact.*` permission and asserts `project_permission`/`has_org_permission` returns a defined mapping (no silent `else false` omission), and (b) a role×permission cross-check exercising each org-role and each project-role through **both** `authz.can()` and a live RLS-scoped statement, asserting agreement. Adding a permission requires updating **both** the TS matrix and the SQL, with the parity test guarding drift.

## 9. Cross-tenant & access threat cases (must be tested)

| Threat | Expected |
|--------|----------|
| Org B member reads/writes any Org A project/company/contact/join row | **Denied** (RLS) for every table/op — pgTAP matrix. |
| Non-admin member opens a project they're **not assigned** to | **Denied** (`can_access_project` false). |
| Client sends another org's `organization_id`/`project_id` | **No access** — server ignores client ids for authz; RLS denies. |
| Suspended/removed member acts | **Denied** (membership gate). |
| Archived-org member reads project data | **Denied** (org-status in helper). |
| Mutating an archived project | **Blocked** (UPDATE policy + function guard). |
| Assigning a company/contact from another org to a project | **Blocked** (same-org check in function). |
| `project_members` policy recursion | **None** (direct predicate + definer helper; pgTAP asserts). |
| Platform admin reads random org's projects via normal query | **Denied** (no bypass policy). |
| Removed project member retains access | **Denied** (status='removed'). |

---

*Continue to [phase-5-data-model.md](./phase-5-data-model.md).*
