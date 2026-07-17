# FILE: /docs/auth/permissions-and-rls.md

> **Document status:** Phase 4A specification — permissions, authorization, and Row Level Security. **Specification only; no SQL.**
> **Related:** [phase-4-data-model.md](./phase-4-data-model.md), [organizations-and-memberships.md](./organizations-and-memberships.md), [identity-and-authentication.md](./identity-and-authentication.md); Phase 2 [auth-and-permissions.md](../architecture/auth-and-permissions.md), [data-architecture.md](../architecture/data-architecture.md) (ADR-005 RLS, ADR-006 authz single source).
> **Grounding:** extends the existing `packages/authz` (`Actor = internal_user | external_grant | platform_admin | system`; `can()` deny-by-default) and the service-role-only `public.write_audit_event` RPC.

---

## 1. Model overview

Two enforcement layers derived from **one** role→permission source:
- **`packages/authz` (application):** the primary UX gate — rich decisions/errors, sensitive-action gating. Every Server Action / Route Handler calls `can(actor, permission, resource)`.
- **PostgreSQL RLS + SECURITY DEFINER functions (database):** the **authoritative** guarantee — isolation holds even if application code is wrong.

**They must agree** (parity-tested). Deny by default at both layers. **Authorization derives only from `organization_memberships` + `platform_roles`** — never from JWT/Auth metadata or client-supplied ids.

**Scope hierarchy (from [auth-and-permissions.md](../architecture/auth-and-permissions.md)):** platform → organization → office/division → project → requirement → document → owner-portal. **Phase 4 implements platform + organization scopes only**; office/project/etc. are **reserved** (the `authz` resource shape and RLS helpers are written so a future `project_id` scope slots in without reshaping org logic).

---

## 2. Permission identifiers

Stable dotted identifiers, defined as a const map in `packages/authz` (`Permission` union). Each: **scope**, **allowed roles** (Phase 4), **sensitive gate**, **audit**, **RLS relevance**, **future project relation**.

| Permission | Scope | Allowed roles (Phase 4) | Sensitive gate | Audit | RLS relevance | Future project relation |
|------------|-------|-------------------------|----------------|:-----:|---------------|-------------------------|
| `profile.update_self` | user | any authenticated (self) | reauth for email/password (handled in auth) | ✓ (profile.updated) | `user_profiles`/`user_preferences` self policies | — |
| `organization.view` | org | Owner, Admin, PM, Coordinator, Reviewer, Viewer | — | on read? no | `organizations` SELECT | base for project reads |
| `organization.update` | org | Owner, Admin | — | ✓ | `organizations` UPDATE | — |
| `organization.manage_members` | org | Owner, Admin | — | ✓ (per action) | memberships/invitations write | — |
| `organization.manage_roles` | org | Owner, Admin (not owner role) | confirm | ✓ (role.changed) | memberships UPDATE(role) | project roles later |
| `organization.transfer_ownership` | org | Owner | **reauth + MFA + target accept** | ✓ | ownership_transfers + memberships | — |
| `organization.archive` | org | Owner | confirm | ✓ | organizations UPDATE(status) | — |
| `organization.delete` | org | Owner | **reauth + MFA + typed confirm + grace** | ✓ | organizations UPDATE(status)→purge | cascades later |
| `organization.manage_security` | org | Owner (Admin partial) | reauth+MFA | ✓ | org MFA policy (reserved) | — |
| `membership.view` | org | Owner, Admin, PM, Coordinator, Reviewer, Viewer | — | — | memberships SELECT (in-org) | assignment reads later |
| `membership.invite` | org | Owner, Admin | — | ✓ (invitation.created) | invitations INSERT | — |
| `membership.change_role` | org | Owner, Admin (not to/from owner) | confirm | ✓ | memberships UPDATE(role) | — |
| `membership.suspend` | org | Owner, Admin (not owner target) | confirm | ✓ | memberships UPDATE(status) | reassignment later |
| `membership.reactivate` | org | Owner, Admin | — | ✓ | memberships UPDATE(status) | — |
| `membership.remove` | org | Owner, Admin (not owner target) | confirm | ✓ | memberships UPDATE(status=removed) | reassignment later |
| `membership.leave` | org | any active member (not sole owner) | confirm | ✓ (membership.left) | memberships UPDATE(self) | — |
| `audit.view` | org | Owner, Admin | — | — (viewing isn’t audited by default) | audit read via function | — |
| `security.manage` | org | Owner | reauth+MFA | ✓ | org security (reserved) | — |
| `platform.suspend_org` | platform | platform_admin | MFA + break-glass log | ✓ | admin function | — |
| `platform.suspend_user` | platform | platform_admin | MFA | ✓ | admin function | — |
| `platform.view_security_events` | platform | platform_admin/support | MFA | (access itself audited) | admin function | — |

