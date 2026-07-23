# FILE: /docs/requirements/phase-6-permissions-and-rls.md

> **Document status:** Phase 6A specification — `template.*`/`requirement.*` permissions, authorization, and RLS. **Specification only; no SQL.**
> **Grounding (verified through Phase 5D):** `packages/authz` deny-by-default `can()` with org + project matrices; SQL mirrors via `has_org_permission`, `can_access_project`, `project_permission` (SECURITY DEFINER, `search_path=''`, narrow grants); forced RLS on every tenant table; mutations via SECURITY DEFINER RPCs; `anon` zero grants; platform admins no bypass. **Phase 6 extends this exact pattern — no new paradigm.**
> **Related:** [phase-6-data-model.md](./phase-6-data-model.md), [phase-5-permissions-and-rls.md](../projects/phase-5-permissions-and-rls.md).

---

## 1. Permission identifiers (added to `packages/authz`)

**Org scope (templates + categories):**

| Permission | Meaning |
|------------|---------|
| `template.view` | view the template library (list/detail/preview) |
| `template.manage` | create templates, edit **draft** versions and items, clone, create new versions, manage requirement categories |
| `template.publish` | publish a draft version (confirmation-gated in UI) |
| `template.archive` | archive/restore a template family or category |

**Project scope (require project access; resolved via effective project role):**

| Permission | Meaning |
|------------|---------|
| `requirement.view` | view the project's requirement register + requirement detail |
| `requirement.manage` | create custom requirements; edit title/description/category/trade/priority/required-flag/notes; reorder |
| `requirement.assign` | set/clear responsible company/contact and internal owner |
| `requirement.set_dates` | set/clear due dates |
| `requirement.apply_template` | run the apply-template flow on the project |
| `requirement.set_not_applicable` | mark N/A and reverse N/A |
| `requirement.archive` | archive/restore requirements |

Bulk operations carry **no separate permission** — each bulk action requires the same permission as its single-row equivalent. Requirement audit history is the existing project activity surface (`project.view` + `get_project_activity`); no new permission.

## 2. Role → permission matrix

### Org scope by org role

| Permission | Owner | Admin | PM | Coordinator | Reviewer | Viewer |
|------------|:--:|:--:|:--:|:--:|:--:|:--:|
| template.view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| template.manage | ✔ | ✔ | ✔ | ✔ | — | — |
| template.publish | ✔ | ✔ | ✔ | ✔ | — | — |
| template.archive | ✔ | ✔ | — | — | — | — |

Matches [user-roles §B](../product/user-roles.md) ("Create/edit templates": PM/Coordinator allowed, gated) — the ▲ gate is a **confirmation dialog** on publish/clone-to-new-version, not MFA (template edits are recoverable via versioning; MFA gates stay reserved for Phase 4 security actions). Archive is org-wide-impact and restricted to Owner/Admin (ROD-7 if the founder wants it wider).

### Project scope by effective project role

Owner/Administrator ⇒ implicit `project_administrator` on every org project (Phase 5 rule, unchanged). Non-admins resolve through their active `project_members.project_role`.

| Permission | project_administrator | project_manager | closeout_coordinator | internal_reviewer | viewer |
|------------|:--:|:--:|:--:|:--:|:--:|
| requirement.view | ✔ | ✔ | ✔ | ✔ | ✔ |
| requirement.manage | ✔ | ✔ | ✔ | — | — |
| requirement.assign | ✔ | ✔ | ✔ | — | — |
| requirement.set_dates | ✔ | ✔ | ✔ | — | — |
| requirement.apply_template | ✔ | ✔ | ✔ | — | — |
| requirement.set_not_applicable | ✔ | ✔ | ✔ | — | — |
| requirement.archive | ✔ | ✔ | ✔ | — | — |

Coordinators are the daily closeout drivers — full configuration capability on assigned projects (consistent with their Phase 5 `project.update`/manage_companies grants). Reviewers/Viewers read-only. [user-roles §B](../product/user-roles.md) "Create project requirements / Assign requirements / Mark N/A": PM ✔P, Coordinator ✔P — matched.

**Preserved invariants:** Owner/Admin see all org projects' registers; non-admin access remains assigned-only; active org membership required; project responsibility (being a requirement's internal owner) grants **no** permissions by itself; unknown role or permission denies; suspended/removed membership, removed assignment, archived org deny; archived project blocks all requirement/template-apply writes.

## 3. Application authorization

`packages/authz` additions: 11 permission ids; org matrix rows for the 4 template permissions; `projectRolePermissions` rows for the 7 requirement permissions (added to `projectScopedPermissions`); no `Actor` shape changes (Phase 5's `projectAccess`/`projectRole` already carry what's needed). Every server action: Zod validation → server-resolved active org/project (client ids never proof) → `can()` → SECURITY DEFINER RPC that re-authorizes in-DB → friendly error mapping. Template mutations use `authorizeOrganizationAction`; requirement mutations use `authorizeProjectAction`.

SQL side: reuse `has_org_permission` (extended mapping for `template.*`) and `project_permission` (extended mapping for `requirement.*`). No new helper shapes.

## 4. RLS strategy by table

