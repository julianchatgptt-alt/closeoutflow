# FILE: /docs/auth/phase-4-overview.md

> **Document status:** Phase 4A specification — authentication, organizations, memberships, invitations, permissions. **Specification only; no implementation, migrations, or packages.**
> **Public brand:** **Closeout** (visible). **Domain:** `closeoutflow.com`. Internal identifiers (`@closeoutflow/*`, repo, env prefixes, `cof-*` keys, `docs/` paths) unchanged.
> **Depends on Phase 1:** [user-roles.md](../product/user-roles.md), [workflows.md](../product/workflows.md), [statuses.md](../product/statuses.md), [product-requirements.md](../product/product-requirements.md).
> **Depends on Phase 2:** [auth-and-permissions.md](../architecture/auth-and-permissions.md), [data-architecture.md](../architecture/data-architecture.md), [security-and-operations.md](../architecture/security-and-operations.md), [architecture-decisions.md](../architecture/architecture-decisions.md) (ADR-003 Supabase, ADR-004 Supabase Auth + WorkOS-later, ADR-005 RLS isolation, ADR-006 authz single source, ADR-015 audit, ADR-016 secure links).
> **Depends on Phase 3:** [application-shell.md](../design/application-shell.md), [navigation-and-routes.md](../design/navigation-and-routes.md), [patterns.md](../design/patterns.md), [accessibility-and-responsive.md](../design/accessibility-and-responsive.md), [phase-3d-remediation.md](../design/phase-3d-remediation.md) (branding).
> **Sibling Phase 4 docs:** [identity-and-authentication.md](./identity-and-authentication.md), [organizations-and-memberships.md](./organizations-and-memberships.md), [permissions-and-rls.md](./permissions-and-rls.md), [phase-4-data-model.md](./phase-4-data-model.md), [invitations-onboarding-and-email.md](./invitations-onboarding-and-email.md), [routes-and-screens.md](./routes-and-screens.md), [account-security-and-lifecycle.md](./account-security-and-lifecycle.md), [audit-events.md](./audit-events.md), [phase-4-testing.md](./phase-4-testing.md), [phase-4-implementation-plan.md](./phase-4-implementation-plan.md), [open-decisions.md](./open-decisions.md).

---

## 1. Phase objective

Establish Closeout's **real identity and multi-tenant foundation**: users can register, verify email, sign in/out, reset passwords, enable MFA, create or join organizations, invite teammates, belong to and switch between multiple organizations, receive **membership-based permissions**, and be **strictly isolated** from organizations they do not belong to — all enforced in PostgreSQL via Row Level Security, supplemented (never replaced) by application authorization, with **immutable audit records** for sensitive identity and membership actions.

This turns the Phase 2 deny-by-default `authz` stub and the audit foundation into a working, tested permission system, and replaces the Phase 3 placeholder org switcher / disabled auth affordances with real behavior — **without** building any Phase 5+ business tables (projects, requirements, documents, reviews, packages, portals).

## 2. Scope (included)

Authentication (email/password, email verification, password reset, sign in/out, Google + Microsoft OAuth architecture, TOTP MFA, session management, reauthentication); user profiles + preferences; organizations; organization memberships; organization invitations (separate entity); organization switching; identity-and-membership organization settings; org roles; permission evaluation (`authz` + RLS parity); RLS policies; authorization helpers; member administration; ownership transfer; member suspension/removal/leaving; user security settings; identity/organization audit events; the full test suite for all of the above.

## 3. Non-goals (explicitly excluded)

Projects, project contacts, subcontractors, requirements, documents, uploads, reviews, packages, owner/subcontractor portals, **project-specific roles backed by project tables**, billing/Stripe, AI, search, integrations, general (Phase 10) notifications, **full enterprise SSO/SAML**, SCIM, public APIs, business analytics. Project-level permission concepts are **designed for forward-compatibility** but **not implemented with fake tables**.

## 4. Main decisions (summary; details in sibling docs)

