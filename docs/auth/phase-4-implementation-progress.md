# Phase 4 implementation progress

> **Status:** Phase 4B implementation, Phase 4C audit, and Phase 4D remediation
> are complete locally.
> **Current branch:** `codex/phase-4d-auth-remediation`
> **Base:** Phase 3E closeout at `0abfcb5`
> **Scope boundary:** identity, authentication, organizations, memberships, invitations,
> permissions, account security, and their supporting audit/email/rate-limit seams only.
> No Phase 5 business entity or workflow was implemented.

## Task register

| Task | Status | Implementation | Validation evidence | Deviation or deferral | Founder action |
| --- | --- | --- | --- | --- | --- |
| 0 — Review and branch gate | Complete | Reviewed the Phase 1–4 sources, retained Phase 3E, and created the Phase 4B branch from the pushed Phase 3E closeout. | Branch ancestry and Git log verified. | None. | None. |
| 1 — Auth package and SSR | Complete | Added `@closeoutflow/auth` with browser, server, middleware, verified-user, profile-fallback, claims-assurance, and recovery-code helpers. | Typecheck, unit tests, build, and server-only negative-build probe pass. | None. | None. |
| 2 — Session middleware and guards | Complete | Added cookie refresh, protected-route classification, server-side layout decisions, and cache-safe request clients. | Proxy/unit tests and direct-navigation Playwright tests pass. | Middleware is an optimization; server layouts remain authoritative as specified. | None. |
| 3 — Migration foundations | Complete | Added ordered migrations `0003`–`0010`, enum/domain foundations, narrow function grants, fixed search paths, and Phase 4-only migration-validator allowances. | Reset, schema lint, migration validation, deterministic types, and pgTAP pass. | None. | None. |
| 4 — Profiles and preferences | Complete | Added trigger-created profiles, idempotent `ensureProfile`, separate preferences, constrained self-updates, and persisted account screens. | pgTAP isolation/grant tests, unit tests, and browser persistence tests pass. | Avatar upload remains deferred per AOD-10; initials are used. | None. |
| 5 — Organizations | Complete | Added organization identity, status, slug, timezone, MFA-policy readiness, RLS, and controlled update paths. | Cross-tenant pgTAP and organization-settings browser tests pass. | None. | None. |
| 6 — Memberships and authz | Complete | Added six roles, one authoritative deny-by-default matrix in `packages/authz`, active membership rules, and recursion-safe DB helpers. | Authz matrix and pgTAP helper/policy tests pass. | No project permissions were fabricated. | None. |
| 7 — RLS and parity hardening | Complete | Enabled and forced RLS on all eight Phase 4 tables; revoked broad default grants and allowed only required columns/functions. | Eight-table isolation, suspended-state, schema-grant, and parity tests pass. | None; RLS was not weakened for tests. | None. |
| 8 — Organization creation | Complete | Added transactional organization + owner-membership creation with safe slug generation and audit writes; wired onboarding and selection. | Atomicity/owner tests and authenticated browser flows pass. | None. | None. |
| 9 — Registration and verification | Complete | Added branded sign-up, verification, callback, confirmation-required local Supabase configuration, safe continuation, and abuse controls. | Live Mailpit registration→verification Playwright journey passes. | Production delivery waits on hosted SMTP. | Configure AOD-1 and AOD-3 before staging. |
| 10 — Sign-in and sign-out | Complete | Added password sign-in, generic failures, current/global sign-out, verified server identity, and safe `next` handling. | Unit and browser sign-in/sign-out/protected-route tests pass. | None. | None. |
| 11 — Password reset | Complete | Added request, callback, password replacement, security event/email seam, and safe continuation. | Live Mailpit reset journey passes. | Production delivery waits on hosted SMTP. | Configure AOD-3 before staging. |
| 12 — OAuth foundations | Complete | Added Google/Microsoft provider buttons, provider gating, callback exchange, conflict-safe behavior, and redirect validation. | Callback/redirect unit coverage and build pass. | Live provider E2E is intentionally disabled locally, as specified. | Supply AOD-2 provider credentials for staging/production. |
| 13 — Invitations | Complete | Added hashed, expiring, revocable, rotation-safe invitations, pending dedupe, RPC-only administration reads, masked public preview, management actions, Mailpit delivery, and rate limits. | Token/grant/lifecycle/privacy pgTAP, email unit, and browser tests pass. | None locally. | Configure AOD-3 before staging. |
| 14 — Invitation acceptance | Complete | Added existing/new-user continuations, generic unauthenticated preview, exact verified email match inside the transaction, idempotent acceptance, and membership reactivation. | Existing-user and new-user Mailpit Playwright journeys plus edge-case pgTAP pass. | None. | None. |
| 15 — Organization switching | Complete | Added server-validated `cof-active-org` preference, membership revalidation, safe fallback, switcher, and organization selector. | Resolver/unit and browser switching tests pass. | Cookie is never authorization evidence. | None. |
| 16 — Team management | Complete | Replaced Phase 3 previews with real member/invitation data and permission-gated role, suspend, reactivate, remove, resend, and revoke actions. | Authz, pgTAP lifecycle, Playwright, and a11y coverage pass. | Invitations remain a team tab with a route alias per AOD-13. | None. |
| 17 — Ownership transfer | Complete | Added two-step transfer initiation, target acceptance, cancellation, expiry, reauthentication/AAL2 gates, atomic owner swap, and audit events. | Ownership, AAL2, atomicity, and ownerless-prevention pgTAP pass. | None. | None. |
| 18 — Membership lifecycle | Complete | Added guarded suspension, reactivation, removal, leave, reuse/reactivation, and last-owner protections. | Lifecycle and suspended-access pgTAP tests pass. | None. | None. |
| 19 — Profile settings | Complete | Added real profile and preference forms with validation and preserved theme/density local fast paths. | Unit, browser persistence, responsive, and a11y checks pass. | Image avatars deferred per AOD-10. | None. |
| 20 — Security, MFA, and sessions | Complete | Added password security, Supabase TOTP enrollment/challenge/removal, versioned purpose-keyed one-time recovery hashes with legacy verification, security events, current/global sign-out, and fresh AAL2 checks. | Unit, pgTAP security, browser route, and server-guard checks pass. | Rich device/session inventory table deferred per AOD-9. | Confirm production MFA/session posture in AOD-5/AOD-7 and set an independent recovery-code pepper. |
| 21 — Route guards | Complete | Enforced verified identity, email/profile/org/MFA/suspension/platform states on the server; `/platform` requires a separate DB role plus AAL2. | Direct-navigation, protected-shell, tampered-state, production-gate, and cross-browser smoke pass. | None. | Provision real platform administrators per AOD-12. |
| 22 — Emails | Complete | Added Closeout HTML/text templates and delivery adapter for verification/reset, invitations, identity/security, ownership, and membership events. | Email rendering/redaction tests and Mailpit end-to-end journeys pass. | Local Mailpit is used; no production credential is required or committed. | Configure Resend/SMTP and SPF/DKIM/DMARC per AOD-3. |
| 23 — Audit integration | Complete | Expanded typed audit actions and connected sensitive database transactions/server actions to immutable audit writes with safe metadata. | Unit/pgTAP catalog, rollback, redaction, immutability, and live mutation probes pass. | Audit remains separate from logs, analytics, and user security events. | None. |
| 24 — Abuse controls | Complete | Added hashed-key rate-limit policies with a local adapter/fallback and production-required configuration validation. | Rate-limit/hash/redaction unit tests pass. | CAPTCHA remains a production infrastructure option. | Configure Upstash and decide CAPTCHA per AOD-6. |
| 25 — Full validation | Complete | Ran static, database, unit, server-only, build, five-project browser, accessibility, deterministic-type, live-runtime, secret, diff, and pre-commit checks after remediation. | Phase 4D: 35 Vitest files/145 tests, 8 pgTAP files/149 tests, 151 E2E pass/55 scoped skips, and 71 a11y pass. | Live OAuth provider smoke remains the only intentional local external-provider omission. | Run OAuth smoke after AOD-2 is configured. |
| 26 — Documentation and closeout | Complete | Preserved the Phase 4B review and Phase 4C audit, added the Phase 4D remediation record, and updated implementation/exit evidence. | Markdown formatting, Git checks, pre-commit, full suite, commits, and push are the closeout gate. | Phase 5 is explicitly not started. | Complete only the staging/production actions in open decisions. |