All 4 tables: `ENABLE` + `FORCE ROW LEVEL SECURITY`; revoke all from public/anon/authenticated then `grant select to authenticated`; **no direct INSERT/UPDATE/DELETE grants** (mutations via RPC only); `grant all to service_role`; `anon` nothing; no platform-admin bypass. Helpers reused: `is_org_member`, `has_org_permission`, `has_org_role`, `can_access_project`, `project_permission` — all non-recursive here (none of the new tables participate in access resolution, so no recursion risk by construction).

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|----------------------|
| `requirement_categories` | `is_org_member(organization_id)` | none (RPC only) |
| `requirement_templates` | `has_org_permission(organization_id,'template.view')` | none (RPC only) |
| `requirement_template_items` | via parent template's org (`has_org_permission(organization_id,'template.view')` — org id denormalized) | none (RPC only) |
| `project_requirements` | `can_access_project(project_id)` | none (RPC only) |

- **Org isolation:** every policy first requires active membership in the row's denormalized `organization_id`.
- **Project gating:** unassigned non-admins get zero `project_requirements` rows; removed assignment/suspension revoke instantly via the existing helpers.
- **Templates are org-visible** to every active member (viewers can read the library; only manage roles mutate). Cross-tenant template ids in any RPC → generic denial; no existence leak (same non-enumerating 404 pattern as projects).
- **Archived project:** SELECT allowed (read-only register); all mutation RPCs check project status.
- **Archived rows:** remain SELECT-visible (filtered in UI); mutation functions block edits except restore.

## 5. RLS/behavior matrix (must be pgTAP-tested per actor)

| Actor | Templates/categories | Project requirements |
|-------|----------------------|----------------------|
| Anonymous | zero rows, zero grants | zero |
| Cross-tenant member | zero (all ops, all tables) | zero |
| Owner / Administrator | full library + manage per matrix | all org projects' registers + full config |
| Assigned PM / Coordinator | library view + manage/publish | assigned projects: view + full config |
| Assigned Reviewer / Viewer | library view only | assigned projects: view only |
| Unassigned org member (non-admin) | library view | **zero rows** for unassigned projects |
| Suspended / removed member | zero | zero |
| Removed project assignment | library view | zero for that project |
| Archived project | n/a | read-only; mutations blocked |
| Archived template/requirement | visible w/ filter; edits blocked except restore | same |
| Service role | full (server-only; definer fns + audit) | full |
| Platform administrator | no bypass policy | no bypass policy |

## 6. SECURITY DEFINER functions (Phase 6 set)

All: `security definer`, `set search_path=''`, revoke public/anon, grant `authenticated`, internal `auth.uid()` + permission checks, safe errcodes (`42501`/`22023`/`23505` + the 0021 stale-conflict code), inline blocking audit, pgTAP-covered.

Templates/categories: `ensure_requirement_defaults` (idempotent starter categories + starter template), `create_requirement_category`, `update_requirement_category`, `reorder_requirement_categories`, `archive_requirement_category`/`restore_requirement_category`, `create_requirement_template`, `update_requirement_template` (draft meta), `save_template_items` (draft items batch), `publish_requirement_template`, `create_template_version`, `clone_requirement_template`, `archive_requirement_template`/`restore_requirement_template`.

Requirements: `create_project_requirement`, `update_project_requirement` (emits granular responsibility/due-date audit events from changed fields; **never touches `status`** — assignment completeness is derived, so responsibility changes require `requirement.assign` but no lifecycle transition; Phase 6D authorizes supplied field groups before mutation and treats authorized empty/same-value payloads as true no-ops), `mark_requirement_not_applicable` (the **only** path to `not_applicable_approved`; requires `requirement.set_not_applicable` + writes `requirement.marked_not_applicable`), `reverse_requirement_not_applicable` (returns the row to `active`), `archive_project_requirement`/`restore_project_requirement`, `move_project_requirement` (one keyboard-accessible step within a category, optimistic-concurrency checked), `bulk_update_project_requirements`, `apply_requirement_template`.

Readers (definer, authorization-gated): `get_requirement_summary(project_id)` (register header + overview counts), `search_project_requirements(project_id, q, filters, cursor)` (grouped, paginated), `get_template_preview(template_id, project_id?)` (items + duplicate flags).

## 7. Grants census & parity

`anon`: nothing. `authenticated`: SELECT on the 4 tables (RLS-gated) + execute on the Phase 6 functions. `service_role`: full, server-only. pgTAP grants assertion extended.

Parity: the existing authz⇔RLS parity harness is extended to enumerate all 11 new permissions — (a) every permission has a defined SQL mapping (no silent `else false`), (b) org-role × project-role cross-checks agree between `can()` and live constrained-role SQL. Drift fails CI.

## 8. Threat cases (must be tested)

| Threat | Expected |
|--------|----------|
| Org B reads/mutates Org A templates, items, categories, or requirements | Denied, every table/op |
| Non-admin opens an unassigned project's register (route or RPC) | Denied; non-enumerating not-found |
| Client passes a foreign `template_id` to `apply_requirement_template` | Generic denial; no template-existence leak |
| Apply resolves responsibility to another project's/org's company/contact/member | Rejected in-function |
| Suspended/removed member or removed assignment mutates anything | Denied |
| Editing a published template version or its items | Blocked (function guard; no direct grants) |
| Mutating requirements on an archived project | Blocked |
| Direct INSERT/UPDATE/DELETE as `authenticated` | No grant → fails |
| Unknown permission / unknown role in either layer | Deny |
| Bulk call mixing rows from two projects | Whole call rejected |
| Any write setting `status` outside `{active, not_applicable_approved}` or setting N/A without `requirement.set_not_applicable` | Blocked (check constraint + function guard) |
| Audit write failure during a mutation | Transaction rolls back |

---

*Continue to [phase-6-data-model.md](./phase-6-data-model.md).*