| Area | Decision |
|------|----------|
| Identity | Supabase Auth = credential/identity; **every auth user gets one `user_profiles` row** (created by an `auth.users` AFTER INSERT trigger + server-side ensure fallback). Preferences in a separate `user_preferences` table. **Auth metadata is never trusted for authorization.** |
| Session | `@supabase/ssr` cookie sessions; **`getUser()` (verified) for all auth decisions, never `getSession()` alone**; `proxy.ts` middleware refreshes tokens + coarse redirects only; real protection in server layouts + RLS. |
| Org context | **Active org = a server-validated cookie preference (`cof-active-org`)**, re-checked against memberships every request. **Not** path or subdomain. Never trust a client org id for access. |
| Roles | Six org roles: **Owner, Administrator, Project Manager, Closeout Coordinator, Internal Reviewer, Viewer.** Phase 4 gives PM/Coordinator/Reviewer *member-level* org capabilities; their **project scopes arrive in Phase 5+** (designed now, not built). |
| Permissions | Stable dotted identifiers in `packages/authz`; role→permission matrix is the single source; **RLS mirrors the same concepts**; parity-tested. Deny by default. |
| Ownership | **Single primary owner** per org (an `owner` membership role), enforced by a partial unique index + last-owner guards; **transfer via a two-step accepted, MFA-gated flow**; ownerless orgs are structurally impossible. |
| Invitations | **Separate entity** from memberships; **hashed, scoped, expiring, revocable, single-use** tokens; acceptance is **transactional + idempotent** and **auto-creates an active membership**. |
| MFA | **TOTP (Supabase AAL2)** + one-time recovery codes; required for platform admins and ownership transfer; org-MFA-policy field reserved. |
| Platform admins | Separate `platform_roles`; **no automatic RLS bypass of customer data**; act via audited SECURITY DEFINER admin functions; MFA mandatory. |
| Audit | Written via the existing service-role-only `write_audit_event` RPC / inside SECURITY DEFINER transactional functions; **failure blocks sensitive actions**. |

## 5. User outcomes (the 19 capabilities, mapped)

Register (§sign-up), verify email, sign in/out, reset password, create/join org, invite teammates, accept/reject invitations, belong to multiple orgs, switch orgs, receive membership-based permissions, access only their orgs (RLS), manage profile + security, view/revoke sessions (best-effort), enable MFA, access protected routes, be blocked from other orgs' records, transfer ownership safely, suspend/remove members with safeguards, and produce complete audit records. Each maps to a route ([routes-and-screens.md](./routes-and-screens.md)), a permission ([permissions-and-rls.md](./permissions-and-rls.md)), and an audit event ([audit-events.md](./audit-events.md)).

## 6. Technical outcomes

A working `@closeoutflow/auth` capability (Supabase SSR clients + session helpers), a populated `authz` policy (roles × permissions, deny-by-default), Phase 4 tables with **forced RLS** and tested policies, SECURITY DEFINER transactional functions for atomic multi-step operations, the identity/org audit catalog wired through `write_audit_event`, Upstash-backed rate limiting on auth/invite endpoints, and Phase-3-design-system auth/account/org-settings screens branded **Closeout**.

## 7. Security principles (preserved permanently)

1. **Database-enforced tenant isolation (RLS)** — app checks supplement, never replace.
2. **Default denial** — missing/unknown/stale/invalid context → deny.
3. **No client-trusted `organization_id`** — never proof of access.
4. **Service-role restriction** — server-only; not for normal user requests that RLS can handle (used narrowly for audit RPC + admin functions).
5. **Complete auditability** — immutable events for sensitive identity/org actions.
6. **Safe invitations** — high-entropy, hashed, scoped, expiring, revocable, single-use, enumeration-resistant, never logged.
7. **Secure SSR sessions** — verified `getUser()`, secure cookies, correct refresh/logout/revocation.
8. **Role separation** — platform / organization / (future) project / external-portal / secure-link grants stay distinct concepts.
9. **Ownership safety** — an organization can never become ownerless.
10. **Human-readable security UX** — clear failures without leaking sensitive detail.