## Implemented database scope

The only Phase 4 application tables are:

- `user_profiles`
- `user_preferences`
- `organizations`
- `organization_memberships`
- `organization_invitations`
- `organization_ownership_transfers`
- `platform_roles`
- `user_security_events`

`user_session_metadata` was not adopted. No project, company, contact, requirement,
document, review, package, equipment, warranty, inspection, training, lien-waiver,
drawing, billing, AI, search-index, integration, or general-notification table was
introduced.

## Phase 4D audit remediation

All P4C-M1–M6 findings were resolved. P4C-L2–L7 were resolved; P4C-L1 was
explicitly closed by retaining fail-fast validated environment initialization
instead of permitting a partially configured authentication deployment. See
[phase-4d-remediation.md](./phase-4d-remediation.md) for root causes, exact
changes, tests, remaining risk, and harness instructions.

Migration `0011_phase_4d_auth_remediation.sql` is append-only. It revokes direct
authenticated invitation reads, adds the narrow invitation administration RPC,
masks public previews, correlates audit writes with boundary-generated request
IDs, versions recovery hashes, and makes reauthentication audit metadata
server-derived. Generated database types were updated in the same branch.

## Local completion status

There is no remaining founder action required for local Phase 4 validation.
Hosted Supabase, OAuth, transactional email, domain/cookie, Upstash/CAPTCHA,
production MFA/session posture, legal deletion review, and platform-admin
provisioning remain staging/production gates documented in
[open-decisions.md](./open-decisions.md). Staging and production must also set an
independent 32+ character `RECOVERY_CODE_PEPPER`.