**Representation in code (single source):** `packages/authz` exports `const permissions` (the union above), `const roles`, and a **role→permission matrix** (`Record<OrgRole, Permission[]>`). `can(actor, permission, resource)`:
1. Deny by default.
2. Platform status: suspended user/org → deny (unless a `platform.*` self-scoped action).
3. Resolve the actor’s **membership** in `resource.organizationId` (server passes the DB-resolved membership; `can()` never fetches from the client).
4. If `membership.status !== 'active'` → deny (except viewing own suspended state).
5. Allow iff the role’s permission set includes `permission`.
6. Apply **sensitive-action gates** (reauth/MFA/two-person/target-accept) using `actor` context (`aal`, `reauthAge`).

**Avoiding duplication:** features never hand-write role checks; they call `can()` and reference `permissions.*` constants. RLS policies use **DB helper functions derived from the same matrix** (§5). A **parity test** asserts, for every (role, permission), that `authz` allow ⇔ the corresponding RLS operation is permitted.

---

## 3. Role → permission matrix (Phase 4)

| Permission \ Role | Owner | Admin | PM | Coord | Reviewer | Viewer |
|-------------------|:-----:|:-----:|:--:|:-----:|:--------:|:------:|
| organization.view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| membership.view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| profile.update_self | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| organization.update | ✔ | ✔ | — | — | — | — |
| membership.invite | ✔ | ✔ | — | — | — | — |
| membership.change_role | ✔ | ✔¹ | — | — | — | — |
| membership.suspend/reactivate/remove | ✔ | ✔¹ | — | — | — | — |
| membership.leave | ✔² | ✔ | ✔ | ✔ | ✔ | ✔ |
| audit.view | ✔ | ✔ | — | — | — | — |
| organization.archive | ✔ | — | — | — | — | — |
| organization.transfer_ownership | ✔ | — | — | — | — | — |
| organization.delete | ✔ | — | — | — | — | — |
| organization.manage_security | ✔ | — | — | — | — | — |

¹ Admins cannot target the **owner** and cannot set/remove the **owner** role. ² The **sole owner cannot leave** (must transfer first).

---

## 4. Permission evaluation flow

```mermaid
flowchart TD
  A[Server Action / Route Handler] --> U[getUser() verified]
  U -->|none| DENY1[401 → /sign-in]
  U --> O[Resolve active org + membership from DB]
  O -->|no active membership in resource org| DENY2[403]
  O --> AZ["authz.can(actor, permission, resource)"]
  AZ -->|Deny| DENY3[403 + safe message + audit deny?]
  AZ -->|Allow + gates ok| OP[RLS-scoped write OR SECURITY DEFINER fn]
  OP --> AUD[write_audit_event]
  OP -. also guaranteed by .-> RLS[(RLS on every table)]
```

Reads use RLS directly (list team, view org). Writes call `can()` first, then either an RLS-scoped statement or a transactional SECURITY DEFINER function that **re-authorizes internally** (defense in depth).

---

## 5. RLS strategy (per Phase 4 table)

**All Phase 4 tables:** `ENABLE` **and** `FORCE ROW LEVEL SECURITY`, default deny (no policy ⇒ no access). Service-role bypasses RLS (used only for audit RPC + admin functions). Platform admins get **no** blanket policy (see §6).