## 8. Dependencies

- **Repo foundation (present):** `packages/authz` (deny-by-default `can()` + `Actor` = internal_user/external_grant/platform_admin/system), `packages/db` (anon + server-only service-role clients), `packages/env` (validated server/client split), `packages/audit` (`write_audit_event` RPC, immutable `audit.audit_events`), `packages/observability` (pino + request-id), `packages/ui` + `apps/web` shell (org switcher/user menu placeholders), `apps/web/proxy.ts` (nonce CSP + token-refresh seam), Supabase local (migrations `0000–0002`, audit only, no business tables).
- **Founder-owned (later):** hosted Supabase project + URLs, Google/Microsoft OAuth credentials, Resend/SMTP + production email domain, production domain, MFA/CAPTCHA settings ([open-decisions.md](./open-decisions.md), plan §Founder actions). **Local Phase 4B does not require any of these** (Mailpit + email/password + TOTP run locally; OAuth is built against a disabled/mock provider).

## 9. Phase boundaries

Phase 4 ends at a secure identity/tenancy foundation. It **does not** create project/document/requirement/closeout tables, external portals, billing, or full SSO. Project-level permissions are **forward-designed** (the role labels + the `authz`/RLS scope model reserve room for a future `project_memberships`/scope layer) but no project table is created.

## 10. Success criteria

- A user can complete every one of the 19 outcomes locally against local Supabase.
- **pgTAP proves cross-tenant isolation**: no member of Org A can SELECT/INSERT/UPDATE/DELETE any Org B row, for every Phase 4 table.
- **`authz` ⇔ RLS parity** tests pass for the full role×permission matrix.
- **Ownerless organizations are impossible** (proven by tests attempting last-owner removal/downgrade/suspension/leave).
- **Invitation acceptance is idempotent and transactional** (double-accept is a no-op; partial failure rolls back).
- **Suspended members and suspended orgs are denied** data access at the DB layer.
- **No client-supplied org id grants access**; **service-role never used for ordinary user reads**; **no `getSession()`-only auth gate**; **redirects are allowlisted** (no open redirect).
- **Every sensitive action writes an audit event**; audit failure blocks the sensitive action.
- All Vitest/pgTAP/Playwright/a11y/cross-browser gates green; no Phase 5 tables created.

## 11. Highest risks

| Risk | Mitigation |
|------|------------|
| Cross-tenant leak via a missed RLS policy or recursion | Forced RLS on every table; SECURITY DEFINER helpers to avoid recursion; exhaustive pgTAP isolation matrix; authz⇔RLS parity ([permissions-and-rls.md](./permissions-and-rls.md)). |
| Trusting JWT/Auth metadata for authorization | Authorization derives **only** from DB `organization_memberships`/`platform_roles`; metadata explicitly non-authoritative; tests assert a forged claim grants nothing. |
| `getSession()`-only protection / client-only guards | Mandate verified `getUser()` in server layouts; middleware is refresh/coarse only; e2e asserts direct navigation to protected routes redirects. |
| Ownerless org / last-admin lockout | Single-owner invariant + last-owner/last-admin guards in every mutation function; transfer-before-leave; platform break-glass. |
| Invitation token leakage/enumeration | Hash-at-rest, high entropy, expiry, revocation, single-use, generic errors, rate limiting, never logged. |
| Open redirect via `next`/OAuth callback | Server-side allowlist of relative in-app paths; reject absolute/external targets. |
| Service-role misuse | Server-only; confined to `write_audit_event` + audited admin functions; boundary test (client import fails build) already enforced; extend to any new service-role code. |
| Platform-admin over-reach | No blanket RLS bypass; audited SECURITY DEFINER admin actions only; MFA mandatory. |
| Email/OAuth provider misconfig blocking dev | Local Mailpit + email/password + TOTP; OAuth deferred; providers are founder actions gated to staging/prod. |

---

*Continue to [identity-and-authentication.md](./identity-and-authentication.md).*