**Helper functions (SECURITY DEFINER, `search_path=''`, granted `authenticated`), used by policies to avoid recursion** (they query memberships with definer rights, so a membership policy referencing them does not recurse):
- `public.current_user_id()` → `auth.uid()` (stable).
- `public.is_org_member(org uuid)` → true if caller has an **active** membership in `org`.
- `public.has_org_role(org uuid, roles text[])` → active membership with role in `roles`.
- `public.has_org_permission(org uuid, perm text)` → maps caller’s active role → permission set (mirrors the §3 matrix in SQL; single source kept in sync by parity tests).
- `public.is_platform_admin()` / `public.is_platform_support()` → from `platform_roles`.

> **Recursion note:** the `organization_memberships` policies must **not** call `is_org_member()` on the same row in a way that re-enters the table under RLS. Pattern: SELECT policy uses a **direct** predicate `user_id = auth.uid()` **OR** `has_org_role(organization_id, array['owner','administrator'])` where the helper is SECURITY DEFINER (bypasses RLS internally). Verified by pgTAP that policies terminate and isolate.

### 5.1 `user_profiles`
| Op | Policy |
|----|--------|
| SELECT | `id = auth.uid()` **OR** the profile’s user shares an active org with the caller (`exists active memberships in same org`) — so team screens can show names. Never cross-org. |
| INSERT | Only via trigger/`ensureProfile` (SECURITY DEFINER); no direct client insert. |
| UPDATE | `id = auth.uid()` (self only). Platform admin edits via admin function only. |
| DELETE | none (deletion via controlled flow → anonymize, not row delete). |
- Suspended member: still sees own profile; shared-org visibility requires **both** memberships active. Service-role: bypass (admin/anonymize). Tests: cross-org name leakage denied.

### 5.2 `user_preferences`
| Op | Policy |
|----|--------|
| SELECT/UPDATE | `user_id = auth.uid()` only. |
| INSERT | via trigger/ensure only. DELETE none. |

### 5.3 `organizations`
| Op | Policy |
|----|--------|
| SELECT | `is_org_member(id)` (active) — members see their org(s). |
| INSERT | via `create_organization_with_owner()` (SECURITY DEFINER) — no direct insert. |
| UPDATE | `has_org_permission(id,'organization.update')` (Owner/Admin); status transitions (archive/delete) via functions. |
| DELETE | none (status → pending_deletion → purge job/function). |
- Suspended org: SELECT allowed to members (to see suspended state) but **mutations denied**; suspended-org **blocks all child-table access** (memberships/invitations policies also check org status). Service-role/platform: admin functions.

### 5.4 `organization_memberships`
| Op | Policy |
|----|--------|
| SELECT | `user_id = auth.uid()` **OR** `has_org_role(organization_id, ['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])` limited to **same org** (i.e., active members can view the member list of their org). Direct predicate to avoid recursion. |
| INSERT | via `accept_invitation()` / `create_organization_with_owner()` only. |
| UPDATE | `has_org_permission(organization_id,'organization.manage_members')` for role/status changes **and** target-guard (cannot change owner unless caller is owner via transfer fn); **self** may update own `job_title`; leaving via `membership.leave` function. |
| DELETE | none (status=removed, retained). |
- Suspended member: their own membership row visible (shows suspended); **no other org rows**; **no data access** elsewhere (org SELECT requires active). Last-owner guard enforced in functions, not policies.

### 5.5 `organization_invitations`
| Op | Policy |
|----|--------|
| SELECT | `has_org_permission(organization_id,'membership.view')` (Owner/Admin see their org’s invites). **Invitee acceptance does NOT read via RLS** — it goes through `accept_invitation(token)` (SECURITY DEFINER) which looks up by **token hash**, so pending invites are **never enumerable** by clients. |
| INSERT | `has_org_permission(organization_id,'membership.invite')` via `create_invitation()` function (to hash token + enforce dedupe). |
| UPDATE | admins: revoke/resend via functions; status transitions guarded. |
| DELETE | none. |
- Enumeration resistance: no client SELECT by email/token; acceptance keyed on hash inside a definer function. Service-role: none needed beyond functions.

### 5.6 `organization_ownership_transfers`
| Op | Policy |
|----|--------|
| SELECT | involved owner + target (`from_user=auth.uid() OR to_user=auth.uid()`) within the org; admins may view via permission. |
| INSERT/UPDATE | via `initiate_ownership_transfer()` / `complete_ownership_transfer()` / `cancel…` functions only. DELETE none. |

### 5.7 `platform_roles`
| Op | Policy |
|----|--------|
| SELECT | `user_id = auth.uid()` (see own platform role) **only**; platform admins list via admin function. |
| INSERT/UPDATE/DELETE | none from clients — provisioned by migration/seed or a break-glass admin function; **never** self-grantable. |

### 5.8 `user_security_events` (user-facing security log; distinct from immutable audit)
| Op | Policy |
|----|--------|
| SELECT | `user_id = auth.uid()` only. |
| INSERT | via server (service-role or definer) only. UPDATE/DELETE none. |

### 5.9 `audit.audit_events` (unchanged from Phase 2)
Off PostgREST; writes only via `write_audit_event` (service-role). **No client SELECT** in Phase 4 (org audit **viewing** for `audit.view` is served by a dedicated SECURITY DEFINER `get_organization_audit(org, …)` that returns only that org’s rows to authorized Owner/Admin — keeping the audit schema off the public API). Immutable (update/delete/truncate blocked).

---

## 6. Service-role & platform-admin restrictions

- **Service-role** (server-only): used **only** for `write_audit_event`, SECURITY DEFINER admin functions, and the `ensureProfile`/cleanup helpers. **Never** for ordinary authenticated user reads/writes that RLS can perform. The existing build test (client import of the service client fails) must be **extended** to cover the new `@closeoutflow/auth` server module.
- **Platform admins** do **not** receive automatic RLS access to customer data. They act through **explicit, audited SECURITY DEFINER admin functions** (`platform_suspend_org`, `platform_suspend_user`, `platform_get_security_events`) that check `is_platform_admin()` + AAL2 and write audit. There is **no** “platform admin sees all orgs” RLS policy. Support impersonation is deferred but modeled as a **time-boxed, consented, audited grant**, never a bypass.

---

## 7. Authz ⇔ RLS parity testing

- **`authz` unit tests:** the full role×permission matrix (§3), deny-by-default, sensitive gates, suspended-member/org denial, owner-target guards, sole-owner-leave block.
- **pgTAP RLS tests:** for each table and each op, assert the exact rows a given identity (Org A owner/admin/member/viewer/suspended, Org B member, platform admin, anon, service-role) can/can’t touch — **zero cross-org access** anywhere.
- **Parity harness:** for representative (role, permission) pairs, exercise the action through **both** `authz.can()` and a real RLS-scoped statement and assert agreement; a divergence fails CI. Adding a permission requires updating the matrix in **both** the authz map and the `has_org_permission()` SQL, with the parity test guarding drift.

---

## 8. Cross-tenant & authorization threat cases (must be covered by tests)

| Threat | Expected result |
|--------|-----------------|
| Org B member reads/writes any Org A row (profiles, memberships, invitations, org, transfers, security events) | **Denied** (RLS) for every table/op. |
| Client sends `organization_id` of an org the user isn’t in | **No access** — RLS requires active membership; server ignores client org id for authz. |
| User edits `cof-active-org` cookie to another org | **No access** — membership re-checked; RLS denies. |
| Forged JWT/`app_metadata` role/org claim | **Grants nothing** — authz reads DB only. |
| Suspended member acts | **Denied** at DB (status≠active) + server. |
| Suspended org’s member reads child data | **Denied** (org-status check in child policies). |
| Admin tries to remove/suspend/downgrade the **owner** | **Blocked** (owner-target guard) + audit of attempt (optional). |
| Sole owner tries to leave/delete self | **Blocked** (last-owner guard). |
| Invitation enumeration by email/token | **No client SELECT**; acceptance keyed on hash in a definer fn; rate-limited; generic errors. |
| Platform admin reads a random org’s data via normal query | **Denied** — no bypass policy; only audited admin functions. |
| Service-role client imported into a client component | **Build fails** (server-only guard). |
| Membership policy recursion / infinite loop | **None** — direct predicates + SECURITY DEFINER helpers (pgTAP asserts termination + isolation). |

---

*Continue to [phase-4-data-model.md](./phase-4-data-model.md).*
